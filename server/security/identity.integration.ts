import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from "mysql2/promise";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { userSessions, type User } from "../../drizzle/schema";
import { guardTestDatabase } from "../../scripts/database-guard.mjs";
import { getDb, getUserByOpenId, saveOAuthIdentity, sessionStore } from "../db";
import { IdentityStorageUnavailable } from "./events";
import { createIdentityService } from "./identityService";
import { createSessionCodec, hashSessionId } from "./sessionTokens";

// Config also checks these gates; this second check protects direct file imports.
const target = guardTestDatabase(process.env);
if (process.env.MGECS_DB_TEST_LAUNCHED !== "true") {
  throw new Error(
    "Use node scripts/database-test.mjs with a fresh disposable schema"
  );
}
const secret = process.env.MGECS_SESSION_SECRET;
const appId = process.env.VITE_APP_ID;
if (
  !secret ||
  !appId ||
  process.env.OWNER_OPEN_ID !== "disposable-owner-fixture"
) {
  throw new Error("Missing isolated integration fixture environment");
}
const START = 1_800_000_000_000;
const ABSOLUTE = 60_000;
const IDLE = 10_000;
let observer: Connection | undefined;
let applicationPool: Awaited<ReturnType<typeof getDb>>["$client"] | undefined;
let applicationPoolClosed = false;
const createdIds = new Set<number>();
const prefix = `dbfixture_${randomBytes(8).toString("hex")}`;
let sequence = 0;
async function syntheticUser(
  openId = `${prefix}_${++sequence}`
): Promise<User> {
  const saved = await saveOAuthIdentity({
    openId,
    name: "Disposable fixture",
    email: "disposable@example.invalid",
    loginMethod: "synthetic-oauth",
  });
  createdIds.add(saved.id);
  return saved;
}
function lifecycle() {
  let clock = START;
  const options = {
    store: sessionStore,
    secret: secret!,
    appId: appId!,
    absoluteMs: ABSOLUTE,
    idleMs: IDLE,
    now: () => clock,
  };
  return {
    service: createIdentityService(options),
    secondService: () => createIdentityService(options),
    codec: createSessionCodec(options),
    setClock: (value: number) => {
      clock = value;
    },
  };
}
function tokenHash(token: string) {
  return hashSessionId(String(decodeJwt(token).jti));
}
async function storedSession(token: string) {
  return (
    await (
      await getDb()
    )
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionIdHash, tokenHash(token)))
  )[0];
}
async function sql(statement: string, values: (string | number | null)[] = []) {
  if (!observer) throw new Error("Observer connection is unavailable");
  return observer.execute(statement, values);
}

beforeAll(async () => {
  // This independent connection observes persisted state, not in-memory service state.
  observer = await createConnection({
    ...target,
    connectTimeout: 5_000,
    multipleStatements: false,
  });
  const [rows] = await observer.query<RowDataPacket[]>(
    "SELECT DATABASE() AS db, CURRENT_USER() AS account, VERSION() AS version"
  );
  expect(rows[0].db).toBe(target.database);
  expect(rows[0].account.split("@")[0]).toBe("mgecs_test");
  expect(/^8\./.test(rows[0].version) || /MariaDB/i.test(rows[0].version)).toBe(
    true
  );
  const [counts] = await observer.query<RowDataPacket[]>(
    "SELECT (SELECT COUNT(*) FROM users) AS usersCount, (SELECT COUNT(*) FROM userSessions) AS sessionsCount"
  );
  expect(Number(counts[0].usersCount)).toBe(0);
  expect(Number(counts[0].sessionsCount)).toBe(0);
  applicationPool = (await getDb()).$client;
});

afterEach(async () => {
  // Delete only identities created by this test; FK cascade clears their sessions.
  if (createdIds.size && observer) {
    const ids = [...createdIds];
    await observer.execute(
      `DELETE FROM users WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    createdIds.clear();
  }
});

afterAll(async () => {
  try {
    if (observer) await observer.end();
  } finally {
    observer = undefined;
    if (applicationPool && !applicationPoolClosed) {
      await applicationPool.promise().end();
      applicationPoolClosed = true;
    }
  }
});

describe.sequential("disposable SQL OAuth identity contracts", () => {
  it("signup is role=user even when its provider subject equals OWNER_OPEN_ID", async () => {
    const saved = await syntheticUser(process.env.OWNER_OPEN_ID!);
    expect(saved.role).toBe("user");
    const test = lifecycle();
    const { token } = await test.service.start(saved);
    const principal = (await test.service.authenticate(token))?.principal;
    expect(principal?.role).toBe("user");
    expect(principal?.permissions).not.toContain("operator:access");
  });
  it.each(["user", "admin"] as const)(
    "repeat OAuth preserves existing %s role and numeric identity",
    async role => {
      const saved = await syntheticUser();
      await sql("UPDATE users SET role = ? WHERE id = ?", [role, saved.id]);
      const repeated = await saveOAuthIdentity({
        openId: saved.openId,
        name: "Changed synthetic profile",
        email: "changed@example.invalid",
        loginMethod: "fixture-repeat",
      });
      expect(repeated.id).toBe(saved.id);
      expect(repeated.role).toBe(role);
      expect(repeated.name).toBe("Changed synthetic profile");
      const [counts] = await observer!.execute<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM users WHERE openId = ?",
        [saved.openId]
      );
      expect(Number(counts[0].n)).toBe(1);
    }
  );
  it("repeat OAuth never restores admin after an explicit demotion", async () => {
    const saved = await syntheticUser();
    await sql("UPDATE users SET role = 'admin' WHERE id = ?", [saved.id]);
    expect((await syntheticUser(saved.openId)).role).toBe("admin");
    await sql("UPDATE users SET role = 'user' WHERE id = ?", [saved.id]);
    const repeated = await syntheticUser(saved.openId);
    expect(repeated.id).toBe(saved.id);
    expect(repeated.role).toBe("user");
  });
  it.each(["different case", "trailing space"] as const)(
    "rejects a %s provider subject colliding under legacy SQL collation without changing the original profile",
    async variant => {
      // MySQL 8 defaults may use NO PAD collation; explicitly exercise legacy
      // case-insensitive PAD SPACE semantics on this disposable schema only.
      const [metadata] = await observer!.execute<RowDataPacket[]>(
        "SELECT CHARACTER_SET_NAME AS charset, COLLATION_NAME AS collation FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'openId'",
        [target.database]
      );
      const { charset, collation } = metadata[0];
      expect(charset).toMatch(/^[A-Za-z0-9_]+$/);
      expect(collation).toMatch(/^[A-Za-z0-9_]+$/);
      await sql(
        "ALTER TABLE users MODIFY openId varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL"
      );
      try {
        const owner = await syntheticUser();
        await sql("UPDATE users SET role = 'admin' WHERE id = ?", [owner.id]);
        const before = (await getUserByOpenId(owner.openId))!;
        const conflicting =
          variant === "different case"
            ? owner.openId.toUpperCase()
            : `${owner.openId} `;
        const [collision] = await observer!.execute<RowDataPacket[]>(
          "SELECT id FROM users WHERE openId = ?",
          [conflicting]
        );
        expect(collision[0].id).toBe(owner.id);
        await expect(getUserByOpenId(conflicting)).rejects.toThrow(
          "Invalid provider identity"
        );
        await expect(
          saveOAuthIdentity({
            openId: conflicting,
            name: "Rejected replacement",
            email: "rejected@example.invalid",
            loginMethod: "rejected-fixture",
          })
        ).rejects.toThrow("Invalid provider identity");
        expect(await getUserByOpenId(owner.openId)).toEqual(before);
        const [counts] = await observer!.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS n FROM users WHERE openId = ?",
          [owner.openId]
        );
        expect(Number(counts[0].n)).toBe(1);
      } finally {
        // Restore the reviewed migration's original charset/collation.
        await sql(
          `ALTER TABLE users MODIFY openId varchar(64) CHARACTER SET ${charset} COLLATE ${collation} NOT NULL`
        );
      }
    }
  );
  it("returns canonical numeric users.id rather than provider IDs or string IDs", async () => {
    const saved = await syntheticUser();
    expect(typeof saved.id).toBe("number");
    expect(Number.isSafeInteger(saved.id) && saved.id > 0).toBe(true);
    const test = lifecycle();
    const { token } = await test.service.start(saved);
    expect(decodeJwt(token).sub).toBe(String(saved.id));
    expect((await test.service.authenticate(token))?.principal.id).toBe(
      saved.id
    );
    expect((await getUserByOpenId(saved.openId))?.id).toBe(saved.id);
  });
});

describe.sequential("disposable SQL session-ledger contracts", () => {
  it("persists a session hash before returning a token and reads it through an independent SQL connection and second service", async () => {
    const owner = await syntheticUser();
    const test = lifecycle();
    const { token } = await test.service.start(owner);
    const claims = decodeJwt(token);
    const [rows] = await observer!.execute<RowDataPacket[]>(
      "SELECT * FROM userSessions WHERE sessionIdHash = ?",
      [tokenHash(token)]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].sessionIdHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].userId).toBe(owner.id);
    expect(Number(rows[0].createdAtMs)).toBe(START);
    expect(Number(rows[0].expiresAtMs)).toBe(START + ABSOLUTE);
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(JSON.stringify(rows)).not.toContain(claims.jti);
    const [columns] = await observer!.execute<RowDataPacket[]>(
      "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'userSessions'",
      [target.database]
    );
    expect(columns.map(column => column.name).sort()).toEqual(
      [
        "sessionIdHash",
        "userId",
        "createdAtMs",
        "expiresAtMs",
        "lastSeenAtMs",
        "revokedAtMs",
      ].sort()
    );
    test.setClock(START + 1_000);
    const auth = await test.secondService().authenticate(token);
    expect(auth?.principal.id).toBe(owner.id);
    expect((await storedSession(token)).lastSeenAtMs).toBe(START + 1_000);
  });
  it("reads the current database role immediately after demotion without reissuing the token", async () => {
    const owner = await syntheticUser();
    await sql("UPDATE users SET role = 'admin' WHERE id = ?", [owner.id]);
    const current = (await getUserByOpenId(owner.openId))!;
    const test = lifecycle();
    const { token } = await test.service.start(current);
    test.setClock(START + 1_000);
    expect(
      (await test.service.authenticate(token))?.principal.permissions
    ).toContain("operator:access");
    await sql("UPDATE users SET role = 'user' WHERE id = ?", [owner.id]);
    test.setClock(START + 2_000);
    const principal = (await test.secondService().authenticate(token))
      ?.principal;
    expect(principal?.role).toBe("user");
    expect(principal?.identityRole).toBe("customer");
    expect(principal?.permissions).not.toContain("operator:access");
    expect(decodeJwt(token)).not.toHaveProperty("role");
  });
  it("rejects unregistered signed sessions and deleted-ledger replay", async () => {
    const owner = await syntheticUser();
    const test = lifecycle();
    const unregistered = await test.codec.issue(owner.id);
    expect(await test.service.authenticate(unregistered.token)).toBeNull();
    const { token } = await test.service.start(owner);
    await sql("DELETE FROM userSessions WHERE sessionIdHash = ?", [
      tokenHash(token),
    ]);
    expect(await test.codec.verify(token)).not.toBeNull();
    expect(await test.secondService().authenticate(token)).toBeNull();
  });
  it("persists revocation, rejects replay and leaves another active session usable", async () => {
    const owner = await syntheticUser();
    const test = lifecycle();
    const first = await test.service.start(owner);
    const second = await test.service.start(owner);
    await test.service.revoke(first.token);
    test.setClock(START + 1_000);
    await test.secondService().revoke(first.token);
    expect((await storedSession(first.token)).revokedAtMs).toBe(START);
    expect(await test.codec.verify(first.token)).not.toBeNull();
    expect(await test.secondService().authenticate(first.token)).toBeNull();
    expect(
      await test.secondService().authenticate(second.token)
    ).not.toBeNull();
  });
  it("atomic touch refuses revoked, wrong-owner and idle-expired rows", async () => {
    const owner = await syntheticUser();
    const stranger = await syntheticUser();
    const test = lifecycle();
    const { token } = await test.service.start(owner);
    const hash = tokenHash(token);
    expect(
      await sessionStore.touch(hash, stranger.id, START + 1, START - IDLE)
    ).toBe(false);
    expect(await sessionStore.touch(hash, owner.id, START + IDLE, START)).toBe(
      false
    );
    await test.service.revoke(token);
    expect(
      await sessionStore.touch(hash, owner.id, START + 1, START - IDLE)
    ).toBe(false);
  });
  it("late concurrent touches never regress the stored activity timestamp", async () => {
    const owner = await syntheticUser();
    const test = lifecycle();
    const { token } = await test.service.start(owner);
    const hash = tokenHash(token);
    expect(
      await sessionStore.touch(hash, owner.id, START + 2_000, START - IDLE)
    ).toBe(true);
    await sessionStore.touch(hash, owner.id, START + 1_000, START - IDLE);
    expect((await storedSession(token)).lastSeenAtMs).toBe(START + 2_000);
  });
  it("rejects a signed subject mismatching a ledger reassigned to another fixture owner", async () => {
    const owner = await syntheticUser();
    const stranger = await syntheticUser();
    const test = lifecycle();
    const { token } = await test.service.start(owner);
    await sql("UPDATE userSessions SET userId = ? WHERE sessionIdHash = ?", [
      stranger.id,
      tokenHash(token),
    ]);
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it.each(["createdAtMs", "expiresAtMs"] as const)(
    "rejects durable %s mismatching signed claims",
    async field => {
      const owner = await syntheticUser();
      const test = lifecycle();
      const { token } = await test.service.start(owner);
      await sql(
        `UPDATE userSessions SET ${field} = ${field} + 1 WHERE sessionIdHash = ?`,
        [tokenHash(token)]
      );
      expect(await test.service.authenticate(token)).toBeNull();
    }
  );
  it("refreshes idle activity before the boundary but rejects at the exact idle cutoff", async () => {
    const owner = await syntheticUser();
    const test = lifecycle();
    const { token } = await test.service.start(owner);
    test.setClock(START + IDLE - 1);
    expect(await test.service.authenticate(token)).not.toBeNull();
    expect((await storedSession(token)).lastSeenAtMs).toBe(START + IDLE - 1);
    test.setClock(START + 2 * IDLE - 1);
    expect(await test.secondService().authenticate(token)).toBeNull();
    expect((await storedSession(token)).expiresAtMs).toBe(START + ABSOLUTE);
  });
  it("rejects absolute expiration despite fresh durable activity", async () => {
    const owner = await syntheticUser();
    const test = lifecycle();
    const { token } = await test.service.start(owner);
    await sql(
      "UPDATE userSessions SET lastSeenAtMs = ? WHERE sessionIdHash = ?",
      [START + ABSOLUTE - 2, tokenHash(token)]
    );
    test.setClock(START + ABSOLUTE - 1);
    expect(await test.service.authenticate(token)).not.toBeNull();
    test.setClock(START + ABSOLUTE);
    expect(await test.secondService().authenticate(token)).toBeNull();
  });
  it("enforces FK ownership and cascades the session ledger on fixture-user deletion", async () => {
    const owner = await syntheticUser();
    const test = lifecycle();
    const { token } = await test.service.start(owner);
    const row = await storedSession(token);
    const [maximum] = await observer!.query<RowDataPacket[]>(
      "SELECT COALESCE(MAX(id), 0) + 1 AS missingId FROM users"
    );
    const missingId = Number(maximum[0].missingId);
    await expect(
      sql(
        "INSERT INTO userSessions (sessionIdHash, userId, createdAtMs, expiresAtMs, lastSeenAtMs, revokedAtMs) VALUES (?, ?, ?, ?, ?, NULL)",
        [
          randomBytes(32).toString("hex"),
          missingId,
          START,
          START + ABSOLUTE,
          START,
        ]
      )
    ).rejects.toMatchObject({ code: "ER_NO_REFERENCED_ROW_2" });
    await sql("DELETE FROM users WHERE id = ?", [owner.id]);
    const [remaining] = await observer!.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM userSessions WHERE sessionIdHash = ?",
      [row.sessionIdHash]
    );
    expect(Number(remaining[0].n)).toBe(0);
    expect(await test.secondService().authenticate(token)).toBeNull();
  });
});

// Last suite deliberately ends the application SQL pool. Observer cleanup stays live.
describe.sequential(
  "disposable SQL storage outage (closed application pool)",
  () => {
    it("fails closed for login, session issuance, reads, touch and logout without cached token identity", async () => {
      const owner = await syntheticUser();
      const test = lifecycle();
      const { token } = await test.service.start(owner);
      const row = await storedSession(token);
      await (await getDb()).$client.promise().end();
      applicationPoolClosed = true;
      await expect(
        saveOAuthIdentity({
          openId: `${prefix}_outage`,
          name: null,
          email: null,
          loginMethod: "fixture",
        })
      ).rejects.toBeInstanceOf(IdentityStorageUnavailable);
      await expect(getUserByOpenId(owner.openId)).rejects.toBeInstanceOf(
        IdentityStorageUnavailable
      );
      await expect(test.service.start(owner)).rejects.toBeInstanceOf(
        IdentityStorageUnavailable
      );
      await expect(
        test.secondService().authenticate(token)
      ).rejects.toBeInstanceOf(IdentityStorageUnavailable);
      await expect(
        sessionStore.touch(row.sessionIdHash, owner.id, START + 1, START - IDLE)
      ).rejects.toBeInstanceOf(IdentityStorageUnavailable);
      await expect(test.service.revoke(token)).rejects.toBeInstanceOf(
        IdentityStorageUnavailable
      );
      const [persisted] = await observer!.execute<RowDataPacket[]>(
        "SELECT revokedAtMs FROM userSessions WHERE sessionIdHash = ?",
        [row.sessionIdHash]
      );
      expect(persisted[0].revokedAtMs).toBeNull();
    });
  }
);

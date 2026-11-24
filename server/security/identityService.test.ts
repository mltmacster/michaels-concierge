import { randomBytes } from "node:crypto";
import { decodeJwt } from "jose";
import { describe, expect, it, vi } from "vitest";
import type { SessionRow, User } from "../../drizzle/schema";
import type { SessionStore, SessionWithUser } from "../db";
import { IdentityStorageUnavailable } from "./events";
import { createIdentityService, publicPrincipal } from "./identityService";
import { createSessionCodec, hashSessionId } from "./sessionTokens";

const START = 1_800_000_000_000;
const ABSOLUTE = 60_000;
const IDLE = 10_000;
const APP = "credential-free-identity-tests";
function user(id = 1, role: User["role"] = "user"): User {
  return {
    id,
    openId: `fixture-subject-${id}`,
    name: "Synthetic identity",
    email: "fixture@example.invalid",
    loginMethod: "fixture",
    role,
    createdAt: new Date(START),
    updatedAt: new Date(START),
    lastSignedIn: new Date(START),
  };
}

/** Test fixture only: no database, environment secrets or actual account records. */
class MemorySessionStore implements SessionStore {
  readonly rows = new Map<string, SessionRow>();
  readonly users = new Map<number, User>();
  outage: keyof SessionStore | undefined;
  private available(operation: keyof SessionStore) {
    if (this.outage === operation) throw new IdentityStorageUnavailable();
  }
  async insert(row: SessionRow) {
    this.available("insert");
    if (this.rows.has(row.sessionIdHash))
      throw new Error("Duplicate fixture session");
    this.rows.set(row.sessionIdHash, { ...row });
  }
  async find(hash: string): Promise<SessionWithUser | null> {
    this.available("find");
    const session = this.rows.get(hash);
    const owner = session && this.users.get(session.userId);
    return session && owner
      ? { session: { ...session }, user: { ...owner } }
      : null;
  }
  async touch(hash: string, userId: number, now: number, idleCutoff: number) {
    this.available("touch");
    const row = this.rows.get(hash);
    if (
      !row ||
      row.userId !== userId ||
      row.revokedAtMs !== null ||
      row.expiresAtMs <= now ||
      row.lastSeenAtMs <= idleCutoff
    )
      return false;
    row.lastSeenAtMs = now;
    return true;
  }
  async revoke(hash: string, userId: number, now: number) {
    this.available("revoke");
    const row = this.rows.get(hash);
    if (row?.userId === userId && row.revokedAtMs === null)
      row.revokedAtMs = now;
  }
}
function fixture(role: User["role"] = "user") {
  let clock = START;
  const store = new MemorySessionStore();
  const owner = user(1, role);
  store.users.set(owner.id, owner);
  const options = {
    store,
    secret: randomBytes(48).toString("base64url"),
    appId: APP,
    absoluteMs: ABSOLUTE,
    idleMs: IDLE,
    now: () => clock,
  };
  return {
    store,
    owner,
    service: createIdentityService(options),
    secondService: () => createIdentityService(options),
    codec: createSessionCodec(options),
    setClock: (value: number) => {
      clock = value;
    },
    row: () => [...store.rows.values()][0],
  };
}

describe("session start persistence boundary", () => {
  it("does not resolve with a cookie-capable token until insert completes", async () => {
    const test = fixture();
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const realInsert = test.store.insert.bind(test.store);
    const insert = vi
      .spyOn(test.store, "insert")
      .mockImplementation(async row => {
        await gate;
        await realInsert(row);
      });
    const cookieWriter = vi.fn();
    const starting = test.service.start(test.owner).then(issued => {
      cookieWriter(issued.token);
      return issued;
    });
    await vi.waitFor(() => expect(insert).toHaveBeenCalledOnce());
    expect(test.store.rows.size).toBe(0);
    expect(cookieWriter).not.toHaveBeenCalled();
    release();
    const issued = await starting;
    expect(test.store.rows.size).toBe(1);
    expect(cookieWriter).toHaveBeenCalledWith(issued.token);
    const claims = decodeJwt(issued.token);
    expect(test.row()).toEqual({
      sessionIdHash: hashSessionId(String(claims.jti)),
      userId: 1,
      createdAtMs: START,
      expiresAtMs: START + ABSOLUTE,
      lastSeenAtMs: START,
      revokedAtMs: null,
    });
    expect(JSON.stringify(test.row())).not.toContain(issued.token);
    expect(JSON.stringify(test.row())).not.toContain(claims.jti);
  });
  it("rejects failed persistence without returning a token for a cookie", async () => {
    const test = fixture();
    test.store.outage = "insert";
    const cookieWriter = vi.fn();
    await expect(
      test.service.start(test.owner).then(cookieWriter)
    ).rejects.toBeInstanceOf(IdentityStorageUnavailable);
    expect(cookieWriter).not.toHaveBeenCalled();
    expect(test.store.rows.size).toBe(0);
  });
  it("issues independent ledger entries for independent sessions", async () => {
    const test = fixture();
    const first = await test.service.start(test.owner);
    const second = await test.service.start(test.owner);
    expect(first.token).not.toBe(second.token);
    expect(test.store.rows.size).toBe(2);
    await test.service.revoke(first.token);
    expect(await test.service.authenticate(first.token)).toBeNull();
    expect(await test.service.authenticate(second.token)).not.toBeNull();
  });
});

describe("durable-ledger authentication contract with in-memory fixtures", () => {
  it.each([undefined, "", "malformed-token"])(
    "rejects missing/malformed token %j without a storage read",
    async token => {
      const test = fixture();
      const find = vi.spyOn(test.store, "find");
      expect(await test.service.authenticate(token)).toBeNull();
      expect(find).not.toHaveBeenCalled();
    }
  );
  it("rejects tampering before reading storage", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    const [header, payload, signature] = token.split(".");
    const changed = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
    const find = vi.spyOn(test.store, "find");
    expect(
      await test.service.authenticate(`${header}.${payload}.${changed}`)
    ).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });
  it("rejects a cryptographically valid but unregistered session", async () => {
    const test = fixture();
    const { token } = await test.codec.issue(1);
    expect(await test.codec.verify(token)).not.toBeNull();
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it("rejects deleted ledger replay even while the signature is valid", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.store.rows.clear();
    expect(await test.codec.verify(token)).not.toBeNull();
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it("rejects revoked-token replay and repeated logout preserves first revocation", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    await test.service.revoke(token);
    test.setClock(START + 1_000);
    await test.service.revoke(token);
    expect(test.row().revokedAtMs).toBe(START);
    expect(await test.codec.verify(token)).not.toBeNull();
    expect(await test.service.authenticate(token)).toBeNull();
    expect(await test.secondService().authenticate(token)).toBeNull();
  });
  it("reads persisted fixture state through a second service, not a claimed process restart", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.setClock(START + 1_000);
    expect((await test.secondService().authenticate(token))?.principal.id).toBe(
      1
    );
    expect(test.row().lastSeenAtMs).toBe(START + 1_000);
  });
  it("rejects a ledger row whose subject does not match signed sub", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.store.users.set(2, user(2));
    test.row().userId = 2;
    const touch = vi.spyOn(test.store, "touch");
    expect(await test.service.authenticate(token)).toBeNull();
    expect(touch).not.toHaveBeenCalled();
  });
  it("rejects a joined user different from the ledger owner", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    vi.spyOn(test.store, "find").mockResolvedValue({
      session: { ...test.row() },
      user: user(2),
    });
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it.each(["createdAtMs", "expiresAtMs"] as const)(
    "rejects ledger %s inconsistent with signed claims",
    async field => {
      const test = fixture();
      const { token } = await test.service.start(test.owner);
      test.row()[field] += 1;
      expect(await test.service.authenticate(token)).toBeNull();
    }
  );
  it("rejects future last-seen ledger data", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.row().lastSeenAtMs = START + 1;
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it("rejects an orphaned session if the owning user no longer exists", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.store.users.delete(1);
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it("does not authenticate if revocation wins the read/touch race", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    const realTouch = test.store.touch.bind(test.store);
    vi.spyOn(test.store, "touch").mockImplementation(async (...args) => {
      await test.store.revoke(args[0], args[1], args[2]);
      return realTouch(...args);
    });
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it("uses the current stored role after an administrator is demoted", async () => {
    const test = fixture("admin");
    const { token } = await test.service.start(test.owner);
    expect(
      (await test.service.authenticate(token))?.principal.permissions
    ).toContain("operator:access");
    test.owner.role = "user";
    const principal = (await test.service.authenticate(token))?.principal;
    expect(principal).toEqual({
      id: 1,
      name: test.owner.name,
      email: test.owner.email,
      role: "user",
      identityRole: "customer",
      permissions: ["identity:read:self", "session:revoke:self"],
    });
    expect(decodeJwt(token)).not.toHaveProperty("role");
  });
});

describe("idle and absolute lifetime boundaries", () => {
  it.each([IDLE, IDLE + 1])(
    "rejects idle expiration after %s ms",
    async elapsed => {
      const test = fixture();
      const { token } = await test.service.start(test.owner);
      test.setClock(START + elapsed);
      expect(await test.service.authenticate(token)).toBeNull();
      expect(test.row().lastSeenAtMs).toBe(START);
    }
  );
  it("touches before the idle cutoff and refreshes only the idle window", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.setClock(START + IDLE - 1);
    expect(await test.service.authenticate(token)).not.toBeNull();
    expect(test.row().lastSeenAtMs).toBe(START + IDLE - 1);
    expect(test.row().expiresAtMs).toBe(START + ABSOLUTE);
    test.setClock(START + 2 * IDLE - 1);
    expect(await test.service.authenticate(token)).toBeNull();
  });
  it.each([ABSOLUTE, ABSOLUTE + 1])(
    "rejects absolute expiration at %s ms despite recent activity",
    async elapsed => {
      const test = fixture();
      const { token } = await test.service.start(test.owner);
      test.row().lastSeenAtMs = START + ABSOLUTE - 1;
      test.setClock(START + elapsed);
      expect(await test.service.authenticate(token)).toBeNull();
    }
  );
  it("accepts one millisecond before absolute expiration with recent activity", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.row().lastSeenAtMs = START + ABSOLUTE - 2;
    test.setClock(START + ABSOLUTE - 1);
    expect(await test.service.authenticate(token)).not.toBeNull();
  });
});

describe("fail-closed storage outages", () => {
  it.each(["find", "touch"] as const)(
    "propagates %s outage instead of authenticating from token claims",
    async operation => {
      const test = fixture("admin");
      const { token } = await test.service.start(test.owner);
      test.store.outage = operation;
      await expect(test.service.authenticate(token)).rejects.toBeInstanceOf(
        IdentityStorageUnavailable
      );
    }
  );
  it("does not claim logout succeeded when revocation storage is unavailable", async () => {
    const test = fixture();
    const { token } = await test.service.start(test.owner);
    test.store.outage = "revoke";
    await expect(test.service.revoke(token)).rejects.toBeInstanceOf(
      IdentityStorageUnavailable
    );
    expect(test.row().revokedAtMs).toBeNull();
  });
  it.each([undefined, "", "malformed-token"])(
    "does not access storage when revoking invalid token %j",
    async token => {
      const test = fixture();
      const revoke = vi.spyOn(test.store, "revoke");
      await test.service.revoke(token);
      expect(revoke).not.toHaveBeenCalled();
    }
  );
});

describe("public principal identity shape", () => {
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid stored numeric ID %s before persistence",
    async id => {
      const test = fixture();
      await expect(test.service.start(user(id))).rejects.toThrow(
        "Invalid stored identity"
      );
      expect(test.store.rows.size).toBe(0);
    }
  );
  it("rejects legacy string IDs and unsupported roles", () => {
    expect(() =>
      publicPrincipal({ ...user(), id: "1" } as unknown as User)
    ).toThrow("Invalid stored identity");
    expect(() =>
      publicPrincipal({ ...user(), role: "owner" } as unknown as User)
    ).toThrow("Invalid stored identity");
  });
  it("does not expose provider IDs or internal timestamps", () => {
    const principal = publicPrincipal(user());
    expect(principal.id).toBeTypeOf("number");
    expect(principal).not.toHaveProperty("openId");
    expect(principal).not.toHaveProperty("createdAt");
    expect(principal).not.toHaveProperty("lastSignedIn");
  });
});

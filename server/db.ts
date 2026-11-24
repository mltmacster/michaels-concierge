import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  userSessions,
  type User,
  type SessionRow,
} from "../drizzle/schema";
import { IdentityStorageUnavailable } from "./security/events";

let database: ReturnType<typeof drizzle> | null = null;
class IdentityRejected extends Error {}
export async function getDb() {
  if (!database) {
    if (!process.env.DATABASE_URL) throw new IdentityStorageUnavailable();
    try {
      database = drizzle(process.env.DATABASE_URL);
    } catch {
      throw new IdentityStorageUnavailable();
    }
  }
  return database;
}

async function storage<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof IdentityRejected) throw error;
    throw new IdentityStorageUnavailable();
  }
}

export type OAuthIdentity = {
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
};
/** Called only on successful OAuth completion. Never accepts a role from a caller. */
export async function saveOAuthIdentity(
  identity: OAuthIdentity
): Promise<User> {
  return storage(async () => {
    const db = await getDb();
    const lastSignedIn = new Date();
    const existing = await db
      .select({ openId: users.openId })
      .from(users)
      .where(eq(users.openId, identity.openId))
      .limit(1);
    if (existing[0] && existing[0].openId !== identity.openId)
      throw new IdentityRejected("Invalid provider identity");
    await db
      .insert(users)
      .values({ ...identity, role: "user", lastSignedIn })
      .onDuplicateKeyUpdate({
        set: {
          name: sql`IF(BINARY ${users.openId} = BINARY ${identity.openId}, ${identity.name}, ${users.name})`,
          email: sql`IF(BINARY ${users.openId} = BINARY ${identity.openId}, ${identity.email}, ${users.email})`,
          loginMethod: sql`IF(BINARY ${users.openId} = BINARY ${identity.openId}, ${identity.loginMethod}, ${users.loginMethod})`,
          lastSignedIn: sql`IF(BINARY ${users.openId} = BINARY ${identity.openId}, ${lastSignedIn}, ${users.lastSignedIn})`,
        },
      });
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.openId, identity.openId))
      .limit(1);
    if (!rows[0]) throw new IdentityStorageUnavailable();
    if (rows[0].openId !== identity.openId)
      throw new IdentityRejected("Invalid provider identity");
    return rows[0];
  });
}

export async function getUserByOpenId(openId: string) {
  return storage(async () => {
    const row = (
      await (
        await getDb()
      )
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1)
    )[0];
    if (row && row.openId !== openId)
      throw new IdentityRejected("Invalid provider identity");
    return row;
  });
}

export type SessionWithUser = { session: SessionRow; user: User };
export interface SessionStore {
  insert(row: SessionRow): Promise<void>;
  find(hash: string): Promise<SessionWithUser | null>;
  touch(
    hash: string,
    userId: number,
    now: number,
    idleCutoff: number
  ): Promise<boolean>;
  revoke(hash: string, userId: number, now: number): Promise<void>;
}

export const sessionStore: SessionStore = {
  insert: row =>
    storage(async () => {
      await (await getDb()).insert(userSessions).values(row);
    }),
  find: hash =>
    storage(async () => {
      const rows = await (
        await getDb()
      )
        .select({ session: userSessions, user: users })
        .from(userSessions)
        .innerJoin(users, eq(users.id, userSessions.userId))
        .where(eq(userSessions.sessionIdHash, hash))
        .limit(1);
      return rows[0] ?? null;
    }),
  touch: (hash, userId, now, cutoff) =>
    storage(async () => {
      const result = await (
        await getDb()
      )
        .update(userSessions)
        .set({
          lastSeenAtMs: sql`GREATEST(${userSessions.lastSeenAtMs}, ${now})`,
        })
        .where(
          and(
            eq(userSessions.sessionIdHash, hash),
            eq(userSessions.userId, userId),
            isNull(userSessions.revokedAtMs),
            gt(userSessions.expiresAtMs, now),
            gt(userSessions.lastSeenAtMs, cutoff)
          )
        );
      return result[0].affectedRows === 1;
    }),
  revoke: (hash, userId, now) =>
    storage(async () => {
      await (
        await getDb()
      )
        .update(userSessions)
        .set({ revokedAtMs: now })
        .where(
          and(
            eq(userSessions.sessionIdHash, hash),
            eq(userSessions.userId, userId),
            isNull(userSessions.revokedAtMs)
          )
        );
    }),
};

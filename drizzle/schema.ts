import {
  bigint,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Server-only, hashed session identifiers with UTC millisecond lifecycle data. */
export const userSessions = mysqlTable(
  "userSessions",
  {
    sessionIdHash: varchar("sessionIdHash", { length: 64 }).primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAtMs: bigint("createdAtMs", { mode: "number" }).notNull(),
    expiresAtMs: bigint("expiresAtMs", { mode: "number" }).notNull(),
    lastSeenAtMs: bigint("lastSeenAtMs", { mode: "number" }).notNull(),
    revokedAtMs: bigint("revokedAtMs", { mode: "number" }),
  },
  table => [
    index("userSessions_userId_idx").on(table.userId),
    index("userSessions_expiry_idx").on(table.expiresAtMs),
  ]
);

export type SessionRow = typeof userSessions.$inferSelect;

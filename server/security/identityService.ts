import type { User } from "../../drizzle/schema";
import { sessionStore, type SessionStore } from "../db";
import { getSessionSigningSecret } from "../config";
import { createSessionCodec, hashSessionId } from "./sessionTokens";
import { permissionsFor, type PublicPrincipal } from "../../shared/identity";

export function publicPrincipal(user: User): PublicPrincipal {
  if (
    !Number.isSafeInteger(user.id) ||
    user.id < 1 ||
    !["user", "admin"].includes(user.role)
  )
    throw new Error("Invalid stored identity");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    identityRole: user.role === "admin" ? "operator" : "customer",
    permissions: permissionsFor(user.role),
  };
}

export function createIdentityService(options: {
  store: SessionStore;
  secret: string;
  appId: string;
  absoluteMs?: number;
  idleMs?: number;
  now?: () => number;
}) {
  const now = options.now ?? Date.now;
  const absoluteMs = options.absoluteMs ?? 3_600_000;
  const idleMs = options.idleMs ?? 900_000;
  if (!Number.isFinite(idleMs) || idleMs <= 0 || idleMs > absoluteMs)
    throw new Error("Invalid idle session policy");
  const codec = createSessionCodec({
    secret: options.secret,
    appId: options.appId,
    absoluteMs,
    now,
  });
  return {
    async start(user: User) {
      publicPrincipal(user);
      const issued = await codec.issue(user.id);
      const createdAtMs = issued.claims.iat * 1000;
      await options.store.insert({
        sessionIdHash: hashSessionId(issued.claims.jti),
        userId: user.id,
        createdAtMs,
        expiresAtMs: issued.claims.exp * 1000,
        lastSeenAtMs: now(),
        revokedAtMs: null,
      });
      return { token: issued.token, expiresAtMs: issued.claims.exp * 1000 };
    },
    async authenticate(token: string | undefined) {
      if (!token) return null;
      const claims = await codec.verify(token);
      if (!claims) return null;
      const hash = hashSessionId(claims.jti);
      const entry = await options.store.find(hash);
      const timestamp = now();
      if (
        !entry ||
        entry.session.userId !== Number(claims.sub) ||
        entry.user.id !== entry.session.userId ||
        entry.session.revokedAtMs !== null ||
        entry.session.expiresAtMs !== claims.exp * 1000 ||
        entry.session.createdAtMs !== claims.iat * 1000 ||
        entry.session.expiresAtMs <= timestamp ||
        entry.session.lastSeenAtMs <= timestamp - idleMs ||
        entry.session.lastSeenAtMs > timestamp
      )
        return null;
      const principal = publicPrincipal(entry.user);
      if (
        !(await options.store.touch(
          hash,
          entry.user.id,
          timestamp,
          timestamp - idleMs
        ))
      )
        return null;
      return { user: entry.user, principal, sessionHash: hash };
    },
    async revoke(token: string | undefined) {
      if (!token) return;
      const claims = await codec.verify(token);
      if (claims)
        await options.store.revoke(
          hashSessionId(claims.jti),
          Number(claims.sub),
          now()
        );
    },
  };
}

let service: ReturnType<typeof createIdentityService> | undefined;
export function identityService() {
  service ??= createIdentityService({
    store: sessionStore,
    secret: getSessionSigningSecret(process.env) ?? "",
    appId: process.env.VITE_APP_ID ?? "",
    absoluteMs:
      Number(process.env.MGECS_SESSION_ABSOLUTE_SECONDS ?? 3600) * 1000,
    idleMs: Number(process.env.MGECS_SESSION_IDLE_SECONDS ?? 900) * 1000,
  });
  return service;
}

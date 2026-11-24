import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse } from "cookie";
import type { User } from "../../drizzle/schema";
import { identityService } from "../security/identityService";
import { sessionCookieName } from "./cookies";
import { IdentityStorageUnavailable, securityEvent } from "../security/events";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  sessionHash?: string;
  identityUnavailable?: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const base = { req: opts.req, res: opts.res, user: null };
  const token = parse(opts.req.headers.cookie ?? "")[
    sessionCookieName(opts.req)
  ];
  if (!token) return base;
  try {
    const identity = await identityService().authenticate(token);
    return identity
      ? { ...base, user: identity.user, sessionHash: identity.sessionHash }
      : base;
  } catch (error) {
    securityEvent(
      error instanceof IdentityStorageUnavailable
        ? "identity.storage_unavailable"
        : "identity.validation_failed",
      String(opts.res.getHeader("X-Request-ID") ?? "")
    );
    return { ...base, identityUnavailable: true };
  }
}

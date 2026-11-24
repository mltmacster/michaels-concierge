import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export type SessionClaims = {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

const ISSUER = "mgecs:session";
const MIN_ABSOLUTE_MS = 60_000;
const MAX_ABSOLUTE_MS = 86_400_000;
const CLAIM_NAMES = new Set(["sub", "jti", "iat", "exp", "iss", "aud"]);

function isSubject(value: unknown): value is string {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return false;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && String(id) === value;
}

function isSessionId(value: unknown): value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    return false;
  }
  const bytes = Buffer.from(value, "base64url");
  return bytes.length === 32 && bytes.toString("base64url") === value;
}

/** Hash the random session identifier before storing it in the session ledger. */
export function hashSessionId(jti: string): string {
  return createHash("sha256").update(jti, "utf8").digest("hex");
}

/** Cryptographic validation only; callers must also check the durable ledger. */
export function createSessionCodec({
  secret,
  appId,
  absoluteMs,
  now = Date.now,
}: {
  secret: string;
  appId: string;
  absoluteMs: number;
  now?: () => number;
}): {
  issue(userId: number): Promise<{ token: string; claims: SessionClaims }>;
  verify(token: string): Promise<SessionClaims | null>;
} {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error(
      "Session signing secret must contain at least 32 characters"
    );
  }
  if (typeof appId !== "string" || appId.trim().length === 0) {
    throw new Error("Session application ID must be nonempty");
  }
  if (
    !Number.isFinite(absoluteMs) ||
    absoluteMs < MIN_ABSOLUTE_MS ||
    absoluteMs > MAX_ABSOLUTE_MS
  ) {
    throw new Error(
      "Session absolute lifetime must be between 60 seconds and 24 hours"
    );
  }
  if (typeof now !== "function") {
    throw new Error("Session clock must be a function");
  }

  const key = new TextEncoder().encode(secret);
  // Rounding down ensures integer-second claims never extend the configured TTL.
  const lifetimeSeconds = Math.floor(absoluteMs / 1_000);

  function readClock() {
    const milliseconds = now();
    const date = new Date(milliseconds);
    const seconds = Math.floor(milliseconds / 1_000);
    if (
      typeof milliseconds !== "number" ||
      !Number.isFinite(date.getTime()) ||
      !Number.isSafeInteger(seconds) ||
      seconds < 0
    ) {
      throw new Error("Invalid session clock");
    }
    return { date, seconds };
  }

  return {
    async issue(userId) {
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error(
          "Session subject must be a positive safe integer user ID"
        );
      }
      const { seconds } = readClock();
      const claims: SessionClaims = {
        sub: String(userId),
        jti: randomBytes(32).toString("base64url"),
        iat: seconds,
        exp: seconds + lifetimeSeconds,
        iss: ISSUER,
        aud: appId,
      };
      const token = await new SignJWT(claims)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .sign(key);
      return { token, claims };
    },

    async verify(token) {
      try {
        const { date, seconds } = readClock();
        const { payload } = await jwtVerify(token, key, {
          algorithms: ["HS256"],
          issuer: ISSUER,
          audience: appId,
          requiredClaims: ["sub", "jti", "iat", "exp", "iss", "aud"],
          currentDate: date,
          clockTolerance: 0,
        });
        const { sub, jti, iat, exp, iss, aud } = payload;
        if (
          Object.keys(payload).some(name => !CLAIM_NAMES.has(name)) ||
          !isSubject(sub) ||
          !isSessionId(jti) ||
          typeof iat !== "number" ||
          typeof exp !== "number" ||
          !Number.isSafeInteger(iat) ||
          !Number.isSafeInteger(exp) ||
          iat < 0 ||
          iat > seconds ||
          exp <= seconds ||
          exp <= iat ||
          (exp - iat) * 1_000 > absoluteMs ||
          iss !== ISSUER ||
          aud !== appId
        ) {
          return null;
        }
        return { sub, jti, iat, exp, iss, aud };
      } catch {
        return null;
      }
    },
  };
}

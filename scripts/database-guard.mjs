import { URL } from "node:url";

const LOCAL_TARGET =
  /^mysql:\/\/mgecs_test(?::[^@/?#]*)?@(localhost|127\.0\.0\.1)(?::([0-9]+))?\/(mgecs_test(?:_[A-Za-z0-9_]+)?)$/;

/** Pure validation: callers must run this before importing drivers or connecting. */
export function guardTestDatabase(env) {
  if (
    env.AI_UNK_TEST_DATABASE !== "true" ||
    env.RUN_DATABASE_TESTS !== "true"
  ) {
    throw new Error(
      "Disposable database tests require AI_UNK_TEST_DATABASE=true and RUN_DATABASE_TESTS=true"
    );
  }
  if (typeof env.DATABASE_URL !== "string" || !env.DATABASE_URL) {
    throw new Error(
      "Disposable database tests require an explicit DATABASE_URL"
    );
  }
  const match = LOCAL_TARGET.exec(env.DATABASE_URL);
  if (
    !match ||
    match[0] !== env.DATABASE_URL ||
    [...env.DATABASE_URL].some(
      character =>
        character.charCodeAt(0) <= 32 || character.charCodeAt(0) >= 127
    ) ||
    env.DATABASE_URL.includes("\\") ||
    /prod|stag|live|managed/i.test(match[3])
  ) {
    throw new Error(
      "DATABASE_URL must target mysql://mgecs_test@localhost or 127.0.0.1 with database mgecs_test or mgecs_test_<alphanumericunderscore>; production, staging and managed targets are forbidden"
    );
  }
  const port = match[2] === undefined ? 3306 : Number(match[2]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Disposable database port must be between 1 and 65535");
  }
  let password;
  try {
    password = decodeURIComponent(new URL(env.DATABASE_URL).password);
  } catch {
    throw new Error("Invalid disposable database URL encoding");
  }
  return {
    host: match[1],
    port,
    user: "mgecs_test",
    password,
    database: match[3],
  };
}

/** Allowlist rather than spreading process.env: no managed keys reach Vitest. */
export function databaseTestEnvironment(env, secret) {
  guardTestDatabase(env);
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("A fresh fixture-only session signing secret is required");
  }
  return {
    NODE_ENV: "test",
    TZ: "UTC",
    CI: "true",
    AI_UNK_TEST_DATABASE: "true",
    RUN_DATABASE_TESTS: "true",
    DATABASE_URL: env.DATABASE_URL,
    VITE_APP_ID: "disposable-identity-integration",
    MGECS_SESSION_SECRET: secret,
    OWNER_OPEN_ID: "disposable-owner-fixture",
  };
}

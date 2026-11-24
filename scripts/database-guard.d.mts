export interface DisposableDatabaseTarget {
  host: "localhost" | "127.0.0.1";
  port: number;
  user: "mgecs_test";
  password: string;
  database: string;
}

export interface DatabaseTestEnvironment {
  NODE_ENV: "test";
  TZ: "UTC";
  CI: "true";
  AI_UNK_TEST_DATABASE: "true";
  RUN_DATABASE_TESTS: "true";
  DATABASE_URL: string;
  VITE_APP_ID: "disposable-identity-integration";
  MGECS_SESSION_SECRET: string;
  OWNER_OPEN_ID: "disposable-owner-fixture";
}

export function guardTestDatabase(
  env: Readonly<Record<string, string | undefined>>
): DisposableDatabaseTarget;

export function databaseTestEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  secret: string
): DatabaseTestEnvironment;

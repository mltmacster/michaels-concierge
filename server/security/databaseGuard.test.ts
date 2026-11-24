import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as databaseGuard from "../../scripts/database-guard.mjs";
import portableConfig from "../../vitest.config";

const { databaseTestEnvironment, guardTestDatabase } = databaseGuard;
const root = path.resolve(import.meta.dirname, "../..");
const valid = () => ({
  AI_UNK_TEST_DATABASE: "true",
  RUN_DATABASE_TESTS: "true",
  DATABASE_URL: "mysql://mgecs_test:fixture-only@127.0.0.1:3306/mgecs_test",
});

describe("disposable database target guard (no connections)", () => {
  it.each([
    "AI_UNK_TEST_DATABASE",
    "RUN_DATABASE_TESTS",
    "DATABASE_URL",
  ] as const)("rejects missing %s", key => {
    const env: Record<string, string> = valid();
    delete env[key];
    expect(() => guardTestDatabase(env)).toThrow();
  });
  it.each(["AI_UNK_TEST_DATABASE", "RUN_DATABASE_TESTS"] as const)(
    "requires exact true acknowledgement for %s",
    key => {
      for (const value of ["", "1", "TRUE", "false", "true "]) {
        expect(() => guardTestDatabase({ ...valid(), [key]: value })).toThrow();
      }
    }
  );
  it.each([
    "mysql://mgecs_test@localhost/mgecs_test",
    "mysql://mgecs_test:fixture-only@127.0.0.1:3307/mgecs_test_ci_42",
    "mysql://mgecs_test@localhost:65535/mgecs_test_A_b_12",
    "mysql://mgecs_test:p%40ss%3Aword@127.0.0.1:1/mgecs_test",
  ])("accepts strictly local disposable target %s", DATABASE_URL => {
    const target = guardTestDatabase({ ...valid(), DATABASE_URL });
    expect(target.user).toBe("mgecs_test");
    expect(["localhost", "127.0.0.1"]).toContain(target.host);
    expect(target.database).toMatch(/^mgecs_test(?:_[A-Za-z0-9_]+)?$/);
  });
  it.each([
    "mysql://mgecs_test@remote.example.invalid/mgecs_test",
    "mysql://mgecs_test@localhost.example.invalid/mgecs_test",
    "mysql://mgecs_test@127.0.0.2/mgecs_test",
    "mysql://mgecs_test@127.1/mgecs_test",
    "mysql://mgecs_test@2130706433/mgecs_test",
    "mysql://mgecs_test@[::1]/mgecs_test",
    "mysql://mgecs_test@LOCALHOST/mgecs_test",
    "mysql://mgecs_test@localhost./mgecs_test",
    "mysql://mgecs_test@%6cocalhost/mgecs_test",
    "mysql://root@localhost/mgecs_test",
    "mysql://app@localhost/mgecs_test",
    "mysql://mgecs_test_admin@localhost/mgecs_test",
    "mysql://managed_user@localhost/mgecs_test",
    "mysql://mgecs%5Ftest@localhost/mgecs_test",
    "mysql://mgecs_test@localhost/production",
    "mysql://mgecs_test@localhost/staging",
    "mysql://mgecs_test@localhost/mgecs",
    "mysql://mgecs_test@localhost/mgecs_test_production",
    "mysql://mgecs_test@localhost/mgecs_test_staging",
    "mysql://mgecs_test@localhost/mgecs_test_managed",
    "mysql://mgecs_test@localhost/mgecs_test_live",
    "mysql://mgecs_test@localhost/mgecs_test_",
    "mysql://mgecs_test@localhost/mgecs_test-ci",
    "mysql://mgecs_test@localhost/mgecs_test/other",
    "mysql://mgecs_test@localhost/mgecs_test/../production",
    "mysql://mgecs_test@localhost/%6dgecs_test",
    "mysql://mgecs_test@localhost/mgecs_test?socketPath=/tmp/mysql.sock",
    "mysql://mgecs_test@localhost/mgecs_test?host=remote.example.invalid",
    "mysql://mgecs_test@localhost/mgecs_test#ignored",
    "mysql://mgecs_test@localhost:0/mgecs_test",
    "mysql://mgecs_test@localhost:65536/mgecs_test",
    "mysql://mgecs_test@localhost:abc/mgecs_test",
    "mysql://mgecs_test:p@ss@localhost/mgecs_test",
    "mysql://mgecs_test:%zz@localhost/mgecs_test",
    "postgres://mgecs_test@localhost/mgecs_test",
    "mysql://mgecs_test:p ass@localhost/mgecs_test",
    "mysql://mgecs_test:p\tass@localhost/mgecs_test",
    "mysql://mgecs_test:p\nass@localhost/mgecs_test",
    "mysql://mgecs_test:p\\ass@localhost/mgecs_test",
    "mysql://mgecs_test:p\u0000ass@localhost/mgecs_test",
    "MYSQL://mgecs_test@localhost/mgecs_test",
    "mysql://mgecs_test@localhost/mgecs_test\n",
    " mysql://mgecs_test@localhost/mgecs_test",
    "",
  ])("rejects unsafe or ambiguous target %j", DATABASE_URL => {
    expect(() => guardTestDatabase({ ...valid(), DATABASE_URL })).toThrow();
  });
  it("never includes URL credentials in rejection errors", () => {
    const sentinel = "never-print-this-fixture-password";
    expect(() =>
      guardTestDatabase({
        ...valid(),
        DATABASE_URL: `mysql://root:${sentinel}@remote.example.invalid/production`,
      })
    ).toThrow(/DATABASE_URL must target/);
    try {
      guardTestDatabase({
        ...valid(),
        DATABASE_URL: `mysql://root:${sentinel}@remote.example.invalid/production`,
      });
    } catch (error) {
      expect(String(error)).not.toContain(sentinel);
    }
  });
  it("returns a decoded password with explicit fixed connection coordinates", () => {
    expect(
      guardTestDatabase({
        ...valid(),
        DATABASE_URL: "mysql://mgecs_test:p%40ss%3Aword@localhost/mgecs_test",
      })
    ).toEqual({
      host: "localhost",
      port: 3306,
      user: "mgecs_test",
      password: "p@ss:word",
      database: "mgecs_test",
    });
  });
});

describe("launcher and discovery boundaries", () => {
  it("allowlists only local test settings and a newly generated fixture signing key", () => {
    const secret = randomBytes(48).toString("base64url");
    const inherited = {
      ...valid(),
      JWT_SECRET: "managed-jwt-sentinel",
      MGECS_SESSION_SECRET: "managed-session-sentinel",
      OAUTH_SERVER_URL: "managed-oauth-sentinel",
      AWS_SECRET_ACCESS_KEY: "managed-storage-sentinel",
      OWNER_OPEN_ID: "real-owner-sentinel",
      PATH: "untrusted-path-sentinel",
      NODE_OPTIONS: "--import untrusted-loader",
      VITE_APP_ID: "managed-app-sentinel",
      HOME: "managed-home-sentinel",
    };
    const env = databaseTestEnvironment(inherited, secret);
    expect(env).toEqual({
      ...valid(),
      NODE_ENV: "test",
      TZ: "UTC",
      CI: "true",
      VITE_APP_ID: "disposable-identity-integration",
      MGECS_SESSION_SECRET: secret,
      OWNER_OPEN_ID: "disposable-owner-fixture",
    });
    expect(JSON.stringify(env)).not.toMatch(/managed-|sentinel|untrusted-/);
  });
  it("validates before preparing child environment", () => {
    expect(() =>
      databaseTestEnvironment({}, randomBytes(48).toString("base64url"))
    ).toThrow();
    expect(() => databaseTestEnvironment(valid(), "short")).toThrow();
  });
  it.each([
    {},
    { ...valid(), AI_UNK_TEST_DATABASE: "false" },
    {
      ...valid(),
      DATABASE_URL:
        "mysql://root:never-print-sentinel@remote.example.invalid/production",
    },
  ])(
    "rejects unsafe launcher environment promptly without loading a driver or opening a connection",
    env => {
      const result = spawnSync(
        process.execPath,
        [path.join(root, "scripts/database-test.mjs")],
        { cwd: root, env, encoding: "utf8", timeout: 5_000 }
      );
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/require|DATABASE_URL must target/);
      expect(result.stderr).not.toContain("never-print-sentinel");
      expect(result.stderr).not.toContain("runner failed");
      expect(result.stdout).toBe("");
    }
  );
  it("default portable discovery cannot discover integration files", () => {
    expect(portableConfig.test?.include).toEqual([
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
    ]);
    expect("server/security/identity.integration.ts").not.toMatch(
      /\.(test|spec)\.ts$/
    );
    const config = readFileSync(
      path.join(root, "vitest.database.config.ts"),
      "utf8"
    );
    expect(config).toContain('include: ["server/**/*.integration.ts"]');
    expect(config).toContain("MGECS_DB_TEST_LAUNCHED");
  });
  it("checks the guard before importing mysql2 and checks emptiness before migration", () => {
    const source = readFileSync(
      path.join(root, "scripts/database-test.mjs"),
      "utf8"
    );
    expect(source.indexOf("guardTestDatabase(process.env)")).toBeLessThan(
      source.indexOf('import("mysql2/promise")')
    );
    expect(source.indexOf("existing.length !== 0")).toBeLessThan(
      source.indexOf("await migrate(")
    );
    expect(source).not.toMatch(/drizzle-kit|db:push|DROP TABLE|TRUNCATE TABLE/);
    expect(source).toContain("120_000");
    expect(source).toContain("180_000");
  });
});

import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { loadRuntimeConfig } from "./config";

function fixture(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DATABASE_URL: "mysql://localhost/isolated_test",
    JWT_SECRET: randomBytes(32).toString("hex"),
    VITE_APP_ID: "configuration-test",
    OAUTH_SERVER_URL: "https://oauth.example.invalid",
    VITE_OAUTH_PORTAL_URL: "https://login.example.invalid",
  };
}

describe("runtime configuration", () => {
  it("accepts valid configuration and defaults the port", () => {
    expect(loadRuntimeConfig(fixture()).PORT).toBe(3000);
  });
  it.each([
    "DATABASE_URL",
    "JWT_SECRET",
    "VITE_APP_ID",
    "OAUTH_SERVER_URL",
    "VITE_OAUTH_PORTAL_URL",
  ])("rejects absent %s without exposing values", key => {
    const env = fixture();
    delete env[key];
    expect(() => loadRuntimeConfig(env)).toThrow(key);
    try {
      loadRuntimeConfig(env);
    } catch (error) {
      expect(String(error)).not.toContain(env.JWT_SECRET ?? "never-present");
    }
  });
  it("rejects a short session secret", () => {
    expect(() =>
      loadRuntimeConfig({ ...fixture(), JWT_SECRET: "short" })
    ).toThrow("JWT_SECRET");
  });
  it("rejects non-MySQL database URLs", () => {
    expect(() =>
      loadRuntimeConfig({
        ...fixture(),
        DATABASE_URL: "postgres://localhost/test",
      })
    ).toThrow("DATABASE_URL");
  });
  it.each(["0", "65536", "not-a-number"])("rejects invalid port %s", PORT => {
    expect(() => loadRuntimeConfig({ ...fixture(), PORT })).toThrow("PORT");
  });
  it("requires HTTPS OAuth endpoints in production", () => {
    expect(() =>
      loadRuntimeConfig({ ...fixture(), OAUTH_SERVER_URL: "http://localhost" })
    ).toThrow("HTTPS");
  });
});

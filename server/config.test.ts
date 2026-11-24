import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { getSessionSigningSecret, loadRuntimeConfig } from "./config";

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
  it("uses a strong application key without changing the managed key", () => {
    const MGECS_SESSION_SECRET = randomBytes(32).toString("hex");
    const env = { ...fixture(), JWT_SECRET: "short", MGECS_SESSION_SECRET };
    expect(loadRuntimeConfig(env).JWT_SECRET).toBe(MGECS_SESSION_SECRET);
    expect(getSessionSigningSecret(env)).toBe(MGECS_SESSION_SECRET);
    expect(env.JWT_SECRET).toBe("short");
  });
  it.each(["", "short"])("rejects an invalid explicit override %j", value => {
    expect(() =>
      loadRuntimeConfig({ ...fixture(), MGECS_SESSION_SECRET: value })
    ).toThrow("MGECS_SESSION_SECRET");
  });
  it("shares the legacy key resolution when an override is absent", () => {
    const env = fixture();
    expect(getSessionSigningSecret(env)).toBe(
      loadRuntimeConfig(env).JWT_SECRET
    );
  });
  it.skipIf(process.env.MGECS_VERIFY_CONFIG !== "true")(
    "validates the configured managed environment without printing credentials",
    async () => {
      const config = loadRuntimeConfig(process.env);
      expect(config.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
      const { sdk } = await import("./_core/sdk");
      const { jwtVerify } = await import("jose");
      const { createApp } = await import("./app");
      const { default: request } = await import("supertest");
      // A short-lived isolated proof, never an account or stored fixture.
      const token = await sdk.createSessionToken("configuration-probe", {
        name: "Configuration probe",
        expiresInMs: 60_000,
      });
      const key = new TextEncoder().encode(config.JWT_SECRET);
      await expect(
        jwtVerify(token, key, { algorithms: ["HS256"] })
      ).resolves.toBeDefined();
      await expect(jwtVerify(token, randomBytes(32))).rejects.toThrow();
      await expect(sdk.verifySession(token)).resolves.toMatchObject({
        openId: "configuration-probe",
        appId: config.VITE_APP_ID,
      });
      // Health is intentionally not authenticated; no identity/DB API is called.
      const response = await request(createApp())
        .get("/api/health")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.phase).toBe("foundation");
    }
  );
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

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
    MGECS_APP_ORIGINS: "https://app.example.invalid",
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
      const { createSessionCodec } = await import("./security/sessionTokens");
      const { jwtVerify } = await import("jose");
      const { createApp } = await import("./app");
      const { default: request } = await import("supertest");
      // A short-lived isolated proof, never an account or stored fixture.
      const codec = createSessionCodec({
        secret: config.JWT_SECRET,
        appId: config.VITE_APP_ID,
        absoluteMs: 60_000,
      });
      const { token } = await codec.issue(1);
      const key = new TextEncoder().encode(config.JWT_SECRET);
      await expect(
        jwtVerify(token, key, { algorithms: ["HS256"] })
      ).resolves.toBeDefined();
      await expect(jwtVerify(token, randomBytes(32))).rejects.toThrow();
      await expect(codec.verify(token)).resolves.toMatchObject({
        sub: "1",
        aud: config.VITE_APP_ID,
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
  it.each([
    undefined,
    "",
    "https://app.example.invalid/",
    "http://app.example.invalid",
    "https://user:pass@app.example.invalid",
    "https://app.example.invalid/path",
    "null",
  ])("rejects unsafe production origin %s", value => {
    const env = fixture();
    if (value === undefined) delete env.MGECS_APP_ORIGINS;
    else env.MGECS_APP_ORIGINS = value;
    expect(() => loadRuntimeConfig(env)).toThrow("MGECS_APP_ORIGINS");
  });
  it("accepts multiple exact HTTPS origins and removes duplicates", () => {
    expect(
      loadRuntimeConfig({
        ...fixture(),
        MGECS_APP_ORIGINS:
          "https://a.example.invalid, https://b.example.invalid,https://a.example.invalid",
      }).appOrigins
    ).toEqual(["https://a.example.invalid", "https://b.example.invalid"]);
  });
  it.each(["0", "59", "86401", "NaN", "1.5"])(
    "rejects unsafe absolute timeout %s",
    value => {
      expect(() =>
        loadRuntimeConfig({
          ...fixture(),
          MGECS_SESSION_ABSOLUTE_SECONDS: value,
        })
      ).toThrow("MGECS_SESSION_ABSOLUTE_SECONDS");
    }
  );
  it.each(["0", "59", "1801", "NaN", "1.5"])(
    "rejects unsafe idle timeout %s",
    value => {
      expect(() =>
        loadRuntimeConfig({ ...fixture(), MGECS_SESSION_IDLE_SECONDS: value })
      ).toThrow("MGECS_SESSION_IDLE_SECONDS");
    }
  );
  it("rejects idle longer than absolute timeout", () => {
    expect(() =>
      loadRuntimeConfig({
        ...fixture(),
        MGECS_SESSION_ABSOLUTE_SECONDS: "60",
        MGECS_SESSION_IDLE_SECONDS: "900",
      })
    ).toThrow("exceeds absolute");
  });
});

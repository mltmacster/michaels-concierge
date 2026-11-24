import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../app";
import {
  COOKIE_NAME,
  OAUTH_STATE_COOKIE,
  encodeOAuthState,
} from "../../shared/const";
import { sdk } from "../_core/sdk";
import { saveOAuthIdentity } from "../db";
import { IdentityStorageUnavailable } from "./events";
const lifecycle = vi.hoisted(() => ({ start: vi.fn(), revoke: vi.fn() }));
vi.mock("../db", async original => ({
  ...(await original<typeof import("../db")>()),
  saveOAuthIdentity: vi.fn(),
}));
vi.mock("./identityService", async original => ({
  ...(await original<typeof import("./identityService")>()),
  identityService: () => lifecycle,
}));
const origin = "https://app.example.invalid";
const app = () => createApp({ origins: [origin] });
const user = {
  id: 7,
  openId: "isolated-oauth",
  name: "Isolated Identity",
  email: null,
  loginMethod: "test",
  role: "user" as const,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignedIn: new Date(0),
};
function callback(
  nonce = randomUUID(),
  redirectUri = `${origin}/api/oauth/callback`
) {
  return { nonce, state: encodeOAuthState({ nonce, redirectUri }) };
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VITE_APP_ID", "isolated-oauth-app");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(sdk, "exchangeCodeForToken").mockResolvedValue({
    accessToken: "isolated-provider-value",
    tokenType: "bearer",
    expiresIn: 60,
    idToken: "unused",
    scope: "test",
  });
  vi.spyOn(sdk, "getUserInfo").mockResolvedValue({
    openId: user.openId,
    projectId: "isolated-oauth-app",
    name: user.name,
    email: null,
  });
  vi.mocked(saveOAuthIdentity).mockReset().mockResolvedValue(user);
  lifecycle.revoke.mockReset().mockResolvedValue(undefined);
  lifecycle.start.mockReset().mockResolvedValue({
    token: "isolated-session-value",
    expiresAtMs: Date.now() + 3_600_000,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("OAuth completion boundary", () => {
  it.each([
    "malformed",
    "missing-cookie",
    "wrong-nonce",
    "wrong-origin",
    "wrong-path",
    "query",
    "fragment",
  ])("rejects %s before provider exchange or persistence", async scenario => {
    const c = callback();
    let state = c.state;
    let cookie = `${OAUTH_STATE_COOKIE}=${c.nonce}`;
    if (scenario === "malformed") state = "invalid-state";
    if (scenario === "missing-cookie") cookie = "";
    if (scenario === "wrong-nonce")
      cookie = `${OAUTH_STATE_COOKIE}=${randomUUID()}`;
    if (scenario === "wrong-origin")
      state = callback(
        c.nonce,
        "https://evil.example.invalid/api/oauth/callback"
      ).state;
    if (scenario === "wrong-path")
      state = callback(c.nonce, `${origin}/other`).state;
    if (scenario === "query")
      state = callback(c.nonce, `${origin}/api/oauth/callback?next=evil`).state;
    if (scenario === "fragment")
      state = callback(c.nonce, `${origin}/api/oauth/callback#evil`).state;
    const res = await request(app())
      .get("/api/oauth/callback")
      .query({ code: "isolated-code", state })
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
    expect(sdk.exchangeCodeForToken).not.toHaveBeenCalled();
    expect(saveOAuthIdentity).not.toHaveBeenCalled();
  });
  it.each(["%C3%A9".repeat(36), "%F0%9F%98%80".repeat(18), "x".repeat(500)])(
    "rejects malformed nonce cookies without crashing",
    async cookie => {
      const c = callback();
      const res = await request(app())
        .get("/api/oauth/callback")
        .query({ code: "isolated-code", state: c.state })
        .set("Cookie", `${OAUTH_STATE_COOKIE}=${cookie}`);
      expect(res.status).toBe(403);
      expect(sdk.exchangeCodeForToken).not.toHaveBeenCalled();
    }
  );
  it("persists identity and new session, revoking old browser token before cookie issuance", async () => {
    const order: string[] = [];
    vi.mocked(saveOAuthIdentity).mockImplementation(async () => {
      order.push("identity");
      return user;
    });
    lifecycle.revoke.mockImplementation(async token => {
      expect(token).toBe("old-isolated-cookie");
      order.push("revoke");
    });
    lifecycle.start.mockImplementation(async () => {
      order.push("persist-session");
      return {
        token: "isolated-session-value",
        expiresAtMs: Date.now() + 3_600_000,
      };
    });
    const c = callback();
    const res = await request(app())
      .get("/api/oauth/callback")
      .query({ code: "isolated-code", state: c.state })
      .set(
        "Cookie",
        `${OAUTH_STATE_COOKIE}=${c.nonce}; ${COOKIE_NAME}=old-isolated-cookie`
      );
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/identity");
    expect(order).toEqual(["identity", "revoke", "persist-session"]);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    const session = cookies.find(value => value.startsWith(`${COOKIE_NAME}=`));
    expect(session).toContain("HttpOnly");
    expect(session).toContain("Secure");
    expect(session).toContain("SameSite=Lax");
    expect(session).not.toContain("Domain=");
    expect(Number(session?.match(/Max-Age=(\d+)/)?.[1])).toBeGreaterThanOrEqual(
      3598
    );
    expect(Number(session?.match(/Max-Age=(\d+)/)?.[1])).toBeLessThanOrEqual(
      3600
    );
    expect(vi.mocked(saveOAuthIdentity).mock.calls[0][0]).not.toHaveProperty(
      "role"
    );
  });
  it.each(["identity", "session", "revoke"])(
    "issues no session cookie if %s storage fails",
    async failure => {
      if (failure === "identity")
        vi.mocked(saveOAuthIdentity).mockRejectedValue(
          new IdentityStorageUnavailable()
        );
      if (failure === "session")
        lifecycle.start.mockRejectedValue(new IdentityStorageUnavailable());
      if (failure === "revoke")
        lifecycle.revoke.mockRejectedValue(new IdentityStorageUnavailable());
      const c = callback();
      const res = await request(app())
        .get("/api/oauth/callback")
        .query({ code: "isolated-code", state: c.state })
        .set("Cookie", `${OAUTH_STATE_COOKIE}=${c.nonce}`);
      expect(res.status).toBe(503);
      expect(
        (res.headers["set-cookie"] as unknown as string[]).some(value =>
          value.startsWith(`${COOKIE_NAME}=`)
        )
      ).toBe(false);
    }
  );
  it("rejects provider audience mismatch before writing identity", async () => {
    vi.mocked(sdk.getUserInfo).mockResolvedValue({
      openId: user.openId,
      projectId: "another-app",
      name: user.name,
    });
    const c = callback();
    const res = await request(app())
      .get("/api/oauth/callback")
      .query({ code: "isolated-code", state: c.state })
      .set("Cookie", `${OAUTH_STATE_COOKIE}=${c.nonce}`);
    expect(res.status).toBe(502);
    expect(saveOAuthIdentity).not.toHaveBeenCalled();
  });
  it("redacts provider failure details from HTTP and telemetry", async () => {
    vi.mocked(sdk.exchangeCodeForToken).mockRejectedValue(
      new Error("private-provider-value person@example.invalid")
    );
    const c = callback();
    const res = await request(app())
      .get("/api/oauth/callback")
      .query({ code: "isolated-code", state: c.state })
      .set("Cookie", `${OAUTH_STATE_COOKIE}=${c.nonce}`);
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain("private-provider-value");
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
      "person@example.invalid"
    );
  });
});

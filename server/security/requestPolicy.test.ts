import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { getSessionCookieOptions, sessionCookieName } from "../_core/cookies";
import { COOKIE_NAME, DEV_COOKIE_NAME } from "../../shared/const";
import { approvedOrigin, validCallback } from "./requestPolicy";
import { createContext } from "../_core/context";
import { identityService } from "./identityService";
import { IdentityStorageUnavailable } from "./events";
import type { Request } from "express";
const origin = "https://app.example.invalid";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("strict origin and cookie policy", () => {
  it.each([
    undefined,
    "null",
    "https://evil.example.invalid",
    `${origin}/`,
    `${origin}/path`,
    `https://user:pass@app.example.invalid`,
    "garbage",
    "https://app.example.invalid.evil.invalid",
  ])("rejects non-exact origin %s", value => {
    expect(approvedOrigin(value, [origin])).toBe(false);
  });
  it("accepts only configured canonical origins", () => {
    expect(approvedOrigin(origin, [origin])).toBe(true);
  });
  it.each([
    "https://evil.example.invalid/api/oauth/callback",
    `${origin}/other`,
    `${origin}/api/oauth/callback?next=evil`,
    `${origin}/api/oauth/callback#hash`,
    `https://u:p@app.example.invalid/api/oauth/callback`,
  ])("rejects unsafe callback %s", value => {
    expect(validCallback(value, [origin])).toBe(false);
  });
  it("accepts the approved fixed callback", () => {
    expect(validCallback(`${origin}/api/oauth/callback`, [origin])).toBe(true);
  });
  it("ignores forwarded protocol for production cookie security", () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = {
      protocol: "http",
      hostname: "localhost",
      socket: { remoteAddress: "127.0.0.1" },
      headers: { "x-forwarded-proto": "http" },
    } as unknown as Request;
    expect(getSessionCookieOptions(req)).toEqual({
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(sessionCookieName(req)).toBe(COOKIE_NAME);
  });
  it("uses a distinct insecure cookie only on actual loopback development HTTP", () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = {
      protocol: "http",
      hostname: "localhost",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as Request;
    expect(getSessionCookieOptions(req).secure).toBe(false);
    expect(sessionCookieName(req)).toBe(DEV_COOKIE_NAME);
    Object.assign(req, { hostname: "public.example.invalid" });
    expect(getSessionCookieOptions(req).secure).toBe(true);
  });
});

describe("mutation HTTP boundary", () => {
  const app = () => createApp({ origins: [origin] });
  it.each([
    "missing-origin",
    "cross-site",
    "same-site",
    "null-origin",
    "sibling-origin",
    "missing-header",
    "multipart",
    "form",
  ])("denies %s before invoking mutation", async scenario => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const req = request(app())
      .post("/api/trpc/auth.logout")
      .set("Origin", origin)
      .set("X-MGECS-Request", "1")
      .set("Sec-Fetch-Site", "same-origin")
      .set("Content-Type", "application/json");
    if (scenario === "missing-origin") req.unset("Origin");
    if (scenario === "cross-site" || scenario === "same-site")
      req.set("Sec-Fetch-Site", scenario);
    if (scenario === "null-origin") req.set("Origin", "null");
    if (scenario === "sibling-origin")
      req.set("Origin", "https://sibling.example.invalid");
    if (scenario === "missing-header") req.unset("X-MGECS-Request");
    if (scenario === "multipart")
      req.set("Content-Type", "multipart/form-data; boundary=test");
    if (scenario === "form")
      req.set("Content-Type", "application/x-www-form-urlencoded");
    const res = await req.send("{}");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ORIGIN_REJECTED");
  });
  it.each([true, false])(
    "allows same-origin JSON with Fetch Metadata present=%s",
    async metadata => {
      const req = request(app())
        .post("/api/trpc/auth.logout")
        .set("Origin", origin)
        .set("X-MGECS-Request", "1")
        .set("Content-Type", "application/json");
      if (metadata) req.set("Sec-Fetch-Site", "same-origin");
      const res = await req.send({ json: null });
      expect(res.status).toBe(200);
      expect(res.headers["cache-control"]).toBe("no-store");
    }
  );
  it("does not accept a mutation via GET", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await request(app()).get("/api/trpc/auth.logout")).status).toBe(
      405
    );
  });
  it("redacts tRPC stack and arbitrary context error messages", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await request(
      createApp({
        origins: [origin],
        context: async () => {
          throw new Error("private-provider-token-and-email");
        },
      })
    ).get("/api/trpc/auth.me");
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("private-provider");
    expect(JSON.stringify(res.body)).not.toContain("stack");
  });
  it("reports unavailable identity separately while public foundation remains usable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const appWithOutage = createApp({
      origins: [origin],
      context: async ({ req, res }) => ({
        req,
        res,
        user: null,
        identityUnavailable: true,
      }),
    });
    expect((await request(appWithOutage).get("/api/trpc/auth.me")).status).toBe(
      503
    );
    expect(
      (await request(appWithOutage).get("/api/trpc/operator.access")).status
    ).toBe(503);
    expect(
      (await request(appWithOutage).get("/api/trpc/foundation.status")).status
    ).toBe(200);
  });
});

describe("cookie-only authentication context", () => {
  it("ignores a JavaScript bearer header without a session cookie", async () => {
    const req = {
      headers: { authorization: "Bearer legacy-managed-token" },
    } as Request;
    const res = {} as Parameters<typeof createContext>[0]["res"];
    expect(
      (
        await createContext({
          req,
          res,
          info: {} as Parameters<typeof createContext>[0]["info"],
        })
      ).user
    ).toBeNull();
  });
  it("classifies ledger failure as unavailable rather than anonymous", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MGECS_SESSION_SECRET", "x".repeat(64));
    vi.stubEnv("VITE_APP_ID", "isolated-context");
    vi.spyOn(identityService(), "authenticate").mockRejectedValue(
      new IdentityStorageUnavailable()
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const req = {
      protocol: "https",
      headers: { cookie: `${COOKIE_NAME}=test-token` },
    } as Request;
    const res = { getHeader: () => undefined } as unknown as Parameters<
      typeof createContext
    >[0]["res"];
    const ctx = await createContext({
      req,
      res,
      info: {} as Parameters<typeof createContext>[0]["info"],
    });
    expect(ctx.identityUnavailable).toBe(true);
    expect(ctx.user).toBeNull();
  });
});

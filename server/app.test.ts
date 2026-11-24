import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app";

// Dependency injection here is test-only; runtime uses a real SELECT 1 probe.
describe("foundation HTTP contract", () => {
  it("reports liveness without claiming customer-service readiness", async () => {
    const response = await request(createApp()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "michaels-concierge",
      phase: "foundation",
    });
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
  it("returns ready only after a successful probe", async () => {
    const response = await request(createApp({ ready: async () => true })).get(
      "/api/ready"
    );
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ready");
  });
  it("returns 503 for unavailable storage", async () => {
    const response = await request(createApp({ ready: async () => false })).get(
      "/api/ready"
    );
    expect(response.status).toBe(503);
  });
  it("does not disclose provider errors", async () => {
    const response = await request(
      createApp({
        ready: async () => {
          throw new Error("private detail");
        },
      })
    ).get("/api/ready");
    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain("private detail");
  });
  it("returns JSON 404 for unknown APIs", async () => {
    const response = await request(createApp()).get("/api/not-implemented");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
  it("rejects invalid JSON", async () => {
    const response = await request(createApp())
      .post("/api/not-implemented")
      .set("Content-Type", "application/json")
      .send("{");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });
  it("rejects oversized request bodies", async () => {
    const response = await request(createApp())
      .post("/api/not-implemented")
      .send({ payload: "x".repeat(300_000) });
    expect(response.status).toBe(413);
  });
  it("rejects incomplete OAuth callback without contacting providers", async () => {
    const response = await request(createApp()).get("/api/oauth/callback");
    expect(response.status).toBe(400);
  });
  it("rejects forged OAuth state without a matching browser cookie", async () => {
    const state = Buffer.from(
      JSON.stringify({
        redirectUri: "https://example.invalid/api/oauth/callback",
        nonce: "test-nonce",
      })
    ).toString("base64");
    const response = await request(createApp())
      .get("/api/oauth/callback")
      .query({ code: "non-actionable-test", state });
    expect(response.status).toBe(403);
  });
});

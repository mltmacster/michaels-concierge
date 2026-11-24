import { afterEach, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { rateLimit } from "./rateLimit";
import { securityEvent } from "./events";
afterEach(() => vi.restoreAllMocks());
it("limits the socket-address bucket, ignores spoofed forwarded IP, and resets after its window", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  let clock = 0;
  const app = express();
  app.use(rateLimit(2, 60000, () => clock));
  app.get("/", (_req, res) => res.json({ ok: true }));
  expect(
    (await request(app).get("/").set("X-Forwarded-For", "1.1.1.1")).status
  ).toBe(200);
  expect(
    (await request(app).get("/").set("X-Forwarded-For", "2.2.2.2")).status
  ).toBe(200);
  const limited = await request(app).get("/").set("X-Forwarded-For", "3.3.3.3");
  expect(limited.status).toBe(429);
  expect(limited.headers["retry-after"]).toBe("60");
  clock = 60000;
  expect((await request(app).get("/")).status).toBe(200);
});
it("omits invalid request IDs rather than logging arbitrary metadata", () => {
  const logger = vi.spyOn(console, "warn").mockImplementation(() => {});
  securityEvent("request.rpc_failed", "person@example.invalid secret-cookie");
  expect(JSON.parse(String(logger.mock.calls[0][0]))).toEqual({
    event: "request.rpc_failed",
  });
});

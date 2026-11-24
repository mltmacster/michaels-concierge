import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { IdentityStorageUnavailable } from "./security/events";
const doubles = vi.hoisted(() => ({ revoke: vi.fn() }));
vi.mock("./security/identityService", async original => ({
  ...(await original<typeof import("./security/identityService")>()),
  identityService: () => doubles,
}));
function context(role: "user" | "admin" = "user") {
  const cleared: string[] = [];
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "isolated-customer",
      name: "Isolated Customer",
      email: "fixture@example.invalid",
      loginMethod: "test",
      role,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      lastSignedIn: new Date(0),
    },
    req: {
      protocol: "https",
      headers: { cookie: `${COOKIE_NAME}=test-cookie-value` },
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string) => {
        cleared.push(name);
      },
      getHeader: () => undefined,
    } as unknown as TrpcContext["res"],
  };
  return { ctx, cleared };
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  doubles.revoke.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("identity/logout API boundaries", () => {
  it("revokes the supplied browser session before clearing and confirming", async () => {
    const { ctx, cleared } = context();
    doubles.revoke.mockImplementation(async () => {
      expect(cleared).toEqual([]);
    });
    await expect(appRouter.createCaller(ctx).auth.logout()).resolves.toEqual({
      success: true,
    });
    expect(doubles.revoke).toHaveBeenCalledWith("test-cookie-value");
    expect(cleared).toEqual([COOKIE_NAME]);
  });
  it("does not clear or claim success on revocation failure", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { ctx, cleared } = context();
    doubles.revoke.mockRejectedValue(new IdentityStorageUnavailable());
    await expect(
      appRouter.createCaller(ctx).auth.logout()
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(cleared).toEqual([]);
  });
  it("rejects an unavailable identity context before logout", async () => {
    const { ctx, cleared } = context();
    ctx.identityUnavailable = true;
    await expect(
      appRouter.createCaller(ctx).auth.logout()
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(cleared).toEqual([]);
    expect(doubles.revoke).not.toHaveBeenCalled();
  });
  it("allows idempotent anonymous logout with no stored credential", async () => {
    const { ctx } = context();
    ctx.user = null;
    ctx.req.headers.cookie = undefined;
    await expect(appRouter.createCaller(ctx).auth.logout()).resolves.toEqual({
      success: true,
    });
    expect(doubles.revoke).not.toHaveBeenCalled();
  });
  it("returns only the minimal principal, not OAuth/timestamps/storage fields", async () => {
    const { ctx } = context();
    const principal = await appRouter.createCaller(ctx).auth.me();
    expect(principal).toEqual({
      id: 1,
      name: "Isolated Customer",
      email: "fixture@example.invalid",
      role: "user",
      identityRole: "customer",
      permissions: ["identity:read:self", "session:revoke:self"],
    });
    expect(principal).not.toHaveProperty("openId");
    expect(principal).not.toHaveProperty("lastSignedIn");
  });
  it("distinguishes anonymous and unavailable identity", async () => {
    const { ctx } = context();
    ctx.user = null;
    await expect(appRouter.createCaller(ctx).auth.me()).resolves.toBeNull();
    ctx.identityUnavailable = true;
    await expect(appRouter.createCaller(ctx).auth.me()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
  it("denies anonymous operator access", async () => {
    const { ctx } = context();
    ctx.user = null;
    await expect(
      appRouter.createCaller(ctx).operator.access()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("denies customer operator access regardless of a forged header", async () => {
    const { ctx } = context();
    ctx.req.headers["x-role"] = "admin";
    await expect(
      appRouter.createCaller(ctx).operator.access()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("grants the operator check only to the current stored admin", async () => {
    const { ctx } = context("admin");
    await expect(
      appRouter.createCaller(ctx).operator.access()
    ).resolves.toEqual({ identityRole: "operator", accessVerified: true });
    ctx.user!.role = "user";
    await expect(
      appRouter.createCaller(ctx).operator.access()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("permits only the caller's numeric profile ID, even for operators", async () => {
    const { ctx } = context("admin");
    await expect(
      appRouter.createCaller(ctx).auth.profile({ userId: 1 })
    ).resolves.toMatchObject({ id: 1 });
    await expect(
      appRouter.createCaller(ctx).auth.profile({ userId: 2 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects noncanonical owner ID %s",
    async userId => {
      const { ctx } = context();
      await expect(
        appRouter.createCaller(ctx).auth.profile({ userId })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  );
});

import { parse } from "cookie";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions, sessionCookieName } from "./_core/cookies";
import {
  adminProcedure,
  ensureIdentityAvailable,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { identityService, publicPrincipal } from "./security/identityService";
import { securityEvent } from "./security/events";

export const appRouter = router({
  foundation: router({
    status: publicProcedure.query(() => ({
      phase: "Phase 1 — Identity/security development",
      acceptsRequests: false,
      billingEnabled: false,
      providerDiscoveryEnabled: false,
      aiEnabled: false,
    })),
  }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      ensureIdentityAvailable(ctx);
      return ctx.user ? publicPrincipal(ctx.user) : null;
    }),
    profile: protectedProcedure
      .input(z.object({ userId: z.number().int().positive().safe() }).strict())
      .query(({ ctx, input }) => {
        if (input.userId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN" });
        return publicPrincipal(ctx.user);
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ensureIdentityAvailable(ctx);
      const token = parse(ctx.req.headers.cookie ?? "")[
        sessionCookieName(ctx.req)
      ];
      try {
        if (token) await identityService().revoke(token);
      } catch {
        securityEvent(
          "identity.revocation_failed",
          String(ctx.res.getHeader("X-Request-ID") ?? "")
        );
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });
      }
      ctx.res.clearCookie(
        sessionCookieName(ctx.req),
        getSessionCookieOptions(ctx.req)
      );
      return { success: true } as const;
    }),
  }),
  operator: router({
    access: adminProcedure.query(
      () => ({ identityRole: "operator", accessVerified: true }) as const
    ),
  }),
});
export type AppRouter = typeof appRouter;

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  foundation: router({
    status: publicProcedure.query(() => ({
      phase: "Phase 0 — Foundation",
      acceptsRequests: false,
      billingEnabled: false,
      providerDiscoveryEnabled: false,
      aiEnabled: false,
    })),
  }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;

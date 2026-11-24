import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const messages: Record<string, string> = {
  UNAUTHORIZED: "Sign in to continue",
  FORBIDDEN: "You do not have permission for this action",
  SERVICE_UNAVAILABLE: "Identity service temporarily unavailable",
  BAD_REQUEST: "Invalid request",
};
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message: messages[error.code] ?? "Request could not be completed",
      data: { code: shape.data.code, httpStatus: shape.data.httpStatus },
    };
  },
});
export const router = t.router;
export const publicProcedure = t.procedure;
export function ensureIdentityAvailable(ctx: TrpcContext) {
  if (ctx.identityUnavailable)
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });
}
const requireUser = t.middleware(({ ctx, next }) => {
  ensureIdentityAvailable(ctx);
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (
    !Number.isSafeInteger(ctx.user.id) ||
    ctx.user.id < 1 ||
    !["user", "admin"].includes(ctx.user.role)
  )
    throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const protectedProcedure = t.procedure.use(requireUser);
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

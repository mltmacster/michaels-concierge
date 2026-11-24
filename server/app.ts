import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

export async function databaseReady(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.execute(sql`SELECT 1`);
  return true;
}

/** No listener, migration or seed side effects. Health probes never write. */
export function createApp(
  options: {
    ready?: () => Promise<boolean>;
    production?: boolean;
  } = {}
) {
  const app = express();
  const ready = options.ready ?? databaseReady;
  app.disable("x-powered-by");
  // CSP will be enforced when provider/asset origins are finalized; not a release claim.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      strictTransportSecurity: options.production ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use((_req, res, next) => {
    res.setHeader("X-Request-ID", randomUUID());
    next();
  });
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ limit: "256kb", extended: false }));
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      status: "ok",
      service: "michaels-concierge",
      phase: "foundation",
    });
  });
  app.get("/api/ready", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const available = await Promise.race([
        ready(),
        new Promise<boolean>(resolve =>
          setTimeout(() => resolve(false), 2000).unref()
        ),
      ]);
      res
        .status(available ? 200 : 503)
        .json({ status: available ? "ready" : "not_ready" });
    } catch {
      res.status(503).json({ status: "not_ready" });
    }
  });
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );
  app.use("/api", (_req, res) => {
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Unknown API route" } });
  });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const status =
      error?.type === "entity.too.large"
        ? 413
        : error instanceof SyntaxError
          ? 400
          : 500;
    res.status(status).json({
      error: {
        code:
          status === 413
            ? "PAYLOAD_TOO_LARGE"
            : status === 400
              ? "INVALID_REQUEST"
              : "INTERNAL_ERROR",
        message:
          status === 500
            ? "Request could not be completed"
            : "Invalid request body",
      },
    });
  };
  app.use(errors);
  return app;
}

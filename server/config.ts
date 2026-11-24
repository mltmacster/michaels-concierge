import { z } from "zod";

const httpUrl = z
  .string()
  .url()
  .refine(value => /^https?:/.test(value));
const mysqlUrl = z
  .string()
  .url()
  .refine(value => value.startsWith("mysql://"));
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: mysqlUrl,
  JWT_SECRET: z.string().min(32),
  VITE_APP_ID: z.string().trim().min(1),
  OAUTH_SERVER_URL: httpUrl,
  VITE_OAUTH_PORTAL_URL: httpUrl,
  MGECS_APP_ORIGINS: z.string().optional(),
  MGECS_SESSION_ABSOLUTE_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(86400)
    .default(3600),
  MGECS_SESSION_IDLE_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(1800)
    .default(900),
});
export type RuntimeConfig = z.infer<typeof schema> & { appOrigins: string[] };

/** A single application session key; never overwrite managed variables. */
export function getSessionSigningSecret(env: NodeJS.ProcessEnv) {
  return env.MGECS_SESSION_SECRET ?? env.JWT_SECRET;
}

export function configuredOrigins(env: NodeJS.ProcessEnv): string[] {
  const raw =
    env.MGECS_APP_ORIGINS ??
    (env.NODE_ENV !== "production"
      ? `http://localhost:${env.PORT ?? 3000},http://127.0.0.1:${env.PORT ?? 3000}`
      : "");
  const origins = raw.split(",").map(value => value.trim());
  if (
    !origins.length ||
    origins.some(value => {
      try {
        const url = new URL(value);
        return (
          url.origin !== value ||
          !["http:", "https:"].includes(url.protocol) ||
          !!url.username ||
          !!url.password ||
          (url.protocol !== "https:" &&
            (env.NODE_ENV === "production" ||
              !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error("Invalid runtime configuration: MGECS_APP_ORIGINS");
  return [...new Set(origins)];
}

/** Errors contain field names only, never configuration values. */
export function loadRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const result = schema.safeParse({
    ...env,
    JWT_SECRET: getSessionSigningSecret(env),
  });
  if (!result.success) {
    const names = [
      ...new Set(
        result.error.issues.map(issue =>
          issue.path[0] === "JWT_SECRET" &&
          env.MGECS_SESSION_SECRET !== undefined
            ? "MGECS_SESSION_SECRET"
            : issue.path[0]
        )
      ),
    ];
    throw new Error(`Invalid runtime configuration: ${names.join(", ")}`);
  }
  const config = result.data;
  if (
    config.NODE_ENV === "production" &&
    [config.OAUTH_SERVER_URL, config.VITE_OAUTH_PORTAL_URL].some(
      url => !url.startsWith("https://")
    )
  )
    throw new Error(
      "Invalid runtime configuration: production OAuth URLs must use HTTPS"
    );
  if (config.MGECS_SESSION_IDLE_SECONDS > config.MGECS_SESSION_ABSOLUTE_SECONDS)
    throw new Error(
      "Invalid runtime configuration: MGECS_SESSION_IDLE_SECONDS exceeds absolute limit"
    );
  return {
    ...config,
    appOrigins: configuredOrigins({
      ...env,
      NODE_ENV: config.NODE_ENV,
      PORT: String(config.PORT),
    }),
  };
}

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
  VITE_APP_ID: z.string().min(1),
  OAUTH_SERVER_URL: httpUrl,
  VITE_OAUTH_PORTAL_URL: httpUrl,
});

export type RuntimeConfig = z.infer<typeof schema>;

/** Validate before listening. Errors contain field names only, never values. */
export function loadRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const result = schema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map(issue => issue.path[0]))];
    throw new Error(`Invalid runtime configuration: ${names.join(", ")}`);
  }
  const config = result.data;
  if (config.NODE_ENV === "production") {
    const urls = [config.OAUTH_SERVER_URL, config.VITE_OAUTH_PORTAL_URL];
    if (urls.some(url => !url.startsWith("https://"))) {
      throw new Error("Production OAuth URLs must use HTTPS");
    }
  }
  return config;
}

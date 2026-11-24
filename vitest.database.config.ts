import path from "node:path";
import { defineConfig } from "vitest/config";
import { guardTestDatabase } from "./scripts/database-guard.mjs";

guardTestDatabase(process.env);
if (process.env.MGECS_DB_TEST_LAUNCHED !== "true") {
  throw new Error(
    "Run database integration through node scripts/database-test.mjs"
  );
}

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    environment: "node",
    include: ["server/**/*.integration.ts"],
    fileParallelism: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 10_000,
    hookTimeout: 10_000,
    teardownTimeout: 5_000,
    sequence: { concurrent: false },
  },
});

import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4179", trace: "retain-on-failure" },
  webServer: {
    command: "node dist/index.js",
    url: "http://127.0.0.1:4179/api/health",
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      NODE_ENV: "production",
      PORT: "4179",
      DATABASE_URL: "mysql://127.0.0.1:1/isolated_browser_test",
      JWT_SECRET: randomBytes(32).toString("hex"),
      VITE_APP_ID: "isolated-browser-test",
      MGECS_APP_ORIGINS: "https://app.example.invalid",
      OAUTH_SERVER_URL: "https://oauth.example.invalid",
      VITE_OAUTH_PORTAL_URL: "https://login.example.invalid",
    },
  },
});

import "dotenv/config";
import { createServer } from "node:http";
import { loadRuntimeConfig } from "../config";

async function startServer() {
  // Reject unsafe config before importing auth/database services or listening.
  const config = loadRuntimeConfig(process.env);
  const { createApp } = await import("../app");
  const { serveStatic, setupVite } = await import("./vite");
  const app = createApp({
    production: config.NODE_ENV === "production",
    origins: config.appOrigins,
  });
  const server = createServer(app);
  if (config.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.PORT, resolve);
  });
  console.log(`Server running on http://localhost:${config.PORT}/`);
  const stop = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}

startServer().catch(error => {
  // Configuration errors contain only field names; other errors stay generic.
  const message =
    error instanceof Error &&
    error.message.startsWith("Invalid runtime configuration")
      ? error.message
      : "Server initialization failed";
  console.error(message);
  process.exitCode = 1;
});

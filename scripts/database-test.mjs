import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  databaseTestEnvironment,
  guardTestDatabase,
} from "./database-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let connection;
let child;
let timedOut = false;
const terminateChild = signal => {
  if (!child || child.exitCode !== null) return;
  try {
    // A detached process group also terminates Vitest's worker processes.
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
};
const deadline = setTimeout(() => {
  timedOut = true;
  console.error("Disposable database runner exceeded its 180-second deadline");
  connection?.destroy();
  terminateChild("SIGKILL");
  process.exit(1);
}, 180_000);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    connection?.destroy();
    terminateChild("SIGKILL");
    process.exit(1);
  });
}

try {
  const target = guardTestDatabase(process.env);
  const env = databaseTestEnvironment(
    process.env,
    randomBytes(48).toString("base64url")
  );
  // Import drivers only AFTER all target and acknowledgement checks succeed.
  const { createConnection } = await import("mysql2/promise");
  const { drizzle } = await import("drizzle-orm/mysql2");
  const { migrate } = await import("drizzle-orm/mysql2/migrator");
  connection = await createConnection({
    ...target,
    connectTimeout: 5_000,
    multipleStatements: false,
  });
  const [identity] = await connection.query(
    "SELECT DATABASE() AS db, CURRENT_USER() AS account, VERSION() AS version"
  );
  if (
    identity[0]?.db !== target.database ||
    identity[0]?.account.split("@")[0] !== "mgecs_test" ||
    !(
      /^8\./.test(identity[0]?.version) || /MariaDB/i.test(identity[0]?.version)
    )
  ) {
    throw new Error("Disposable database server, user or schema mismatch");
  }
  const [existing] = await connection.execute(
    `SELECT TABLE_NAME AS objectName FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?
     UNION ALL SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?
     UNION ALL SELECT EVENT_NAME FROM information_schema.EVENTS WHERE EVENT_SCHEMA = ?
     UNION ALL SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?`,
    [target.database, target.database, target.database, target.database]
  );
  if (existing.length !== 0) {
    throw new Error(
      "Refusing a nonempty preexisting schema; recreate the disposable database before each run"
    );
  }
  console.log(
    "Disposable schema is empty; applying existing reviewed Drizzle migrations"
  );
  await migrate(drizzle(connection), {
    migrationsFolder: path.join(root, "drizzle"),
  });
  const [required] = await connection.execute(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('users', 'userSessions')",
    [target.database]
  );
  if (required.length !== 2) {
    throw new Error("Reviewed migrations must create users and userSessions");
  }
  await connection.end();
  connection = undefined;
  console.log(
    "Running isolated identity integration tests (120-second child limit)"
  );
  env.MGECS_DB_TEST_LAUNCHED = "true";
  child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/vitest/vitest.mjs"),
      "run",
      "--config",
      "vitest.database.config.ts",
    ],
    { cwd: root, env, stdio: "inherit", detached: true }
  );
  const childDeadline = setTimeout(() => {
    timedOut = true;
    console.error("Vitest database child exceeded its 120-second deadline");
    terminateChild("SIGKILL");
  }, 120_000);
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (status, signal) => resolve(signal ? 1 : (status ?? 1)));
  }).finally(() => clearTimeout(childDeadline));
  process.exitCode = timedOut ? 1 : code;
} catch (error) {
  // Never print a driver exception/stack: it may contain the connection URL.
  const safe = [
    "Disposable database tests require",
    "DATABASE_URL must target",
    "Disposable database port",
    "Invalid disposable database URL",
    "A fresh fixture-only",
    "Disposable database server",
    "Refusing a nonempty",
    "Reviewed migrations must",
  ];
  console.error(
    safe.some(prefix => error.message?.startsWith(prefix))
      ? error.message
      : "Disposable database runner failed; check local server availability and reviewed migrations"
  );
  process.exitCode = 1;
} finally {
  if (connection) {
    try {
      await connection.end();
    } catch {
      connection.destroy();
    }
  }
  clearTimeout(deadline);
}

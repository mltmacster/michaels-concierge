import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import net from "node:net";
import assert from "node:assert/strict";

const cleanEnv = { PATH: process.env.PATH, NODE_ENV: "production" };
const invalid = spawn(process.execPath, ["dist/index.js"], {
  env: cleanEnv,
  stdio: ["ignore", "pipe", "pipe"],
});
let invalidOutput = "";
invalid.stderr.on("data", data => {
  invalidOutput += data;
});
const [invalidCode] = await once(invalid, "exit");
assert.equal(invalidCode, 1, "missing configuration must exit with 1");
assert.match(invalidOutput, /Invalid runtime configuration/);

const listener = net.createServer();
listener.listen(0, "127.0.0.1");
await once(listener, "listening");
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const env = {
  ...cleanEnv,
  PORT: String(port),
  DATABASE_URL: "mysql://127.0.0.1:1/isolated_smoke",
  JWT_SECRET: randomBytes(32).toString("hex"),
  VITE_APP_ID: "isolated-smoke",
  OAUTH_SERVER_URL: "https://oauth.example.invalid",
  VITE_OAUTH_PORTAL_URL: "https://login.example.invalid",
};
const child = spawn(process.execPath, ["dist/index.js"], {
  env,
  stdio: ["ignore", "pipe", "pipe"],
});
// Capture, do not echo secondary listener URLs into the managed preview log.
let output = "";
child.stdout.on("data", data => {
  output += data;
});
child.stderr.on("data", data => {
  output += data;
});
const origin = `http://127.0.0.1:${port}`;
try {
  let connected = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null)
      throw new Error("Smoke server exited during startup");
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) {
        connected = true;
        break;
      }
    } catch {
      /* bounded startup wait */
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(connected, "production process must become live");
  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Michaels Concierge/);
  const health = await fetch(`${origin}/api/health`);
  assert.equal((await health.json()).phase, "foundation");
  const ready = await fetch(`${origin}/api/ready`);
  assert.equal(
    ready.status,
    503,
    "unavailable database must not be called ready"
  );
  const missing = await fetch(`${origin}/api/not-implemented`);
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get("content-type"), /json/);
  console.log(
    "PASS: production startup rejects missing config; static page and API are live; unavailable DB returns 503; unknown API returns JSON 404."
  );
} catch (error) {
  console.error("FAIL: production smoke", error.message);
  // Child output must never include real credentials: this process uses only generated test values.
  console.error(output.replaceAll(env.JWT_SECRET, "[redacted test secret]"));
  process.exitCode = 1;
} finally {
  child.kill("SIGTERM");
  if (child.exitCode === null) await once(child, "exit");
}

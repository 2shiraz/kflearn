import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const backendDir = fileURLToPath(new URL("../", import.meta.url));
const script = 'import { env } from "./src/config/env.js"; import { SESSION_COOKIE, CSRF_COOKIE } from "./src/utils/authCookies.js"; process.stdout.write(JSON.stringify({ host: env.host, trustedProxyHops: env.trustedProxyHops, SESSION_COOKIE, CSRF_COOKIE }));';

function loadProductionConfig(overrides = {}) {
  return spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: backendDir,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "production",
      JWT_SECRET: "a".repeat(32),
      ENCRYPTION_KEY: "b".repeat(32),
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      FRONTEND_URL: "https://example.test",
      HOST: "",
      TRUST_PROXY_HOPS: "0",
      ...overrides,
    },
  });
}

test("production rejects a weak encryption key", () => {
  const child = loadProductionConfig({ ENCRYPTION_KEY: "short" });
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /ENCRYPTION_KEY must be at least 32 characters/);
});

test("production proxy trust is opt-in and proxy hop count is validated", () => {
  const normal = loadProductionConfig();
  assert.equal(normal.status, 0);
  assert.deepEqual(JSON.parse(normal.stdout), {
    host: "0.0.0.0", trustedProxyHops: 0,
    SESSION_COOKIE: "__Host-kf_session", CSRF_COOKIE: "__Host-XSRF-TOKEN",
  });

  const invalid = loadProductionConfig({ TRUST_PROXY_HOPS: "-1" });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /TRUST_PROXY_HOPS must be a non-negative integer/);
});

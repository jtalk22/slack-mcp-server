/**
 * The HTTP transport's browser-origin allowlist: exact origins, plus the
 * `<scheme>://*` form for browser-extension MCP clients, under the rules
 * @modelcontextprotocol/server 2.3.0 adopted (no wildcard over http or https).
 * Unit cases first, then the real entry spawned on a port.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describeAllowedOrigins, isOriginAllowed, parseAllowedOrigins } from "../lib/http-origins.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIREFOX = "moz-extension://3f1c2a9e-7b44-4d0e-9a51-2c8e6f0b1d77";

test("exact origins match exactly", () => {
  const allow = parseAllowedOrigins("https://app.example.com, http://localhost:5173");
  assert.equal(isOriginAllowed("https://app.example.com", allow), true);
  assert.equal(isOriginAllowed("http://localhost:5173", allow), true);
  assert.equal(isOriginAllowed("https://app.example.com:8443", allow), false);
  assert.equal(isOriginAllowed("https://evil.example", allow), false);
  assert.equal(isOriginAllowed(FIREFOX, allow), false, "no wildcard listed, no extension admitted");
});

test("a scheme wildcard admits every origin of that scheme and nothing else", () => {
  const allow = parseAllowedOrigins("moz-extension://*,chrome-extension://*");
  assert.equal(isOriginAllowed(FIREFOX, allow), true);
  assert.equal(isOriginAllowed("moz-extension://another-install-id", allow), true);
  assert.equal(isOriginAllowed("chrome-extension://abcdefghijklmnopabcdefghijklmnop", allow), true);
  assert.equal(isOriginAllowed("safari-web-extension://abc", allow), false);
  assert.equal(isOriginAllowed("https://evil.example", allow), false);
  assert.equal(isOriginAllowed("null", allow), false, "the opaque origin");
  assert.equal(isOriginAllowed("moz-extension://", allow), false, "no host");
  assert.equal(isOriginAllowed(`${FIREFOX}/popup.html`, allow), false, "an Origin never carries a path");
  assert.equal(isOriginAllowed("", allow), false);
  assert.equal(isOriginAllowed(undefined, allow), false);
});

test("a wildcard over the web, or any other wildcard shape, is refused", () => {
  const allow = parseAllowedOrigins("https://*, http://*, https://*.example.com, MOZ-EXTENSION://*, moz-extension://*");
  assert.deepEqual(allow.refused.map((r) => r.entry), ["https://*", "http://*", "https://*.example.com", "MOZ-EXTENSION://*"]);
  assert.deepEqual([...allow.schemes], ["moz-extension:"]);
  assert.equal(isOriginAllowed("https://anything.example", allow), false);
  assert.equal(isOriginAllowed("https://a.example.com", allow), false);
  assert.equal(describeAllowedOrigins(allow), "moz-extension://*");
});

test("an empty or missing value admits no browser origin", () => {
  for (const raw of [undefined, "", " , "]) {
    const allow = parseAllowedOrigins(raw);
    assert.equal(allow.exact.size + allow.schemes.size + allow.refused.length, 0);
    assert.equal(isOriginAllowed("https://app.example.com", allow), false);
    assert.equal(describeAllowedOrigins(allow), "");
  }
});

test("the HTTP entry admits a Firefox extension origin, echoes it, and still requires the bearer", async () => {
  const port = 40100 + Math.floor(Math.random() * 400);
  const token = `t-${Math.random().toString(36).slice(2)}`;
  const env = {
    ...process.env,
    PORT: String(port),
    SLACK_MCP_HTTP_AUTH_TOKEN: token,
    SLACK_MCP_HTTP_ALLOWED_ORIGINS: "moz-extension://*,https://app.example.com,https://*",
    HOME: mkdtempSync(join(tmpdir(), "slack-mcp-origins-")),
    SLACK_MCP_TOKEN_STORAGE: "file",
    SLACK_NO_AUTO_REFRESH: "true",
  };
  delete env.SLACK_TOKEN;
  delete env.SLACK_COOKIE;
  delete env.SLACK_MCP_HTTP_INSECURE;
  const child = spawn(process.execPath, ["src/server-http.js"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout.on("data", (d) => { log += d; });
  child.stderr.on("data", (d) => { log += d; });
  try {
    const base = `http://127.0.0.1:${port}/mcp`;
    // Wait for the whole startup log, not its first line. The allowlist line
    // follows "HTTP server running" on stdout, and the refused-entry warning
    // goes to stderr, so the two can arrive in separate chunks and in either
    // order. Waiting for the first line alone failed on Node 20 in CI.
    const started = () => log.includes("CORS allowlist:") && log.includes('entry "https://*" ignored');
    for (let i = 0; i < 100 && !started(); i += 1) {
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.match(log, /CORS allowlist: https:\/\/app\.example\.com, moz-extension:\/\/\*/);
    assert.match(log, /entry "https:\/\/\*" ignored/);

    const initialize = {
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "origins-test", version: "0" } },
    };
    const post = (origin, bearer = token) => fetch(base, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(origin ? { origin } : {}),
        ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify(initialize),
    });

    const preflight = await fetch(base, { method: "OPTIONS", headers: { origin: FIREFOX } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), FIREFOX);
    assert.equal(preflight.headers.get("vary"), "Origin");

    const fromExtension = await post(FIREFOX);
    assert.equal(fromExtension.status, 200);
    assert.equal(fromExtension.headers.get("access-control-allow-origin"), FIREFOX);
    assert.match(await fromExtension.text(), /slack-mcp-server/);

    const listedSite = await post("https://app.example.com");
    assert.equal(listedSite.status, 200);

    const unlistedSite = await post("https://evil.example");
    assert.equal(unlistedSite.status, 403);
    assert.equal((await unlistedSite.json()).code, "cors_origin_denied");

    const otherExtension = await post("chrome-extension://abcdefghijklmnopabcdefghijklmnop");
    assert.equal(otherExtension.status, 403);

    const noBearer = await post(FIREFOX, null);
    assert.equal(noBearer.status, 401, "an admitted origin still needs the token");
  } finally {
    child.kill("SIGTERM");
  }
});

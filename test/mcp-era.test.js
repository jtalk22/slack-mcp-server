/**
 * Proof for the README's protocol claim: this server speaks MCP 2026-07-28
 * and every 2025 revision from the same binary.
 *
 * Three layers, each against the real SDK, no mocks:
 *   1. In-process Streamable HTTP — the same handler src/server-http.js
 *      serves — driven by a legacy client, a pinned 2026-07-28 client, and
 *      raw wire requests that check the 2026-07-28 conformance details
 *      (`resultType`, cache fields, `_meta` serverInfo, `Mcp-Method`
 *      enforcement, unsupported-version rejection, 405 on GET/DELETE,
 *      202 on notifications).
 *   2. The real HTTP entry (src/server-http.js) spawned on a port: 405 on
 *      GET, a spec-shaped 401 with `WWW-Authenticate`, a legacy initialize.
 *   3. The real stdio entry (src/server.js) spawned as a child, opened by a
 *      legacy client and by an auto-negotiating client.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

import { createSlackMcpServer, SERVER_NAME, TOOLS_LIST_CACHE_HINT } from "../lib/mcp-server.js";
import { RELEASE_VERSION } from "../lib/public-metadata.js";
import { TOOLS } from "../lib/tools.js";

const MODERN = "2026-07-28";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const URL_ = "http://slack-mcp.test/mcp";

// A hermetic child environment: no credential file, no Keychain probe, no
// tool-profile narrowing inherited from the developer's shell.
function childEnv() {
  const env = { ...process.env };
  delete env.SLACK_TOKEN;
  delete env.SLACK_COOKIE;
  delete env.SLACK_MCP_TOOLS;
  env.HOME = mkdtempSync(join(tmpdir(), "slack-mcp-era-"));
  env.SLACK_MCP_PROFILE = "mcp-era-test";
  env.SLACK_MCP_TOKEN_STORAGE = "file";
  env.SLACK_NO_AUTO_REFRESH = "true";
  return env;
}

function inProcessHandler() {
  return createMcpHandler(() => createSlackMcpServer({ tools: TOOLS }));
}

function fetchVia(handler) {
  return async (input, init) => handler.fetch(input instanceof Request ? input : new Request(input, init));
}

async function connect(handler, clientOptions) {
  const client = new Client({ name: "mcp-era-test", version: "0.0.0" }, clientOptions);
  const transport = new StreamableHTTPClientTransport(new URL(URL_), { fetch: fetchVia(handler) });
  await client.connect(transport);
  return client;
}

const MODERN_META = {
  "io.modelcontextprotocol/protocolVersion": MODERN,
  "io.modelcontextprotocol/clientInfo": { name: "mcp-era-test", version: "0.0.0" },
  "io.modelcontextprotocol/clientCapabilities": {},
};

async function post(handler, headers, body) {
  const res = await handler.fetch(new Request(URL_, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify(body),
  }));
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

test("legacy (2025-era) client: plain initialize, full surface, no cache fields", async () => {
  const handler = inProcessHandler();
  try {
    const client = await connect(handler, {});
    assert.equal(client.getProtocolEra(), "legacy");
    assert.match(client.getNegotiatedProtocolVersion(), /^2025-/);
    const list = await client.listTools();
    assert.equal(list.tools.length, TOOLS.length);
    assert.equal(list.ttlMs, undefined, "2025-era results never carry cache fields");
    assert.equal(list._meta, undefined);
    const call = await client.callTool({ name: "not_a_tool", arguments: {} });
    assert.equal(call.isError, true);
    assert.match(call.content[0].text, /unknown_tool/);
    await client.close();
  } finally {
    await handler.close();
  }
});

test("2026-07-28 client: modern era, cache hint, serverInfo in _meta", async () => {
  const handler = inProcessHandler();
  try {
    const client = await connect(handler, { versionNegotiation: { mode: { pin: MODERN } } });
    assert.equal(client.getProtocolEra(), "modern");
    assert.equal(client.getNegotiatedProtocolVersion(), MODERN);
    const list = await client.listTools();
    assert.equal(list.tools.length, TOOLS.length);
    assert.equal(list.ttlMs, TOOLS_LIST_CACHE_HINT.ttlMs);
    assert.equal(list.cacheScope, TOOLS_LIST_CACHE_HINT.cacheScope);
    assert.deepEqual(list._meta?.["io.modelcontextprotocol/serverInfo"], { name: SERVER_NAME, version: RELEASE_VERSION });
    const call = await client.callTool({ name: "not_a_tool", arguments: {} });
    assert.equal(call.isError, true);
    await client.close();
  } finally {
    await handler.close();
  }
});

test("auto-negotiating client discovers the modern era", async () => {
  const handler = inProcessHandler();
  try {
    const client = await connect(handler, { versionNegotiation: { mode: "auto" } });
    assert.equal(client.getProtocolEra(), "modern");
    await client.close();
  } finally {
    await handler.close();
  }
});

test("2026-07-28 wire conformance on the raw handler", async () => {
  const handler = inProcessHandler();
  try {
    const modernHeaders = { "mcp-protocol-version": MODERN, "mcp-method": "tools/list" };
    const listReq = { jsonrpc: "2.0", id: 1, method: "tools/list", params: { _meta: MODERN_META } };

    const ok = await post(handler, modernHeaders, listReq);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.result.resultType, "complete");
    assert.equal(ok.json.result.ttlMs, TOOLS_LIST_CACHE_HINT.ttlMs);
    assert.equal(ok.json.result.cacheScope, "public");
    assert.equal(ok.json.result.tools.length, TOOLS.length);
    assert.equal(ok.json.result._meta["io.modelcontextprotocol/serverInfo"].name, SERVER_NAME);

    // Header/body disagreement is a 400 with the typed -32020 error.
    const mismatch = await post(handler, { ...modernHeaders, "mcp-method": "tools/call" }, listReq);
    assert.equal(mismatch.status, 400);
    assert.equal(mismatch.json.error.code, -32020);

    // A modern request without Mcp-Method is the same class of error.
    const missing = await post(handler, { "mcp-protocol-version": MODERN }, listReq);
    assert.equal(missing.status, 400);
    assert.equal(missing.json.error.code, -32020);

    // An unsupported revision is refused with -32022 naming what is supported.
    const unsupported = await post(
      handler,
      { "mcp-protocol-version": "2027-01-01", "mcp-method": "tools/list" },
      { ...listReq, params: { _meta: { ...MODERN_META, "io.modelcontextprotocol/protocolVersion": "2027-01-01" } } }
    );
    assert.equal(unsupported.status, 400);
    assert.equal(unsupported.json.error.code, -32022);
    assert.deepEqual(unsupported.json.error.data.supported, [MODERN]);

    // server/discover names the modern revision.
    const discover = await post(
      handler,
      { "mcp-protocol-version": MODERN, "mcp-method": "server/discover" },
      { jsonrpc: "2.0", id: 2, method: "server/discover", params: { _meta: MODERN_META } }
    );
    assert.equal(discover.status, 200);
    assert.deepEqual(discover.json.result.supportedVersions, [MODERN]);
    assert.ok(discover.json.result.capabilities.tools);

    // Notifications are accepted, not answered.
    const note = await post(
      handler,
      { "mcp-protocol-version": MODERN, "mcp-method": "notifications/initialized" },
      { jsonrpc: "2.0", method: "notifications/initialized", params: { _meta: MODERN_META } }
    );
    assert.equal(note.status, 202);

    // No sessions: the 2025 session operations are not allowed here.
    const get = await handler.fetch(new Request(URL_, { method: "GET", headers: { accept: "text/event-stream" } }));
    assert.equal(get.status, 405);
    const del = await handler.fetch(new Request(URL_, { method: "DELETE" }));
    assert.equal(del.status, 405);

    // A 2025-era initialize still answers, echoing the requested revision.
    const legacy = await post(handler, {}, {
      jsonrpc: "2.0", id: 3, method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "old", version: "0" } },
    });
    assert.equal(legacy.status, 200);
    assert.match(legacy.text, /"protocolVersion":"2025-03-26"/);
    assert.equal(legacy.headers.get("mcp-session-id"), null, "stateless: no session is ever minted");
  } finally {
    await handler.close();
  }
});

async function spawnHttpEntry(extraEnv) {
  const env = { ...childEnv(), ...extraEnv };
  const child = spawn(process.execPath, [join(ROOT, "src/server-http.js")], { env, stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server-http did not announce a port:\n${out}`)), 20000);
    child.stdout.on("data", (chunk) => {
      out += chunk;
      const m = out.match(/running on port (\d+)/);
      if (m) { clearTimeout(timer); resolve(Number(m[1])); }
    });
    child.stderr.on("data", (chunk) => { out += chunk; });
    child.on("exit", (code) => { clearTimeout(timer); reject(new Error(`server-http exited ${code}:\n${out}`)); });
  });
  return { child, port, base: `http://127.0.0.1:${port}` };
}

test("src/server-http.js: stateless entry — 405 on GET, 401 challenges, legacy initialize answers", async () => {
  // The entry logs the configured PORT, so pick a free one up front.
  const { createServer } = await import("node:net");
  const freePort = await new Promise((resolve) => {
    const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
  const { child, base } = await spawnHttpEntry({ PORT: String(freePort), SLACK_MCP_HTTP_AUTH_TOKEN: "secret-token" });
  try {
    const health = await fetch(`${base}/health`).then((r) => r.json());
    assert.equal(health.version, RELEASE_VERSION);

    const unauth = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    assert.equal(unauth.status, 401);
    assert.match(unauth.headers.get("www-authenticate") || "", /^Bearer /, "401 must carry a WWW-Authenticate challenge");

    const auth = { authorization: "Bearer secret-token" };
    const get = await fetch(`${base}/mcp`, { method: "GET", headers: { ...auth, accept: "text/event-stream" } });
    assert.equal(get.status, 405);
    const del = await fetch(`${base}/mcp`, { method: "DELETE", headers: auth });
    assert.equal(del.status, 405);

    const init = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "old", version: "0" } } }),
    });
    assert.equal(init.status, 200);
    assert.equal(init.headers.get("mcp-session-id"), null);
    assert.match(await init.text(), /"protocolVersion":"2025-06-18"/);

    const modern = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": MODERN, "mcp-method": "tools/list" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: { _meta: MODERN_META } }),
    });
    assert.equal(modern.status, 200);
    const body = await modern.json();
    assert.equal(body.result.resultType, "complete");
    assert.equal(body.result.tools.length, TOOLS.length);

    const badOrigin = await fetch(`${base}/mcp`, { method: "POST", headers: { ...auth, origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
    assert.equal(badOrigin.status, 403, "an origin outside the allowlist is refused before the protocol layer");
  } finally {
    child.kill("SIGTERM");
  }
});

async function connectStdio(clientOptions) {
  const client = new Client({ name: "mcp-era-test", version: "0.0.0" }, clientOptions);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(ROOT, "src/server.js")],
    env: childEnv(),
    stderr: "ignore",
  });
  await client.connect(transport);
  return client;
}

test("src/server.js over stdio: legacy client and auto-negotiating client both work", async () => {
  const legacy = await connectStdio({});
  try {
    assert.equal(legacy.getProtocolEra(), "legacy");
    const list = await legacy.listTools();
    assert.equal(list.tools.length, TOOLS.length);
    assert.ok(!list.tools.some((t) => /smart_search|triage/.test(t.name)), "no hosted stubs on the wire");
  } finally {
    await legacy.close();
  }

  const modern = await connectStdio({ versionNegotiation: { mode: "auto" } });
  try {
    assert.equal(modern.getProtocolEra(), "modern");
    assert.equal(modern.getNegotiatedProtocolVersion(), MODERN);
    const list = await modern.listTools();
    assert.equal(list.tools.length, TOOLS.length);
    assert.equal(list.cacheScope, "public");
  } finally {
    await modern.close();
  }
});

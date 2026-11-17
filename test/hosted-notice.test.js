import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HOSTED_URL,
  hostedNoticeEnabled,
  hostedNoticeLine,
  hostedVersionField,
  printHostedNoticeOnce,
  resetHostedNotice,
} from "../lib/hosted-notice.js";
import { handleHealthCheck } from "../lib/handlers.js";

const root = (path) => fileURLToPath(new URL("../" + path, import.meta.url));
const realFetch = globalThis.fetch;
const savedEnv = { ...process.env };

afterEach(() => {
  globalThis.fetch = realFetch;
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env, savedEnv);
  resetHostedNotice();
});

function sink() {
  const writes = [];
  return { writes, write: (text) => { writes.push(text); return true; } };
}

test("the line says what the hosted tier does and costs, with the link, and nothing about how it signs in to Slack", () => {
  const line = hostedNoticeLine();
  assert.ok(line.includes(HOSTED_URL), "the link is in the line");
  assert.equal(HOSTED_URL, "https://mcp.revasserlabs.com");
  assert.match(line, /saved catch-up on a schedule while your laptop is closed/);
  assert.match(line, /free tier/i);
  assert.match(line, /scheduled delivery is on the paid plans/);
  assert.match(line, /SLACK_MCP_NO_UPSELL=1/);
  assert.doesNotMatch(line, /oauth|sign[ -]?in|log[ -]?in|connect|browser|cookie/i, "nothing that could stop being true");
  assert.equal(line.includes("\n"), false, "one line");
});

test("it prints once per process, to the stream it is given, with a trailing newline", () => {
  const out = sink();
  assert.equal(printHostedNoticeOnce({ stream: out, env: {} }), true);
  assert.equal(printHostedNoticeOnce({ stream: out, env: {} }), false);
  assert.equal(printHostedNoticeOnce({ stream: out, env: {} }), false);
  assert.equal(out.writes.length, 1);
  assert.equal(out.writes[0], hostedNoticeLine() + "\n");
});

test("SLACK_MCP_NO_UPSELL=1 hides the line and the field; the Lifeboat's switch is the same switch", () => {
  const out = sink();
  assert.equal(hostedNoticeEnabled({}), true);
  assert.equal(hostedNoticeEnabled({ SLACK_MCP_NO_UPSELL: "1" }), false);
  assert.equal(printHostedNoticeOnce({ stream: out, env: { SLACK_MCP_NO_UPSELL: "1" } }), false);
  assert.equal(out.writes.length, 0);
  assert.equal(hostedVersionField({ SLACK_MCP_NO_UPSELL: "1" }), undefined);
  assert.equal(hostedVersionField({}).url, HOSTED_URL);
  // A value other than "1" does not switch it off, exactly as in lib/lifeboat.js.
  assert.equal(hostedNoticeEnabled({ SLACK_MCP_NO_UPSELL: "true" }), true);
  assert.equal(hostedNoticeEnabled({ SLACK_MCP_NO_UPSELL: "0" }), true);
});

test("the module imports nothing and calls nothing, so it cannot reach a network", () => {
  const source = readFileSync(root("lib/hosted-notice.js"), "utf8");
  assert.equal(/^\s*import\s/m.test(source), false, "no imports at all");
  assert.equal(/fetch\s*\(|XMLHttpRequest|WebSocket|require\s*\(|import\s*\(/.test(source), false, "no calls that reach out");
  globalThis.fetch = () => { throw new Error("the notice reached the network"); };
  printHostedNoticeOnce({ stream: sink(), env: {} });
  hostedVersionField({});
});

function fakeSlack() {
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    calls.push(String(typeof input === "string" ? input : input.url));
    return new Response(JSON.stringify({ ok: true, user: "u", user_id: "U1", team: "T", team_id: "T1" }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

test("slack_health_check carries a hosted_tier field, and only calls Slack", async () => {
  process.env.SLACK_TOKEN = "xoxc-test";
  process.env.SLACK_COOKIE = "xoxd-test";
  delete process.env.SLACK_MCP_NO_UPSELL;
  const calls = fakeSlack();
  const result = await handleHealthCheck();
  const payload = JSON.parse(result.content[0].text);
  assert.equal(payload.status, "ok");
  assert.equal(payload.hosted_tier.url, HOSTED_URL);
  assert.equal(payload.hosted_tier.hide_with, "SLACK_MCP_NO_UPSELL=1");
  assert.match(payload.hosted_tier.summary, /free tier/);
  assert.ok(calls.length >= 1);
  assert.ok(calls.every((url) => url.startsWith("https://slack.com/api/")), "no call went anywhere but Slack: " + calls.join(", "));
});

test("with SLACK_MCP_NO_UPSELL=1 the health check has no hosted_tier field", async () => {
  process.env.SLACK_TOKEN = "xoxc-test";
  process.env.SLACK_COOKIE = "xoxd-test";
  process.env.SLACK_MCP_NO_UPSELL = "1";
  fakeSlack();
  const payload = JSON.parse((await handleHealthCheck()).content[0].text);
  assert.equal(payload.status, "ok");
  assert.equal("hosted_tier" in payload, false);
});

// ---- the real servers, as separate processes: stdout stays the protocol's, stderr gets one line

function cleanEnv(extra = {}) {
  const home = mkdtempSync(join(tmpdir(), "slack-mcp-notice-"));
  const env = {
    PATH: process.env.PATH,
    HOME: home,
    SLACK_MCP_TOKEN_STORAGE: "file",
    ...extra,
  };
  return { env, home };
}

function run(script, { env, ready, args = [] }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [root(script), ...args], { env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.once("exit", () => resolve({ stdout, stderr }));
      child.stdin.end();
      child.kill("SIGTERM");
    };
    const timer = setTimeout(() => { if (!settled) { settled = true; child.kill("SIGKILL"); reject(new Error("server did not start: " + stderr + stdout)); } }, 15000);
    child.stdout.on("data", (chunk) => { stdout += chunk; if (ready(stdout, stderr)) setTimeout(finish, 250); });
    child.stderr.on("data", (chunk) => { stderr += chunk; if (ready(stdout, stderr)) setTimeout(finish, 250); });
    child.on("error", reject);
  });
}

const notices = (text) => text.split("\n").filter((line) => line.startsWith("Hosted tier:"));

test("the stdio server prints the line once on stderr and nothing on stdout", async () => {
  const { env, home } = cleanEnv();
  try {
    const { stdout, stderr } = await run("src/server.js", { env, ready: (_o, e) => e.includes(" running") });
    assert.equal(stdout, "", "stdout is the MCP channel and stays empty until a client speaks");
    assert.equal(notices(stderr).length, 1);
    assert.equal(notices(stderr)[0], hostedNoticeLine());
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("the stdio server prints no line with SLACK_MCP_NO_UPSELL=1", async () => {
  const { env, home } = cleanEnv({ SLACK_MCP_NO_UPSELL: "1" });
  try {
    const { stdout, stderr } = await run("src/server.js", { env, ready: (_o, e) => e.includes(" running") });
    assert.equal(stdout, "");
    assert.equal(notices(stderr).length, 0);
    assert.equal(stderr.includes("mcp.revasserlabs.com"), false);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

test("the HTTP server prints the line once on stderr and not into its stdout log", async () => {
  const port = String(20000 + Math.floor(Math.random() * 20000));
  const { env, home } = cleanEnv({ PORT: port, SLACK_MCP_HTTP_INSECURE: "1" });
  try {
    const { stdout, stderr } = await run("src/server-http.js", { env, ready: (_o, e) => e.includes("Hosted tier:") });
    assert.equal(notices(stderr).length, 1);
    assert.equal(stdout.includes("Hosted tier"), false);
  } finally { rmSync(home, { recursive: true, force: true }); }
});

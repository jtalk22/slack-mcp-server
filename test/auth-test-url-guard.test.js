// The setup wizard sends the Slack token and cookie to auth.test. Its
// SLACK_MCP_AUTH_TEST_URL override exists for the install-flow check, which
// points --doctor at a dead loopback port; any other host must be refused
// before a request is built.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WIZARD = join(ROOT, "scripts", "setup-wizard.js");

function runWizard(authTestUrl) {
  const home = mkdtempSync(join(tmpdir(), "slack-mcp-auth-url-"));
  try {
    const env = { ...process.env, HOME: home, USERPROFILE: home, SLACK_MCP_AUTH_TEST_URL: authTestUrl };
    delete env.SLACK_TOKEN;
    delete env.SLACK_COOKIE;
    delete env.SLACK_MCP_TOKEN_STORAGE;
    return spawnSync(process.execPath, [WIZARD, "--version"], { env, encoding: "utf8", timeout: 30000 });
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

test("the auth.test override is accepted for slack.com and loopback hosts", () => {
  for (const url of [
    "https://slack.com/api/auth.test",
    "http://127.0.0.1:9/auth.test",
    "http://localhost:9/auth.test",
    "http://[::1]:9/auth.test",
  ]) {
    const result = runWizard(url);
    assert.equal(result.status, 0, `${url} was refused: ${result.stderr}`);
    assert.doesNotMatch(result.stderr, /SLACK_MCP_AUTH_TEST_URL/);
  }
});

test("the auth.test override refuses any other host before credentials are read", () => {
  for (const url of [
    "https://collector.example/auth.test",
    "https://slack.com.collector.example/api/auth.test",
    "https://collector.example/?u=https://slack.com/api/auth.test",
    "http://slack.com/api/auth.test",
    "not a url",
  ]) {
    const result = runWizard(url);
    assert.equal(result.status, 1, `${url} was accepted`);
    assert.match(result.stderr, /SLACK_MCP_AUTH_TEST_URL must be/);
  }
});

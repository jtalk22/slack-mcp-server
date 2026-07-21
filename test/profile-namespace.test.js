import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// SLACK_MCP_PROFILE (#164) namespaces every storage surface so multiple
// server instances (work + personal) run side-by-side without sharing or
// overwriting each other's credentials. Paths are computed at module load,
// so the profile is set before the import and this file owns that setup.

const SANDBOX = mkdtempSync(join(tmpdir(), "slack-mcp-profile-test-"));
process.env.HOME = SANDBOX;
process.env.USERPROFILE = SANDBOX;
process.env.SLACK_MCP_PROFILE = "work";
delete process.env.SLACK_TOKEN;
delete process.env.SLACK_COOKIE;
delete process.env.SLACK_MCP_TOKEN_STORAGE;

const {
  saveTokens,
  loadTokensReadOnly,
  getStorageInfo,
  TOKEN_FILE,
  META_FILE,
  KEYCHAIN_SERVICE,
  ACTIVE_PROFILE,
} = await import("../lib/token-store.js");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN = "xoxc-1111-2222-3333-" + "a".repeat(24);
const COOKIE = "xoxd-profile-test-cookie";

test("a profile namespaces the token file, sidecar, and Keychain service", () => {
  assert.equal(ACTIVE_PROFILE, "work");
  assert.ok(TOKEN_FILE.endsWith(".slack-mcp-tokens-work.json"), TOKEN_FILE);
  assert.ok(META_FILE.endsWith(".slack-mcp-meta-work.json"), META_FILE);
  assert.equal(KEYCHAIN_SERVICE, "slack-mcp-server-work");
  assert.equal(getStorageInfo().profile, "work");
});

test("saves land in the profile's namespace, not the default one", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "file";
  try {
    saveTokens(TOKEN, COOKIE);
  } finally {
    delete process.env.SLACK_MCP_TOKEN_STORAGE;
  }

  assert.equal(existsSync(join(SANDBOX, ".slack-mcp-tokens-work.json")), true);
  assert.equal(existsSync(join(SANDBOX, ".slack-mcp-tokens.json")), false,
    "the default namespace must stay untouched");
  const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
  assert.equal(data.SLACK_TOKEN, TOKEN);
  assert.equal(loadTokensReadOnly().token, TOKEN);
});

test("an invalid profile name fails closed at load, naming the rule", () => {
  const probe = spawnSync(process.execPath, [
    "--input-type=module",
    "-e",
    `await import(${JSON.stringify(join(REPO_ROOT, "lib", "token-store.js"))});`,
  ], {
    env: { ...process.env, HOME: SANDBOX, SLACK_MCP_PROFILE: "Bad Name!" },
    encoding: "utf-8",
  });
  assert.notEqual(probe.status, 0);
  assert.match(probe.stderr, /Invalid SLACK_MCP_PROFILE/);
});

test("the CLI dispatcher maps --profile to SLACK_MCP_PROFILE for the child", () => {
  // An invalid profile through the flag must reach the child and kill it —
  // proving the flag is parsed, stripped, and exported as env.
  const bad = spawnSync(process.execPath, [join(REPO_ROOT, "src", "cli.js"), "--version", "--profile", "bad name!"], {
    env: { ...process.env, HOME: SANDBOX },
    encoding: "utf-8",
    timeout: 30000,
  });
  assert.match(bad.stderr + bad.stdout, /Invalid SLACK_MCP_PROFILE/);

  // A valid profile passes through cleanly and the flag is not forwarded as
  // a positional command.
  const good = spawnSync(process.execPath, [join(REPO_ROOT, "src", "cli.js"), "--version", "--profile=work"], {
    env: { ...process.env, HOME: SANDBOX },
    encoding: "utf-8",
    timeout: 30000,
  });
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /slack-mcp-server v\d+\.\d+\.\d+/);
});

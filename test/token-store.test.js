import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";

// token-store computes its file paths from homedir() at import time, so the
// sandbox HOME must be in place before the module loads. node --test runs
// each test file in its own process, so this does not leak.
const SANDBOX = mkdtempSync(join(tmpdir(), "slack-mcp-token-store-test-"));
process.env.HOME = SANDBOX;
process.env.USERPROFILE = SANDBOX; // homedir() on Windows
delete process.env.SLACK_TOKEN;
delete process.env.SLACK_COOKIE;
delete process.env.SLACK_MCP_TOKEN_STORAGE;

const {
  getStorageMode,
  getStorageModeDetail,
  setPersistedStorageMode,
  getStorageInfo,
  saveTokens,
  loadTokensReadOnly,
  saveAutoHealTelemetry,
  _setKeychainAdapterForTests,
  TOKEN_FILE,
  META_FILE,
} = await import("../lib/token-store.js");

const TOKEN = "xoxc-1111-2222-3333-aaaaaaaaaaaaaaaaaaaaaaaa";
const COOKIE = "xoxd-test-cookie-value";

function fakeKeychain({ failSet = false, lieOnGet = false } = {}) {
  const store = new Map();
  return {
    store,
    available: () => true,
    get(key) { return lieOnGet ? null : (store.get(key) ?? null); },
    set(key, value) {
      if (failSet) return false;
      store.set(key, value);
      return true;
    },
  };
}

function writeLegacyTokenFile(extra = {}) {
  writeFileSync(TOKEN_FILE, JSON.stringify({
    SLACK_TOKEN: TOKEN,
    SLACK_COOKIE: COOKIE,
    updated_at: "2026-07-01T00:00:00.000Z",
    ...extra,
  }, null, 2));
}

beforeEach(() => {
  delete process.env.SLACK_MCP_TOKEN_STORAGE;
  _setKeychainAdapterForTests(null);
  for (const f of [TOKEN_FILE, META_FILE]) {
    try { unlinkSync(f); } catch {}
  }
});

// ---------- mode parsing ----------

test("storage mode defaults to auto and accepts documented aliases", () => {
  assert.equal(getStorageMode(), "auto");
  for (const [value, expected] of [
    ["auto", "auto"],
    ["default", "auto"],
    ["keychain-only", "keychain-only"],
    ["KEYCHAIN-ONLY", "keychain-only"],
    ["keychain", "keychain-only"],
    ["file", "file"],
    ["file-only", "file"],
  ]) {
    process.env.SLACK_MCP_TOKEN_STORAGE = value;
    assert.equal(getStorageMode(), expected, `value "${value}"`);
  }
});

test("an unrecognized storage mode fails closed instead of guessing", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychainonly";
  assert.throws(() => getStorageMode(), (e) => e.code === "invalid_token_storage_mode");
});

test("a persisted setup choice is honored, and the env var overrides it", () => {
  assert.deepEqual(getStorageModeDetail(), { mode: "auto", source: "default" });

  setPersistedStorageMode("keychain-only");
  assert.deepEqual(getStorageModeDetail(), { mode: "keychain-only", source: "persisted" });

  process.env.SLACK_MCP_TOKEN_STORAGE = "file";
  assert.deepEqual(getStorageModeDetail(), { mode: "file", source: "env" });
});

test("an unrecognized persisted mode fails closed, and cannot be persisted in the first place", () => {
  assert.throws(() => setPersistedStorageMode("keychainonly"), (e) => e.code === "invalid_token_storage_mode");

  writeFileSync(META_FILE, JSON.stringify({ storage_mode: "keychian-only" }));
  assert.throws(() => getStorageMode(), (e) => e.code === "invalid_token_storage_mode");
});

test("persisting a storage mode preserves other metadata fields", () => {
  writeFileSync(META_FILE, JSON.stringify({ updated_at: "2026-07-01T00:00:00.000Z" }));
  setPersistedStorageMode("keychain-only");
  const meta = JSON.parse(readFileSync(META_FILE, "utf-8"));
  assert.equal(meta.storage_mode, "keychain-only");
  assert.equal(meta.updated_at, "2026-07-01T00:00:00.000Z");
});

// ---------- auto mode (default behavior unchanged) ----------

test("auto mode writes the token file and both keychain entries", () => {
  const kc = fakeKeychain();
  _setKeychainAdapterForTests(kc);

  saveTokens(TOKEN, COOKIE);

  assert.equal(existsSync(TOKEN_FILE), true);
  const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
  assert.equal(data.SLACK_TOKEN, TOKEN);
  assert.equal(kc.store.get("token"), TOKEN);
  assert.equal(kc.store.get("cookie"), COOKIE);

  const creds = loadTokensReadOnly();
  assert.equal(creds.source, "file");
  assert.equal(creds.token, TOKEN);
});

// ---------- file mode ----------

test("file mode never touches the keychain", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "file";
  const kc = fakeKeychain();
  _setKeychainAdapterForTests(kc);

  saveTokens(TOKEN, COOKIE);

  assert.equal(existsSync(TOKEN_FILE), true);
  assert.equal(kc.store.size, 0);
  assert.equal(loadTokensReadOnly().source, "file");
});

// ---------- keychain-only mode ----------

test("keychain-only save writes no plaintext file and loads back from the keychain", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  const kc = fakeKeychain();
  _setKeychainAdapterForTests(kc);

  saveTokens(TOKEN, COOKIE);

  assert.equal(existsSync(TOKEN_FILE), false, "no plaintext token file may be written");
  assert.equal(kc.store.get("token"), TOKEN);
  assert.equal(kc.store.get("cookie"), COOKIE);

  const meta = JSON.parse(readFileSync(META_FILE, "utf-8"));
  assert.ok(meta.updated_at, "timestamp moves to the metadata sidecar");
  assert.equal(JSON.stringify(meta).includes("xox"), false, "sidecar must hold no credentials");

  const creds = loadTokensReadOnly();
  assert.equal(creds.source, "keychain");
  assert.equal(creds.token, TOKEN);
  assert.equal(creds.updatedAt, meta.updated_at);
});

test("keychain-only save that cannot be verified throws and writes nothing to disk", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  _setKeychainAdapterForTests(fakeKeychain({ lieOnGet: true }));

  assert.throws(() => saveTokens(TOKEN, COOKIE), (e) => e.code === "keychain_write_failed");
  assert.equal(existsSync(TOKEN_FILE), false);
});

test("keychain-only refresh removes a lingering plaintext file after the verified write", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  _setKeychainAdapterForTests(fakeKeychain());
  writeLegacyTokenFile();

  saveTokens(TOKEN, COOKIE);

  assert.equal(existsSync(TOKEN_FILE), false);
});

test("migration imports a legacy token file, preserves its timestamp, then removes it", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  const kc = fakeKeychain();
  _setKeychainAdapterForTests(kc);
  writeLegacyTokenFile({ last_auto_heal_error: "chrome_not_ready", stuck_since: "2026-07-02T00:00:00.000Z" });

  const creds = loadTokensReadOnly();

  assert.equal(creds.source, "keychain");
  assert.equal(creds.token, TOKEN);
  assert.equal(creds.updatedAt, "2026-07-01T00:00:00.000Z");
  assert.equal(creds.lastAutoHealError, "chrome_not_ready");
  assert.equal(kc.store.get("token"), TOKEN);
  assert.equal(existsSync(TOKEN_FILE), false, "legacy file is removed after verification");
});

test("failed migration leaves the legacy file untouched and reports clearly", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  _setKeychainAdapterForTests(fakeKeychain({ failSet: true }));
  writeLegacyTokenFile();

  assert.throws(() => loadTokensReadOnly(), (e) => e.code === "keychain_migration_failed");
  assert.equal(existsSync(TOKEN_FILE), true, "file must survive a failed migration");
});

test("keychain-only mode without a usable keychain fails clearly", { skip: platform() === "darwin" }, () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  // Default adapter: available() is false off macOS.
  assert.throws(() => saveTokens(TOKEN, COOKIE), (e) => e.code === "keychain_unavailable");
});

// ---------- telemetry routing ----------

test("auto-heal telemetry lands in the sidecar in keychain-only mode, with stuck_since semantics intact", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  _setKeychainAdapterForTests(fakeKeychain());

  saveAutoHealTelemetry({ attemptAt: "2026-07-10T00:00:00.000Z", error: "chrome_not_ready" });
  let meta = JSON.parse(readFileSync(META_FILE, "utf-8"));
  assert.equal(meta.last_auto_heal_error, "chrome_not_ready");
  assert.equal(meta.stuck_since, "2026-07-10T00:00:00.000Z");

  // Same error on a later attempt: stuck_since is preserved.
  saveAutoHealTelemetry({ attemptAt: "2026-07-11T00:00:00.000Z", error: "chrome_not_ready" });
  meta = JSON.parse(readFileSync(META_FILE, "utf-8"));
  assert.equal(meta.stuck_since, "2026-07-10T00:00:00.000Z");

  // Success clears the stuck state.
  saveAutoHealTelemetry({ attemptAt: "2026-07-12T00:00:00.000Z", error: null });
  meta = JSON.parse(readFileSync(META_FILE, "utf-8"));
  assert.equal(meta.last_auto_heal_error, null);
  assert.equal(meta.stuck_since, null);
  assert.equal(existsSync(TOKEN_FILE), false);
});

test("auto-mode telemetry behavior is unchanged: no token file, no write", () => {
  saveAutoHealTelemetry({ attemptAt: "2026-07-10T00:00:00.000Z", error: "chrome_not_ready" });
  assert.equal(existsSync(TOKEN_FILE), false);
  assert.equal(existsSync(META_FILE), false);
});

// ---------- status surface ----------

test("getStorageInfo reports the mode and whether a plaintext file is present", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  _setKeychainAdapterForTests(fakeKeychain());

  writeLegacyTokenFile();
  assert.deepEqual(getStorageInfo(), {
    mode: "keychain-only",
    mode_source: "env",
    keychain_available: true,
    plaintext_file_present: true,
  });

  loadTokensReadOnly(); // triggers migration
  assert.equal(getStorageInfo().plaintext_file_present, false);
});

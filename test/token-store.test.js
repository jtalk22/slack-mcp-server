import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync, chmodSync } from "node:fs";
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
  _resetMemoryTokensForTests,
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
  _resetMemoryTokensForTests();
  chmodSync(SANDBOX, 0o700); // undo any read-only-HOME test
  for (const f of [TOKEN_FILE, META_FILE]) {
    // recursive: the undeletable-file test leaves a directory at TOKEN_FILE
    try { rmSync(f, { recursive: true, force: true }); } catch {}
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

// ---------- fail-loud plaintext removal ----------

test("keychain-only: a plaintext file that cannot be removed after a verified write fails loudly", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  const kc = fakeKeychain();
  _setKeychainAdapterForTests(kc);

  // A non-empty directory at the token path makes unlinkSync fail on every
  // platform (and for root), simulating an undeletable plaintext file.
  mkdirSync(TOKEN_FILE);
  writeFileSync(join(TOKEN_FILE, "blocker"), "x");

  assert.throws(() => saveTokens(TOKEN, COOKIE), (e) => e.code === "plaintext_removal_failed");
  assert.equal(kc.store.get("token"), TOKEN, "the verified Keychain write itself must survive");
  assert.equal(existsSync(TOKEN_FILE), true, "the leftover path must stay visible, never silently 'gone'");
  assert.equal(getStorageInfo().plaintext_file_present, true);
  // Credentials DID persist — the removal failure must not claim otherwise.
  assert.equal(getStorageInfo().unpersisted_fresh_tokens, false);
});

// Root ignores directory write permissions, so the read-only-HOME trick can't
// force the unlink failure there — the saveTokens-path sibling above covers
// the same throw with a root-proof directory blocker.
test("keychain-only: a migration whose file removal fails throws instead of silently looping", { skip: process.getuid?.() === 0 ? "read-only HOME cannot block unlink when running as root" : false }, () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  _setKeychainAdapterForTests(fakeKeychain());
  writeLegacyTokenFile();

  // The dir-blocker trick can't reach the migration path (a directory doesn't
  // parse as a token file), so force the unlink failure with a read-only HOME.
  chmodSync(SANDBOX, 0o500);
  try {
    assert.throws(() => loadTokensReadOnly(), (e) => e.code === "plaintext_removal_failed");
  } finally {
    chmodSync(SANDBOX, 0o700);
  }
  assert.equal(existsSync(TOKEN_FILE), true);
});

// ---------- in-memory fallback for failed persistence ----------

test("a failed save keeps the fresh tokens available in memory until persistence recovers", () => {
  process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
  _setKeychainAdapterForTests(fakeKeychain({ failSet: true }));

  const FRESH_TOKEN = "xoxc-9999-8888-7777-bbbbbbbbbbbbbbbbbbbbbbbb";
  assert.throws(() => saveTokens(FRESH_TOKEN, COOKIE), (e) => e.code === "keychain_write_failed");

  // The extraction is not discarded: this process serves the fresh tokens,
  // so an auth-failure retry uses them instead of the stale persisted copy.
  const creds = loadTokensReadOnly();
  assert.equal(creds.source, "memory");
  assert.equal(creds.token, FRESH_TOKEN);
  assert.equal(getStorageInfo().unpersisted_fresh_tokens, true);

  // Once persistence recovers, the persistent store is authoritative again.
  const kc = fakeKeychain();
  _setKeychainAdapterForTests(kc);
  saveTokens(FRESH_TOKEN, COOKIE);
  const persisted = loadTokensReadOnly();
  assert.equal(persisted.source, "keychain");
  assert.equal(persisted.token, FRESH_TOKEN);
  assert.equal(getStorageInfo().unpersisted_fresh_tokens, false);
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
    unpersisted_fresh_tokens: false,
  });

  loadTokensReadOnly(); // triggers migration
  assert.equal(getStorageInfo().plaintext_file_present, false);
});

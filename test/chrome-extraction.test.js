import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { pbkdf2Sync, createCipheriv } from "node:crypto";

// Chrome credential extraction was untestable before #168: every failure
// collapsed to null and the pipeline needed a real Chrome install. This rig
// builds a synthetic Chrome estate — a REAL SQLite cookie DB holding a
// genuine v10 AES-128-CBC-encrypted cookie, and a REAL LevelDB-style log with
// a cached xoxc token — and drives the actual extraction code with only the
// Safe Storage Keychain lookup faked. It proves the #168 fixes: one Keychain
// lookup per run (not per profile), fatal Keychain failures abort instead of
// prompt-storming, and every failure names its cause.

const SANDBOX = mkdtempSync(join(tmpdir(), "slack-mcp-chrome-test-"));
process.env.HOME = SANDBOX;
process.env.USERPROFILE = SANDBOX;
delete process.env.SLACK_TOKEN;
delete process.env.SLACK_COOKIE;

const {
  extractFromChrome,
  getLastExtractionError,
  _setSafeStorageAdapterForTests,
  _extractCookieForProfileForTests,
} = await import("../lib/token-store.js");

const PASSWORD = "test-safe-storage-password";
const COOKIE_VALUE = "xoxd-e2e-extraction-cookie";
const CACHED_TOKEN = "xoxc-1111-2222-3333-" + "a".repeat(40);

const HAS_SQLITE = spawnSync("sqlite3", ["--version"], { stdio: "ignore" }).status === 0;
const IS_MACOS = platform() === "darwin";

function encryptV10(value, password) {
  const key = pbkdf2Sync(password, "saltysalt", 1003, 16, "sha1");
  const cipher = createCipheriv("aes-128-cbc", key, Buffer.alloc(16, " "));
  const ciphertext = Buffer.concat([cipher.update(value, "utf-8"), cipher.final()]);
  return Buffer.concat([Buffer.from("v10"), ciphertext]);
}

/** Build a profile dir with a real cookie DB; optionally a LevelDB token log. */
function buildProfile(base, name, { cookie = true, token = false, password = PASSWORD } = {}) {
  const dir = join(base, name);
  mkdirSync(dir, { recursive: true });
  if (cookie) {
    const blob = encryptV10(COOKIE_VALUE, password).toString("hex");
    execFileSync("sqlite3", [join(dir, "Cookies"),
      "CREATE TABLE cookies (host_key TEXT, name TEXT, encrypted_value BLOB);" +
      `INSERT INTO cookies VALUES ('.slack.com', 'd', X'${blob}');`
    ]);
  }
  if (token) {
    const ldb = join(dir, "Local Storage", "leveldb");
    mkdirSync(ldb, { recursive: true });
    writeFileSync(join(ldb, "000003.log"), Buffer.from(`junk-prefix ${CACHED_TOKEN} junk-suffix`, "binary"));
  }
  return dir;
}

function fakeSafeStorage({ password = PASSWORD, fail = null } = {}) {
  return {
    calls: 0,
    getKey() {
      this.calls++;
      if (fail === "timeout") throw Object.assign(new Error("spawnSync security ETIMEDOUT"), { killed: true });
      if (fail === "denied") throw new Error("security: SecKeychainSearchCopyNext");
      return password;
    },
  };
}

function chromeBase() {
  const base = mkdtempSync(join(tmpdir(), "slack-mcp-chrome-base-"));
  process.env.SLACK_MCP_CHROME_USER_DATA_DIR = base;
  return base;
}

beforeEach(() => {
  _setSafeStorageAdapterForTests(null);
  delete process.env.SLACK_MCP_CHROME_USER_DATA_DIR;
  delete process.env.SLACK_MCP_CHROME_PROFILE;
  delete process.env.SLACK_MCP_EXTRACTION_MODE;
  delete process.env.SLACK_MCP_KEYCHAIN_TIMEOUT_MS;
});

// ---------- profile-level taxonomy (any OS with sqlite3) ----------

test("cookie extraction decrypts a real v10 blob and names every failure cause", { skip: !HAS_SQLITE }, () => {
  const base = chromeBase();
  const adapter = fakeSafeStorage();
  _setSafeStorageAdapterForTests(adapter);

  // Success: real SQLite DB, real AES round-trip.
  const good = buildProfile(base, "Good");
  assert.deepEqual(_extractCookieForProfileForTests(good), { cookie: COOKIE_VALUE, reason: null });

  // Missing DB and empty DB name their causes instead of returning bare null.
  assert.equal(_extractCookieForProfileForTests(join(base, "Missing")).reason, "no_cookie_db");
  const empty = join(base, "Empty");
  mkdirSync(empty, { recursive: true });
  execFileSync("sqlite3", [join(empty, "Cookies"), "CREATE TABLE cookies (host_key TEXT, name TEXT, encrypted_value BLOB);"]);
  assert.equal(_extractCookieForProfileForTests(empty).reason, "no_slack_cookie_row");
});

test("the Safe Storage key is looked up once and cached across profiles", { skip: !HAS_SQLITE }, () => {
  const base = chromeBase();
  const adapter = fakeSafeStorage();
  _setSafeStorageAdapterForTests(adapter);

  const a = buildProfile(base, "ProfileA");
  const b = buildProfile(base, "ProfileB");

  assert.equal(_extractCookieForProfileForTests(a).cookie, COOKIE_VALUE);
  assert.equal(_extractCookieForProfileForTests(b).cookie, COOKIE_VALUE);
  assert.equal(adapter.calls, 1, "second profile must reuse the cached key — one Keychain hit per run");
});

test("a decrypt failure refetches the key once, then reports cookie_decrypt_failed", { skip: !HAS_SQLITE }, () => {
  const base = chromeBase();
  const adapter = fakeSafeStorage({ password: "wrong-password" });
  _setSafeStorageAdapterForTests(adapter);

  const dir = buildProfile(base, "ReKeyed"); // encrypted with PASSWORD, adapter serves wrong-password
  const result = _extractCookieForProfileForTests(dir);
  assert.equal(result.reason, "cookie_decrypt_failed");
  assert.equal(adapter.calls, 2, "exactly one forced refresh after a decrypt failure — no retry storm");
});

test("a Keychain lookup failure is classified, not swallowed", { skip: !HAS_SQLITE }, () => {
  const base = chromeBase();
  _setSafeStorageAdapterForTests(fakeSafeStorage({ fail: "timeout" }));
  assert.equal(_extractCookieForProfileForTests(buildProfile(base, "T")).reason, "keychain_timeout");

  _setSafeStorageAdapterForTests(fakeSafeStorage({ fail: "denied" }));
  assert.equal(_extractCookieForProfileForTests(buildProfile(base, "D")).reason, "keychain_lookup_failed");
});

// ---------- full pipeline (macOS only: the pipeline is platform-gated) ----------

test("full extraction succeeds end-to-end from a synthetic Chrome estate", { skip: !IS_MACOS || !HAS_SQLITE }, () => {
  const base = chromeBase();
  process.env.SLACK_MCP_EXTRACTION_MODE = "leveldb";
  writeFileSync(join(base, "Local State"), JSON.stringify({ profile: { info_cache: { NoToken: {}, Full: {} } } }));
  const adapter = fakeSafeStorage();
  _setSafeStorageAdapterForTests(adapter);

  buildProfile(base, "NoToken", { cookie: true, token: false });
  buildProfile(base, "Full", { cookie: true, token: true });

  const result = extractFromChrome();
  assert.ok(result, `extraction failed: ${JSON.stringify(getLastExtractionError())}`);
  assert.equal(result.token, CACHED_TOKEN);
  assert.equal(result.cookie, COOKIE_VALUE);
  assert.equal(result.extraction_mode, "leveldb");
  assert.equal(adapter.calls, 1, "one Keychain lookup even when multiple profiles decrypt");
});

test("a fatal Keychain failure aborts the run — no per-profile prompt storm", { skip: !IS_MACOS || !HAS_SQLITE }, () => {
  const base = chromeBase();
  process.env.SLACK_MCP_EXTRACTION_MODE = "leveldb";
  writeFileSync(join(base, "Local State"), JSON.stringify({ profile: { info_cache: { A: {}, B: {}, C: {} } } }));
  const adapter = fakeSafeStorage({ fail: "timeout" });
  _setSafeStorageAdapterForTests(adapter);

  for (const name of ["A", "B", "C"]) buildProfile(base, name);

  const result = extractFromChrome();
  assert.equal(result, null);
  assert.equal(getLastExtractionError().code, "keychain_timeout");
  assert.match(getLastExtractionError().detail, /SLACK_MCP_KEYCHAIN_TIMEOUT_MS/);
  assert.equal(adapter.calls, 1, "three profiles must not mean three slow Keychain attempts");
});

test("per-profile failure reasons surface in the final extraction error", { skip: !IS_MACOS || !HAS_SQLITE }, () => {
  const base = chromeBase();
  process.env.SLACK_MCP_EXTRACTION_MODE = "leveldb";
  writeFileSync(join(base, "Local State"), JSON.stringify({ profile: { info_cache: { OnlyCookie: {} } } }));
  _setSafeStorageAdapterForTests(fakeSafeStorage());

  buildProfile(base, "OnlyCookie", { cookie: true, token: false });

  assert.equal(extractFromChrome(), null);
  const err = getLastExtractionError();
  assert.equal(err.code, "leveldb_no_matching_profile");
  assert.match(err.detail, /OnlyCookie: cookie ok, no cached xoxc token/);
});

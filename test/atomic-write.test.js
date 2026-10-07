import { test } from "node:test";
import assert from "node:assert/strict";
import fs, { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { atomicWriteSync } from "../lib/atomic-write.js";

// On Windows an antivirus scanner or the search indexer can hold a file open
// for a few milliseconds, and the rename that commits an atomic write fails
// with EPERM, EACCES or EBUSY. These tests make fs.renameSync fail on cue and
// check that the write still lands, that other errors are not retried, and
// that a lock which never clears is still reported.

// token-store computes its file paths from homedir() at import time, so the
// sandbox HOME must be in place before the module loads. node --test runs
// each test file in its own process, so this does not leak.
const SANDBOX = mkdtempSync(join(tmpdir(), "slack-mcp-atomic-write-test-"));
process.env.HOME = SANDBOX;
process.env.USERPROFILE = SANDBOX; // homedir() on Windows
delete process.env.SLACK_MCP_PROFILE;
process.env.SLACK_MCP_TOKEN_STORAGE = "file";

const { saveTokens, TOKEN_FILE } = await import("../lib/token-store.js");

const LIB_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "lib");

// Replace fs.renameSync with one that throws `code` on the calls for which
// failOn(callNumber) is true, counting every call. syncBuiltinESMExports
// carries the replacement into the named `renameSync` import that
// lib/atomic-write.js uses.
function failRename(code, failOn) {
  const realRename = fs.renameSync;
  const calls = { count: 0 };
  fs.renameSync = (...args) => {
    calls.count++;
    if (failOn(calls.count)) {
      const err = new Error(`${code}: simulated file lock`);
      err.code = code;
      throw err;
    }
    return realRename(...args);
  };
  syncBuiltinESMExports();
  return {
    calls,
    restore() {
      fs.renameSync = realRename;
      syncBuiltinESMExports();
    },
  };
}

function freshDir() {
  return mkdtempSync(join(tmpdir(), "slack-mcp-atomic-"));
}

test("a rename refused twice with EPERM is retried and the write lands", () => {
  const dir = freshDir();
  const target = join(dir, "store.json");
  const rename = failRename("EPERM", (n) => n <= 2);
  try {
    atomicWriteSync(target, '{"saved":true}');
  } finally {
    rename.restore();
  }

  assert.equal(rename.calls.count, 3, "two refusals, then the rename that succeeds");
  assert.equal(readFileSync(target, "utf-8"), '{"saved":true}');
  assert.deepEqual(readdirSync(dir), ["store.json"], "no temp file left behind");
});

test("a non-transient rename error is thrown at once, not retried", () => {
  const dir = freshDir();
  const target = join(dir, "store.json");
  writeFileSync(target, "previous");
  const rename = failRename("ENOENT", () => true);
  try {
    assert.throws(() => atomicWriteSync(target, "next"), { code: "ENOENT" });
  } finally {
    rename.restore();
  }

  assert.equal(rename.calls.count, 1, "ENOENT is not a lock; one attempt only");
  assert.equal(readFileSync(target, "utf-8"), "previous", "the target is untouched");
  assert.deepEqual(readdirSync(dir), ["store.json"], "the temp file is removed");
});

test("a lock that never clears is rethrown after the last attempt", () => {
  const dir = freshDir();
  const target = join(dir, "store.json");
  writeFileSync(target, "previous");
  const rename = failRename("EBUSY", () => true);
  try {
    assert.throws(() => atomicWriteSync(target, "next"), { code: "EBUSY" });
  } finally {
    rename.restore();
  }

  assert.equal(rename.calls.count, 6, "one attempt plus five retries, then give up");
  assert.equal(readFileSync(target, "utf-8"), "previous", "the target is untouched");
  assert.deepEqual(readdirSync(dir), ["store.json"], "the temp file is removed");
});

test("saved credentials survive a transient rename lock on the token file", () => {
  const rename = failRename("EPERM", (n) => n === 1);
  try {
    saveTokens("xoxc-atomic-write-test", "xoxd-atomic-write-test");
  } finally {
    rename.restore();
  }

  assert.equal(rename.calls.count, 2, "the token file rename was retried once");
  const saved = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
  assert.equal(saved.SLACK_TOKEN, "xoxc-atomic-write-test");
  assert.equal(saved.SLACK_COOKIE, "xoxd-atomic-write-test");
});

test("no module in lib/ calls renameSync except the retrying helper", () => {
  const direct = readdirSync(LIB_DIR)
    .filter((file) => file.endsWith(".js") && file !== "atomic-write.js")
    .filter((file) => /\brenameSync\b/.test(readFileSync(join(LIB_DIR, file), "utf-8")));

  assert.deepEqual(direct, [],
    "use atomicWriteSync or renameSyncWithRetry from lib/atomic-write.js, so a Windows file lock is retried");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  fixForExtractionCode,
  _extractionFixTableForTests,
} from "../lib/token-store.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN_STORE_SOURCE = readFileSync(join(ROOT, "lib", "token-store.js"), "utf-8");

/**
 * Every reason code the extractor can set must carry its own instruction.
 *
 * The bug this guards: a failure whose code was extraction_failed_all_paths
 * was answered with the apple_events_javascript_disabled fix, because each
 * user-facing surface special-cased one code and defaulted the rest. Routing
 * is only safe while the table covers the codes the extractor actually emits,
 * so the source is the authority here — not a hand-kept list in this file.
 */
function extractionCodesInSource() {
  const codes = new Set();
  for (const match of TOKEN_STORE_SOURCE.matchAll(/\bcode:\s*["']([a-z0-9_]+)["']/g)) {
    codes.add(match[1]);
  }
  return codes;
}

test("every extraction reason code in token-store.js has a fix instruction", () => {
  const codes = extractionCodesInSource();
  assert.ok(codes.size > 0, "found no code: literals — the scan regex has rotted");

  const table = _extractionFixTableForTests();
  const missing = [...codes].filter((code) => !Object.hasOwn(table, code)).sort();
  assert.deepEqual(
    missing,
    [],
    `these codes have no entry in EXTRACTION_FIXES: ${missing.join(", ")}`
  );
});

test("the fix table carries no entry for a code the extractor cannot emit", () => {
  const codes = extractionCodesInSource();
  const orphans = Object.keys(_extractionFixTableForTests())
    .filter((code) => !codes.has(code))
    .sort();
  assert.deepEqual(
    orphans,
    [],
    `these table entries match no code: literal in token-store.js: ${orphans.join(", ")}`
  );
});

test("no reason code inherits another code's instruction", () => {
  const table = _extractionFixTableForTests();
  const seen = new Map();
  for (const [code, fix] of Object.entries(table)) {
    assert.ok(fix && fix.trim().length > 0, `${code} has an empty instruction`);
    if (seen.has(fix)) {
      assert.fail(`${code} reuses the instruction already given to ${seen.get(fix)}`);
    }
    seen.set(fix, code);
  }
});

test("an unknown or missing code falls back without borrowing an instruction", () => {
  const table = _extractionFixTableForTests();
  const known = new Set(Object.values(table));
  for (const input of [undefined, null, "", "not_a_real_code"]) {
    const fix = fixForExtractionCode(input);
    assert.ok(fix && fix.trim().length > 0, `no fallback instruction for ${String(input)}`);
    assert.ok(
      !known.has(fix),
      `fallback for ${String(input)} returned a real code's instruction: ${fix}`
    );
  }
});

test("extraction_failed_all_paths names the sign-in fix, not the AppleScript flag", () => {
  // The live reproduction behind this change: seven Chrome profiles read fine,
  // none held a Slack cookie row, and the user was told to change a Chrome
  // AppleScript setting for a path the run never reached.
  const fix = fixForExtractionCode("extraction_failed_all_paths");
  assert.match(fix, /app\.slack\.com/);
  assert.doesNotMatch(fix, /Apple Events/);
});

test("no user-facing surface hardcodes the AppleScript fix outside its own code", () => {
  for (const relPath of ["lib/slack-client.js", "lib/handlers.js"]) {
    const source = readFileSync(join(ROOT, relPath), "utf-8");
    const offenders = source
      .split("\n")
      .map((line, i) => [i + 1, line])
      .filter(([, line]) => /Allow JavaScript from Apple Events/.test(line));
    assert.deepEqual(
      offenders,
      [],
      `${relPath} still hardcodes the AppleScript instruction at line(s) ${offenders
        .map(([n]) => n)
        .join(", ")} — route it through fixForExtractionCode instead`
    );
  }
});

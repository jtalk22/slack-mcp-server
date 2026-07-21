import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// The metadata sidecar (~/.slack-mcp-meta.json) is a read-modify-write
// surface shared by the MCP server, the CLI, and a LaunchAgent refresh.
// Without cross-process serialization, two concurrent writers read the same
// baseline and the loser's fields silently vanish — the file stays valid
// JSON, so the loss is invisible (found in adversarial testing on PR #163).
// This test drives two REAL processes through many interleaved writes and
// asserts both writers' final fields survive.

const STORE_URL = pathToFileURL(
  join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "token-store.js")
).href;
const ITERATIONS = 150;

function runWriter(home, script) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ["--input-type=module", "-e", script], {
      env: { ...process.env, HOME: home, USERPROFILE: home, SLACK_MCP_TOKEN_STORAGE: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d; });
    proc.on("error", reject);
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`writer exited ${code}: ${stderr}`))
    );
  });
}

test("concurrent metadata writers do not lose each other's fields", async () => {
  const home = mkdtempSync(join(tmpdir(), "slack-mcp-meta-lock-"));

  // Writer A: auto-heal telemetry in keychain-only mode (patches telemetry keys).
  const telemetryWriter = `
    process.env.SLACK_MCP_TOKEN_STORAGE = "keychain-only";
    const { saveAutoHealTelemetry } = await import(${JSON.stringify(STORE_URL)});
    for (let i = 0; i < ${ITERATIONS}; i++) {
      saveAutoHealTelemetry({ attemptAt: "A-" + i, error: "adversarial_test" });
    }
  `;
  // Writer B: the persisted setup choice (patches storage_mode, then verifies
  // its own write — a lost update makes it exit non-zero on its own).
  const modeWriter = `
    const { setPersistedStorageMode } = await import(${JSON.stringify(STORE_URL)});
    for (let i = 0; i < ${ITERATIONS}; i++) {
      setPersistedStorageMode(i % 2 === 0 ? "keychain-only" : "auto");
    }
  `;

  await Promise.all([runWriter(home, telemetryWriter), runWriter(home, modeWriter)]);

  const meta = JSON.parse(readFileSync(join(home, ".slack-mcp-meta.json"), "utf-8"));
  assert.equal(meta.storage_mode, "auto",
    "the mode writer's final value must survive the telemetry writer");
  assert.equal(meta.last_auto_heal_attempt, `A-${ITERATIONS - 1}`,
    "the telemetry writer's final value must survive the mode writer");
  assert.equal(meta.last_auto_heal_error, "adversarial_test");
});

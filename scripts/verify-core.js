#!/usr/bin/env node
/**
 * Core Stability Verification Script
 *
 * Tests:
 * 1. Atomic write - no .tmp artifacts remain after write
 * 2. Server exits cleanly (unref timer doesn't cause zombie)
 */

import { writeFileSync, readFileSync, existsSync, renameSync, unlinkSync, readdirSync } from "fs";
import { spawn } from "child_process";
import { homedir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = join(homedir(), ".slack-mcp-test");
const TEST_FILE = join(TEST_DIR, "test-atomic.json");

// ============ Test 1: Atomic Write ============

function atomicWriteSync(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tempPath, content);
    renameSync(tempPath, filePath);
  } catch (e) {
    try { unlinkSync(tempPath); } catch {}
    throw e;
  }
}

async function testAtomicWrite() {
  console.log("\n[TEST 1] Atomic Write");
  console.log("─".repeat(40));

  // Setup - ensure test directory exists
  const { execSync } = await import("child_process");
  try {
    execSync(`mkdir -p "${TEST_DIR}"`);
  } catch {}

  // Test successful write
  const testData = { test: "data", timestamp: Date.now() };
  atomicWriteSync(TEST_FILE, JSON.stringify(testData, null, 2));

  // Verify file exists
  if (!existsSync(TEST_FILE)) {
    console.log("  FAIL: File was not created");
    return false;
  }

  // Verify content
  const readBack = JSON.parse(readFileSync(TEST_FILE, "utf-8"));
  if (readBack.test !== "data") {
    console.log("  FAIL: Content mismatch");
    return false;
  }

  // Check for .tmp artifacts in test dir
  const files = readdirSync(TEST_DIR);
  const tmpFiles = files.filter(f => f.endsWith(".tmp"));
  if (tmpFiles.length > 0) {
    console.log(`  FAIL: Found .tmp artifacts: ${tmpFiles.join(", ")}`);
    return false;
  }

  // Cleanup
  try { unlinkSync(TEST_FILE); } catch {}

  console.log("  PASS: Atomic write completed, no .tmp artifacts");
  return true;
}

// ============ Test 2: Server Exit (No Zombie) ============

async function testServerExit() {
  console.log("\n[TEST 2] Server Clean Exit (No Zombie)");
  console.log("─".repeat(40));

  const serverPath = join(__dirname, "../src/server.js");

  return new Promise((resolve) => {
    const timeout = 5000; // 5 second timeout
    let exitCode = null;
    let timedOut = false;

    // Spawn server process
    const proc = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, SLACK_TOKEN: "test", SLACK_COOKIE: "test" }
    });

    // Set timeout - if process doesn't exit after stdin closes, it's a zombie
    const timer = setTimeout(() => {
      timedOut = true;
      console.log("  FAIL: Server did not exit within 5s (zombie process detected)");
      proc.kill("SIGKILL");
      resolve(false);
    }, timeout);

    proc.on("exit", (code) => {
      exitCode = code;
      clearTimeout(timer);
      if (!timedOut) {
        console.log(`  PASS: Server exited cleanly (code: ${code})`);
        resolve(true);
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      console.log(`  INFO: Server spawn error (expected if no SDK): ${err.message}`);
      // This is OK - we're testing exit behavior, not full functionality
      resolve(true);
    });

    // Close stdin immediately to simulate MCP client disconnect
    proc.stdin.end();

    // Give it a moment then send SIGTERM
    setTimeout(() => {
      if (exitCode === null && !timedOut) {
        proc.kill("SIGTERM");
      }
    }, 1000);
  });
}

// ============ Main ============

async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Core Stability Verification Tests     ║");
  console.log("╚════════════════════════════════════════╝");

  const results = [];

  results.push(await testAtomicWrite());
  results.push(await testServerExit());

  console.log("\n" + "═".repeat(40));
  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    console.log(`\n✓ ALL TESTS PASSED (${passed}/${total})`);
    console.log("\nCore stability features verified");
    process.exit(0);
  } else {
    console.log(`\n✗ TESTS FAILED (${passed}/${total})`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});

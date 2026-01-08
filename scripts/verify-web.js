#!/usr/bin/env node
/**
 * Web UI Verification Script
 *
 * Tests:
 * 1. Server starts and prints Magic Link
 * 2. /demo.html contains "STATIC PREVIEW" banner
 * 3. /?key=... serves the dashboard (index.html)
 * 4. Server shuts down cleanly
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "../src/web-server.js");
const PORT = 3456; // Use non-standard port to avoid conflicts
const TIMEOUT = 15000;

let serverProc = null;

function log(msg) {
  console.log(`  ${msg}`);
}

function cleanup() {
  if (serverProc) {
    serverProc.kill("SIGTERM");
    serverProc = null;
  }
}

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(1); });
process.on("SIGTERM", () => { cleanup(); process.exit(1); });

async function startServer() {
  return new Promise((resolve, reject) => {
    let magicLink = null;
    let apiKey = null;
    let output = "";

    serverProc = spawn("node", [SERVER_PATH], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ["pipe", "pipe", "pipe"]
    });

    const timeout = setTimeout(() => {
      reject(new Error("Server startup timeout - no magic link detected"));
    }, TIMEOUT);

    serverProc.stderr.on("data", (data) => {
      const text = data.toString();
      output += text;

      // Look for magic link pattern
      const match = text.match(/Dashboard:\s*(http:\/\/[^\s]+)/);
      if (match) {
        magicLink = match[1];
        // Extract key from URL
        const keyMatch = magicLink.match(/[?&]key=([^&\s]+)/);
        if (keyMatch) {
          apiKey = keyMatch[1];
        }
      }

      // Server is ready when we see the full banner
      if (output.includes("Dashboard:") && output.includes("API Key:")) {
        clearTimeout(timeout);
        resolve({ magicLink, apiKey });
      }
    });

    serverProc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProc.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

async function testDemoPage() {
  const url = `http://localhost:${PORT}/demo.html`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch demo.html: ${res.status}`);
  }

  const html = await res.text();

  if (!html.includes("STATIC PREVIEW")) {
    throw new Error("demo.html missing 'STATIC PREVIEW' banner");
  }

  if (!html.includes("Who is Alex?")) {
    throw new Error("demo.html missing anonymized 'Who is Alex?' scenario");
  }

  return true;
}

async function testDashboard(apiKey) {
  const url = `http://localhost:${PORT}/?key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard: ${res.status}`);
  }

  const html = await res.text();

  // Should serve index.html (the dashboard)
  if (!html.includes("Slack Web API")) {
    throw new Error("Dashboard page missing 'Slack Web API' title");
  }

  if (!html.includes("authModal")) {
    throw new Error("Dashboard missing auth modal");
  }

  return true;
}

async function testApiWithKey(apiKey) {
  // Test that API rejects bad key
  const badRes = await fetch(`http://localhost:${PORT}/health`, {
    headers: { "Authorization": "Bearer bad-key" }
  });

  if (badRes.status !== 401) {
    throw new Error(`Expected 401 for bad key, got ${badRes.status}`);
  }

  return true;
}

async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Web UI Verification Tests             ║");
  console.log("╚════════════════════════════════════════╝");

  const results = [];

  try {
    // Test 1: Server starts with magic link
    console.log("\n[TEST 1] Server Startup & Magic Link");
    console.log("─".repeat(40));

    const { magicLink, apiKey } = await startServer();

    if (!magicLink) {
      throw new Error("No magic link found");
    }
    if (!apiKey) {
      throw new Error("No API key found in magic link");
    }

    log(`Magic Link: ${magicLink}`);
    log(`API Key: ${apiKey.substring(0, 20)}...`);
    log("PASS: Server started with magic link");
    results.push(true);

    // Test 2: Demo page
    console.log("\n[TEST 2] Demo Page (/demo.html)");
    console.log("─".repeat(40));

    await testDemoPage();
    log("PASS: Demo page serves correctly with STATIC PREVIEW banner");
    results.push(true);

    // Test 3: Dashboard
    console.log("\n[TEST 3] Dashboard (/?key=...)");
    console.log("─".repeat(40));

    await testDashboard(apiKey);
    log("PASS: Dashboard serves with auth modal");
    results.push(true);

    // Test 4: API auth
    console.log("\n[TEST 4] API Authentication");
    console.log("─".repeat(40));

    await testApiWithKey(apiKey);
    log("PASS: API correctly rejects bad keys");
    results.push(true);

  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
    results.push(false);
  } finally {
    cleanup();
  }

  // Summary
  console.log("\n" + "═".repeat(40));
  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    console.log(`\n✓ ALL TESTS PASSED (${passed}/${total})`);
    console.log("\nWeb UI features verified");
    process.exit(0);
  } else {
    console.log(`\n✗ TESTS FAILED (${passed}/${total})`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error("Test error:", e);
  cleanup();
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Web UI Verification Script
 *
 * Tests:
 * 1. Server starts and prints Magic Link
 * 2. /demo.html contains the current interactive demo trust banner
 * 3. /?key=... serves the dashboard (index.html)
 * 4. /demo-video.html and /public/demo-video.html media assets are reachable
 * 5. Server shuts down cleanly
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, "../src/web-server.js");
const TEST_PORT = process.env.TEST_WEB_PORT || "3456";
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
    let baseUrl = null;
    let output = "";

    serverProc = spawn("node", [SERVER_PATH], {
      env: { ...process.env, PORT: TEST_PORT },
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
        baseUrl = new URL(magicLink).origin;
        // Extract key from URL
        const keyMatch = magicLink.match(/[?&]key=([^&\s]+)/);
        if (keyMatch) {
          apiKey = keyMatch[1];
        }
      }

      // Server is ready when we see the full banner
      if (output.includes("Dashboard:") && output.includes("API Key:")) {
        clearTimeout(timeout);
        resolve({ magicLink, apiKey, baseUrl });
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

async function testDemoPage(baseUrl) {
  const url = `${baseUrl}/demo.html`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch demo.html: ${res.status}`);
  }

  const html = await res.text();

  if (!html.includes("INTERACTIVE DEMO")) {
    throw new Error("demo.html missing 'INTERACTIVE DEMO' banner");
  }

  if (!html.includes("simulated data")) {
    throw new Error("demo.html missing simulated-data disclosure");
  }

  if (!html.includes("Who is Alex?")) {
    throw new Error("demo.html missing anonymized 'Who is Alex?' scenario");
  }

  return true;
}

async function testDashboard(baseUrl, apiKey) {
  const url = `${baseUrl}/?key=${apiKey}`;
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

async function testApiWithKey(baseUrl, apiKey) {
  // Test that API rejects bad key
  const badRes = await fetch(`${baseUrl}/health`, {
    headers: { "Authorization": "Bearer bad-key" }
  });

  if (badRes.status !== 401) {
    throw new Error(`Expected 401 for bad key, got ${badRes.status}`);
  }

  return true;
}

async function testDemoVideoAssets(baseUrl) {
  const demoVideoPaths = ["/demo-video.html", "/public/demo-video.html"];
  const requiredAssetCandidates = [
    [
      "/docs/images/demo-poster.png",
      "https://jtalk22.github.io/slack-mcp-server/docs/images/demo-poster.png",
    ],
    [
      "/docs/videos/demo-claude.webm",
      "https://jtalk22.github.io/slack-mcp-server/docs/videos/demo-claude.webm",
    ],
  ];

  for (const pagePath of demoVideoPaths) {
    const demoVideoUrl = `${baseUrl}${pagePath}`;
    const demoVideoRes = await fetch(demoVideoUrl);

    if (!demoVideoRes.ok) {
      throw new Error(`Failed to fetch ${pagePath}: ${demoVideoRes.status}`);
    }

    const demoVideoHtml = await demoVideoRes.text();

    for (const candidates of requiredAssetCandidates) {
      const matched = candidates.find((candidate) => demoVideoHtml.includes(candidate));
      if (!matched) {
        throw new Error(`${pagePath} missing expected media reference: ${candidates.join(" OR ")}`);
      }

      const assetUrl = matched.startsWith("http")
        ? matched
        : `${baseUrl}${matched}`;

      const assetRes = await fetch(assetUrl);
      if (!assetRes.ok) {
        throw new Error(`Demo media not reachable from ${pagePath}: ${assetUrl} (status ${assetRes.status})`);
      }
    }
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

    const { magicLink, apiKey, baseUrl } = await startServer();

    if (!magicLink) {
      throw new Error("No magic link found");
    }
    if (!apiKey) {
      throw new Error("No API key found in magic link");
    }
    if (!baseUrl) {
      throw new Error("No base URL found in magic link");
    }

    log(`Magic Link: ${magicLink}`);
    log(`API Key: ${apiKey.substring(0, 20)}...`);
    log(`Base URL: ${baseUrl}`);
    log("PASS: Server started with magic link");
    results.push(true);

    // Test 2: Demo page
    console.log("\n[TEST 2] Demo Page (/demo.html)");
    console.log("─".repeat(40));

    await testDemoPage(baseUrl);
    log("PASS: Demo page serves correctly with the interactive demo disclosure");
    results.push(true);

    // Test 3: Dashboard
    console.log("\n[TEST 3] Dashboard (/?key=...)");
    console.log("─".repeat(40));

    await testDashboard(baseUrl, apiKey);
    log("PASS: Dashboard serves with auth modal");
    results.push(true);

    // Test 4: API auth
    console.log("\n[TEST 4] API Authentication");
    console.log("─".repeat(40));

    await testApiWithKey(baseUrl, apiKey);
    log("PASS: API correctly rejects bad keys");
    results.push(true);

    // Test 5: Demo video/media paths
    console.log("\n[TEST 5] Demo Video Media Reachability");
    console.log("─".repeat(40));

    await testDemoVideoAssets(baseUrl);
    log("PASS: demo-video media assets are reachable");
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

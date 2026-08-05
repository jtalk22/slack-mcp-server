#!/usr/bin/env node

import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import playwright from "playwright";
import { RELEASE_VERSION, PUBLIC_METADATA } from "../lib/public-metadata.js";

const { chromium } = playwright;

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

function argValue(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

const mode = argValue("--mode", "local");
const liveBaseUrl = argValue("--base-url", "https://jtalk22.github.io/slack-mcp-server");
const retries = Number(argValue("--retries", mode === "live" ? "8" : "1"));
const retryDelayMs = Number(argValue("--retry-delay-ms", "10000"));

// Two distinct invariants, two modes (the old single assertion conflated them and
// went red on every version-bump merge during the normal merge→release window):
//   default (push-to-main) — DEPLOYMENT INTEGRITY: the page must render what its
//     upstream sources (GitHub releases API, npm registry) actually say right now.
//     package.json being ahead of the latest release is the expected pre-release
//     state, logged, never failed.
//   --strict-version (release-published) — SURFACE CONVERGENCE: releases API, npm,
//     and the page must all agree on RELEASE_VERSION. Upstreams are re-resolved on
//     every retry so npm-publish propagation is covered by the retry budget.
const strictVersion = process.argv.includes("--strict-version");
const expectTagOverride = argValue("--expect-tag", null);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
};

function statusFixture() {
  // Mirrors the LIVE hosted /status contract (buildHostedStatusPayload in the
  // hosted repo): tools are {free,paid,total}. The old fixture pinned the dead
  // {standard,ai_compound} shape, which is exactly how the landing-page tile
  // drifted to "Unavailable managed tools" in production without a red test.
  return {
    status: "ok",
    server: "slack-mcp-hosted",
    version: "5.0.0",
    timestamp: "2026-03-11T00:00:00.000Z",
    tools: {
      free: 15,
      paid: 3,
      total: 18,
    },
    docs: {
      docs_url: "https://mcp.revasserlabs.com/docs",
    },
  };
}

function releaseFixture() {
  return {
    tag_name: `v${RELEASE_VERSION}`,
    published_at: "2026-03-11T00:00:00.000Z",
  };
}

function npmFixture() {
  return {
    name: "@jtalk22/slack-mcp",
    version: RELEASE_VERSION,
  };
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const rawPath = req.url?.split("?")[0] || "/";
      const pathname = rawPath === "/" ? "/index.html" : rawPath;
      const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
      const target = join(ROOT, safePath);

      if (!existsSync(target) || !(await stat(target)).isFile()) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "content-type": MIME_TYPES[extname(target)] || "application/octet-stream",
        "cache-control": "no-store",
      });
      createReadStream(target).pipe(res);
    } catch (error) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end(String(error.message || error));
    }
  });

  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({
        close: () => new Promise((resolveClose) => server.close(resolveClose)),
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function collectErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Browsers log console errors for video <source> 404s when trying
      // formats in order (MP4 first, WebM fallback). These are expected.
      if (/Failed to load resource.*404/.test(text)) return;
      errors.push(`console:${text}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror:${error.message}`);
  });
  page.on("requestfailed", (request) => {
    const resourceType = request.resourceType();
    if (["document", "script", "fetch", "xhr"].includes(resourceType)) {
      errors.push(`requestfailed:${request.url()} (${request.failure()?.errorText || "unknown"})`);
    }
  });
  return errors;
}

function assertText(text, pattern, label) {
  if (!pattern.test(text)) {
    throw new Error(`${label} did not match ${pattern}: ${text}`);
  }
}

function normalizeErrors(errors, { allowHostedStatusFallback = false } = {}) {
  if (!allowHostedStatusFallback) {
    return errors;
  }

  const hostedStatusFailurePattern = /requestfailed:https:\/\/mcp\.revasserlabs\.com\/status\b/;
  const hostedStatusCorsConsolePattern =
    /^console:Access to fetch at 'https:\/\/mcp\.revasserlabs\.com\/status'.*blocked by CORS policy/i;
  let hostedStatusConsoleBudget = errors.some((entry) => hostedStatusFailurePattern.test(entry)) ? 1 : 0;

  return errors.filter((entry) => {
    if (hostedStatusFailurePattern.test(entry)) {
      return false;
    }

    if (hostedStatusCorsConsolePattern.test(entry)) {
      return false;
    }

    if (entry === "console:Failed to load resource: net::ERR_FAILED" && hostedStatusConsoleBudget > 0) {
      hostedStatusConsoleBudget -= 1;
      return false;
    }

    return true;
  });
}

// Resolve what the page's upstream sources say RIGHT NOW (same endpoints the page
// itself fetches at runtime). Falls back to RELEASE_VERSION when an upstream is
// unreachable (e.g. anonymous API rate limits on shared runners) so the smoke
// degrades to the old strict behavior instead of a false failure.
async function resolveExpectedVersions() {
  let expectedTag = expectTagOverride;
  let expectedNpm = null;

  if (!expectedTag) {
    try {
      const res = await fetch("https://api.github.com/repos/jtalk22/slack-mcp-server/releases/latest", {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "browser-smoke" },
      });
      if (res.ok) expectedTag = (await res.json()).tag_name || null;
    } catch {}
  }
  try {
    const res = await fetch("https://registry.npmjs.org/@jtalk22/slack-mcp/latest", {
      headers: { "User-Agent": "browser-smoke" },
    });
    if (res.ok) expectedNpm = `v${(await res.json()).version}` || null;
  } catch {}

  return {
    expectedTag: expectedTag || `v${RELEASE_VERSION}`,
    expectedNpm: expectedNpm || `v${RELEASE_VERSION}`,
  };
}

function literalPattern(value) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

async function checkRoot(page, url, { expectedNpm = `v${RELEASE_VERSION}` } = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => {
    const npm = document.querySelector("#npmVersion")?.textContent?.trim();
    return Boolean(npm && npm !== "latest release");
  }, { timeout: 30000 });

  const snapshot = await page.evaluate(() => ({
    npm: document.querySelector("#npmVersion")?.textContent?.trim() || "",
    hero: document.querySelector(".hero-copy")?.textContent?.trim() || "",
    systems: document.querySelector("#systems")?.textContent?.trim() || "",
    paths: document.querySelector("#paths")?.textContent?.trim() || "",
    command: document.querySelector(".command")?.textContent?.trim() || "",
  }));

  assertText(snapshot.npm, literalPattern(expectedNpm), "#npmVersion");
  assertText(snapshot.hero, /Ask what happened\.[\s\S]*Get receipts\.[\s\S]*Close the loop\./i, "hero thesis");
  assertText(snapshot.hero, new RegExp(`${PUBLIC_METADATA.selfHostedToolCount}[- ]tool`, "i"), "hero tool count");
  assertText(snapshot.systems, /Browser-session engine/i, "systems proof");
  assertText(snapshot.paths, /Move now\.[\s\S]*Run unattended\./i, "local-hosted decision");
  assertText(snapshot.command, /npx -y @jtalk22\/slack-mcp --setup/, "install command");
  return { pageState: "ok" };
}

async function checkStaticPage(page, url, selector, pattern, label) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  const text = await page.locator(selector).innerText({ timeout: 30000 });
  assertText(text, pattern, label);
}

async function runLocal() {
  const browser = await chromium.launch({ headless: true, executablePath });
  const server = await startStaticServer();

  try {
    const page = await browser.newPage();
    const errors = await collectErrors(page);

    await page.route(/https:\/\/registry\.npmjs\.org\/@jtalk22(?:%2F|\/)slack-mcp\/latest/i, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(npmFixture()) });
    });
    await page.route("https://api.github.com/repos/jtalk22/slack-mcp-server/releases/latest", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(releaseFixture()) });
    });
    await page.route("https://mcp.revasserlabs.com/status", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(statusFixture()) });
    });

    await checkRoot(page, `${server.url}/`);
    const toolCount = PUBLIC_METADATA.selfHostedToolCount;
    await checkStaticPage(page, `${server.url}/public/share.html`, ".note", /Ask what happened\. Get receipts\. Close the loop\./i, "share note");
    await checkStaticPage(page, `${server.url}/public/demo-video.html`, ".note", /Use Slack interactively for free; move unattended work to hosted/i, "demo video note");
    await checkStaticPage(page, `${server.url}/public/demo.html`, ".cta-note", new RegExp(`free local path ships the current ${toolCount}-tool surface`, "i"), "demo note");
    await checkStaticPage(page, `${server.url}/public/demo-slack-mcp.html`, ".note", new RegExp(`free local path ships the current ${toolCount}-tool surface`, "i"), "demo claude note");

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  } finally {
    await server.close();
    await browser.close();
  }
}

async function runLive() {
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      const page = await browser.newPage();
      const errors = await collectErrors(page);

      try {
        // Re-resolve upstream truth on every attempt: in strict mode this lets the
        // retry budget absorb npm-publish / releases-API propagation after a release.
        const { expectedTag, expectedNpm } = await resolveExpectedVersions();
        if (strictVersion) {
          assertText(expectedTag, literalPattern(`v${RELEASE_VERSION}`), "latest release tag (strict convergence)");
          assertText(expectedNpm, literalPattern(`v${RELEASE_VERSION}`), "npm latest version (strict convergence)");
        } else if (expectedTag !== `v${RELEASE_VERSION}`) {
          console.log(`note: package version v${RELEASE_VERSION} is ahead of the latest release ${expectedTag} — expected merge→release window; asserting the page against live upstream truth.`);
        }

        await checkRoot(page, `${liveBaseUrl.replace(/\/$/, "")}/`, { expectedNpm });
        await checkStaticPage(page, `${liveBaseUrl.replace(/\/$/, "")}/public/share.html`, ".note", /Ask what happened\. Get receipts\. Close the loop\./i, "live share note");
        const normalizedErrors = normalizeErrors(errors);
        if (normalizedErrors.length > 0) {
          throw new Error(normalizedErrors.join("\n"));
        }
        return;
      } catch (error) {
        await page.close();
        if (attempt === retries) {
          throw error;
        }
        await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelayMs));
      }
    }
  } finally {
    await browser.close();
  }
}

if (mode === "live") {
  await runLive();
} else {
  await runLocal();
}

console.log(`Public browser smoke passed (${mode}).`);

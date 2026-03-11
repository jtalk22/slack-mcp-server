#!/usr/bin/env node

import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import playwright from "playwright";

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
  return {
    status: "ok",
    server: "slack-mcp-hosted",
    version: "0.6.7-local",
    timestamp: "2026-03-11T00:00:00.000Z",
    tools: {
      standard: 15,
      ai_compound: 3,
      total: 18,
    },
    docs: {
      docs_url: "https://mcp.revasserlabs.com/docs",
    },
  };
}

function releaseFixture() {
  return {
    tag_name: "v3.2.4",
    published_at: "2026-03-11T00:00:00.000Z",
  };
}

function npmFixture() {
  return {
    name: "@jtalk22/slack-mcp",
    version: "3.2.4",
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
      errors.push(`console:${msg.text()}`);
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

async function checkRoot(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => {
    const npm = document.querySelector("#npmLatest")?.textContent?.trim();
    const release = document.querySelector("#releaseTag")?.textContent?.trim();
    const cloud = document.querySelector("#cloudHealth")?.textContent?.trim();
    return Boolean(npm && npm !== "Loading..." && release && release !== "Loading..." && cloud && cloud !== "Checking...");
  }, { timeout: 30000 });

  const snapshot = await page.evaluate(() => ({
    npm: document.querySelector("#npmLatest")?.textContent?.trim() || "",
    release: document.querySelector("#releaseTag")?.textContent?.trim() || "",
    cloud: document.querySelector("#cloudHealth")?.textContent?.trim() || "",
    cloudNote: document.querySelector("#cloudHealthNote")?.textContent?.trim() || "",
    decision: document.querySelector(".decision-grid")?.textContent?.trim() || "",
  }));

  assertText(snapshot.npm, /^v3\.2\.4$/, "#npmLatest");
  assertText(snapshot.release, /^v3\.2\.4$/, "#releaseTag");
  assertText(snapshot.cloud, /^ok$/i, "#cloudHealth");
  assertText(snapshot.cloudNote, /15 managed tools/i, "#cloudHealthNote");
  assertText(snapshot.cloudNote, /3 Team AI workflows/i, "#cloudHealthNote");
  assertText(snapshot.decision, /16 tools and full operator control/i, "decision guide");
}

async function checkStaticPage(page, url, selector, pattern, label) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  const text = await page.locator(selector).innerText({ timeout: 30000 });
  assertText(text, pattern, label);
}

async function runLocal() {
  const browser = await chromium.launch({ headless: true });
  const server = await startStaticServer();

  try {
    const page = await browser.newPage();
    const errors = await collectErrors(page);

    await page.route("https://registry.npmjs.org/@jtalk22/slack-mcp/latest", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(npmFixture()) });
    });
    await page.route("https://api.github.com/repos/jtalk22/slack-mcp-server/releases/latest", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(releaseFixture()) });
    });
    await page.route("https://mcp.revasserlabs.com/status", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(statusFixture()) });
    });

    await checkRoot(page, `${server.url}/`);
    await checkStaticPage(page, `${server.url}/public/share.html`, ".note", /Cloud starts at \$19\/mo/i, "share note");
    await checkStaticPage(page, `${server.url}/public/demo-video.html`, ".note", /Solo starts at \$19\/mo/i, "demo video note");
    await checkStaticPage(page, `${server.url}/public/demo.html`, ".cta-note", /Team at \$49\/mo adds 3 AI workflows/i, "demo note");
    await checkStaticPage(page, `${server.url}/public/demo-claude.html`, ".note", /deployment review, and support/i, "demo claude note");

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  } finally {
    await server.close();
    await browser.close();
  }
}

async function runLive() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      const page = await browser.newPage();
      const errors = await collectErrors(page);

      try {
        await checkRoot(page, `${liveBaseUrl.replace(/\/$/, "")}/`);
        await checkStaticPage(page, `${liveBaseUrl.replace(/\/$/, "")}/public/share.html`, ".note", /Cloud starts at \$19\/mo/i, "live share note");
        if (errors.length > 0) {
          throw new Error(errors.join("\n"));
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

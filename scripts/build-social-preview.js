#!/usr/bin/env node

import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const WIDTH = 1280;
const HEIGHT = 640;
const MAX_BYTES = 1_000_000;

function parseArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

const outputPath = resolve(parseArg("--out") || join(ROOT, "docs", "images", "social-preview-v3.png"));
const sourcePath = resolve(parseArg("--source") || join(ROOT, "docs", "images", "demo-poster.png"));

if (!existsSync(sourcePath)) {
  console.error(`Missing source image: ${sourcePath}`);
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });

const sourceDataUri = `data:image/png;base64,${readFileSync(sourcePath).toString("base64")}`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slack MCP Server v3.0.0 Social Preview</title>
  <style>
    :root {
      --bg-a: #0f1f4c;
      --bg-b: #0a1538;
      --line: rgba(141, 168, 233, 0.3);
      --text: #ecf4ff;
      --muted: #b3c4e8;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: "Space Grotesk", "IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }
    body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      overflow: hidden;
      color: var(--text);
      background:
        radial-gradient(920px 460px at 8% 0%, #2a4f98 0%, transparent 58%),
        radial-gradient(980px 500px at 100% 100%, #0f4686 0%, transparent 63%),
        linear-gradient(130deg, var(--bg-a), var(--bg-b));
      padding: 24px 28px;
    }
    .card {
      width: 100%;
      height: 100%;
      border-radius: 16px;
      border: 1px solid var(--line);
      background: linear-gradient(165deg, rgba(16, 34, 82, 0.76), rgba(9, 20, 54, 0.92));
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.3);
      padding: 14px 16px;
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 10px;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 19px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #e9f2ff;
    }
    .pill {
      font-size: 17px;
      background: rgba(88, 121, 191, 0.24);
      border: 1px solid rgba(137, 167, 227, 0.5);
      color: #dce9ff;
      border-radius: 999px;
      padding: 4px 10px 5px;
      font-weight: 600;
    }
    .image-frame {
      border-radius: 13px;
      border: 1px solid rgba(147, 173, 240, 0.32);
      overflow: hidden;
      background: #0a1438;
      height: 474px;
    }
    .image-frame img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      filter: saturate(1.03);
    }
    .bottom {
      border-top: 1px solid rgba(130, 156, 220, 0.24);
      padding-top: 8px;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 12px;
    }
    .subhead {
      font-size: 28px;
      font-weight: 620;
      line-height: 1.08;
      letter-spacing: -0.02em;
      max-width: 930px;
    }
    .detail {
      margin-top: 5px;
      font-size: 18px;
      color: var(--muted);
      letter-spacing: -0.012em;
      font-weight: 500;
    }
    .attribution {
      text-align: right;
      font-size: 17px;
      color: #d6e3ff;
      font-weight: 560;
      line-height: 1.2;
    }
    .attribution .mail {
      font-size: 14px;
      color: #a8bbe6;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <main class="card">
    <header class="top">
      <span>Slack MCP Server</span>
      <span class="pill">v3.0.0</span>
    </header>
    <section class="image-frame">
      <img src="${sourceDataUri}" alt="Slack MCP live demo frame">
    </section>
    <footer class="bottom">
      <div>
        <div class="subhead">Session-based Slack MCP for Claude and MCP clients.</div>
        <div class="detail">Local-first stdio/web. Secure-default hosted HTTP in v3.</div>
      </div>
      <div class="attribution">
        <div>jtalk22</div>
        <div class="mail">james@revasser.nyc</div>
      </div>
    </footer>
  </main>
</body>
</html>`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  colorScheme: "dark",
});

const page = await context.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: outputPath, type: "png" });

await context.close();
await browser.close();

const size = statSync(outputPath).size;
console.log(`Wrote ${outputPath}`);
console.log(`Size: ${size} bytes`);

if (size > MAX_BYTES) {
  console.error(`Image exceeds ${MAX_BYTES} bytes target.`);
  process.exit(1);
}

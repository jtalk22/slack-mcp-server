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
      --bg-a: #101b43;
      --bg-b: #0a1231;
      --line: rgba(145, 170, 235, 0.26);
      --text: #eef4ff;
      --muted: #adbedf;
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
        radial-gradient(840px 380px at 12% 12%, #254793 0%, transparent 58%),
        radial-gradient(920px 420px at 100% 100%, #103a78 0%, transparent 62%),
        linear-gradient(130deg, var(--bg-a), var(--bg-b));
      padding: 28px 30px;
    }
    .card {
      width: 100%;
      height: 100%;
      border-radius: 16px;
      border: 1px solid var(--line);
      background: linear-gradient(165deg, rgba(16, 31, 74, 0.78), rgba(9, 19, 49, 0.92));
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.3);
      padding: 14px 16px 16px;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #eaf1ff;
      margin-bottom: 10px;
    }
    .pill {
      font-size: 17px;
      background: rgba(88, 122, 193, 0.24);
      border: 1px solid rgba(137, 166, 227, 0.46);
      color: #dce9ff;
      border-radius: 999px;
      padding: 4px 10px 5px;
      font-weight: 600;
    }
    .image-frame {
      border-radius: 13px;
      border: 1px solid rgba(147, 173, 240, 0.3);
      overflow: hidden;
      background: #0a1438;
      height: 448px;
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
      border-top: 1px solid rgba(130, 156, 220, 0.22);
      padding-top: 10px;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: end;
      gap: 12px;
      margin-top: 10px;
    }
    .headline {
      font-size: 30px;
      font-weight: 630;
      line-height: 1.08;
      letter-spacing: -0.018em;
      max-width: 900px;
    }
    .subhead {
      margin-top: 6px;
      font-size: 20px;
      color: var(--muted);
      letter-spacing: -0.012em;
      font-weight: 480;
    }
    .attribution {
      text-align: right;
      font-size: 18px;
      color: #d6e2ff;
      font-weight: 560;
      line-height: 1.2;
    }
    .attribution .mail {
      font-size: 15px;
      color: #a9bce9;
      font-weight: 480;
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
        <div class="headline">Session-based Slack MCP server for Claude and MCP clients.</div>
        <div class="subhead">Local-first stdio/web, secure-default hosted HTTP in v3.</div>
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

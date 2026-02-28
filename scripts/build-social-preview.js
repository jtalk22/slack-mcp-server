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
      --bg-a: #0f1f4d;
      --bg-b: #0b173b;
      --panel: rgba(17, 34, 78, 0.84);
      --muted: #9fb0d9;
      --text: #f4f7ff;
      --teal: #4ed0c8;
      --line: rgba(122, 152, 224, 0.35);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: "SF Pro Text", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }
    body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      color: var(--text);
      background:
        radial-gradient(1000px 500px at 10% 20%, #1b3279 0%, transparent 62%),
        radial-gradient(900px 420px at 100% 100%, #143c78 0%, transparent 60%),
        linear-gradient(130deg, var(--bg-a), var(--bg-b));
      overflow: hidden;
    }
    .wrap {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: 57% 43%;
      gap: 20px;
      padding: 36px 38px 28px;
    }
    .visual {
      border: 1px solid var(--line);
      border-radius: 16px;
      background: linear-gradient(160deg, rgba(17, 31, 71, 0.7), rgba(11, 22, 54, 0.8));
      box-shadow: 0 20px 44px rgba(0, 0, 0, 0.32);
      padding: 16px;
      display: flex;
      flex-direction: column;
    }
    .visual-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 15px;
      color: #d8e2ff;
      letter-spacing: 0.01em;
    }
    .pill {
      font-size: 13px;
      background: rgba(78, 208, 200, 0.14);
      border: 1px solid rgba(78, 208, 200, 0.45);
      color: #8ff1eb;
      border-radius: 999px;
      padding: 6px 10px;
      font-weight: 600;
    }
    .image-frame {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(140, 165, 230, 0.32);
      flex: 1;
      min-height: 0;
    }
    .image-frame img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      filter: saturate(1.05);
    }
    .copy {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 24px 24px 18px;
      background: var(--panel);
      display: grid;
      grid-template-rows: auto auto auto 1fr auto;
      gap: 14px;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.3);
    }
    .title {
      font-size: 36px;
      line-height: 1.08;
      letter-spacing: -0.02em;
      font-weight: 760;
    }
    .subtitle {
      font-size: 21px;
      line-height: 1.35;
      color: #d6e0fb;
      font-weight: 540;
    }
    .verify-head {
      color: var(--teal);
      font-size: 16px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .verify {
      border-radius: 12px;
      border: 1px solid rgba(135, 162, 228, 0.28);
      background: rgba(7, 14, 37, 0.74);
      padding: 13px 15px;
      font-family: "SF Mono", "SFMono-Regular", ui-monospace, "Cascadia Mono", "Menlo", Consolas, monospace;
      font-size: 13.5px;
      line-height: 1.5;
      color: #cde0ff;
      white-space: pre;
    }
    .footer {
      font-size: 14px;
      color: var(--muted);
      border-top: 1px solid rgba(130, 156, 219, 0.25);
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .strong {
      color: #eaf0ff;
      font-weight: 650;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="visual">
      <div class="visual-head">
        <span>Slack MCP Server</span>
        <span class="pill">v3.0.0</span>
      </div>
      <div class="image-frame">
        <img src="${sourceDataUri}" alt="Slack MCP demo">
      </div>
    </section>
    <section class="copy">
      <h1 class="title">Secure-default hosted HTTP.<br>Local-first workflows preserved.</h1>
      <p class="subtitle">Session-based Slack access for Claude and MCP clients with a verifiable operator path.</p>
      <p class="verify-head">30-second verify</p>
      <pre class="verify">npx -y @jtalk22/slack-mcp@latest --version
npx -y @jtalk22/slack-mcp@latest --doctor
npx -y @jtalk22/slack-mcp@latest --status</pre>
      <div class="footer">
        <span class="strong">jtalk22</span>
        <span>james@revasser.nyc</span>
      </div>
    </section>
  </div>
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

#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(ROOT, "public", "proof-reel.html");
const VIDEO_DIR = join(ROOT, "docs", "videos");
const IMAGE_DIR = join(ROOT, "docs", "images");
const argv = new Set(process.argv.slice(2));
const runAll = argv.size === 0;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

if (!existsSync(PAGE)) {
  throw new Error("public/proof-reel.html is missing. Run npm run build:public-pages first.");
}
mkdirSync(VIDEO_DIR, { recursive: true });
mkdirSync(IMAGE_DIR, { recursive: true });

function runFfmpeg(args) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
}

function sizeLabel(path) {
  return `${(statSync(path).size / 1024 / 1024).toFixed(2)} MB`;
}

async function recordVariant({ name, viewport, query, durationSeconds, crf, outputMp4, outputWebm }) {
  const browser = await chromium.launch({ headless: true, executablePath });
  const tempDir = join(VIDEO_DIR, `.proof-${name}`);
  mkdirSync(tempDir, { recursive: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: tempDir, size: viewport },
  });
  const page = await context.newPage();
  await page.goto(`file://${PAGE}${query}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.REEL_READY === true);
  const video = page.video();
  await page.waitForSelector("body.reel-complete", { timeout: 60000 });
  await page.waitForTimeout(500);
  await page.close();
  const source = await video.path();
  await context.close();
  await browser.close();

  if (outputWebm) {
    runFfmpeg(["-i", source, "-t", String(durationSeconds), "-c:v", "copy", "-an", outputWebm]);
    console.log(`${name} WebM: ${sizeLabel(outputWebm)}`);
  }
  runFfmpeg([
    "-i", source, "-t", String(durationSeconds),
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf),
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
    outputMp4,
  ]);
  console.log(`${name} MP4: ${sizeLabel(outputMp4)}`);
  rmSync(tempDir, { recursive: true, force: true });
}

async function capturePosters() {
  const browser = await chromium.launch({ headless: true, executablePath });
  for (const target of [
    { viewport: { width: 1280, height: 720 }, path: join(IMAGE_DIR, "demo-poster.png"), query: "?still=poster" },
    { viewport: { width: 1280, height: 640 }, path: join(IMAGE_DIR, "social-preview-v3.png"), query: "?still=final" },
  ]) {
    const page = await browser.newPage({ viewport: target.viewport, colorScheme: "dark" });
    await page.goto(`file://${PAGE}${target.query}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.REEL_READY === true);
    await page.screenshot({ path: target.path, type: "png" });
    await page.close();
    console.log(`${target.path.replace(`${ROOT}/`, "")}: ${sizeLabel(target.path)}`);
  }
  await browser.close();
}

if (runAll || argv.has("--desktop")) {
  await recordVariant({
    name: "desktop",
    viewport: { width: 1920, height: 1080 },
    query: "",
    durationSeconds: 42,
    crf: 18,
    outputMp4: join(VIDEO_DIR, "slack-mcp-proof-42s.mp4"),
    outputWebm: join(VIDEO_DIR, "slack-mcp-proof-42s.webm"),
  });
}

if (runAll || argv.has("--vertical")) {
  await recordVariant({
    name: "vertical",
    viewport: { width: 1080, height: 1920 },
    query: "?short=1",
    durationSeconds: 20,
    crf: 27,
    outputMp4: join(VIDEO_DIR, "slack-mcp-proof-20s-vertical.mp4"),
  });
}

if (runAll || argv.has("--posters")) {
  await capturePosters();
}

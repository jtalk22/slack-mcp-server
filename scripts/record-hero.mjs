#!/usr/bin/env node
/**
 * Re-record the README hero from its source, frame by frame.
 *
 *   node scripts/record-hero.mjs
 *
 * docs/assets/hero-printer-pin.html renders an exact frame for any timestamp
 * (window.__render), so a capture is reproducible and an unchanged frame is
 * byte-identical to the last — which is what keeps a 14-second GIF near 250 KB
 * instead of the ~2 MB a browser screen recording produces from codec noise.
 *
 * Needs playwright (a devDependency) and ffmpeg on PATH. Writes
 * docs/images/hero-printer-pin.gif; run `npm run build:media-manifest` after.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const SOURCE = join(ROOT, "docs/assets/hero-printer-pin.html");
const OUT = join(ROOT, "docs/images/hero-printer-pin.gif");
const FPS = 12;
const TOTAL_MS = 13800;   // last beat lands at 11.2 s; the rest is the hold

const dir = mkdtempSync(join(tmpdir(), "hero-"));
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => { window.__capture = true; });
  await page.goto("file://" + SOURCE);
  await page.evaluate(() => document.fonts.ready);
  let i = 0;
  for (let t = 0; t <= TOTAL_MS; t += 1000 / FPS) {
    await page.evaluate((tt) => window.__render(tt), t);
    await page.screenshot({ path: join(dir, `f${String(i++).padStart(4, "0")}.png`) });
  }
  await browser.close();

  const frames = join(dir, "f%04d.png");
  const palette = join(dir, "palette.png");
  const scale = "scale=1000:-1:flags=lanczos";
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", frames,
    "-vf", `${scale},palettegen=max_colors=128:stats_mode=full`, palette]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", frames, "-i", palette,
    "-lavfi", `${scale}[x];[x][1:v]paletteuse=dither=none:diff_mode=rectangle`,
    "-final_delay", "350", "-loop", "0", OUT]);
  console.log(`Wrote ${OUT} from ${i} frames.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

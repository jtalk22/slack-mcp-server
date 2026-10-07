#!/usr/bin/env node
/**
 * Re-record the README hero from its source, frame by frame.
 *
 *   node scripts/record-hero.mjs            # both themes
 *   node scripts/record-hero.mjs dark       # one
 *
 * docs/assets/hero-v2.html renders an exact frame for any timestamp
 * (window.__render), so a capture is reproducible and an unchanged frame is
 * byte-identical to the last — which is what keeps a 14-second GIF small instead
 * of the several MB a browser screen recording produces from codec noise.
 *
 * The README shows the light file to light-mode readers and the dark twin to
 * dark-mode readers through <picture>. Fonts are vendored in docs/assets/fonts,
 * so a re-record never depends on the network.
 *
 * Needs playwright (a devDependency) and ffmpeg on PATH. Writes
 * docs/images/hero-v2-<theme>.gif; run `npm run build:media-manifest` after.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const SOURCE = join(ROOT, "docs/assets/hero-v2.html");
const THEMES = process.argv.slice(2).length ? process.argv.slice(2) : ["light", "dark"];
const FPS = 12;
const TOTAL_MS = 11000;   // last beat lands at 8.6 s; final_delay holds the end frame 3.5 s more
const SCALE = 2;          // capture at 2x so text stays sharp on high-density screens
const WIDTH = 1600;       // GitHub shows the hero at 900 CSS px, i.e. 1800 device px on Retina

for (const theme of THEMES) {
  const out = join(ROOT, `docs/images/hero-v2-${theme}.gif`);
  const dir = mkdtempSync(join(tmpdir(), "hero-"));
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: SCALE });
    await page.addInitScript(() => { window.__capture = true; });
    await page.goto(`file://${SOURCE}?theme=${theme}`);
    await page.evaluate(() => document.fonts.ready);
    const missing = await page.evaluate(() => [...document.fonts].filter((f) => f.status !== "loaded").map((f) => f.family));
    if (missing.length) throw new Error(`fonts did not load: ${missing.join(", ")}`);
    let i = 0;
    for (let t = 0; t <= TOTAL_MS; t += 1000 / FPS) {
      await page.evaluate((tt) => window.__render(tt), t);
      await page.screenshot({ path: join(dir, `f${String(i++).padStart(4, "0")}.png`) });
    }
    await browser.close();

    const frames = join(dir, "f%04d.png");
    const palette = join(dir, "palette.png");
    const scale = `scale=${WIDTH}:-1:flags=lanczos`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", frames,
      "-vf", `${scale},palettegen=max_colors=128:stats_mode=full`, palette]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", frames, "-i", palette,
      "-lavfi", `${scale}[x];[x][1:v]paletteuse=dither=none:diff_mode=rectangle`,
      "-final_delay", "350", "-loop", "0", out]);
    console.log(`Wrote ${out} from ${i} frames.`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

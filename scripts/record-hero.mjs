#!/usr/bin/env node
/**
 * Re-record the README hero from its source, frame by frame.
 *
 *   node scripts/record-hero.mjs
 *   node scripts/record-hero.mjs --open-fonts    # without the type estate
 *
 * docs/assets/hero-v2.html renders an exact frame for any timestamp
 * (window.__render), so a capture is reproducible and an unchanged frame is
 * byte-identical to the last — which is what keeps a 14-second GIF small instead
 * of the several MB a browser screen recording produces from codec noise.
 *
 * The type is Söhne and GT America Mono from
 * the maintainer's type estate, read from HERO_FONTS_DIR (default: the OneDrive
 * fonts folder) and never committed; the GIF carries the pixels. Without the
 * estate the recording stops, unless --open-fonts asks for the vendored
 * open-licence stand-ins in docs/assets/fonts.
 *
 * Needs playwright (a devDependency) and ffmpeg on PATH. Writes
 * docs/images/hero-v2.gif; run `npm run build:media-manifest` after.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const SOURCE = join(ROOT, "docs/assets/hero-v2.html");
const args = process.argv.slice(2);
const OPEN_FONTS = args.includes("--open-fonts");
const THEMES = ["one"];   // one purple field reads in both GitHub themes
// OneDrive evicts files it has not seen opened for a while, and an evicted font
// fails the FontFace load with a network error. A local mirror of the seven files
// the hero uses takes precedence; refresh it by copying from the estate.
const LOCAL_FONTS = join(homedir(), "Library/Caches/slack-mcp-hero-fonts");
const FONTS_DIR = process.env.HERO_FONTS_DIR || (existsSync(join(LOCAL_FONTS, "Söhne", "web")) ? LOCAL_FONTS : join(homedir(), "Library/CloudStorage/OneDrive-Personal/fonts"));
if (!OPEN_FONTS && !existsSync(join(FONTS_DIR, "Söhne", "web"))) {
  console.error(`The type estate is not at ${FONTS_DIR}. Set HERO_FONTS_DIR, or pass --open-fonts to record with the stand-ins.`);
  process.exit(1);
}
const FONTS_QUERY = OPEN_FONTS ? "" : `&fonts=${encodeURIComponent(pathToFileURL(FONTS_DIR).href)}`;
const FPS = 12;
const TOTAL_MS = 11800;   // last beat lands at 8.35 s; final_delay holds the end frame 3.5 s more
const SCALE = 2;          // capture at 2x so text stays sharp on high-density screens
const WIDTH = 1600;       // GitHub shows the hero at 900 CSS px, i.e. 1800 device px on Retina

for (const theme of THEMES) {
  const out = join(ROOT, "docs/images/hero-v2.gif");
  const dir = mkdtempSync(join(tmpdir(), "hero-"));
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: SCALE });
    await page.addInitScript(() => { window.__capture = true; });
    await page.goto(`file://${SOURCE}?${FONTS_QUERY.slice(1)}`);
    await page.evaluate(() => window.__fontsLoaded);
    await page.evaluate(() => document.fonts.ready);
    const source = await page.evaluate(() => window.__fontSource);
    if (!OPEN_FONTS && source !== "estate") throw new Error(`expected the estate faces, got "${source}"`);
    const used = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`));
    const failed = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "error").map((f) => `${f.family} ${f.weight}`));
    if (failed.length) throw new Error(`fonts did not load: ${failed.join(", ")}`);
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
    console.log(`Wrote ${out} from ${i} frames (${source} faces: ${[...new Set(used)].join(", ")}).`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

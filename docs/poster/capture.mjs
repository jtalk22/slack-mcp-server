// Regenerates docs/images/demo-poster.png from docs/poster/poster.html.
// Usage: node docs/poster/capture.mjs
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = "file://" + resolve(here, "poster.html");
const out = resolve(here, "..", "images", "demo-poster.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 640, height: 400 },
  deviceScaleFactor: 2,
});
await page.goto(src, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
console.log("wrote", out, "(1280x800)");

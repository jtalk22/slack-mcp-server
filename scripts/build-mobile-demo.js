#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const argv = process.argv.slice(2);
const hasArg = (flag) => argv.includes(flag);
const argValue = (flag) => {
  const idx = argv.indexOf(flag);
  return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : null;
};

const input = resolve(argValue("--in") || join(ROOT, "docs", "videos", "demo-claude.webm"));
const outputVideo = resolve(
  argValue("--out-video") || join(ROOT, "docs", "videos", "demo-claude-mobile-20s.mp4")
);
const outputPoster = resolve(
  argValue("--out-poster") || join(ROOT, "docs", "images", "demo-claude-mobile-poster.png")
);
const outputGif = resolve(
  argValue("--out-gif") || join(ROOT, "docs", "images", "demo-claude-mobile-20s.gif")
);
const validationDir = resolve(
  argValue("--validation-dir") || join(ROOT, "output", "release-health", "mobile-first3-frames")
);

// Start from a frame where tool execution is already visible.
const startSeconds = Number(argValue("--start") || 8);
const durationSeconds = Number(argValue("--duration") || 20);

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed during: ${label}`);
  }
}

function hasCommand(name, args = ["--version"]) {
  const probe = spawnSync(name, args, { stdio: "ignore" });
  return probe.status === 0;
}

function ensureFfmpeg() {
  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (probe.status !== 0) {
    throw new Error("ffmpeg is required but not available in PATH");
  }
}

function formatSize(path) {
  const bytes = statSync(path).size;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

if (!existsSync(input)) {
  console.error(`Missing input video: ${input}`);
  process.exit(1);
}

ensureFfmpeg();
mkdirSync(dirname(outputVideo), { recursive: true });
mkdirSync(dirname(outputPoster), { recursive: true });
mkdirSync(dirname(outputGif), { recursive: true });

const verticalComposite =
  "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:10[bg];" +
  "[0:v]scale=1040:-2:force_original_aspect_ratio=decrease[fg];" +
  "[bg][fg]overlay=(W-w)/2:(H-h)/2[vout]";

run("Build 9:16 mobile clip", [
  "-y",
  "-ss",
  String(startSeconds),
  "-t",
  String(durationSeconds),
  "-i",
  input,
  "-filter_complex",
  verticalComposite,
  "-map",
  "[vout]",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "20",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  "-an",
  outputVideo,
]);

run("Build mobile poster", [
  "-y",
  "-ss",
  String(startSeconds + 2),
  "-i",
  input,
  "-vframes",
  "1",
  "-update",
  "1",
  "-filter_complex",
  verticalComposite,
  "-map",
  "[vout]",
  outputPoster,
]);

if (hasArg("--gif")) {
  if (hasCommand("gifski")) {
    console.log("\n▶ Build optional mobile GIF preview (gifski)");
    const gifResult = spawnSync(
      "gifski",
      ["--fps", "12", "--width", "540", "--quality", "88", "--output", outputGif, outputVideo],
      { stdio: "inherit" }
    );
    if (gifResult.status !== 0) {
      throw new Error("gifski failed while building optional mobile GIF preview");
    }
  } else {
    run("Build optional mobile GIF preview (ffmpeg fallback)", [
      "-y",
      "-i",
      outputVideo,
      "-vf",
      "fps=12,scale=540:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a",
      outputGif,
    ]);
  }
}

if (hasArg("--validate-first3")) {
  mkdirSync(validationDir, { recursive: true });
  for (let second = 0; second < 3; second += 1) {
    run(`Capture validation frame @ +${second}s`, [
      "-y",
      "-ss",
      String(second),
      "-i",
      outputVideo,
      "-frames:v",
      "1",
      "-update",
      "1",
      join(validationDir, `frame-${second}s.png`),
    ]);
  }
}

console.log("\n✅ Mobile demo artifacts ready");
console.log(`- Video:  ${outputVideo} (${formatSize(outputVideo)})`);
console.log(`- Poster: ${outputPoster} (${formatSize(outputPoster)})`);
if (hasArg("--gif") && existsSync(outputGif)) {
  console.log(`- GIF:    ${outputGif} (${formatSize(outputGif)})`);
}
if (hasArg("--validate-first3")) {
  console.log(`- Validation frames: ${validationDir}`);
}

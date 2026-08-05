#!/usr/bin/env node

import { readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(ROOT, "docs", "assets", "manifest.json");
const CHECK = process.argv.includes("--check");

const ASSETS = [
  ["proof-desktop-mp4", "docs/videos/slack-mcp-proof-42s.mp4", "primary-proof"],
  ["proof-desktop-webm", "docs/videos/slack-mcp-proof-42s.webm", "primary-proof-fallback"],
  ["proof-vertical-mp4", "docs/videos/slack-mcp-proof-20s-vertical.mp4", "mobile-proof"],
  ["proof-desktop-captions", "docs/videos/slack-mcp-proof-42s.vtt", "primary-proof-captions"],
  ["proof-vertical-captions", "docs/videos/slack-mcp-proof-20s-vertical.vtt", "mobile-proof-captions"],
  ["full-demo-mp4", "docs/videos/demo-slack-mcp.mp4", "full-walkthrough"],
  ["full-demo-webm", "docs/videos/demo-slack-mcp.webm", "full-walkthrough-fallback"],
  ["full-demo-hq", "docs/videos/demo-slack-mcp-hq.mp4", "full-walkthrough-master"],
  ["proof-poster", "docs/images/demo-poster.png", "readme-poster"],
  ["social-preview", "docs/images/social-preview-v3.png", "social-preview"],
  ["access-path-diagram", "docs/images/diagram-oauth-comparison.svg", "readme-diagram"],
];

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function hasFfprobe() {
  return spawnSync("ffprobe", ["-version"], { encoding: "utf8" }).status === 0;
}

function videoMetadata(path) {
  const result = spawnSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,codec_name,r_frame_rate:format=duration,bit_rate",
    "-of", "json", path,
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`ffprobe failed for ${path}: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  const stream = parsed.streams?.[0] || {};
  const [numerator, denominator] = String(stream.r_frame_rate || "0/1").split("/").map(Number);
  return {
    width: stream.width,
    height: stream.height,
    duration_s: Number(Number(parsed.format?.duration || 0).toFixed(2)),
    fps: Number((numerator / denominator).toFixed(2)),
    codec: stream.codec_name,
    bitrate_kbps: parsed.format?.bit_rate ? Math.round(Number(parsed.format.bit_rate) / 1000) : null,
  };
}

function pngMetadata(path) {
  const buffer = readFileSync(path);
  if (buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error(`Not a PNG: ${path}`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function svgMetadata(path) {
  const source = readFileSync(path, "utf8");
  const width = Number(source.match(/<svg[^>]*\bwidth="([\d.]+)"/)?.[1]);
  const height = Number(source.match(/<svg[^>]*\bheight="([\d.]+)"/)?.[1]);
  return { width, height };
}

function vttMetadata(path) {
  const source = readFileSync(path, "utf8");
  if (!source.startsWith("WEBVTT")) throw new Error(`Not a WebVTT file: ${path}`);
  return { cues: (source.match(/ --> /g) || []).length };
}

function buildManifest() {
  return {
    schema_version: 1,
    source: "scripts/media-manifest.js",
    assets: ASSETS.map(([id, relativePath, role]) => {
      const absolutePath = resolve(ROOT, relativePath);
      const extension = extname(relativePath).slice(1);
      const metadata = extension === "mp4" || extension === "webm"
        ? videoMetadata(absolutePath)
        : extension === "png"
          ? pngMetadata(absolutePath)
          : extension === "svg"
            ? svgMetadata(absolutePath)
            : vttMetadata(absolutePath);
      return {
        id,
        path: relativePath,
        role,
        format: extension,
        size_bytes: statSync(absolutePath).size,
        sha256: sha256(absolutePath),
        ...metadata,
      };
    }),
  };
}

// Byte-level verification that needs no external binaries. The stored ffprobe
// metadata was derived from these exact bytes at write time, so a sha256 match
// pins it transitively — a CI runner without ffmpeg can still prove integrity.
function checkBytes() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const entries = new Map((manifest.assets || []).map((asset) => [asset.path, asset]));
  const failures = [];
  for (const [id, relativePath] of ASSETS) {
    const entry = entries.get(relativePath);
    if (!entry) { failures.push(`${relativePath}: missing from manifest`); continue; }
    entries.delete(relativePath);
    if (entry.id !== id) failures.push(`${relativePath}: id drift (${entry.id} != ${id})`);
    const absolutePath = resolve(ROOT, relativePath);
    let size, digest;
    try {
      size = statSync(absolutePath).size;
      digest = sha256(absolutePath);
    } catch {
      failures.push(`${relativePath}: file missing from checkout`);
      continue;
    }
    if (entry.size_bytes !== size) failures.push(`${relativePath}: size drift (${entry.size_bytes} != ${size})`);
    if (entry.sha256 !== digest) failures.push(`${relativePath}: sha256 drift`);
  }
  for (const stale of entries.keys()) failures.push(`${stale}: in manifest but not in the asset list`);
  return failures;
}

if (CHECK) {
  if (hasFfprobe()) {
    const expected = `${JSON.stringify(buildManifest(), null, 2)}\n`;
    const current = readFileSync(MANIFEST_PATH, "utf8");
    if (current !== expected) {
      console.error("Media manifest drift detected. Run npm run build:media-manifest.");
      process.exit(1);
    }
    console.log("Media manifest matches the current assets.");
  } else {
    const failures = checkBytes();
    if (failures.length > 0) {
      console.error(`Media manifest drift detected:\n${failures.map((line) => `  - ${line}`).join("\n")}`);
      process.exit(1);
    }
    console.log("Media manifest bytes verified (ffprobe unavailable; metadata pinned by sha256).");
  }
} else {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(buildManifest(), null, 2)}\n`, "utf8");
  console.log(`Wrote ${MANIFEST_PATH}`);
}

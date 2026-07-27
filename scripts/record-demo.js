#!/usr/bin/env node
/**
 * Demo video recording script using Playwright
 * Records the Claude Desktop demo in fullscreen mode with auto-play
 *
 * Usage: npm run record-demo
 * Output: docs/videos/demo-slack-mcp.webm
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, copyFileSync, statSync, readdirSync, unlinkSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const argv = process.argv.slice(2);
const hasArg = (flag) => argv.includes(flag);
const argValue = (flag) => {
  const idx = argv.indexOf(flag);
  return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : null;
};

const pngSequenceMode = hasArg('--png-sequence');

const CONFIG = {
  viewport: pngSequenceMode ? { width: 2560, height: 1600 } : { width: 1280, height: 800 },
  speed: '0.5',
  maxDemoTimeout: 600000, // 10 min safety net
};

const canonicalOutput = argValue('--out') || join(projectRoot, 'docs', 'videos', 'demo-slack-mcp.webm');
const archiveOutput = hasArg('--archive');

async function recordDemo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Slack MCP Server — Demo Video Recording                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  const videosDir = join(projectRoot, 'docs', 'videos');
  if (!existsSync(videosDir)) {
    mkdirSync(videosDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const timestampedOutput = join(videosDir, `demo-slack-mcp-${timestamp}.webm`);

  const framesDir = join(videosDir, 'frames');
  if (pngSequenceMode) {
    mkdirSync(framesDir, { recursive: true });
    console.log(`📸 PNG sequence mode: ${CONFIG.viewport.width}x${CONFIG.viewport.height} (2x Retina)`);
  }

  console.log('🚀 Launching browser...');
  // PLAYWRIGHT_CHROMIUM_EXECUTABLE: point at a system Chromium when the
  // Playwright-managed download isn't available (CI images, sandboxes).
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
  const browser = await chromium.launch({ headless: true, executablePath });
  const contextOpts = {
    viewport: CONFIG.viewport,
    colorScheme: 'dark',
    ...(pngSequenceMode ? { deviceScaleFactor: 2 } : { recordVideo: { dir: videosDir, size: CONFIG.viewport } }),
  };
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  // ── Load page ────────────────────────────────────────────────
  // ?noauto prevents DOMContentLoaded from starting a scenario
  // (which sets isRunning=true and silently blocks autoPlayAll)
  const demoPath = join(projectRoot, 'public', 'demo-slack-mcp.html');
  console.log(`📄 Loading: ${demoPath}`);
  await page.goto(`file://${demoPath}?noauto`);
  await page.waitForTimeout(1000);

  // ── Set speed ────────────────────────────────────────────────
  console.log(`⏱️  Speed: ${CONFIG.speed}x`);
  await page.selectOption('#speedSelect', CONFIG.speed);
  await page.waitForTimeout(300);

  // ── Start auto-play, then enter fullscreen ───────────────────
  // Click the button BEFORE fullscreen (it's hidden in fullscreen).
  // The title card immediately covers the window, so the fullscreen
  // resize is invisible — just a dark bg expanding.
  console.log('▶️  Starting auto-play...');
  await page.click('#autoPlayBtn');
  await page.waitForTimeout(500);

  console.log('🖥️  Entering fullscreen...');
  await page.keyboard.press('f');
  await page.waitForTimeout(300);

  // ── Watch the demo via DOM state ─────────────────────────────

  console.log('📺 Waiting for title card...');
  await page.waitForFunction(
    () => {
      const el = document.getElementById('titleCard');
      return el && el.classList.contains('visible');
    },
    null,
    { timeout: 15000 },
  );
  console.log('   Title card visible.');

  await page.waitForFunction(
    () => {
      const el = document.getElementById('titleCard');
      return el && !el.classList.contains('visible');
    },
    null,
    { timeout: 60000 },
  );
  console.log('▶️  Scenarios running...');
  console.log();

  // Frame capture loop (--png-sequence mode only)
  // Sequential: await each screenshot before starting the next.
  // setInterval doesn't work — screenshots take ~100-200ms at 2x DPI,
  // so 33ms intervals cause overlapping captures that pile up.
  //
  // Each frame records its wall-clock timestamp. Capture rate is whatever
  // the machine manages (~6-15fps); stitching uses the real durations, so
  // the output plays at true speed instead of time-compressing the demo.
  // JPEG q95 at 2x is used instead of PNG: ~3x faster capture (higher
  // effective fps), and after lanczos downscale + x264 the difference is
  // invisible.
  let frameCount = 0;
  let captureRunning = false;
  const frameTimes = [];
  if (pngSequenceMode) {
    captureRunning = true;
    (async () => {
      while (captureRunning) {
        try {
          const framePath = join(framesDir, `frame-${String(frameCount).padStart(5, '0')}.jpg`);
          await page.screenshot({ path: framePath, type: 'jpeg', quality: 95 });
          frameTimes.push(Date.now());
          frameCount++;
        } catch (_) { break; } // page closing
      }
    })(); // fire-and-forget — runs concurrently with DOM watchers below
  }

  // Poll scenario progress for console output
  const scenarios = ['triage', 'search', 'thread', 'respond', 'people', 'react', 'export'];
  let lastScenario = null;
  const poller = setInterval(async () => {
    try {
      const current = await page.evaluate(() => window.currentScenario);
      if (current && current !== lastScenario) {
        const idx = scenarios.indexOf(current);
        console.log(`  📍 ${idx + 1}/7: ${current}`);
        lastScenario = current;
      }
    } catch (_) { /* page closing */ }
  }, 2000);

  // Wait for closing card
  await page.waitForFunction(
    () => {
      const el = document.getElementById('closingCard');
      return el && el.classList.contains('visible');
    },
    null,
    { timeout: CONFIG.maxDemoTimeout },
  );
  clearInterval(poller);
  console.log();
  console.log('🎬 Closing card visible.');

  // Wait for closing card to fade out — keep capturing through it so the
  // closing shot actually lands in the recording.
  await page.waitForFunction(
    () => {
      const el = document.getElementById('closingCard');
      return el && !el.classList.contains('visible');
    },
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(600);
  captureRunning = false; // signal frame capture loop to stop
  if (pngSequenceMode) console.log(`   Captured ${frameCount} frames`);

  // ── Save video ──────────────────────────────────────────────
  const mp4Output = canonicalOutput.replace(/\.webm$/, '.mp4');
  if (pngSequenceMode) {
    console.log('💾 Stitching frames with FFmpeg (real-time durations)...');
    await context.close();
    await browser.close();

    // ffconcat with per-frame durations from the capture timestamps, so
    // playback speed matches the live demo regardless of capture fps.
    const concatLines = ['ffconcat version 1.0'];
    for (let i = 0; i < frameCount; i++) {
      const next = i + 1 < frameCount ? frameTimes[i + 1] : frameTimes[i] + 500;
      concatLines.push(`file 'frame-${String(i).padStart(5, '0')}.jpg'`);
      concatLines.push(`duration ${((next - frameTimes[i]) / 1000).toFixed(4)}`);
    }
    const concatPath = join(framesDir, 'frames.ffconcat');
    writeFileSync(concatPath, concatLines.join('\n') + '\n');

    // fps=30 resamples the variable-duration frames to constant 30fps
    // (duplicated frames cost ~nothing in x264/vp9).
    // Retina frames are captured at 2560x1600 (deviceScaleFactor 2); downscale
    // to 1920x1200 (16:10) — keeps the detail the old 1280x800 threw away.
    const FILTERS = 'scale=1920:1200:flags=lanczos,fps=30';
    const encode = (label, args, out) => {
      const r = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatPath, ...args, out], { stdio: 'inherit' });
      if (r.status === 0) {
        console.log(`   ${label}: ${(statSync(out).size / 1048576).toFixed(1)} MB`);
        return true;
      }
      console.warn(`   ⚠️  ${label} encode failed`);
      return false;
    };

    const hqOutput = canonicalOutput.replace(/\.webm$/, '-hq.mp4');
    encode('HQ MP4 (crf 16)', ['-vf', FILTERS, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'], hqOutput);
    encode('MP4 (crf 18)', ['-vf', FILTERS, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'], mp4Output);
    encode('WebM (vp9 crf 32)', ['-vf', FILTERS, '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1', '-cpu-used', '4', '-pix_fmt', 'yuv420p'], canonicalOutput);

    // Clean up frames
    console.log('🧹 Cleaning up frames...');
    rmSync(framesDir, { recursive: true, force: true });
  } else {
    console.log('💾 Saving video...');
    const video = await page.video();
    await context.close();
    await browser.close();

    const videoPath = await video.path();
    copyFileSync(videoPath, canonicalOutput);

    // ── Encode H.264 MP4 from WebM ────────────────────────────
    // Playwright records VP8 WebM (~9MB). Re-encode to H.264 MP4
    // for universal browser support and ~85% smaller file size.
    const ffprobe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    if (ffprobe.status === 0) {
      console.log('🎞️  Encoding H.264 MP4...');
      const enc = spawnSync('ffmpeg', [
        '-y', '-i', canonicalOutput,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        mp4Output,
      ], { stdio: 'inherit' });
      if (enc.status === 0) {
        const webmSize = (statSync(canonicalOutput).size / 1048576).toFixed(1);
        const mp4Size = (statSync(mp4Output).size / 1048576).toFixed(1);
        console.log(`   WebM: ${webmSize} MB → MP4: ${mp4Size} MB`);
      } else {
        console.warn('   ⚠️  H.264 encode failed — WebM still available');
      }
    } else {
      console.log('ℹ️  FFmpeg not found — skipping H.264 encode (WebM only)');
    }
  }

  console.log();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ Recording Complete                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`📹 Video: ${canonicalOutput}`);
  if (existsSync(mp4Output)) console.log(`📹 MP4:   ${mp4Output}`);
  if (archiveOutput && existsSync(canonicalOutput)) {
    copyFileSync(canonicalOutput, timestampedOutput);
    console.log(`🗂️  Archive: ${timestampedOutput}`);
  }
}

recordDemo().catch(err => {
  console.error('❌ Recording failed:', err.message);
  process.exit(1);
});

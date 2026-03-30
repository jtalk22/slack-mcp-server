#!/usr/bin/env node
/**
 * Demo video recording script using Playwright
 * Records the Claude Desktop demo in fullscreen mode with auto-play
 *
 * Usage: npm run record-demo
 * Output: docs/videos/demo-claude.webm
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const argv = process.argv.slice(2);
const hasArg = (flag) => argv.includes(flag);
const argValue = (flag) => {
  const idx = argv.indexOf(flag);
  return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : null;
};

const CONFIG = {
  viewport: { width: 1280, height: 800 },
  speed: '0.5',
  maxDemoTimeout: 600000, // 10 min safety net
};

const canonicalOutput = argValue('--out') || join(projectRoot, 'docs', 'videos', 'demo-claude.webm');
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
  const timestampedOutput = join(videosDir, `demo-claude-${timestamp}.webm`);

  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    recordVideo: { dir: videosDir, size: CONFIG.viewport },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // ── Load page ────────────────────────────────────────────────
  // ?noauto prevents DOMContentLoaded from starting a scenario
  // (which sets isRunning=true and silently blocks autoPlayAll)
  const demoPath = join(projectRoot, 'public', 'demo-claude.html');
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
    { timeout: 15000 },
  );
  console.log('   Title card visible.');

  await page.waitForFunction(
    () => {
      const el = document.getElementById('titleCard');
      return el && !el.classList.contains('visible');
    },
    { timeout: 60000 },
  );
  console.log('▶️  Scenarios running...');
  console.log();

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
    { timeout: CONFIG.maxDemoTimeout },
  );
  clearInterval(poller);
  console.log();
  console.log('🎬 Closing card visible.');

  // Wait for closing card to fade out
  await page.waitForFunction(
    () => {
      const el = document.getElementById('closingCard');
      return el && !el.classList.contains('visible');
    },
    { timeout: 60000 },
  );
  await page.waitForTimeout(600);

  // ── Save video ──────────────────────────────────────────────
  console.log('💾 Saving video...');
  const video = await page.video();
  await context.close();
  await browser.close();

  const videoPath = await video.path();
  copyFileSync(videoPath, canonicalOutput);

  console.log();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ Recording Complete                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`📹 Video: ${canonicalOutput}`);
  if (archiveOutput) {
    copyFileSync(videoPath, timestampedOutput);
    console.log(`🗂️  Archive: ${timestampedOutput}`);
  }
  console.log();
  console.log('Next steps:');
  console.log('  1. Review in a media player');
  console.log('  2. Optional GIF:');
  console.log(`     ffmpeg -y -i "${canonicalOutput}" -vf "fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" docs/images/demo-claude.gif`);
}

recordDemo().catch(err => {
  console.error('❌ Recording failed:', err.message);
  process.exit(1);
});

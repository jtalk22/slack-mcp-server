#!/usr/bin/env node
/**
 * Demo video recording script using Playwright
 * Records the Claude Desktop demo in fullscreen mode with auto-play
 *
 * Usage: npm run record-demo
 * Output: docs/videos/demo-claude-TIMESTAMP.webm
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

// Configuration
const CONFIG = {
  viewport: { width: 1280, height: 800 },
  speed: '0.5', // Slow speed for video recording
  scenarioCount: 7,
  initialHold: 500,
  // Title and closing card durations (ms)
  introDuration: 5000,   // Title card (narrative title card needs more time)
  outroDuration: 5500,   // Closing card (4s visible + fades)
  // Approximate duration per scenario at 0.5x speed (in ms)
  scenarioDurations: {
    triage: 32000,   // ~32s (multi-tool, rich data)
    search: 24000,   // ~24s
    thread: 26000,   // ~26s
    respond: 30000,  // ~30s (multi-tool: read + write)
    people: 26000,   // ~26s (multi-tool: search + info)
    react: 20000,    // ~20s (multi-tool but quick results)
    export: 22000    // ~22s
  }
};

const canonicalOutput = argValue('--out') || join(projectRoot, 'docs', 'videos', 'demo-claude.webm');
const archiveOutput = hasArg('--archive');

async function recordDemo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Slack MCP Server - Demo Video Recording                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  // Ensure videos directory exists
  const videosDir = join(projectRoot, 'docs', 'videos');
  if (!existsSync(videosDir)) {
    mkdirSync(videosDir, { recursive: true });
    console.log(`📁 Created directory: ${videosDir}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const timestampedOutput = join(videosDir, `demo-claude-${timestamp}.webm`);

  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    recordVideo: {
      dir: videosDir,
      size: CONFIG.viewport
    },
    colorScheme: 'dark'
  });

  const page = await context.newPage();

  // Load the demo
  const demoPath = join(projectRoot, 'public', 'demo-claude.html');
  console.log(`📄 Loading: ${demoPath}`);
  await page.goto(`file://${demoPath}`);
  await page.waitForTimeout(1000);

  // Keep first frame brief so autoplay reaches full-screen flow quickly.
  console.log(`⏸️  Holding initial frame (${CONFIG.initialHold}ms)...`);
  await page.waitForTimeout(CONFIG.initialHold);

  // Set slow speed for video recording
  console.log(`⏱️  Setting speed to ${CONFIG.speed}x...`);
  await page.selectOption('#speedSelect', CONFIG.speed);
  await page.waitForTimeout(300);

  // Start auto-play BEFORE entering fullscreen (button hidden in fullscreen)
  console.log('▶️  Starting auto-play...');
  await page.click('#autoPlayBtn');
  await page.waitForTimeout(500);

  // Now enter fullscreen mode
  console.log('🖥️  Entering fullscreen mode...');
  console.log();
  await page.keyboard.press('f');
  await page.waitForTimeout(500);

  // Wait for title card
  console.log('📺 Showing title card...');
  await page.waitForTimeout(CONFIG.introDuration);

  // Wait for each scenario
  const scenarios = ['triage', 'search', 'thread', 'respond', 'people', 'react', 'export'];
  let totalWait = 0;

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const duration = CONFIG.scenarioDurations[scenario];
    totalWait += duration;

    console.log(`  📍 Scenario ${i + 1}/${scenarios.length}: ${scenario} (${Math.round(duration/1000)}s)`);
    await page.waitForTimeout(duration);
  }

  // Wait for closing card
  console.log();
  console.log('🎬 Showing closing screen...');
  await page.waitForTimeout(CONFIG.outroDuration);

  // Exit fullscreen
  console.log('🔚 Exiting fullscreen...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Close context to flush video
  console.log('💾 Saving video...');
  const video = await page.video();
  await context.close();
  await browser.close();

  // Get the actual video path
  const videoPath = await video.path();

  console.log();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ Recording Complete!                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  copyFileSync(videoPath, canonicalOutput);
  console.log(`📹 Canonical video: ${canonicalOutput}`);
  if (archiveOutput) {
    copyFileSync(videoPath, timestampedOutput);
    console.log(`🗂️  Archived copy: ${timestampedOutput}`);
  }
  console.log();
  console.log('Next steps:');
  console.log('  1. Review the canonical video in a media player');
  console.log('  2. Convert to GIF with FFmpeg:');
  console.log(`     ffmpeg -i "${canonicalOutput}" -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" docs/images/demo-claude.gif`);
  console.log('  3. Re-run with --archive to keep timestamped historical outputs');
}

recordDemo().catch(err => {
  console.error('❌ Recording failed:', err.message);
  process.exit(1);
});

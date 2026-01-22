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
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const CONFIG = {
  viewport: { width: 1280, height: 800 },
  speed: '0.5', // Slow speed for video recording
  scenarioCount: 5,
  // Title and closing card durations (ms)
  introDuration: 4000,   // Title card (3s visible + fade)
  outroDuration: 5500,   // Closing card (4s visible + fades)
  // Approximate duration per scenario at 0.5x speed (in ms)
  scenarioDurations: {
    search: 26000,   // +1s for transition fade
    thread: 26000,
    list: 21000,
    send: 19000,
    multi: 36000
  }
};

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

  // Generate timestamped filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const videoFilename = `demo-claude-${timestamp}.webm`;

  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({
    headless: false, // Need visible browser for recording
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
  const scenarios = ['search', 'thread', 'list', 'send', 'multi'];
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
  console.log(`📹 Video saved: ${videoPath}`);
  console.log();
  console.log('Next steps:');
  console.log('  1. Review the video in a media player');
  console.log('  2. Convert to GIF: npm run gif (requires gifski)');
  console.log('  3. Or with FFmpeg:');
  console.log(`     ffmpeg -i "${videoPath}" -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" docs/images/demo-claude.gif`);
}

recordDemo().catch(err => {
  console.error('❌ Recording failed:', err.message);
  process.exit(1);
});

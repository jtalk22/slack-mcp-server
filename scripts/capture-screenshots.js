#!/usr/bin/env node
/**
 * Screenshot capture script using Playwright
 * Captures polished screenshots of the demo UI for README/docs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function captureScreenshots() {
  console.log('Launching browser...');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2, // Retina quality
    colorScheme: 'dark'
  });

  const page = await context.newPage();

  // Load the demo.html file directly
  const demoPath = join(projectRoot, 'public', 'demo.html');
  const demoHtml = readFileSync(demoPath, 'utf-8');

  // Serve it as a data URL or file URL
  await page.goto(`file://${demoPath}`);

  // Wait for content to render
  await page.waitForTimeout(1000);

  const imagesDir = join(projectRoot, 'docs', 'images');

  // Screenshot 1: Full UI with DMs
  console.log('Capturing main UI screenshot...');
  await page.screenshot({
    path: join(imagesDir, 'demo-main.png'),
    clip: { x: 0, y: 0, width: 1400, height: 800 }
  });

  // Screenshot 2: Conversation view (zoomed)
  console.log('Capturing conversation screenshot...');
  const mainPanel = await page.$('.main-panel');
  if (mainPanel) {
    await mainPanel.screenshot({
      path: join(imagesDir, 'demo-messages.png')
    });
  }

  // Screenshot 3: Sidebar with conversations
  console.log('Capturing sidebar screenshot...');
  const sidebar = await page.$('.sidebar');
  if (sidebar) {
    await sidebar.screenshot({
      path: join(imagesDir, 'demo-sidebar.png')
    });
  }

  // Screenshot 4: Switch to channels view
  console.log('Capturing channels view...');
  await page.click('.tabs button:nth-child(2)'); // Click Channels tab
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(imagesDir, 'demo-channels.png'),
    clip: { x: 0, y: 0, width: 1400, height: 800 }
  });

  // Screenshot 5: Engineering channel messages
  console.log('Capturing channel messages...');
  await page.click('.conversation-item:first-child'); // Click first channel
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(imagesDir, 'demo-channel-messages.png'),
    clip: { x: 0, y: 0, width: 1400, height: 800 }
  });

  await browser.close();

  console.log('\nScreenshots saved to docs/images/');
  console.log('  - demo-main.png');
  console.log('  - demo-messages.png');
  console.log('  - demo-sidebar.png');
  console.log('  - demo-channels.png');
  console.log('  - demo-channel-messages.png');
}

captureScreenshots().catch(console.error);

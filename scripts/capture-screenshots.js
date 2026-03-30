#!/usr/bin/env node
/**
 * Screenshot capture script using Playwright
 * Captures desktop + mobile screenshots for README/docs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const imagesDir = join(projectRoot, 'docs', 'images');

const viewports = [
  { width: 390, height: 844, suffix: '390x844' },
  { width: 360, height: 800, suffix: '360x800' }
];

async function openPage(browser, filePath, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme: 'dark'
  });
  const page = await context.newPage();
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(1000);
  return { context, page };
}

async function captureScreenshots() {
  console.log('Launching browser...');

  const browser = await chromium.launch({
    headless: true
  });

  const demoPath = join(projectRoot, 'public', 'demo.html');
  const demoClaudePath = join(projectRoot, 'public', 'demo-claude.html');
  const indexPath = join(projectRoot, 'public', 'index.html');

  // Desktop captures from demo.html
  {
    const { context, page } = await openPage(browser, demoPath, { width: 1400, height: 900 });

    console.log('Capturing desktop demo screenshots...');
    await page.screenshot({
      path: join(imagesDir, 'demo-main.png'),
      clip: { x: 0, y: 0, width: 1400, height: 800 }
    });

    const mainPanel = await page.$('.main-panel');
    if (mainPanel) {
      await mainPanel.screenshot({
        path: join(imagesDir, 'demo-messages.png')
      });
    }

    const sidebar = await page.$('.sidebar');
    if (sidebar) {
      await sidebar.screenshot({
        path: join(imagesDir, 'demo-sidebar.png')
      });
    }

    await page.evaluate(() => runScenario('listChannels'));
    await page.waitForTimeout(2600);
    await page.screenshot({
      path: join(imagesDir, 'demo-channels.png'),
      clip: { x: 0, y: 0, width: 1400, height: 800 }
    });

    await page.click('.conversation-item:first-child');
    await page.waitForTimeout(600);
    await page.screenshot({
      path: join(imagesDir, 'demo-channel-messages.png'),
      clip: { x: 0, y: 0, width: 1400, height: 800 }
    });

    await context.close();
  }

  // Poster from the Claude demo — capture the title card in fullscreen
  // "It's Monday, 9:07 AM. 47 unreads. A database outage. A jammed printer."
  // Fullscreen gives a clean frame — title card fills the viewport, no chrome.
  {
    const { context, page } = await openPage(browser, `${demoClaudePath}?noauto`, { width: 1280, height: 800 });
    console.log('Capturing poster image (title card, fullscreen)...');
    await page.keyboard.press('f');
    await page.waitForTimeout(300);
    await page.evaluate(() => { autoPlayAll(); });
    await page.waitForFunction(
      () => document.getElementById('titleCard')?.classList.contains('visible'),
      null,
      { timeout: 10000 },
    );
    await page.waitForTimeout(3500);
    await page.screenshot({
      path: join(imagesDir, 'demo-poster.png'),
      clip: { x: 0, y: 0, width: 1280, height: 800 }
    });
    await context.close();
  }

  // Mobile captures for web, demo, and claude demo pages
  for (const viewport of viewports) {
    const label = `${viewport.width}x${viewport.height}`;
    console.log(`Capturing mobile screenshots (${label})...`);

    {
      const { context, page } = await openPage(browser, demoPath, viewport);
      await page.screenshot({
        path: join(imagesDir, `demo-main-mobile-${viewport.suffix}.png`),
        fullPage: true
      });
      await context.close();
    }

    {
      const { context, page } = await openPage(browser, demoClaudePath, viewport);
      await page.screenshot({
        path: join(imagesDir, `demo-claude-mobile-${viewport.suffix}.png`),
        fullPage: true
      });
      await context.close();
    }

    {
      const { context, page } = await openPage(browser, indexPath, viewport);
      await page.screenshot({
        path: join(imagesDir, `web-api-mobile-${viewport.suffix}.png`),
        fullPage: true
      });
      await context.close();
    }
  }

  await browser.close();

  console.log('\nScreenshots saved to docs/images/');
  console.log('  - demo-main.png');
  console.log('  - demo-messages.png');
  console.log('  - demo-sidebar.png');
  console.log('  - demo-channels.png');
  console.log('  - demo-channel-messages.png');
  console.log('  - demo-poster.png');
  console.log('  - demo-main-mobile-390x844.png');
  console.log('  - demo-main-mobile-360x800.png');
  console.log('  - demo-claude-mobile-390x844.png');
  console.log('  - demo-claude-mobile-360x800.png');
  console.log('  - web-api-mobile-390x844.png');
  console.log('  - web-api-mobile-360x800.png');
}

captureScreenshots().catch(console.error);

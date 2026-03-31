#!/usr/bin/env node
/**
 * Screenshot capture script using Playwright
 * Captures desktop + mobile screenshots for README/docs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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
  // Speed is set to 0.5x so the title card stays visible for 6 real seconds
  // (stagger animations complete at ~3.3s, screenshot at 4s, card gone at 6s).
  {
    const { context, page } = await openPage(browser, `${demoClaudePath}?noauto`, { width: 1280, height: 800 });
    console.log('Capturing poster image (title card, fullscreen)...');
    await page.keyboard.press('f');
    await page.waitForTimeout(300);
    await page.evaluate(() => updateSpeed('0.5'));
    await page.evaluate(() => { autoPlayAll(); });
    await page.waitForFunction(
      () => document.getElementById('titleCard')?.classList.contains('visible'),
      null,
      { timeout: 10000 },
    );
    // Stagger animations: CSS delays 0.2s-2.8s + 0.5s duration = done by 3.3s
    // Title card at 0.5x: sleep(3000)/0.5 = visible for 6 real seconds
    // Capture at 4s: all text visible, card still has 2s before disappearing
    await page.waitForTimeout(4000);
    await page.screenshot({
      path: join(imagesDir, 'demo-poster.png'),
      clip: { x: 0, y: 0, width: 1280, height: 800 }
    });
    await context.close();
  }

  // Composite a play-button overlay onto the poster so README viewers
  // know it's a clickable video link, not just a static screenshot.
  {
    const posterPath = join(imagesDir, 'demo-poster.png');
    const posterB64 = readFileSync(posterPath).toString('base64');
    const overlayHTML = `
      <html><body style="margin:0;padding:0;width:1280px;height:800px;position:relative">
        <img src="data:image/png;base64,${posterB64}" style="width:1280px;height:800px;display:block">
        <div style="position:absolute;bottom:28px;left:28px">
          <div style="width:48px;height:48px;background:rgba(218,119,86,0.55);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3)">
            <div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 16px;border-color:transparent transparent transparent rgba(255,255,255,0.9);margin-left:2px"></div>
          </div>
        </div>
      </body></html>`;
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pg2 = await ctx2.newPage();
    await pg2.setContent(overlayHTML, { waitUntil: 'load' });
    await pg2.screenshot({ path: posterPath, clip: { x: 0, y: 0, width: 1280, height: 800 } });
    await ctx2.close();
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

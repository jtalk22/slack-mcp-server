#!/usr/bin/env node

import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const hasFlag = (flag) => argv.includes(flag);
const argValue = (flag) => {
  const idx = argv.indexOf(flag);
  return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : null;
};

const repo = argValue("--repo") || "jtalk22/slack-mcp-server";
const imagePath = resolve(
  argValue("--image") || "docs/images/social-preview-v3.png"
);
const headed = hasFlag("--headed");
const loginTimeoutMs = Number(argValue("--login-timeout-ms") || 10 * 60 * 1000);
const settingsUrl = `https://github.com/${repo}/settings`;

if (!existsSync(imagePath)) {
  console.error(`Missing image: ${imagePath}`);
  process.exit(1);
}

console.log(`Repo: ${repo}`);
console.log(`Image: ${imagePath}`);
console.log(`Opening: ${settingsUrl}`);

const browser = await chromium.launch({
  channel: "chrome",
  headless: !headed,
});

const context = await browser.newContext();
const page = await context.newPage();

const waitForAuthenticatedSettings = async () => {
  const started = Date.now();
  while (Date.now() - started < loginTimeoutMs) {
    const url = page.url();
    const title = await page.title().catch(() => "");
    const onSettings = url.includes(`/${repo}/settings`) && !title.includes("Page not found");
    if (onSettings) return;
    await page.waitForTimeout(1200);
  }
  throw new Error(
    `Timed out waiting for authenticated settings page after ${loginTimeoutMs}ms`
  );
};

try {
  await page.goto(settingsUrl, { waitUntil: "domcontentloaded", timeout: 120000 });

  const initialTitle = await page.title().catch(() => "");
  if (initialTitle.includes("Page not found") || page.url().includes("/login")) {
    console.log("GitHub settings not authenticated in this browser context.");
    console.log("Please sign in in the opened browser window, then keep this process running.");
    await waitForAuthenticatedSettings();
  }

  // Ensure the settings page is fully loaded before interacting.
  await page.waitForLoadState("networkidle", { timeout: 120000 });

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.waitFor({ timeout: 60000 });
  await fileInput.setInputFiles(imagePath);

  // GitHub UI labels can vary; try likely save/update actions.
  const saveCandidates = [
    'button:has-text("Update social preview")',
    'button:has-text("Update social image")',
    'button:has-text("Save changes")',
    'button:has-text("Upload")',
  ];

  let clicked = false;
  for (const selector of saveCandidates) {
    const button = page.locator(selector).first();
    if (await button.count()) {
      try {
        await button.click({ timeout: 5000 });
        clicked = true;
        break;
      } catch {
        // Keep trying other candidates.
      }
    }
  }

  if (!clicked) {
    console.log(
      "Uploaded image file to input; could not confidently click a save button automatically."
    );
    console.log("Complete the final click in the open browser if needed.");
  } else {
    await page.waitForTimeout(2500);
    console.log("Social preview update action submitted.");
  }

  console.log("Done.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}

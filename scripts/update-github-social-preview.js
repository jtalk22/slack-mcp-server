#!/usr/bin/env node

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

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
const profileDir = resolve(
  argValue("--profile-dir") || ".cache/playwright/github-social-preview"
);
const evidencePath = resolve(
  argValue("--evidence") || "output/release-health/social-preview-settings.png"
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
console.log(`Profile: ${profileDir}`);
console.log(`Opening: ${settingsUrl}`);

mkdirSync(profileDir, { recursive: true });
mkdirSync(dirname(evidencePath), { recursive: true });

const context = await chromium.launchPersistentContext(profileDir, {
  channel: "chrome",
  headless: !headed,
  viewport: { width: 1440, height: 1100 },
});
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

  // GitHub settings pages often keep long-lived background requests, so
  // networkidle can hang even when UI is interactive.
  await page.waitForLoadState("domcontentloaded", { timeout: 120000 });

  const socialHeading = page.getByText("Social preview", { exact: true }).first();
  await socialHeading.waitFor({ timeout: 120000 });
  await socialHeading.scrollIntoViewIfNeeded();

  // In current GitHub settings, upload is often behind an Edit button.
  const editButtons = page.getByRole("button", { name: /^Edit$/i });
  const editCount = await editButtons.count();
  if (editCount > 0) {
    for (let i = 0; i < editCount; i += 1) {
      const btn = editButtons.nth(i);
      if (await btn.isVisible()) {
        try {
          await btn.click({ timeout: 3000 });
          break;
        } catch {
          // Try next visible Edit button.
        }
      }
    }
  }

  const fileInput = page.locator('#repo-image-file-input, input[type="file"]').first();
  await fileInput.waitFor({ state: "attached", timeout: 90000 });
  await fileInput.setInputFiles(imagePath);
  await page.waitForTimeout(1500);

  // GitHub UI labels can vary; try likely save/update actions.
  const saveCandidates = [
    /update social preview/i,
    /update social image/i,
    /save changes/i,
    /^save$/i,
    /upload/i,
    /^apply$/i,
    /^done$/i,
  ];

  let clicked = false;
  for (const rx of saveCandidates) {
    const button = page.getByRole("button", { name: rx }).first();
    const count = await button.count();
    if (count > 0) {
      try {
        await button.scrollIntoViewIfNeeded();
        await button.click({ timeout: 5000 });
        clicked = true;
        break;
      } catch {
        // Keep trying other candidates.
      }
    }
  }

  if (!clicked) {
    const visibleButtons = await page
      .locator("button:visible")
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() || "").filter(Boolean))
      .catch(() => []);
    console.log("Visible buttons during upload:", visibleButtons.join(" | "));
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

  await page.screenshot({ path: evidencePath, fullPage: true });
  console.log(`Saved evidence screenshot: ${evidencePath}`);
  console.log("Done.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await context.close();
}

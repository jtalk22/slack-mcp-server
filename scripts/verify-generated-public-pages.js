#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildPublicPages } from "../lib/public-pages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let hasMismatch = false;

for (const [relativePath, generated] of Object.entries(buildPublicPages())) {
  const targetPath = resolve(ROOT, relativePath);
  const current = readFileSync(targetPath, "utf8");
  if (current !== generated) {
    hasMismatch = true;
    console.error(`Generated public page drift detected: ${relativePath}`);
  }
}

if (hasMismatch) {
  console.error("Run `node scripts/generate-public-pages.js` and commit the updated outputs.");
  process.exit(1);
}

console.log("Generated public pages are up to date.");

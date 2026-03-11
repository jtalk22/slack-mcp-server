#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildPublicPages } from "../lib/public-pages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

for (const [relativePath, contents] of Object.entries(buildPublicPages())) {
  const targetPath = resolve(ROOT, relativePath);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, contents, "utf8");
  console.log(`Wrote ${relativePath}`);
}

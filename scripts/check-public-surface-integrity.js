#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_METADATA, RELEASE_VERSION } from "../lib/public-metadata.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPORT_PATH = resolve(ROOT, "output", "release-health", "public-surface-integrity.md");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function semverLiterals(text) {
  return Array.from(text.matchAll(/\bv\d+\.\d+\.\d+\b/g), (match) => match[0]);
}

function runNode(args) {
  const result = spawnSync("node", args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
  });

  return {
    status: result.status ?? 1,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function check(results, name, ok, details) {
  results.push({ name, ok, details });
}

function buildReport(results) {
  const lines = [
    "# Public Surface Integrity",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Release version: ${RELEASE_VERSION}`,
    "",
    "| Check | Status | Details |",
    "|---|---|---|",
  ];

  for (const result of results) {
    lines.push(`| ${result.name} | ${result.ok ? "pass" : "fail"} | ${result.details} |`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const results = [];
  const packageJson = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));
  const serverMeta = JSON.parse(read("server.json"));
  const glamaMeta = JSON.parse(read("glama.json"));

  check(
    results,
    "package.json version",
    packageJson.version === RELEASE_VERSION,
    `expected ${RELEASE_VERSION}, found ${packageJson.version}`
  );
  check(
    results,
    "package-lock root version",
    packageLock.version === RELEASE_VERSION && packageLock.packages?.[""]?.version === RELEASE_VERSION,
    `root=${packageLock.version}, package=${packageLock.packages?.[""]?.version ?? "n/a"}`
  );
  check(
    results,
    "server.json version parity",
    serverMeta.version === RELEASE_VERSION && serverMeta.packages?.[0]?.version === RELEASE_VERSION,
    `root=${serverMeta.version}, package=${serverMeta.packages?.[0]?.version ?? "n/a"}`
  );
  check(
    results,
    "glama version parity",
    glamaMeta.version === RELEASE_VERSION,
    `found ${glamaMeta.version}`
  );
  check(
    results,
    "description parity",
    packageJson.description === PUBLIC_METADATA.canonicalShortDescription &&
      serverMeta.description === PUBLIC_METADATA.canonicalShortDescription &&
      glamaMeta.description === PUBLIC_METADATA.canonicalShortDescription,
    `package=${packageJson.description}; server=${serverMeta.description}; glama=${glamaMeta.description}`
  );
  check(
    results,
    "glama tool count",
    glamaMeta.features?.tools === PUBLIC_METADATA.selfHostedToolCount,
    `expected ${PUBLIC_METADATA.selfHostedToolCount}, found ${glamaMeta.features?.tools ?? "n/a"}`
  );

  const cliVersionResult = runNode(["src/cli.js", "--version"]);
  check(
    results,
    "CLI version output",
    cliVersionResult.status === 0 && cliVersionResult.stdout.includes(`slack-mcp-server v${RELEASE_VERSION}`),
    cliVersionResult.stdout || cliVersionResult.stderr || "no output"
  );

  for (const runtimePath of ["src/server.js", "src/server-http.js", "src/web-server.js", "scripts/setup-wizard.js"]) {
    const source = read(runtimePath);
    check(
      results,
      `${runtimePath} uses release metadata`,
      source.includes("RELEASE_VERSION"),
      "expected RELEASE_VERSION import/usage"
    );
  }

  for (const marketingPath of [
    "index.html",
    "README.md",
    "public/share.html",
    "public/demo.html",
    "public/demo-video.html",
    "public/demo-claude.html",
  ]) {
    const versions = semverLiterals(read(marketingPath));
    check(
      results,
      `${marketingPath} version-neutral`,
      versions.length === 0,
      versions.length === 0 ? "no hard-coded release literal" : versions.join(", ")
    );
  }

  const readme = read("README.md");
  check(
    results,
    "README tool count",
    readme.includes(`${PUBLIC_METADATA.selfHostedToolCount} tools`) &&
      readme.includes("12 read-only") &&
      readme.includes("4 write-path"),
    "README must state tool count and safety annotation breakdown"
  );
  check(
    results,
    "README session auth",
    readme.includes("Session-based auth") || readme.includes("session tokens") || readme.includes("Session tokens"),
    "README should describe session-based authentication approach"
  );

  const docsIndex = read("docs/INDEX.md");
  check(
    results,
    "Docs index core links",
    docsIndex.includes("Setup Guide") &&
      docsIndex.includes("Architecture") &&
      docsIndex.includes("Troubleshooting"),
    "docs/INDEX.md must link core documentation"
  );

  const supportBoundaries = read("docs/SUPPORT-BOUNDARIES.md");
  check(
    results,
    "Support boundaries company-led",
    supportBoundaries.includes("Operated by Revasser") &&
      !supportBoundaries.includes("Maintained by James Lambert"),
    "docs/SUPPORT-BOUNDARIES.md must use company-led support wording"
  );

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, buildReport(results), "utf8");
  console.log(`Wrote ${REPORT_PATH}`);

  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

main();

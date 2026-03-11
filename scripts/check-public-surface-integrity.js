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
    "README cloud claims",
    readme.includes(`${PUBLIC_METADATA.cloudManagedToolCount} standard tools`) &&
      readme.includes(`${PUBLIC_METADATA.cloudManagedToolCount} standard + ${PUBLIC_METADATA.teamAiWorkflowCount} AI compound tools`) &&
      !readme.includes("16 standard tools"),
    "README must describe Cloud as 15 standard tools plus 3 AI compound tools on Team"
  );
  check(
    results,
    "README operator links",
    readme.includes("Release health snapshot") &&
      readme.includes("Version parity report") &&
      readme.includes(PUBLIC_METADATA.cloudDeploymentUrl) &&
      readme.includes(PUBLIC_METADATA.cloudSupportUrl),
    "README should link current release-health, version-parity, deployment, and support surfaces"
  );

  const marketingIndex = read("index.html");
  check(
    results,
    "GitHub Pages distribution snapshot",
    marketingIndex.includes("Current distribution snapshot") &&
      marketingIndex.includes("npm latest") &&
      marketingIndex.includes("GitHub release") &&
      marketingIndex.includes("Cloud status") &&
      marketingIndex.includes(PUBLIC_METADATA.cloudStatusUrl) &&
      !marketingIndex.includes("https://mcp.revasserlabs.com/health") &&
      marketingIndex.includes("Release health"),
    "index.html should expose the live distribution snapshot cards, /status contract, and operator links"
  );
  check(
    results,
    "GitHub Pages cloud routing",
    marketingIndex.includes(PUBLIC_METADATA.cloudDocsUrl) &&
      marketingIndex.includes(PUBLIC_METADATA.cloudDeploymentUrl) &&
      marketingIndex.includes(PUBLIC_METADATA.cloudSupportUrl),
    "index.html should point Cloud routing at hosted docs, deployment, and support"
  );

  const setupGuide = read("docs/SETUP.md");
  check(
    results,
    "Setup guide cloud claims",
    setupGuide.includes(`one URL, ${PUBLIC_METADATA.cloudManagedToolCount} managed tools`) &&
      setupGuide.includes(`${PUBLIC_METADATA.teamAiWorkflowCount} AI workflows`) &&
      !setupGuide.includes("one URL, 16 tools"),
    "docs/SETUP.md must describe the managed Cloud counts"
  );

  const troubleshootingGuide = read("docs/TROUBLESHOOTING.md");
  check(
    results,
    "Troubleshooting cloud claims",
    troubleshootingGuide.includes(`${PUBLIC_METADATA.cloudManagedToolCount} standard managed tools`) &&
      !troubleshootingGuide.includes("standard 16 tools available on all plans"),
    "docs/TROUBLESHOOTING.md must describe the managed Cloud counts"
  );

  const deploymentModes = read("docs/DEPLOYMENT-MODES.md");
  check(
    results,
    "Deployment modes cloud claims",
    deploymentModes.includes(`${PUBLIC_METADATA.cloudManagedToolCount} standard managed tools + ${PUBLIC_METADATA.teamAiWorkflowCount} AI workflows on Team`) &&
      !deploymentModes.includes("16 standard tools + AI compound tools on Team"),
    "docs/DEPLOYMENT-MODES.md must describe the managed Cloud counts"
  );

  const localWebUi = read("public/index.html");
  check(
    results,
    "Local web banner cloud claims",
    localWebUi.includes(`${PUBLIC_METADATA.cloudManagedToolCount} managed tools`) &&
      !localWebUi.includes("gives you 16 tools"),
    "public/index.html banner must describe managed Cloud counts"
  );

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, buildReport(results), "utf8");
  console.log(`Wrote ${REPORT_PATH}`);

  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

main();

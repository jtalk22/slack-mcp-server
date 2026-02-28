#!/usr/bin/env node

import { spawnSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPORT_PATH = process.env.PREPUBLISH_REPORT_PATH
  ? resolve(ROOT, process.env.PREPUBLISH_REPORT_PATH)
  : resolve(ROOT, "output", "release-health", "prepublish-dry-run.md");

const EXPECTED_NAME = process.env.EXPECTED_GIT_NAME || "jtalk22";
const EXPECTED_EMAIL = process.env.EXPECTED_GIT_EMAIL || "james@revasser.nyc";
const OWNER_RANGE = process.env.OWNER_CHECK_RANGE || "origin/main..HEAD";

function run(command, args = [], options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
    ...options
  });
}

function trimOutput(text = "", maxChars = 1200) {
  const normalized = String(text || "").trim();
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}... [truncated]`;
}

function stepResult(name, command, ok, details = "", commandOutput = "") {
  return { name, command, ok, details, commandOutput };
}

function gitIdentityStep() {
  const nameResult = run("git", ["config", "--get", "user.name"]);
  const emailResult = run("git", ["config", "--get", "user.email"]);

  const actualName = nameResult.stdout.trim();
  const actualEmail = emailResult.stdout.trim();
  const ok =
    nameResult.status === 0 &&
    emailResult.status === 0 &&
    actualName === EXPECTED_NAME &&
    actualEmail === EXPECTED_EMAIL;

  const details = ok
    ? `Configured as ${actualName} <${actualEmail}>`
    : `Expected ${EXPECTED_NAME} <${EXPECTED_EMAIL}>, found ${actualName || "(missing)"} <${actualEmail || "(missing)"}>`;

  return stepResult(
    "Git identity",
    "git config --get user.name && git config --get user.email",
    ok,
    details,
    `${nameResult.stdout}${nameResult.stderr}${emailResult.stdout}${emailResult.stderr}`
  );
}

function ownerAttributionStep() {
  const result = run("bash", ["scripts/check-owner-attribution.sh", OWNER_RANGE]);
  return stepResult(
    "Owner attribution",
    `bash scripts/check-owner-attribution.sh ${OWNER_RANGE}`,
    result.status === 0,
    result.status === 0 ? "All commits in range are owner-attributed." : "Owner attribution check failed.",
    `${result.stdout}${result.stderr}`
  );
}

function publicLanguageStep() {
  const result = run("bash", ["scripts/check-public-language.sh"]);
  return stepResult(
    "Public language",
    "bash scripts/check-public-language.sh",
    result.status === 0,
    result.status === 0 ? "Public wording guardrail passed." : "Disallowed wording found.",
    `${result.stdout}${result.stderr}`
  );
}

function markerScanStep() {
  const pattern = "Co-authored-by|co-authored-by|Generated with|generated with";
  const scanPaths = [
    "README.md",
    "docs",
    "public",
    ".github/RELEASE_NOTES_TEMPLATE.md",
    ".github/ISSUE_REPLY_TEMPLATE.md"
  ];
  const result = run("rg", [
    "-n",
    pattern,
    "--glob",
    "!docs/release-health/**",
    "--glob",
    "!output/release-health/**",
    ...scanPaths
  ]);

  if (result.status === 1) {
    return stepResult(
      "Public attribution markers",
      "marker-scan",
      true,
      "No non-owner attribution markers found in public surfaces."
    );
  }

  return stepResult(
    "Public attribution markers",
    "marker-scan",
    false,
    result.status === 0
      ? "Found disallowed markers on public surfaces."
      : "Marker scan failed.",
    `${result.stdout}${result.stderr}`
  );
}

function runNodeStep(name, scriptPath, extraArgs = []) {
  const result = run("node", [scriptPath, ...extraArgs]);
  return stepResult(
    name,
    `node ${scriptPath}${extraArgs.length ? ` ${extraArgs.join(" ")}` : ""}`,
    result.status === 0,
    result.status === 0 ? "Passed." : "Failed.",
    `${result.stdout}${result.stderr}`
  );
}

function npmPackSnapshot() {
  const result = run("npm", ["pack", "--dry-run", "--json"]);
  if (result.status !== 0) {
    return {
      ok: false,
      details: "Unable to generate npm pack snapshot.",
      output: `${result.stdout}${result.stderr}`
    };
  }

  try {
    const parsed = JSON.parse(result.stdout);
    const entry = Array.isArray(parsed) ? parsed[0] : parsed;
    const fileCount = Array.isArray(entry.files) ? entry.files.length : 0;
    const details = `package size ${entry.size} bytes, unpacked ${entry.unpackedSize} bytes, files ${fileCount}`;
    return { ok: true, details, output: result.stdout };
  } catch (error) {
    return {
      ok: false,
      details: "npm pack output was not valid JSON.",
      output: `${result.stdout}\n${String(error)}`
    };
  }
}

function buildReport(results, packSnapshot) {
  const generated = new Date().toISOString();
  const failed = results.filter((step) => !step.ok);
  const lines = [];
  lines.push("# Prepublish Dry Run");
  lines.push("");
  lines.push(`- Generated: ${generated}`);
  lines.push(`- Expected owner: \`${EXPECTED_NAME} <${EXPECTED_EMAIL}>\``);
  lines.push(`- Owner range: \`${OWNER_RANGE}\``);
  lines.push("");
  lines.push("## Step Matrix");
  lines.push("");
  lines.push("| Step | Status | Command | Details |");
  lines.push("|---|---|---|---|");
  for (const step of results) {
    lines.push(`| ${step.name} | ${step.ok ? "pass" : "fail"} | \`${step.command}\` | ${step.details} |`);
  }
  lines.push("");
  lines.push("## npm Pack Snapshot");
  lines.push("");
  lines.push(`- Status: ${packSnapshot.ok ? "pass" : "fail"}`);
  lines.push(`- Details: ${packSnapshot.details}`);
  lines.push("");

  if (failed.length === 0 && packSnapshot.ok) {
    lines.push("## Result");
    lines.push("");
    lines.push("Prepublish dry run passed.");
  } else {
    lines.push("## Result");
    lines.push("");
    lines.push("Prepublish dry run failed.");
    lines.push("");
    lines.push("### Failing checks");
    for (const step of failed) {
      lines.push(`- ${step.name}`);
    }
    if (!packSnapshot.ok) lines.push("- npm pack snapshot");
  }

  lines.push("");
  lines.push("## Command Output (Truncated)");
  lines.push("");
  for (const step of results) {
    lines.push(`### ${step.name}`);
    lines.push("");
    lines.push("```text");
    lines.push(trimOutput(step.commandOutput) || "(no output)");
    lines.push("```");
    lines.push("");
  }
  lines.push("### npm Pack Snapshot");
  lines.push("");
  lines.push("```text");
  lines.push(trimOutput(packSnapshot.output, 4000) || "(no output)");
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

function main() {
  const steps = [
    gitIdentityStep(),
    ownerAttributionStep(),
    publicLanguageStep(),
    markerScanStep(),
    runNodeStep("Core verification", "scripts/verify-core.js"),
    runNodeStep("Web verification", "scripts/verify-web.js"),
    runNodeStep("Install-flow verification", "scripts/verify-install-flow.js"),
    runNodeStep("Version parity", "scripts/check-version-parity.js", ["--allow-propagation"])
  ];

  const packSnapshot = npmPackSnapshot();
  const report = buildReport(steps, packSnapshot);

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${report}\n`);

  console.log(`Wrote ${REPORT_PATH}`);
  const failed = steps.some((step) => !step.ok) || !packSnapshot.ok;
  if (failed) {
    process.exitCode = 1;
  }
}

main();

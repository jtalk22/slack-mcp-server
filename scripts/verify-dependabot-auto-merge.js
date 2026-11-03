#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// An explicit path lets the guardrail be proven against a known-bad copy.
const WORKFLOW_PATH = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(ROOT, ".github", "workflows", "dependabot-auto-merge.yml");
const workflow = readFileSync(WORKFLOW_PATH, "utf8");

// dependabot/fetch-metadata emits Dependabot's internal ecosystem names, which
// use underscores (github_actions, npm_and_yarn). dependabot.yml spells the same
// ecosystems with hyphens, and a condition copied from there never matches.
// Full-line YAML comments are dropped first, so a commented-out condition can
// neither satisfy the presence check nor trip the spelling check.
const activeWorkflow = workflow
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("#"))
  .join("\n");
const ecosystemComparisons = [
  ...activeWorkflow.matchAll(/outputs\.package-ecosystem\s*[!=]=\s*'([^']*)'/g),
].map((match) => match[1]);
// Only an equality can route Actions updates to auto-merge.
const ecosystemEqualities = [
  ...activeWorkflow.matchAll(/outputs\.package-ecosystem\s*==\s*'([^']*)'/g),
].map((match) => match[1]);

const checks = [
  {
    label: "PR author must be Dependabot",
    ok: workflow.includes("github.event.pull_request.user.login == 'dependabot[bot]'"),
  },
  {
    label: "workflow actor must be Dependabot",
    ok: workflow.includes("github.actor == 'dependabot[bot]'"),
  },
  {
    label: "both identities must be required by the same job condition",
    ok: /if:\s*\|[\s\S]*?pull_request\.user\.login == 'dependabot\[bot\]'\s*&&[\s\S]*?github\.actor == 'dependabot\[bot\]'/m.test(workflow),
  },
  {
    label: "Dependabot metadata verification must remain enabled",
    ok: workflow.includes("dependabot/fetch-metadata@") && !workflow.includes("skip-commit-verification"),
  },
  {
    label: "Actions must not attempt to approve their own PR",
    ok: !workflow.includes("gh pr review"),
  },
  {
    label: "eligible updates must use auto-merge",
    ok: workflow.includes('gh pr merge --auto --squash "$PR_URL"'),
  },
  {
    label: "GitHub Actions updates must be matched by fetch-metadata's name (github_actions)",
    ok: ecosystemEqualities.includes("github_actions"),
  },
  {
    label: `ecosystem conditions must use fetch-metadata names, not dependabot.yml spellings (saw: ${ecosystemComparisons.join(", ") || "none"})`,
    ok: ecosystemComparisons.every((name) => /^[a-z0-9_]+$/.test(name)),
  },
];

let failed = false;
for (const check of checks) {
  const status = check.ok ? "PASS" : "FAIL";
  console.log(`${status} ${check.label}`);
  failed ||= !check.ok;
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Dependabot auto-merge guardrail verified.");
}

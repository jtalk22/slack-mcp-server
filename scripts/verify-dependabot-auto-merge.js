#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW_PATH = resolve(ROOT, ".github", "workflows", "dependabot-auto-merge.yml");
const workflow = readFileSync(WORKFLOW_PATH, "utf8");

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

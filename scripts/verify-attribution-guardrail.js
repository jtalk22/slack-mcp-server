#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WORKFLOW_PATH = resolve(ROOT, ".github", "workflows", "attribution-guardrail.yml");
const REPORT_PATH = resolve(ROOT, "output", "release-health", "attribution-guardrail-check.md");

const workflow = readFileSync(WORKFLOW_PATH, "utf8");

const checks = [
  {
    name: "Dependabot actor skip",
    ok: workflow.includes("github.actor != 'dependabot[bot]'"),
    details: "Job must skip when the workflow actor is Dependabot.",
  },
  {
    name: "Dependabot PR author skip",
    ok: workflow.includes("github.event.pull_request.user.login != 'dependabot[bot]'"),
    details: "Job must skip pull requests authored by Dependabot.",
  },
  {
    name: "Main push trigger",
    ok: /on:\s*\n\s*push:\s*\n\s*branches:\s*\[main\]/m.test(workflow),
    details: "Workflow must still run on pushes to main.",
  },
  {
    name: "Main PR trigger",
    ok: /pull_request:\s*\n\s*branches:\s*\[main\]/m.test(workflow),
    details: "Workflow must still run on pull requests targeting main.",
  },
  {
    name: "Owner attribution step present",
    ok: workflow.includes("bash scripts/check-owner-attribution.sh"),
    details: "Workflow must keep the owner-attribution enforcement step.",
  },
];

const lines = [
  "# Attribution Guardrail Regression Check",
  "",
  `- Generated: ${new Date().toISOString()}`,
  "",
  "| Check | Status | Details |",
  "|---|---|---|",
  ...checks.map((check) => `| ${check.name} | ${check.ok ? "pass" : "fail"} | ${check.details} |`),
  "",
];

mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${REPORT_PATH}`);

if (checks.some((check) => !check.ok)) {
  process.exit(1);
}

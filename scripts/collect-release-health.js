#!/usr/bin/env node

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO =
  process.env.RELEASE_HEALTH_REPO ||
  process.env.GROWTH_REPO ||
  "jtalk22/slack-mcp-server";
const NPM_PACKAGE =
  process.env.RELEASE_HEALTH_NPM_PACKAGE ||
  process.env.GROWTH_NPM_PACKAGE ||
  "@jtalk22/slack-mcp";
const argv = process.argv.slice(2);

function argValue(flag) {
  const idx = argv.indexOf(flag);
  return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : null;
}

function safeGhApi(path) {
  try {
    const out = execSync(`gh api ${path}`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }
  return response.json();
}

function toDateSlug(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function countNonPrIssues(items) {
  if (!Array.isArray(items)) return 0;
  return items.filter((item) => item && !item.pull_request).length;
}

function buildMarkdown(data) {
  const lines = [];
  lines.push("# Release Health Snapshot");
  lines.push("");
  lines.push(`- Generated: ${data.generatedAt}`);
  lines.push(`- Repo: \`${REPO}\``);
  lines.push(`- Package: \`${NPM_PACKAGE}\``);
  lines.push("");

  lines.push("## Install Signals");
  lines.push("");
  lines.push(`- npm downloads (last week): ${data.npm.lastWeek ?? "n/a"}`);
  lines.push(`- npm downloads (last month): ${data.npm.lastMonth ?? "n/a"}`);
  lines.push(`- npm latest version: ${data.npm.latestVersion ?? "n/a"}`);
  lines.push("");

  lines.push("## GitHub Reach");
  lines.push("");
  lines.push(`- stars: ${data.github.stars ?? "n/a"}`);
  lines.push(`- forks: ${data.github.forks ?? "n/a"}`);
  lines.push(`- open issues: ${data.github.openIssues ?? "n/a"}`);
  lines.push(`- 14d views: ${data.github.viewsCount ?? "n/a"}`);
  lines.push(`- 14d unique visitors: ${data.github.viewsUniques ?? "n/a"}`);
  lines.push(`- 14d clones: ${data.github.clonesCount ?? "n/a"}`);
  lines.push(`- 14d unique cloners: ${data.github.clonesUniques ?? "n/a"}`);
  lines.push(`- deployment-intake submissions (all-time): ${data.github.deploymentIntakeCount ?? "n/a"}`);
  lines.push("");

  lines.push("## 14-Day Reliability Targets (v3.0.0 Cycle)");
  lines.push("");
  lines.push("- weekly downloads: >= 180");
  lines.push("- qualified deployment-intake submissions: >= 2");
  lines.push("- maintainer support load: <= 2 hours/week");
  lines.push("");

  lines.push("## Notes");
  lines.push("");
  lines.push("- Update this snapshot daily during active release windows, then weekly.");
  lines.push("- Track deployment-intake quality and support load manually in issue notes.");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const now = new Date();
  const generatedAt = now.toISOString();
  const dateSlug = toDateSlug(now);

  let npmWeek = null;
  let npmMonth = null;
  let npmMeta = null;

  try {
    npmWeek = await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(NPM_PACKAGE)}`);
  } catch {}

  try {
    npmMonth = await fetchJson(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(NPM_PACKAGE)}`);
  } catch {}

  try {
    npmMeta = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(NPM_PACKAGE)}`);
  } catch {}

  const repoInfo = safeGhApi(`repos/${REPO}`) || {};
  const views = safeGhApi(`repos/${REPO}/traffic/views`) || {};
  const clones = safeGhApi(`repos/${REPO}/traffic/clones`) || {};
  const intakeIssues = safeGhApi(`repos/${REPO}/issues?state=all&labels=deployment-intake&per_page=100`) || [];

  const data = {
    generatedAt,
    npm: {
      lastWeek: npmWeek?.downloads ?? null,
      lastMonth: npmMonth?.downloads ?? null,
      latestVersion: npmMeta?.["dist-tags"]?.latest ?? null,
    },
    github: {
      stars: repoInfo.stargazers_count ?? null,
      forks: repoInfo.forks_count ?? null,
      openIssues: repoInfo.open_issues_count ?? null,
      viewsCount: views.count ?? null,
      viewsUniques: views.uniques ?? null,
      clonesCount: clones.count ?? null,
      clonesUniques: clones.uniques ?? null,
      deploymentIntakeCount: countNonPrIssues(intakeIssues),
    },
  };

  const markdown = buildMarkdown(data);

  const explicitOutDir = argValue("--out-dir");
  const publicMode = argv.includes("--public");
  const metricsDir = explicitOutDir
    ? resolve(explicitOutDir)
    : publicMode
      ? resolve("docs", "release-health")
      : resolve("output", "release-health");
  const datedPath = join(metricsDir, `${dateSlug}.md`);
  const latestPath = join(metricsDir, "latest.md");

  mkdirSync(metricsDir, { recursive: true });
  writeFileSync(datedPath, markdown);
  writeFileSync(latestPath, markdown);

  console.log(`Wrote ${datedPath}`);
  console.log(`Wrote ${latestPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

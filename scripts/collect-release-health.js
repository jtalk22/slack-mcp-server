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
  lines.push("- hosted deployment review requests: manual tracking");
  lines.push("");

  lines.push("## 14-Day Reliability Targets");
  lines.push("");
  lines.push("- weekly downloads: >= 180");
  lines.push("- qualified hosted deployment review requests: manual");
  lines.push("- maintainer support load: <= 2 hours/week");
  lines.push("");

  lines.push("## Same-Day Operator Checks");
  lines.push("");
  lines.push("- hosted deployment review requests: manual");
  lines.push("- GitHub Release page: verify current release notes, verify commands, support path, and Cloud vs self-hosted split.");
  lines.push("- npm / npx / GHCR parity: verify after release using `npm view`, `npx --version`, and Docker `--version`.");
  lines.push("- MCP Registry / Glama / Smithery: confirm latest version and canonical homepage, or record propagation lag.");
  lines.push("- Cloudflare sessions since release: manual.");
  lines.push("- Checkout starts and provisioned keys since release: manual.");
  lines.push("- Support load for the release window: manual.");
  lines.push("");

  lines.push("## Notes");
  lines.push("");
  lines.push("- Update this snapshot daily during active release windows, then weekly.");
  lines.push("- GitHub traffic is an awareness signal, not the sole demand KPI, now that canonical onboarding lives at mcp.revasserlabs.com.");
  lines.push("- Track off-GitHub funnel metrics manually: Cloudflare sessions, checkout starts, provisioned keys, and support load.");
  lines.push("- Track hosted deployment review volume and support load manually.");

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

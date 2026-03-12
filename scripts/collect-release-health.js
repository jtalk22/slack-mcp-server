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
const HOSTED_FUNNEL_SUMMARY_URL =
  process.env.HOSTED_FUNNEL_SUMMARY_URL ||
  "https://mcp.revasserlabs.com/api/v1/funnel/summary";
const HOSTED_ADMIN_TOKEN = process.env.HOSTED_ADMIN_TOKEN || "";
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

function formatTopEvents(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return "unavailable";
  }

  return events
    .slice(0, 6)
    .map((event) => `${event.event_name}: ${event.total}`)
    .join(", ");
}

function findEventTotal(events = [], eventName) {
  if (!Array.isArray(events)) return 0;
  return Number((events.find((event) => event.event_name === eventName) || {}).total || 0);
}

function formatRows(rows = [], formatter, limit = 6) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "unavailable";
  }

  return rows
    .slice(0, limit)
    .map(formatter)
    .join(", ");
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
  lines.push(`- hosted deployment review submits: ${data.hosted?.available ? data.hosted.deploymentReviewSubmits ?? 0 : "unavailable"}`);
  lines.push("");

  lines.push("## 14-Day Reliability Targets");
  lines.push("");
  lines.push("- weekly downloads: >= 180");
  lines.push(`- qualified hosted deployment review requests: ${data.hosted?.available ? formatRows(data.hosted.leads, (lead) => `${lead.qualification_state}/${lead.source}: ${lead.total}`, 4) : "unavailable"}`);
  lines.push("- maintainer support load: <= 2 hours/week");
  lines.push("");

  lines.push("## Same-Day Operator Checks");
  lines.push("");
  lines.push(`- hosted deployment review requests: ${data.hosted?.available ? data.hosted.deploymentReviewSubmits ?? 0 : "unavailable"}`);
  lines.push("- GitHub Release page: verify current release notes, verify commands, support path, and Cloud vs self-hosted split.");
  lines.push("- npm / npx / GHCR parity: verify after release using `npm view`, `npx --version`, and Docker `--version`.");
  lines.push("- MCP Registry / Glama / Smithery: confirm latest version and canonical homepage, or record propagation lag.");
  lines.push(`- Cloudflare sessions since release: ${data.hosted?.available ? "reconcile with hosted source mix and Search Console/Bing weekly." : "unavailable."}`);
  lines.push(`- Checkout starts/completes since release: ${data.hosted?.available ? formatRows(data.hosted.checkouts, (row) => `${row.status}/${row.source}/${row.plan}: ${row.total}`) : "unavailable."}`);
  lines.push(`- First-call conversion since release: ${data.hosted?.available ? formatRows(data.hosted.conversions, (row) => `${row.event_name}/${row.source}/${row.plan}: ${row.total}`) : "unavailable."}`);
  lines.push(`- Support load for the release window: ${data.hosted?.available ? "review hosted funnel summary plus support inbox manually." : "unavailable."}`);
  lines.push("");

  lines.push("## Hosted Funnel");
  lines.push("");
  if (data.hosted?.available) {
    lines.push(`- window days: ${data.hosted.windowDays ?? "n/a"}`);
    lines.push(`- top events: ${formatTopEvents(data.hosted.events)}`);
    lines.push(`- top pages: ${formatRows(data.hosted.pages, (page) => `${page.page_path}: ${page.total}`)}`);
    lines.push(`- top entry pages: ${formatRows(data.hosted.entryPages, (page) => `${page.entry_page}: ${page.total}`)}`);
    lines.push(`- source mix: ${formatRows(data.hosted.sources, (source) => `${source.source}: ${source.total}`)}`);
    lines.push(`- lead states: ${formatRows(data.hosted.leads, (lead) => `${lead.qualification_state}/${lead.source}: ${lead.total}`)}`);
    lines.push(`- readiness outcomes: ${formatRows(data.hosted.readiness, (row) => `${row.plan}: ${row.total}`)}`);
    lines.push(`- deployment review submits: ${data.hosted.deploymentReviewSubmits ?? 0}`);
    lines.push(`- checkout starts: ${data.hosted.checkoutStarts ?? 0}`);
    lines.push(`- checkout completes: ${data.hosted.checkoutCompletes ?? 0}`);
    lines.push(`- checkout attribution: ${formatRows(data.hosted.checkouts, (row) => `${row.status}/${row.source}/${row.plan}: ${row.total}`)}`);
    lines.push(`- conversion detail: ${formatRows(data.hosted.conversions, (row) => `${row.event_name}/${row.source}/${row.plan}: ${row.total}`)}`);
  } else {
    lines.push(`- unavailable: ${data.hosted?.note || "set HOSTED_ADMIN_TOKEN to query the hosted funnel summary."}`);
  }
  lines.push("");

  lines.push("## Search Ops");
  lines.push("");
  lines.push("- Submit or refresh `https://mcp.revasserlabs.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.");
  lines.push("- Inspect `/`, `/pricing`, `/security`, `/gemini-cli`, `/workflows`, and `/use-cases/support-triage`.");
  lines.push("- Compare Search Console clicks with hosted first-touch source mix weekly.");
  lines.push("- Use `docs/DISTRIBUTION-LEDGER.md` as the manual follow-up ledger for MCP Registry, Glama, mcp.so, PulseMCP, and Smithery.");
  lines.push("");

  lines.push("## Notes");
  lines.push("");
  lines.push("- Update this snapshot daily during active release windows, then weekly.");
  lines.push("- GitHub traffic is an awareness signal, not the sole demand KPI, now that canonical onboarding lives at mcp.revasserlabs.com.");
  lines.push("- Track off-GitHub funnel metrics with the hosted summary when admin auth is available, then reconcile against Cloudflare sessions, Search Console/Bing, and support load.");
  lines.push("- Use the distribution ledger to record directory drift that cannot be read from GitHub traffic alone.");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const now = new Date();
  const generatedAt = now.toISOString();
  const dateSlug = toDateSlug(now);

  let npmWeek = null;
  let npmMonth = null;
  let npmMeta = null;
  let hostedSummary = null;

  try {
    npmWeek = await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(NPM_PACKAGE)}`);
  } catch {}

  try {
    npmMonth = await fetchJson(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(NPM_PACKAGE)}`);
  } catch {}

  try {
    npmMeta = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(NPM_PACKAGE)}`);
  } catch {}

  if (HOSTED_ADMIN_TOKEN) {
    try {
      const response = await fetch(`${HOSTED_FUNNEL_SUMMARY_URL}?days=30`, {
        headers: {
          authorization: `Bearer ${HOSTED_ADMIN_TOKEN}`,
        },
      });
      if (response.ok) {
        hostedSummary = await response.json();
      } else {
        hostedSummary = {
          available: false,
          note: `hosted summary returned ${response.status}`,
        };
      }
    } catch (error) {
      hostedSummary = {
        available: false,
        note: String(error?.message || error),
      };
    }
  } else {
    hostedSummary = {
      available: false,
      note: "HOSTED_ADMIN_TOKEN not set",
    };
  }

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
    hosted: hostedSummary?.window_days
      ? {
          available: true,
          windowDays: hostedSummary.window_days,
          events: hostedSummary.events || [],
          pages: hostedSummary.pages || [],
          sources: hostedSummary.sources || [],
          leads: hostedSummary.leads || [],
          readiness: hostedSummary.readiness || [],
          entryPages: hostedSummary.entry_pages || [],
          conversions: hostedSummary.conversions || [],
          checkouts: hostedSummary.checkouts || [],
          deploymentReviewSubmits: findEventTotal(hostedSummary.events, "deployment_review_submit"),
          checkoutStarts: findEventTotal(hostedSummary.events, "checkout_start"),
          checkoutCompletes: findEventTotal(hostedSummary.events, "checkout_complete"),
        }
      : hostedSummary,
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

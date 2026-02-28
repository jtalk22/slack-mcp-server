#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const METRICS = [
  "npm downloads (last week)",
  "npm downloads (last month)",
  "stars",
  "forks",
  "open issues",
  "14d views",
  "14d unique visitors",
  "14d clones",
  "14d unique cloners",
  "deployment-intake submissions (all-time)",
];

const DEFAULT_AFTER = resolve("output", "release-health", "latest.md");
const DEFAULT_OUT = resolve("output", "release-health", "automation-delta.md");
const TARGETS = {
  "npm downloads (last week)": { operator: ">=", value: 180 },
  "deployment-intake submissions (all-time)": { operator: ">=", value: 2 },
};

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseArgs(argv) {
  const args = { before: null, after: DEFAULT_AFTER, out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--before") {
      if (!argv[i + 1]) throw new Error("Missing value for --before");
      args.before = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--after") {
      if (!argv[i + 1]) throw new Error("Missing value for --after");
      args.after = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--out") {
      if (!argv[i + 1]) throw new Error("Missing value for --out");
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function readSnapshot(path) {
  if (!path || !existsSync(path)) {
    return { path, metrics: new Map(), generatedAt: null };
  }

  const content = readFileSync(path, "utf8");
  const generatedAtMatch = content.match(/^- Generated:\s+(.+)$/m);
  const metrics = new Map();

  for (const label of METRICS) {
    const metricRegex = new RegExp(`^- ${escapeRegex(label)}:\\s+(.+)$`, "m");
    const match = content.match(metricRegex);
    if (!match) continue;

    const raw = match[1].trim();
    if (raw.toLowerCase() === "n/a") {
      metrics.set(label, null);
      continue;
    }

    const parsed = Number(raw.replace(/,/g, ""));
    metrics.set(label, Number.isFinite(parsed) ? parsed : null);
  }

  return {
    path,
    metrics,
    generatedAt: generatedAtMatch ? generatedAtMatch[1].trim() : null,
  };
}

function formatValue(value) {
  return value === null || value === undefined ? "n/a" : `${value}`;
}

function formatDelta(beforeValue, afterValue) {
  if (!Number.isFinite(beforeValue) || !Number.isFinite(afterValue)) {
    return "n/a";
  }
  const delta = afterValue - beforeValue;
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function evaluateTarget(metricLabel, value) {
  const target = TARGETS[metricLabel];
  if (!target || !Number.isFinite(value)) {
    return null;
  }

  if (target.operator === ">=") {
    return value >= target.value;
  }
  return null;
}

function displayPath(path) {
  if (!path) return "(none found)";
  const relPath = relative(process.cwd(), path);
  if (relPath && !relPath.startsWith("..")) {
    return relPath;
  }
  return path;
}

function renderMarkdown(beforeSnapshot, afterSnapshot, rows) {
  const lines = [];
  lines.push("# Automated Release Health Delta");
  lines.push("");
  lines.push(
    `- Baseline snapshot: ${
      beforeSnapshot.path && existsSync(beforeSnapshot.path) ? `\`${displayPath(beforeSnapshot.path)}\`` : "`(none found)`"
    }`
  );
  lines.push(`- Current snapshot: \`${displayPath(afterSnapshot.path)}\``);
  lines.push("");
  lines.push("| Metric | Baseline | Current | Delta |");
  lines.push("|---|---:|---:|---:|");

  for (const row of rows) {
    lines.push(
      `| ${row.metric} | ${formatValue(row.beforeValue)} | ${formatValue(row.afterValue)} | ${formatDelta(
        row.beforeValue,
        row.afterValue
      )} |`
    );
  }

  lines.push("");
  lines.push("## Target Checks");
  lines.push("");

  for (const metric of Object.keys(TARGETS)) {
    const value = afterSnapshot.metrics.get(metric) ?? null;
    const passed = evaluateTarget(metric, value);
    const target = TARGETS[metric];
    const status = passed === null ? "n/a" : passed ? "pass" : "miss";
    lines.push(`- ${metric} ${target.operator} ${target.value}: ${status} (current: ${formatValue(value)})`);
  }

  if (beforeSnapshot.generatedAt || afterSnapshot.generatedAt) {
    lines.push("");
    lines.push("## Snapshot Times");
    lines.push("");
    if (beforeSnapshot.generatedAt) {
      lines.push(`- Baseline generated: ${beforeSnapshot.generatedAt}`);
    }
    if (afterSnapshot.generatedAt) {
      lines.push(`- Current generated: ${afterSnapshot.generatedAt}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const beforeSnapshot = readSnapshot(args.before ? resolve(args.before) : null);
  const afterPath = resolve(args.after);

  if (!existsSync(afterPath)) {
    throw new Error(`Current snapshot not found: ${afterPath}`);
  }

  const afterSnapshot = readSnapshot(afterPath);
  const rows = METRICS.map((metric) => ({
    metric,
    beforeValue: beforeSnapshot.metrics.get(metric) ?? null,
    afterValue: afterSnapshot.metrics.get(metric) ?? null,
  }));

  const outputPath = resolve(args.out);
  mkdirSync(dirname(outputPath), { recursive: true });
  const markdown = renderMarkdown(beforeSnapshot, afterSnapshot, rows);
  writeFileSync(outputPath, markdown);

  console.log(`Wrote ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_METADATA, RELEASE_VERSION } from "../lib/public-metadata.js";
import { DESIGN_TOKENS } from "../lib/public-pages.js";
import { TOOLS, READ_TOOLS, ESSENTIALS_TOOLS, resolveToolProfile } from "../lib/tools.js";

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
    "description parity",
    packageJson.description === PUBLIC_METADATA.canonicalShortDescription &&
      serverMeta.description === PUBLIC_METADATA.canonicalShortDescription,
    `package=${packageJson.description}; server=${serverMeta.description}`
  );
  // Glama's live schema defines only maintainers; everything else it reads
  // from the repository directly, so the file stays a minimal claim contract.
  check(
    results,
    "glama minimal contract",
    Array.isArray(glamaMeta.maintainers) && glamaMeta.maintainers.includes("jtalk22"),
    `maintainers=${JSON.stringify(glamaMeta.maintainers ?? null)}`
  );

  const dockerfile = read("Dockerfile");
  check(
    results,
    "Dockerfile LABEL description parity",
    dockerfile.includes(`LABEL org.opencontainers.image.description="${PUBLIC_METADATA.canonicalShortDescription}"`),
    "OCI image description label must carry the canonical short description"
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
    "public/proof-reel.html",
    "public/demo-slack-mcp.html",
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
    /session-based auth|session tokens|browser-session credentials|browser session/i.test(readme),
    "README should describe session-based authentication approach"
  );
  check(
    results,
    "README category thesis",
    readme.includes("Catch up on Slack without reading it.") &&
      readme.includes("Built past the demo") &&
      readme.includes("Two ways into Slack") &&
      readme.includes("Hosted when it must drive itself"),
    "README must lead with the job it does, plus systems proof and the local/hosted value split"
  );
  check(
    results,
    "README download proof",
    readme.includes("img.shields.io/npm/dw/%40jtalk22%2Fslack-mcp"),
    "README must use the dynamic weekly npm download badge"
  );

  // Tool profiles must agree with the counts the README publishes, and must
  // never advertise a hosted upgrade stub to someone who narrowed their surface
  // to save schema cost. Both sides drifted once; this is the gate.
  check(
    results,
    "tool profile counts match published claims",
    TOOLS.length === PUBLIC_METADATA.selfHostedToolCount &&
      READ_TOOLS.length === 12 &&
      ESSENTIALS_TOOLS.length === 6,
    `all=${TOOLS.length} (README ${PUBLIC_METADATA.selfHostedToolCount}), read=${READ_TOOLS.length} (README 12), essentials=${ESSENTIALS_TOOLS.length}`
  );

  // 5.0.0 removed the hosted upgrade stubs. No profile — including "all" —
  // may advertise a tool that exists to point at a paid tier, and no handler
  // may return an upgrade payload in place of doing the work.
  const retiredStubs = ["slack_smart_search", "slack_triage"];
  const stubLeaks = ["all", "read", "essentials"].flatMap((profile) =>
    resolveToolProfile(profile)
      .tools.map((tool) => tool.name)
      .filter((name) => retiredStubs.includes(name))
      .map((name) => `${profile}:${name}`)
  );
  const paidTierDescriptions = TOOLS
    .filter((tool) => /hosted-only|upgrade to Pro|\$19\/mo|signup|free tier/i.test(tool.description))
    .map((tool) => tool.name);
  const handlersSource = read("lib/handlers.js");
  const upgradePayloadMarkers = ["tool_requires_hosted", "signup_url", "pro_value_prop"].filter((m) => handlersSource.includes(m));
  check(
    results,
    "no hosted upgrade stub in any profile",
    stubLeaks.length === 0 && paidTierDescriptions.length === 0 && upgradePayloadMarkers.length === 0,
    [
      stubLeaks.length ? `advertised: ${stubLeaks.join(", ")}` : "",
      paidTierDescriptions.length ? `paid-tier copy in: ${paidTierDescriptions.join(", ")}` : "",
      upgradePayloadMarkers.length ? `upgrade payload markers in lib/handlers.js: ${upgradePayloadMarkers.join(", ")}` : "",
    ].filter(Boolean).join("; ") || "every advertised tool does its own work"
  );

  // The protocol claim is a test, not a sentence. The README may say
  // 2026-07-28 only while the proof exists; the HTTP entry may not mint a
  // session; nothing may still import the retired v1 SDK.
  const eraTestExists = existsSync(join(ROOT, "test", "mcp-era.test.js"));
  check(
    results,
    "README protocol claim is backed by test/mcp-era.test.js",
    readme.includes("2026-07-28") && eraTestExists,
    eraTestExists ? "claim and proof both present" : "README claims 2026-07-28 without test/mcp-era.test.js"
  );
  const httpSource = read("src/server-http.js");
  check(
    results,
    "HTTP entry is stateless",
    !httpSource.includes("sessionIdGenerator") && httpSource.includes("createMcpHandler"),
    "src/server-http.js must serve per request via createMcpHandler and never mint a session"
  );
  const v1Importers = ["src", "lib"].flatMap((dir) =>
    readdirSync(join(ROOT, dir))
      .filter((name) => name.endsWith(".js"))
      .map((name) => `${dir}/${name}`)
      .filter((relPath) => read(relPath).includes("@modelcontextprotocol/sdk"))
  );
  check(
    results,
    "no import of the retired @modelcontextprotocol/sdk v1 package",
    v1Importers.length === 0 && !Object.keys(packageJson.dependencies || {}).includes("@modelcontextprotocol/sdk"),
    v1Importers.length === 0 ? "runtime is on SDK v2" : v1Importers.join(", ")
  );

  const unknownProfileNames = [...READ_TOOLS, ...ESSENTIALS_TOOLS].filter(
    (name) => !TOOLS.some((tool) => tool.name === name)
  );
  check(
    results,
    "profile tool names all resolve",
    unknownProfileNames.length === 0,
    unknownProfileNames.length === 0 ? "no rotted names" : unknownProfileNames.join(", ")
  );

  // A script the public docs invite people to run must actually ship in the
  // package. The token-cost claim is only as good as the reader's ability to
  // reproduce it from what they installed.
  const publishedScripts = (packageJson.files || []).filter((entry) => entry.startsWith("scripts/"));
  const docInvitedScripts = Array.from(
    new Set(Array.from(readme.matchAll(/scripts\/([a-z0-9-]+\.js)/g), (match) => `scripts/${match[1]}`))
  );
  const unshippedInvited = docInvitedScripts.filter((path) => !publishedScripts.includes(path));
  check(
    results,
    "README-invited scripts ship in the package",
    unshippedInvited.length === 0,
    unshippedInvited.length === 0
      ? `${docInvitedScripts.length} referenced, all in files[]`
      : `not published: ${unshippedInvited.join(", ")}`
  );

  const cliHelpResult = runNode(["src/cli.js", "--help"]);
  check(
    results,
    "CLI client-neutral help",
    cliHelpResult.status === 0 &&
      cliHelpResult.stdout.includes(`${PUBLIC_METADATA.selfHostedToolCount} tools for any stdio MCP client`) &&
      !cliHelpResult.stdout.includes("Full Slack access for Claude"),
    cliHelpResult.stdout || cliHelpResult.stderr || "no output"
  );

  // One design-token vocabulary: the shared :root block from lib/public-pages.js
  // must appear byte-identical on every generated page.
  for (const pagePath of [
    "index.html",
    "public/share.html",
    "public/demo.html",
    "public/demo-video.html",
    "public/proof-reel.html",
    "public/demo-slack-mcp.html",
  ]) {
    check(
      results,
      `${pagePath} canonical design tokens`,
      read(pagePath).includes(DESIGN_TOKENS),
      "expected the shared :root vocabulary emitted by {{DESIGN_TOKENS}}"
    );
  }

  // Retired token names must not re-enter the templates.
  const fossilTokens = ["--teal", "--coral", "--ground", "--bg-primary", "--accent", "--claude-orange"];
  for (const templateName of readdirSync(join(ROOT, "templates", "public-pages"))) {
    const templateSource = read(join("templates", "public-pages", templateName));
    const fossilsFound = fossilTokens.filter((token) => templateSource.includes(token));
    check(
      results,
      `templates/public-pages/${templateName} fossil-token free`,
      fossilsFound.length === 0,
      fossilsFound.length === 0 ? "no retired token names" : fossilsFound.join(", ")
    );
  }

  const proofReel = read("public/proof-reel.html");
  check(
    results,
    "Proof reel contract",
    proofReel.includes("47 unread") &&
      proofReel.includes("slack_conversations_unreads") &&
      proofReel.includes("slack_conversations_mark") &&
      proofReel.includes("reel-complete"),
    "proof reel must show the outcome, real tool names, and deterministic completion state"
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

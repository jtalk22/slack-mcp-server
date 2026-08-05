import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_METADATA } from "./public-metadata.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEMPLATE_DIR = resolve(ROOT, "templates", "public-pages");

const GITHUB_PAGES_ROOT = "https://jtalk22.github.io/slack-mcp-server";
const GITHUB_DOCS_ROOT = `${PUBLIC_METADATA.canonicalRepoUrl}/blob/main/docs`;
const SOCIAL_IMAGE_URL = `${GITHUB_PAGES_ROOT}/docs/images/social-preview-v3.png`;
const ICON_URL = `${GITHUB_PAGES_ROOT}/docs/assets/icon-512.png`;
const NPM_URL = "https://www.npmjs.com/package/@jtalk22/slack-mcp";
const RELEASES_URL = `${PUBLIC_METADATA.canonicalRepoUrl}/releases/latest`;
const SETUP_URL = `${PUBLIC_METADATA.canonicalRepoUrl}/blob/main/docs/SETUP.md`;
const DEMO_VIDEO_URL = `${GITHUB_PAGES_ROOT}/docs/videos/slack-mcp-proof-20s-vertical.mp4`;

function template(name) {
  return readFileSync(resolve(TEMPLATE_DIR, name), "utf8");
}

function replaceTokens(source, replacements) {
  return source.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (!(key in replacements)) {
      throw new Error(`Missing template token: ${key}`);
    }
    return replacements[key];
  });
}

function rootDecisionPanel() {
  return `
    <section class="stage" style="padding-top:0">
      <div class="decision-grid" aria-label="Self-host info">
        <article class="decision-card">
          <span class="decision-label">Self-host</span>
          <h2>Slack's operating layer—free, local, and yours.</h2>
          <p>The current ${PUBLIC_METADATA.selfHostedToolCount}-tool surface turns DMs, search, threads, unread triage, actions, and workflows into agent-readable context without an app/admin queue.</p>
          <ul>
            <li>stdio, web, and Docker paths stay fully under your control</li>
            <li>No OAuth app registration or admin approval needed</li>
            <li>Token persistence with automatic refresh on macOS</li>
          </ul>
          <p class="decision-links"><a href="${SETUP_URL}">Setup guide</a> · <a href="${RELEASES_URL}">Latest release</a> · <a href="${NPM_URL}">npm</a></p>
        </article>
      </div>
    </section>
  `.trim();
}

function shareLinks() {
  return `
      <a href="${SETUP_URL}" rel="noopener">Install (\`--setup\`)</a>
      <a href="${SETUP_URL}" rel="noopener">Verify (\`--version/--doctor/--status\`)</a>
      <a href="${RELEASES_URL}" rel="noopener">Latest Release</a>
      <a href="${GITHUB_PAGES_ROOT}/" rel="noopener">Autoplay Demo Landing</a>
      <a href="${DEMO_VIDEO_URL}" rel="noopener">20s Mobile Clip</a>
      <a href="${NPM_URL}" rel="noopener">npm Package</a>
      <a href="${PUBLIC_METADATA.canonicalSiteUrl}" rel="noopener" style="background:rgba(255,178,36,0.18);border-color:rgba(255,178,36,0.45);color:#ffb224">Hosted</a>
    `.trim();
}

function shareNote() {
  return `<strong>Ask what happened. Find the decision. Close the loop.</strong> The free local path gives you the current ${PUBLIC_METADATA.selfHostedToolCount}-tool surface without an app/admin queue. <a href="${PUBLIC_METADATA.canonicalSiteUrl}">Hosted</a> adds permanent OAuth, indexing, scheduled intelligence, and team continuity when the workflow must run without you.`;
}

function demoLinks() {
  return `
      <a href="${PUBLIC_METADATA.canonicalSiteUrl}" target="_blank" rel="noopener noreferrer" style="background:rgba(229,72,47,0.18);border-color:rgba(229,72,47,0.45);color:#e5482f">Hosted</a>
      <a href="${NPM_URL}" target="_blank" rel="noopener noreferrer">npm Install</a>
      <a href="${SETUP_URL}" target="_blank" rel="noopener noreferrer">Setup Guide</a>
    `.trim();
}

function demoNote() {
  return `The free local path ships the current ${PUBLIC_METADATA.selfHostedToolCount}-tool surface with session-based auth and no app/admin queue. <a href="${PUBLIC_METADATA.canonicalSiteUrl}" target="_blank" rel="noopener noreferrer">Hosted</a> adds permanent OAuth, indexed retrieval, scheduled intelligence, and team continuity when the workflow must run without you.`;
}

function demoFooterLinks() {
  return `<a href="${PUBLIC_METADATA.canonicalRepoUrl}">GitHub</a> · <a href="${NPM_URL}" style="color:#96938a;text-decoration:none;font-size:0.875rem">npm</a> · <a href="${PUBLIC_METADATA.canonicalSiteUrl}" style="color:#e5482f;text-decoration:none;font-size:0.875rem">Hosted</a>`;
}

function commonTokens() {
  return {
    CANONICAL_SITE_URL: PUBLIC_METADATA.canonicalSiteUrl,
    CLOUD_PRICING_URL: PUBLIC_METADATA.cloudPricingUrl,
    CLOUD_WORKFLOWS_URL: PUBLIC_METADATA.canonicalSiteUrl + "/workflows",
    CLOUD_OFFICIAL_COMPARISON_URL: PUBLIC_METADATA.canonicalSiteUrl + "/official-slack-mcp-vs-managed",
    CLOUD_GEMINI_CLI_URL: PUBLIC_METADATA.canonicalSiteUrl + "/gemini-cli",
    CLOUD_READINESS_URL: PUBLIC_METADATA.canonicalSiteUrl + "/readiness",
    CLOUD_DOCS_URL: PUBLIC_METADATA.cloudDocsUrl,
    CLOUD_SECURITY_URL: PUBLIC_METADATA.cloudSecurityUrl,
    CLOUD_PROCUREMENT_URL: PUBLIC_METADATA.canonicalSiteUrl + "/procurement",
    CLOUD_MARKETPLACE_READINESS_URL: PUBLIC_METADATA.canonicalSiteUrl + "/marketplace-readiness",
    CLOUD_SUPPORT_URL: PUBLIC_METADATA.cloudSupportUrl,
    CLOUD_DEPLOYMENT_URL: PUBLIC_METADATA.canonicalSiteUrl + "/deployment",
    CLOUD_STATUS_URL: PUBLIC_METADATA.cloudStatusUrl,
    CLOUD_SELF_HOST_URL: PUBLIC_METADATA.canonicalSiteUrl + "/self-host",
    CLOUD_ACCOUNT_URL: PUBLIC_METADATA.canonicalSiteUrl + "/account",
    GITHUB_REPO_URL: PUBLIC_METADATA.canonicalRepoUrl,
    GITHUB_PAGES_ROOT,
    GITHUB_DOCS_ROOT,
    ICON_URL,
    SOCIAL_IMAGE_URL,
    NPM_URL,
    RELEASES_URL,
    SETUP_URL,
    RELEASE_HEALTH_URL: RELEASES_URL,
    VERSION_PARITY_URL: RELEASES_URL,
    RUNBOOK_URL: SETUP_URL,
    SELF_HOSTED_TOOL_COUNT: String(PUBLIC_METADATA.selfHostedToolCount),
    CLOUD_MANAGED_TOOL_COUNT: "15",
    TEAM_AI_WORKFLOW_COUNT: "3",
    CLOUD_SOLO_PRICE: "$19/mo",
    CLOUD_TEAM_PRICE: "$49/mo",
    CLOUD_TURNKEY_LAUNCH_PRICE: "contact us",
    CLOUD_MANAGED_RELIABILITY_PRICE: "contact us",
    SUPPORT_EMAIL: PUBLIC_METADATA.supportEmail,
    ROOT_DECISION_PANEL: rootDecisionPanel(),
    SHARE_LINKS: shareLinks(),
    SHARE_NOTE: shareNote(),
    DEMO_LINKS: demoLinks(),
    DEMO_NOTE: demoNote(),
    DEMO_FOOTER_LINKS: demoFooterLinks(),
  };
}

export function buildPublicPages() {
  const tokens = commonTokens();
  return {
    "index.html": replaceTokens(template("index.html.tpl"), tokens),
    "public/share.html": replaceTokens(template("share.html.tpl"), tokens),
    "public/demo.html": replaceTokens(template("demo.html.tpl"), tokens),
    "public/demo-video.html": replaceTokens(template("demo-video.html.tpl"), tokens),
    "public/proof-reel.html": replaceTokens(template("proof-reel.html.tpl"), tokens),
    "public/demo-slack-mcp.html": replaceTokens(template("demo-slack-mcp.html.tpl"), tokens),
  };
}

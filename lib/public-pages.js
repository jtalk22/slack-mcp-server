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
const DEMO_VIDEO_URL = `${GITHUB_PAGES_ROOT}/docs/videos/demo-slack-mcp-mobile-20s.mp4`;

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
          <h2>${PUBLIC_METADATA.selfHostedToolCount} tools and full operator control.</h2>
          <p>Session-based auth, stdio transport. Works with Claude, ChatGPT, Cursor, Copilot, Gemini, Windsurf, and any other MCP client.</p>
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
      <a href="${PUBLIC_METADATA.canonicalSiteUrl}" rel="noopener" style="background:rgba(240,194,70,0.18);border-color:rgba(240,194,70,0.45);color:#f0c246">Hosted</a>
    `.trim();
}

function shareNote() {
  return `<strong>Verify in 30 seconds:</strong> <code>--version</code>, <code>--doctor</code>, <code>--status</code>. Self-host gives ${PUBLIC_METADATA.selfHostedToolCount} tools with session-based auth. Works with any MCP client — Claude, ChatGPT, Cursor, Copilot, Gemini, Windsurf. Hosted free tier (no card) live at <a href="${PUBLIC_METADATA.canonicalSiteUrl}">mcp.revasserlabs.com</a> — Pro $9/mo unlocks unlimited AI tools (scheduled morning catch-up DM rolling out Q2 2026).`;
}

function demoLinks() {
  return `
      <a href="${PUBLIC_METADATA.canonicalSiteUrl}" target="_blank" rel="noopener noreferrer" style="background:rgba(240,194,70,0.18);border-color:rgba(240,194,70,0.45);color:#f0c246">Hosted</a>
      <a href="${NPM_URL}" target="_blank" rel="noopener noreferrer">npm Install</a>
      <a href="${SETUP_URL}" target="_blank" rel="noopener noreferrer">Setup Guide</a>
    `.trim();
}

function demoNote() {
  return `Self-host free for ${PUBLIC_METADATA.selfHostedToolCount} tools with session-based auth. Works with Claude, ChatGPT, Cursor, Copilot, Gemini, Windsurf, and any other MCP client. No OAuth app, no admin approval. Hosted free tier (no card) live at <a href="${PUBLIC_METADATA.canonicalSiteUrl}" target="_blank" rel="noopener noreferrer">mcp.revasserlabs.com</a> — Pro $9/mo unlocks unlimited AI tools (scheduled morning catch-up DM rolling out Q2 2026).`;
}

function demoFooterLinks() {
  return `<a href="${PUBLIC_METADATA.canonicalRepoUrl}">GitHub</a> · <a href="${NPM_URL}" style="color:#94a3b8;text-decoration:none;font-size:0.875rem">npm</a> · <a href="${PUBLIC_METADATA.canonicalSiteUrl}" style="color:#f0c246;text-decoration:none;font-size:0.875rem">Hosted</a>`;
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
    CLOUD_SOLO_PRICE: "$9/mo",
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
    "public/demo-slack-mcp.html": replaceTokens(template("demo-slack-mcp.html.tpl"), tokens),
  };
}

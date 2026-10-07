import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

export const RELEASE_VERSION = packageJson.version;

export const PUBLIC_METADATA = Object.freeze({
  projectName: "slack-mcp-server",
  packageName: packageJson.name,
  canonicalShortDescription: packageJson.description,
  canonicalRepoUrl: "https://github.com/jtalk22/slack-mcp-server",
  canonicalSiteUrl: "https://mcp.revasserlabs.com",
  cloudPricingUrl: "https://mcp.revasserlabs.com/pricing",
  cloudDocsUrl: "https://mcp.revasserlabs.com/docs",
  cloudSecurityUrl: "https://mcp.revasserlabs.com/security",
  cloudSupportUrl: "https://mcp.revasserlabs.com/support",
  cloudStatusUrl: "https://mcp.revasserlabs.com/status",
  supportEmail: "support@revasserlabs.com",
  selfHostedToolCount: 20,
  // Hardcoding these in the gate is what let five surfaces drift apart. They
  // live here, with the tool count, so one edit moves every claim at once.
  readOnlyToolCount: 13,
  writePathToolCount: 4,
});

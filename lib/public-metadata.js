import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

export const RELEASE_VERSION = packageJson.version;

export const PUBLIC_METADATA = Object.freeze({
  projectName: "slack-mcp-server",
  packageName: packageJson.name,
  canonicalRepoUrl: "https://github.com/jtalk22/slack-mcp-server",
  canonicalSiteUrl: "https://mcp.revasserlabs.com",
  cloudDocsUrl: "https://mcp.revasserlabs.com/docs",
  cloudSupportUrl: "https://mcp.revasserlabs.com/support",
  cloudDeploymentUrl: "https://mcp.revasserlabs.com/deployment",
  cloudSelfHostUrl: "https://mcp.revasserlabs.com/self-host",
  cloudStatusUrl: "https://mcp.revasserlabs.com/status",
  supportEmail: "support@revasserlabs.com",
  privacyEmail: "privacy@revasserlabs.com",
  selfHostedToolCount: 16,
  cloudManagedToolCount: 15,
  teamAiWorkflowCount: 3,
  cloudSoloPrice: "$19/mo",
  cloudTeamPrice: "$49/mo",
});

# Version Parity Report

- Generated: 2026-03-12T00:32:42.881Z
- Local target version: 3.2.5

## Surface Matrix

| Surface | Version | Status | Notes |
|---|---|---|---|
| package.json | 3.2.5 | ok |  |
| server.json (root) | 3.2.5 | ok |  |
| server.json (package entry) | 3.2.5 | ok |  |
| npm dist-tag latest | 3.2.5 | ok |  |
| MCP Registry latest | 3.2.5 | ok |  |
| MCP Registry websiteUrl | https://mcp.revasserlabs.com | ok | expected: https://mcp.revasserlabs.com |
| MCP Registry description | Slack MCP for self-host or managed Cloud, with Gemini CLI and secure-default HTTP. | ok | expected_prefix: Slack MCP for self-host or managed Cloud, with Gemini CLI and secure-default HTTP. |
| Smithery endpoint | n/a | reachable | status: 401; version check is manual. |

## Interpretation

- Local metadata parity: pass.
- External parity: pass.

## Actionable Drift Notes

- MCP registry `websiteUrl` matches local metadata.
- MCP registry description prefix matches local metadata.
- Propagation mode: not needed (external parity is already aligned).

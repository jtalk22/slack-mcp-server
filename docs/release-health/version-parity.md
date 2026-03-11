# Version Parity Report

- Generated: 2026-03-11T17:03:58.472Z
- Local target version: 3.2.4

## Surface Matrix

| Surface | Version | Status | Notes |
|---|---|---|---|
| package.json | 3.2.4 | ok |  |
| server.json (root) | 3.2.4 | ok |  |
| server.json (package entry) | 3.2.4 | ok |  |
| npm dist-tag latest | 3.2.4 | ok |  |
| MCP Registry latest | 3.2.4 | ok |  |
| MCP Registry websiteUrl | https://mcp.revasserlabs.com | ok | expected: https://mcp.revasserlabs.com |
| MCP Registry description | Session-based Slack MCP for Claude and MCP clients: local-first workflows, secure-default HTTP. | mismatch | expected_prefix: Claude-first Slack MCP for self-host or managed Cloud, with Gemini CLI and secure-default HTTP. |
| Smithery endpoint | n/a | reachable | status: 401; version check is manual. |

## Interpretation

- Local metadata parity: pass.
- External parity mismatch: MCP registry description prefix.

## Actionable Drift Notes

- MCP registry `websiteUrl` matches local metadata.
- MCP registry description drift detected. Registry metadata for the same version cannot be republished; carry the new description on the next publishable version.
- Propagation mode enabled: external mismatch accepted temporarily.

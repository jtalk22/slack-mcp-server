# Version Parity Report

- Generated: 2026-03-11T04:35:03.849Z
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
| MCP Registry description | Session-based Slack MCP for Claude and MCP clients: local-first workflows, secure-default HTTP. | ok | expected_prefix: Session-based Slack MCP for Claude and MCP clients: local-first workflows, secure-default HTTP. |
| Smithery endpoint | n/a | reachable | status: 401; version check is manual. |

## Interpretation

- Local metadata parity: pass.
- External parity: pass.

## Actionable Drift Notes

- MCP registry `websiteUrl` matches local metadata.
- MCP registry description prefix matches local metadata.
- Propagation mode: not needed (external parity is already aligned).

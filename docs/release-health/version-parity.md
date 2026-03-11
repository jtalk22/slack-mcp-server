# Version Parity Report

- Generated: 2026-03-11T01:43:37.402Z
- Local target version: 3.2.4

## Surface Matrix

| Surface | Version | Status | Notes |
|---|---|---|---|
| package.json | 3.2.4 | ok |  |
| server.json (root) | 3.2.4 | ok |  |
| server.json (package entry) | 3.2.4 | ok |  |
| npm dist-tag latest | 3.2.3 | mismatch |  |
| MCP Registry latest | 3.2.0 | mismatch |  |
| MCP Registry websiteUrl | https://jtalk22.github.io/slack-mcp-server/ | mismatch | expected: https://mcp.revasserlabs.com |
| MCP Registry description | Session-based Slack MCP for Claude and MCP clients: local-first workflows, secure-default HTTP. | ok | expected_prefix: Session-based Slack MCP for Claude and MCP clients: local-first workflows, secure-default HTTP. |
| Smithery endpoint | n/a | reachable | status: 401; version check is manual. |

## Interpretation

- Local metadata parity: pass.
- External parity mismatch: npm latest, MCP registry latest, MCP registry websiteUrl.

## Actionable Drift Notes

- MCP registry `websiteUrl` drift detected. Update registry metadata or re-publish metadata-bearing release to align canonical install landing URL.
- MCP registry description prefix matches local metadata.
- Propagation mode enabled: external mismatch accepted temporarily.

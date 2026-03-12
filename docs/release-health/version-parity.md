# Version Parity Report

- Generated: 2026-03-12T00:09:38.739Z
- Local target version: 3.2.5

## Surface Matrix

| Surface | Version | Status | Notes |
|---|---|---|---|
| package.json | 3.2.5 | ok |  |
| server.json (root) | 3.2.5 | ok |  |
| server.json (package entry) | 3.2.5 | ok |  |
| npm dist-tag latest | 3.2.4 | mismatch |  |
| MCP Registry latest | 3.2.4 | mismatch |  |
| MCP Registry websiteUrl | https://mcp.revasserlabs.com | ok | expected: https://mcp.revasserlabs.com |
| MCP Registry description | Session-based Slack MCP for Claude and MCP clients: local-first workflows, secure-default HTTP. | mismatch | expected_prefix: Claude-first Slack MCP for self-host or managed Cloud, with Gemini CLI, deployment review, and secure-default HTTP. |
| Smithery endpoint | n/a | reachable | status: 401; version check is manual. |

## Interpretation

- Local metadata parity: pass.
- External parity mismatch: npm latest, MCP registry latest, MCP registry description prefix.

## Actionable Drift Notes

- MCP registry `websiteUrl` matches local metadata.
- MCP registry description drift detected. Align registry listing description with local `server.json` wording.
- Propagation mode enabled: external mismatch accepted temporarily.

# Version Parity Report

- Generated: 2026-02-28T03:51:28.365Z
- Local target version: 3.0.0

## Surface Matrix

| Surface | Version | Status | Notes |
|---|---|---|---|
| package.json | 3.0.0 | ok |  |
| server.json (root) | 3.0.0 | ok |  |
| server.json (package entry) | 3.0.0 | ok |  |
| npm dist-tag latest | 2.0.0 | mismatch |  |
| MCP Registry latest | 2.0.0 | mismatch |  |
| Smithery endpoint | n/a | reachable | status: 401; version check is manual. |

## Interpretation

- Local metadata parity: pass.
- External parity mismatch: npm latest, MCP registry latest.
- Propagation mode enabled: external mismatch accepted temporarily.

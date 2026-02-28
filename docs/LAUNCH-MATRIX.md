# Capability Matrix (v3.0.0)

Comparison matrix for release notes and channel posts. Keep competitor references unnamed.

| Capability | This Release (`v3.0.0`) | Typical Session-Based Alternatives |
|---|---|---|
| Read-only status checks | Enforced and verified in install flow | Often undocumented or mixed with refresh side effects |
| Deterministic doctor exits | Enforced (`0/1/2/3`) with install-path coverage | Often ad-hoc or text-only |
| Structured diagnostics | Shared fields in MCP/web error payloads | Mixed payload shapes |
| Hosted HTTP auth default | Bearer required on `/mcp` by default | Often permissive by default |
| Hosted HTTP CORS | Explicit allowlist (`SLACK_MCP_HTTP_ALLOWED_ORIGINS`) | Often wildcard/implicit |
| Unknown token age handling | Explicit `unknown_age` semantics | Missing timestamp may appear as stale/failing |
| Tool contract stability | No MCP tool rename/removal | Varies by release |
| Local-first operator path | First-class (`stdio`, `web`) | Varies by runtime emphasis |
| Version parity check | Scripted local/npm/registry report | Often manual |
| Smithery/registry alignment | Metadata prepared in release wave | Often delayed post-release |

## Usage Guidance

1. Use this table in release notes and social threads.
2. Do not name external projects.
3. Keep claims tied to verifiable commands and docs.

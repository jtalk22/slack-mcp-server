# Launch Ops Runbook (v3.0.0)

This runbook defines launch-day monitoring and distribution for technical/operator channels (no X/Reddit dependency).

## Same-Day Fanout Order (9 Channels)

1. GitHub release page refresh (`v3.0.0` copy + install-proof block)
2. npm parity confirm (`@jtalk22/slack-mcp@3.0.0`)
3. MCP registry parity confirm (`3.0.0`)
4. Smithery listing metadata/parity update (or timestamped propagation note)
5. `awesome-mcp-servers` listing PR refresh
6. Glama metadata sync and canonical link verification
7. HN thread update comment (high-signal install proof + support path)
8. GitHub Discussions announcement/support threads update
9. GitHub Pages/docs surface publish + link verification

## Monitoring Cadence

- First 4 hours: every 30 minutes
- Up to 24 hours: every 60 minutes

Track:
- install reports and blocker count
- npm/MCP parity state
- listing propagation status (Smithery/Glama)
- inbound issue and discussion severity
- hosted migration questions (`SLACK_MCP_HTTP_AUTH_TOKEN`, CORS allowlist)

## Triage Rules

P1 install blocker:
- acknowledge within 30-60 minutes
- provide immediate workaround
- add fix to patch queue

Non-blocking request:
- acknowledge and route to issue/discussion template
- provide timeline as best effort

## Escalation Triggers

1. If install failures exceed 3 unique reports in 24h:
- pause outbound promotion
- prioritize hotfix

2. If support load exceeds 2 hours/day for 2 days:
- switch to stability-only mode
- defer non-critical requests

## 24h / 48h / 72h Follow-Up

24h:
- publish release-health delta and short technical summary

48h:
- patch docs for top recurring setup questions

72h:
- ship `v3.0.1` only if launch defects are confirmed

## Evidence Log

Use:
- local `output/release-health/launch-log-template.md` (private by default)

Capture:
- channel
- UTC timestamp
- URL or command evidence
- action taken
- observed result (`success|partial|blocked`)

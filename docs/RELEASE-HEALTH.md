# Release Health Tracking

Use this to track installation reliability and operational load during the current release cycle.

## One-command snapshot

```bash
node scripts/collect-release-health.js
```

Outputs:
- `docs/release-health/latest.md`
- `docs/release-health/YYYY-MM-DD.md`

24-hour loop artifacts:
- `docs/release-health/24h-start.md`
- `docs/release-health/24h-end.md`
- `docs/release-health/24h-delta.md`

## What it captures automatically

- npm downloads (last week, last month)
- npm latest version
- GitHub stars, forks, open issues
- GitHub 14-day traffic views/clones (owner token required via `gh auth`)
- Count of `deployment-intake` issues

## 14-day targets

- weekly downloads: `>= 180`
- qualified deployment-intake submissions: `>= 2`
- support load: `<= 2 hours/week`

## Manual fields to track alongside snapshots

- Weekly support minutes spent.
- Deployment-intake quality (clear use case, owner, timeline).
- Conversion source notes (search, referrals, docs traffic).
- External \"first run succeeded\" confirmations (issues/discussions).

## Recommended cadence

- Days 1-7: daily snapshot
- Days 8-14: every 2-3 days

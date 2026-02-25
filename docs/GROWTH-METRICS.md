# Growth Metrics Tracking

Use this to measure install conversion and support quality during the current free-first cycle.

## One-command snapshot

```bash
node scripts/collect-growth-metrics.js
```

Outputs:
- `docs/growth-metrics/latest.md`
- `docs/growth-metrics/YYYY-MM-DD.md`

## What it captures automatically

- npm downloads (last week, last month)
- npm latest version
- GitHub stars, forks, open issues
- GitHub 14-day traffic views/clones (owner token required via `gh auth`)

## 14-day targets

- weekly downloads: `>= 180`
- successful external first-run confirmations: `>= 3`
- qualified deployment-intake submissions: `>= 2`
- support load: `<= 2 hours/week`

## Manual fields to track alongside snapshots

- Count of first-run confirmations from issues/discussions.
- Count of complete deployment-intake submissions.
- Weekly support minutes spent.

## Recommended cadence

- Days 1-7: daily snapshot
- Days 8-14: every 2-3 days

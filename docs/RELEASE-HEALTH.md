# Release Health Tracking

Use this to track installation reliability and operational load during the current release cycle.

## One-command snapshot

```bash
node scripts/collect-release-health.js
```

Outputs:
- `docs/release-health/latest.md`
- `docs/release-health/YYYY-MM-DD.md`
- `docs/release-health/automation-delta.md` (when delta script is run)

## Version parity report

```bash
npm run verify:version-parity
```

Output:
- `docs/release-health/version-parity.md`

If external registries are still propagating immediately after publish:

```bash
npm run verify:version-parity -- --allow-propagation
```

## Prepublish dry run

```bash
npm run verify:release-dry-run
```

Output:
- `docs/release-health/prepublish-dry-run.md`

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
- Traffic source notes (search, referrals, docs traffic).
- External \"first run succeeded\" confirmations (issues/discussions).

## Recommended cadence

- Days 1-7: daily snapshot
- Days 8-14: every 2-3 days

## Automated cadence (low-touch)

- Workflow: `.github/workflows/release-health.yml`
- Triggers:
  - scheduled at `07:15` and `19:15` UTC
  - manual `workflow_dispatch`
- Outputs per run:
  - workflow summary with current snapshot and baseline delta
  - artifacts: `docs/release-health/latest.md`, `docs/release-health/automation-delta.md`

## Local delta command

If you want to compare two explicit snapshots locally:

```bash
node scripts/build-release-health-delta.js \
  --before docs/release-health/24h-start.md \
  --after docs/release-health/24h-end.md \
  --out docs/release-health/24h-delta.md
```

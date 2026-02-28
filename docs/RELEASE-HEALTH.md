# Release Health Tracking

Operator telemetry is private-by-default in this repo.

By default, release-health scripts write to local gitignored files under:

- `output/release-health/`

Use public docs output only when explicitly needed.

## Snapshot (local default)

```bash
node scripts/collect-release-health.js
```

Outputs:

- `output/release-health/latest.md`
- `output/release-health/YYYY-MM-DD.md`

Optional public output:

```bash
node scripts/collect-release-health.js --public
```

Outputs:

- `docs/release-health/latest.md`
- `docs/release-health/YYYY-MM-DD.md`

## Version Parity (local default)

```bash
npm run verify:version-parity
```

Output:

- `output/release-health/version-parity.md`

Optional public output:

```bash
node scripts/check-version-parity.js --public
```

## Delta Report (local default)

```bash
node scripts/build-release-health-delta.js
```

Defaults:

- `--after output/release-health/latest.md`
- `--out output/release-health/automation-delta.md`

## Prepublish Dry Run (local default)

```bash
npm run verify:release-dry-run
```

Output:

- `output/release-health/prepublish-dry-run.md`

## CI Workflow

Workflow: `.github/workflows/release-health.yml`

- collects local snapshots in `output/release-health/`
- publishes workflow summary
- uploads artifacts for maintainers
- does not commit telemetry files back to the repo

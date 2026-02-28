# State of Union — 2026-02-28

## Scope

Public surface update on `v3.0.0` (no semver bump, no runtime behavior changes).

## What Changed

- Added a hybrid root landing page at `index.html` for GitHub Pages:
  - dual proof layout (static poster + motion proof)
  - stable canonical links (`demo`, `release`, `npm`, setup/migration)
  - trust-first copy and metadata (`og:` + `twitter:` tags)
- Rebuilt and re-applied social preview image:
  - generator: `scripts/build-social-preview.js`
  - output: `docs/images/social-preview-v3.png` (`1280x640`, `<1 MB`)
  - uploaded through repo settings automation with headed Playwright flow
- Tightened README hero ordering:
  - value proposition
  - 3-command verify block
  - static proof poster
  - motion proof links
  - hosted migration note
  - concise star/support CTA
- Refined share surface (`public/share.html`) to match product-first tone:
  - reduced command-heavy framing
  - aligned to active social preview asset
- Refreshed mobile proof assets:
  - `docs/videos/demo-claude-mobile-20s.mp4`
  - `docs/images/demo-claude-mobile-poster.png`
  - mobile generator now starts where tool activity is visible (`--start` default `8`)
- Curated public `docs/release-health/`:
  - kept `latest.md`, `version-parity.md`, `state-of-union-2026-02-28.md`
  - moved historical launch/ops logs to local private archive under `output/release-health/`
- Governance hardening:
  - enabled `enforce_admins=true` for `main` branch protection
  - kept required checks unchanged (`test (20.x)`, `test (22.x)`, `lint`, `attribution`)

## Validation

- `node scripts/verify-core.js` passed.
- `node scripts/verify-web.js` passed.
- `node scripts/verify-install-flow.js --strict-published` passed.
- `bash scripts/check-public-language.sh` passed.
- Public URL checks returned `200`:
  - `https://jtalk22.github.io/slack-mcp-server/`
  - `https://jtalk22.github.io/slack-mcp-server/public/demo-video.html`
  - `https://jtalk22.github.io/slack-mcp-server/public/share.html`
  - `https://jtalk22.github.io/slack-mcp-server/docs/videos/demo-claude-mobile-20s.mp4`
  - `https://jtalk22.github.io/slack-mcp-server/docs/images/social-preview-v3.png`

## Notes

- Discussion pinning remains a manual GitHub UI step for `#12` (Announcements).
- Render audit screenshots are stored locally only in `output/release-health/` (private by default).
- GitHub traffic panels can lag by ~24h; short-term drops should be interpreted with that delay in mind.

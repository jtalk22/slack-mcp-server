#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Terms that tend to read as hype/manipulative for technical audiences.
DISALLOWED='(?i)(\bstealth\b|\bgrowth\b|social-proof|social proof|share kit|\bviral\b|growth loop|\bgrindset\b|\bdominate\b|hack growth|edge line|launch-ready)'

SCAN_PATHS=(
  "$ROOT/README.md"
  "$ROOT/index.html"
  "$ROOT/docs"
  "$ROOT/public"
  "$ROOT/.github/ISSUE_REPLY_TEMPLATE.md"
  "$ROOT/.github/RELEASE_NOTES_TEMPLATE.md"
  "$ROOT/docs/COMMUNICATION-STYLE.md"
)

echo "Scanning public-facing text for disallowed wording..."

if rg -Nni "$DISALLOWED" "${SCAN_PATHS[@]}"; then
  echo "Disallowed public wording found. Use neutral reliability/compatibility language."
  exit 1
fi

echo "Public wording check passed."

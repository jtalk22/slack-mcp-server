#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Terms that tend to read as hype/manipulative for technical audiences.
#
# "stealth" was on this list and is deliberately off it (James, 2026-10-07): it
# describes the one thing that is actually true and actually unusual about the
# local path — no app to install, no bot identity, nothing in a workspace's app
# directory — and the ban cost more than it bought.
#
# What stays banned is the claim that rode along with it. "No audit trail" is
# false: the server calls Slack as the signed-in user with that user's own
# session, so a workspace sees the same API activity it would see from any
# client signed in as that person. Say stealth; never say invisible.
DISALLOWED='(?i)(\bgrowth\b|social-proof|social proof|share kit|\bviral\b|growth loop|\bgrindset\b|\bdominate\b|hack growth|edge line|launch-ready|no audit trail|invisible to admins|zero footprint)'

SCAN_PATHS=(
  "$ROOT/README.md"
  "$ROOT/index.html"
  "$ROOT/docs"
  "$ROOT/public"
  "$ROOT/templates/public-pages"
  "$ROOT/.github/launch-posts.md"
  "$ROOT/.github/ISSUE_REPLY_TEMPLATE.md"
  "$ROOT/.github/RELEASE_NOTES_TEMPLATE.md"
)

echo "Scanning public-facing text for disallowed wording..."

if rg -Nni "$DISALLOWED" "${SCAN_PATHS[@]}"; then
  echo "Disallowed public wording found. Use neutral reliability/compatibility language."
  exit 1
fi

echo "Public wording check passed."

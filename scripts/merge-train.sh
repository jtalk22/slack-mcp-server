#!/usr/bin/env bash
#
# Merge several pull requests in order without hand-rebasing each one.
#
# `main` is branch-protected with "require branches to be up to date"
# (`strict: true`), so the moment one pull request merges, every other open one
# is stale and has to be replayed on top of it. Doing that by hand is slow and
# the failure is quiet: a merge can succeed and still drop another branch's edit
# to the same file.
#
# This does the same thing the same way every time — rebase, run the full gate
# set locally, push, wait for CI, merge, move to the next.
#
#   scripts/merge-train.sh 252 255 254        # in the order given
#   scripts/merge-train.sh --dry-run 252 255  # say what it would do
#
# The durable fix is a merge queue, which does this on GitHub's side; the
# `merge_group:` trigger in ci.yml is the half of that which lives in this
# repository. Until it is switched on, this is the deterministic local path.

set -euo pipefail

DRY_RUN=0
PRS=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) PRS+=("$arg") ;;
  esac
done

if [ ${#PRS[@]} -eq 0 ]; then
  echo "usage: scripts/merge-train.sh [--dry-run] <pr> [<pr> ...]" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit or stash first." >&2
  exit 1
fi

START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
restore() { git checkout -q "$START_BRANCH" 2>/dev/null || true; }
trap restore EXIT

# Every gate the release depends on, run locally before CI sees the branch, so
# a red one costs a second rather than a round trip.
run_gates() {
  npm test
  npm run verify:api-docs
  npm run verify:public-pages
  node scripts/check-public-surface-integrity.js
  bash scripts/check-public-language.sh
  npm run verify:attribution-guardrail
}

for pr in "${PRS[@]}"; do
  echo
  echo "=== PR #${pr} ==="
  branch="$(gh pr view "$pr" --json headRefName --jq .headRefName)"
  state="$(gh pr view "$pr" --json state --jq .state)"
  if [ "$state" != "OPEN" ]; then
    echo "  #${pr} is ${state}; skipping."
    continue
  fi

  git fetch origin --quiet
  echo "  branch: ${branch}"

  if [ "$DRY_RUN" -eq 1 ]; then
    behind="$(git rev-list --count "origin/${branch}..origin/main")"
    echo "  would rebase (${behind} commits behind main), run gates, push, wait for CI, squash-merge"
    continue
  fi

  git checkout -q -B "merge-train/${branch}" "origin/${branch}"
  if ! git rebase origin/main; then
    git rebase --abort || true
    echo "  CONFLICT rebasing ${branch} onto main. Resolve by hand, then re-run." >&2
    exit 1
  fi

  run_gates

  git push --force-with-lease --quiet origin "HEAD:${branch}"
  echo "  pushed; waiting for CI"

  # Let the new run register before asking about it, or `gh pr checks` reports
  # the previous commit's verdict and the train merges something untested.
  sleep 20
  if ! gh pr checks "$pr" --watch --fail-fast; then
    echo "  CI failed on #${pr}. Stopping; nothing after it was touched." >&2
    exit 1
  fi

  # An explicit body keeps GitHub from appending the branch's co-author
  # trailers (a Dependabot commit adds one), which the attribution guard rejects.
  gh pr merge "$pr" --squash --body "Merged by scripts/merge-train.sh."
  echo "  merged #${pr}"
  git checkout -q main
  git branch -D "merge-train/${branch}" -q 2>/dev/null || true
done

git checkout -q main
git fetch origin --quiet
git merge --ff-only origin/main --quiet
echo
echo "Train complete. main is at $(git rev-parse --short HEAD)."

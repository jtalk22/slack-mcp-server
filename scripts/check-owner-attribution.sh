#!/usr/bin/env bash
set -euo pipefail

EXPECTED_NAME="${EXPECTED_GIT_NAME:-jtalk22}"
EXPECTED_EMAIL="${EXPECTED_GIT_EMAIL:-james@revasser.nyc}"
ALLOW_GITHUB_WEB_COMMITTER="${ALLOW_GITHUB_WEB_COMMITTER:-0}"
BANNED_REGEX='(?i)(co-authored-by|generated with|\bclaude\b|\bgpt\b|\bcopilot\b|\bgemini\b|\bai\b)'

die() {
  echo "ERROR: $*" >&2
  exit 1
}

contains_banned_markers() {
  local text="$1"
  if command -v rg >/dev/null 2>&1; then
    rg -Niq "$BANNED_REGEX" <<<"$text"
  else
    grep -Eiq '(Co-authored-by|Generated with|Claude|GPT|Copilot|Gemini)' <<<"$text" \
      || grep -Eiq '(^|[^[:alnum:]_])[Aa][Ii]([^[:alnum:]_]|$)' <<<"$text"
  fi
}

is_allowed_owner_author() {
  local name="$1"
  local email="$2"

  if [[ "$name" != "$EXPECTED_NAME" ]]; then
    return 1
  fi

  if [[ "$email" == "$EXPECTED_EMAIL" ]]; then
    return 0
  fi

  if [[ "$ALLOW_GITHUB_WEB_COMMITTER" == "1" ]]; then
    if [[ "$email" == "${EXPECTED_NAME}@users.noreply.github.com" || "$email" =~ ^[0-9]+\+${EXPECTED_NAME}@users\.noreply\.github\.com$ ]]; then
      return 0
    fi
  fi

  return 1
}

is_allowed_owner_committer() {
  local committer_name="$1"
  local committer_email="$2"
  local author_name="$3"
  local author_email="$4"

  if [[ "$committer_name" == "$EXPECTED_NAME" && "$committer_email" == "$EXPECTED_EMAIL" ]]; then
    return 0
  fi

  if [[ "$ALLOW_GITHUB_WEB_COMMITTER" == "1" ]]; then
    if [[ "$committer_name" == "$EXPECTED_NAME" ]]; then
      if [[ "$committer_email" == "${EXPECTED_NAME}@users.noreply.github.com" || "$committer_email" =~ ^[0-9]+\+${EXPECTED_NAME}@users\.noreply\.github\.com$ ]]; then
        if is_allowed_owner_author "$author_name" "$author_email"; then
          return 0
        fi
      fi
    fi

    if [[ "$committer_name" == "GitHub" && "$committer_email" == "noreply@github.com" ]]; then
      if is_allowed_owner_author "$author_name" "$author_email"; then
        return 0
      fi
    fi
  fi

  return 1
}

if [[ "${SKIP_LOCAL_CONFIG_CHECK:-0}" != "1" ]]; then
  local_name="$(git config --get user.name || true)"
  local_email="$(git config --get user.email || true)"

  [[ -n "$local_name" ]] || die "Missing repo-local git user.name"
  [[ -n "$local_email" ]] || die "Missing repo-local git user.email"

  [[ "$local_name" == "$EXPECTED_NAME" ]] \
    || die "Repo-local user.name is '$local_name' (expected '$EXPECTED_NAME')"
  [[ "$local_email" == "$EXPECTED_EMAIL" ]] \
    || die "Repo-local user.email is '$local_email' (expected '$EXPECTED_EMAIL')"
fi

default_range="HEAD"
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  default_range="origin/main..HEAD"
fi

range="${1:-${GIT_CHECK_RANGE:-$default_range}}"

git rev-list --count "$range" >/dev/null 2>&1 || die "Invalid commit range: $range"
commit_count="$(git rev-list --count "$range")"

if [[ "$commit_count" -eq 0 ]]; then
  echo "No commits to validate in range '$range'."
  exit 0
fi

errors=0

while IFS= read -r sha; do
  author_name="$(git show -s --format=%an "$sha")"
  author_email="$(git show -s --format=%ae "$sha")"
  committer_name="$(git show -s --format=%cn "$sha")"
  committer_email="$(git show -s --format=%ce "$sha")"
  body="$(git show -s --format=%B "$sha")"

  if ! is_allowed_owner_author "$author_name" "$author_email"; then
    echo "Commit $sha has author '$author_name <$author_email>' (expected '$EXPECTED_NAME <$EXPECTED_EMAIL>')." >&2
    errors=1
  fi

  if ! is_allowed_owner_committer "$committer_name" "$committer_email" "$author_name" "$author_email"; then
    echo "Commit $sha has committer '$committer_name <$committer_email>' (expected '$EXPECTED_NAME <$EXPECTED_EMAIL>')." >&2
    errors=1
  fi

  if contains_banned_markers "$body"; then
    echo "Commit $sha contains disallowed attribution markers in commit message." >&2
    errors=1
  fi
done < <(git rev-list "$range")

if [[ "$errors" -ne 0 ]]; then
  exit 1
fi

echo "Owner-only attribution check passed for $commit_count commit(s) in '$range'."

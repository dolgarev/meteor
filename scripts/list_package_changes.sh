#!/bin/bash
# =============================================================================
# list_package_changes.sh
# Lists folders changed inside /package for every open PR
#
# Usage:
#   ./list_package_changes.sh [--output file.json]
#
# Examples:
#   ./list_package_changes.sh
#   ./list_package_changes.sh --output packages_by_pr.json
#
# Requirements:
#   - gh CLI installed and authenticated (gh auth login)
# =============================================================================

set -euo pipefail

OUTPUT_FILE=""
if [[ "${1:-}" == "--output" && -n "${2:-}" ]]; then
  OUTPUT_FILE="$2"
fi

# --- Check gh CLI is available and authenticated ---
if ! command -v gh &>/dev/null; then
  echo "❌  gh CLI not found. Install it at https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null 2>&1; then
  echo "❌  gh CLI is not authenticated. Run: gh auth login"
  exit 1
fi

# --- Detect owner/repo from git remote ---
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")
if [[ -z "$REPO" ]]; then
  echo "❌  Could not detect repository. Run this script inside a git repository."
  exit 1
fi

echo "📦  Repository: $REPO"
echo "⬇️   Fetching open PRs..."

# --- Fetch all open PRs ---
ALL_PRS=$(gh pr list \
  --repo "$REPO" \
  --state open \
  --limit 500 \
  --json number,title,headRefName,author,url)

TOTAL=$(echo "$ALL_PRS" | jq 'length')
echo "✅  $TOTAL open PRs found"
echo ""

# --- Loop through each PR ---
RESULT="{}"
FOUND_ANY=false

while IFS= read -r pr; do
  PR_NUM=$(echo "$pr"    | jq -r '.number')
  PR_TITLE=$(echo "$pr"  | jq -r '.title')
  PR_BRANCH=$(echo "$pr" | jq -r '.headRefName')
  PR_AUTHOR=$(echo "$pr" | jq -r '.author.login')
  PR_URL=$(echo "$pr"    | jq -r '.url')

  # Fetch changed files for this PR
  PR_FILES=$(gh pr view "$PR_NUM" \
    --repo "$REPO" \
    --json files \
    -q '.files[].path' 2>/dev/null || echo "")

  if [[ -z "$PR_FILES" ]]; then
    continue
  fi

  # Filter files inside /packages and extract immediate subfolder
  # e.g. packages/my-module/src/foo.ts → packages/my-module
  PACKAGES=$(echo "$PR_FILES" \
    | (grep -E '^packages/' || true) \
    | awk -F'/' '{print $1"/"$2}' \
    | sort -u)

  if [[ -z "$PACKAGES" ]]; then
    continue
  fi

  FOUND_ANY=true

  # Print to terminal
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "PR #$PR_NUM — $PR_TITLE"
  echo "👤  $PR_AUTHOR  |  🌿 $PR_BRANCH"
  echo "🔗  $PR_URL"
  echo "📁  Changed folders in /package:"
  while IFS= read -r pkg; do
    echo "    • $pkg"
  done <<< "$PACKAGES"
  echo ""

  # Accumulate JSON result — keyed by package name
  PR_ENTRY=$(jq -n \
    --argjson num "$PR_NUM" \
    --arg title "$PR_TITLE" \
    --arg branch "$PR_BRANCH" \
    --arg author "$PR_AUTHOR" \
    --arg url "$PR_URL" \
    '{pr: $num, title: $title, branch: $branch, author: $author, url: $url}')
  while IFS= read -r pkg; do
    RESULT=$(echo "$RESULT" | jq --arg pkg "$pkg" --argjson entry "$PR_ENTRY" \
      'if has($pkg) then .[$pkg] += [$entry] else . + {($pkg): [$entry]} end')
  done <<< "$PACKAGES"

done < <(echo "$ALL_PRS" | jq -c '.[]')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$FOUND_ANY" == false ]]; then
  echo "ℹ️   No PRs found that change files inside /packages."
else
  PKG_COUNT=$(echo "$RESULT" | jq 'keys | length')
  echo "📊  $PKG_COUNT package(s) touched across open PRs."
fi

# --- Save JSON if requested ---
if [[ -n "$OUTPUT_FILE" ]]; then
  echo "$RESULT" | jq '.' > "$OUTPUT_FILE"
  echo "💾  Results saved to: $OUTPUT_FILE"
fi
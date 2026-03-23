#!/bin/bash

# STARK — Push to All Remotes
# Pushes current branch to all configured remotes
#
# Usage:
#   ./scripts/push-all.sh              # Push current branch
#   ./scripts/push-all.sh --pr         # Create PR after pushing
#   ./scripts/push-all.sh --pr "Title" # Create PR with title

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

BRANCH=$(git rev-parse --abbrev-ref HEAD)
CREATE_PR=false
PR_TITLE=""

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --pr)
      CREATE_PR=true
      if [[ "${2:-}" != "" && "${2:-}" != --* ]]; then
        PR_TITLE="$2"
        shift
      fi
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo "═══════════════════════════════════════════════════════"
echo "  STARK — Push to All Remotes"
echo "  Branch: $BRANCH"
echo "═══════════════════════════════════════════════════════"
echo ""

# Get all remotes
REMOTES=$(git remote)

for remote in $REMOTES; do
  echo -n "Pushing to $remote... "
  if git push "$remote" "$BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
  else
    # Try with upstream set
    if git push -u "$remote" "$BRANCH" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} (upstream set)"
    else
      echo -e "${RED}✗${NC}"
    fi
  fi
done

echo ""

# Create PR if requested
if $CREATE_PR && [[ "$BRANCH" != "main" ]]; then
  echo "Creating PR..."

  if [[ -z "$PR_TITLE" ]]; then
    # Use branch name as title
    PR_TITLE=$(echo "$BRANCH" | sed 's/feature\///' | sed 's/-/ /g' | sed 's/\b\w/\u&/g')
  fi

  gh pr create --title "$PR_TITLE" --body "$(cat <<EOF
## Summary

Auto-generated PR from ADAPT workflow.

## Auto-Merge Policy

This PR will be auto-merged after 2 hours if:
- CI checks pass
- No blocking review comments
- Not marked "DO NOT MERGE"

---
🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" || echo "PR may already exist"

  echo ""
  echo -e "${CYAN}PR created. Will auto-merge in 2 hours if not reviewed.${NC}"
fi

echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}Done!${NC}"

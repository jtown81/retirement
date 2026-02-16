#!/bin/sh
# push-updates.sh — Stage, commit, and push retire app to GitHub
# Usage: ./push-updates.sh [commit message]

set -e

RETIRE_DIR="/home/jpl/app-dev/retire"
REMOTE="https://github.com/jtown81/retirement.git"
BRANCH="main"

cd "$RETIRE_DIR"

MSG="${1:-Updates 2/11/26 V2 — FERS estimate, expenses, simulation, UI restructure}"

# Ensure remote is set
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "==> Adding remote origin: $REMOTE"
  git remote add origin "$REMOTE"
fi

echo "==> Staging all changes in $RETIRE_DIR ..."
git add -A

echo "==> Checking for staged changes..."
if git diff --cached --quiet; then
  echo "Nothing to commit — no changes staged."
  exit 0
fi

echo "==> Creating commit..."
git commit -m "$MSG"

echo "==> Pulling remote changes (if any)..."
git pull --rebase origin "$BRANCH" 2>/dev/null || true

echo "==> Pushing to origin/$BRANCH ..."
git push -u origin "$BRANCH"

echo "==> Done. Repository updated."
git log --oneline -1

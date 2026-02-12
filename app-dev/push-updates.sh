#!/bin/sh
# push-updates.sh — Stage, commit, and push updates to GitHub
# Usage: ./push-updates.sh [commit message]
# If no message is provided, a default is used.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
APP_DIR="app-dev"

cd "$REPO_ROOT"

MSG="${1:-Updates 2/11/26 V2 — FERS estimate, expenses, simulation, UI restructure}"

echo "==> Repo root: $REPO_ROOT"
echo "==> Staging changes in $APP_DIR/ ..."

git add "$APP_DIR/"

echo "==> Checking for staged changes..."
if git diff --cached --quiet; then
  echo "Nothing to commit — no changes staged."
  exit 0
fi

echo "==> Creating commit..."
git commit -m "$MSG"

echo "==> Pushing to origin/main..."
git push origin main

echo "==> Done. Repository updated."
git log --oneline -1

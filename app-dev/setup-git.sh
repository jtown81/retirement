#!/bin/bash

# Script to initialize and push project to GitHub
# Repository: github.com/jtown81/retirement

REPO_DIR="${1:-.}"
GITHUB_URL="https://github.com/jtown81/retirement.git"
MAIN_BRANCH="main"

echo "================================"
echo "Git Repository Setup"
echo "================================"
echo "Repository URL: $GITHUB_URL"
echo "Working directory: $REPO_DIR"
echo ""

# Change to project directory
cd "$REPO_DIR" || exit 1

# Check if git is already initialized
if [ -d .git ]; then
    echo "✓ Git repository already initialized"
else
    echo "Initializing git repository..."
    git init
    echo "✓ Git initialized"
fi

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "Updating existing remote..."
    git remote set-url origin "$GITHUB_URL"
    echo "✓ Remote updated"
else
    echo "Adding GitHub remote..."
    git remote add origin "$GITHUB_URL"
    echo "✓ Remote added"
fi

# Check current branch and rename to main if needed
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$CURRENT_BRANCH" != "$MAIN_BRANCH" ] && [ -n "$CURRENT_BRANCH" ]; then
    echo "Renaming branch from '$CURRENT_BRANCH' to '$MAIN_BRANCH'..."
    git branch -M "$MAIN_BRANCH"
    echo "✓ Branch renamed to $MAIN_BRANCH"
fi

# Display git status
echo ""
echo "================================"
echo "Current Status"
echo "================================"
git config --get remote.origin.url
echo ""
git status
echo ""

# Show next steps
echo "================================"
echo "Next Steps"
echo "================================"
echo "1. Review the files above with: git status"
echo "2. Stage files with: git add ."
echo "3. Commit with: git commit -m 'Initial commit'"
echo "4. Push to GitHub with: git push -u origin $MAIN_BRANCH"
echo ""
echo "Or run everything at once:"
echo "  git add . && git commit -m 'Initial commit' && git push -u origin $MAIN_BRANCH"

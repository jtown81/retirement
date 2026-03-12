# Development Workflow

This document defines the branch strategy and development workflow for all projects in the jtown81 organization.

## Branch Strategy

### Master Branch (`master`)
- **Purpose:** Production-ready code only
- **Protection:** Requires code review before merge
- **Access:** Merge only from `dev` or hotfix branches
- **Deployments:** Tagged releases from master
- **Status:** Always stable, releasable

### Dev Branch (`dev`)
- **Purpose:** Integration branch for features
- **Protection:** Requires pull request review before merge
- **Access:** Feature branches merge into dev
- **Deployments:** Internal testing, staging
- **Status:** Latest development code

### Feature Branches (`feature/*`, `fix/*`, `docs/*`)
- **Naming:** `feature/description`, `fix/bug-name`, `docs/topic`
- **Base:** Branch from `dev`
- **Lifetime:** Deleted after merge to dev
- **CI/CD:** Automated tests run on push

### Hotfix Branches (`hotfix/*`)
- **Naming:** `hotfix/critical-issue`
- **Base:** Branch from `master` ONLY
- **Purpose:** Critical production fixes
- **Merge:** Back to both `master` AND `dev`
- **Lifetime:** Deleted after merge

## Development Workflow

### 1. Start New Feature

```bash
# Update local dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/my-feature dev

# Or for bug fixes:
git checkout -b fix/bug-description dev

# Or for documentation:
git checkout -b docs/feature-docs dev
```

### 2. Make Changes

```bash
# Work on your feature
# Edit files, write code, commit regularly

git add .
git commit -m "feat: Add new capability

- Description of what was added
- Why it was needed
- Any breaking changes or dependencies"

# Multiple commits are OK - they will be squashed later
```

### Commit Message Format

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting, missing semicolons, etc)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build, dependencies, etc

Example:
```
feat: Add email notification system

- Implement SMTP integration
- Add email template engine
- Include retry logic for failed sends
- Update documentation

Closes #123
```

### 3. Push and Create Pull Request

```bash
# Push feature branch to GitHub
git push origin feature/my-feature

# Create pull request via GitHub UI or CLI
gh pr create --base dev --head feature/my-feature \
  --title "feat: Add new capability" \
  --body "Description of changes and testing done"
```

### 4. Code Review

- At least one code review required
- CI/CD checks must pass
- Address review comments with new commits
- No force push during review

```bash
# If changes requested:
git add .
git commit -m "refactor: Address review comments"
git push origin feature/my-feature
```

### 5. Merge to Dev

```bash
# Via GitHub UI: "Squash and merge"
# OR via CLI:

git checkout dev
git pull origin dev
git merge --squash feature/my-feature
git commit -m "feat: Add new capability

Co-Authored-By: Reviewer <email@example.com>"

git push origin dev

# Delete feature branch
git push origin --delete feature/my-feature
git branch -d feature/my-feature
```

### 6. Release to Master

When ready for production release:

```bash
# Ensure dev is fully tested and stable
git checkout master
git pull origin master
git merge dev
git push origin master

# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Update dev to match master (if needed)
git checkout dev
git pull origin dev
git merge master
git push origin dev
```

## Hotfix Process (Urgent Production Fixes)

Use only for critical issues in production:

```bash
# 1. Create hotfix from master
git checkout master
git pull origin master
git checkout -b hotfix/critical-issue master

# 2. Make fix
git add .
git commit -m "fix: Critical production issue

Description of critical issue and fix applied"

# 3. Merge back to master
git checkout master
git merge --no-ff hotfix/critical-issue
git push origin master
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin v1.0.1

# 4. Also merge back to dev (IMPORTANT!)
git checkout dev
git merge --no-ff hotfix/critical-issue
git push origin dev

# 5. Delete hotfix branch
git push origin --delete hotfix/critical-issue
git branch -d hotfix/critical-issue
```

## Pull Request Requirements

Before merging, PRs must have:

- [ ] Descriptive title (feat/fix/docs: ...)
- [ ] Clear description of changes
- [ ] Testing performed documented
- [ ] No unresolved conversations
- [ ] All CI/CD checks passing
- [ ] At least 1 approval
- [ ] Appropriate labels
- [ ] Related issues linked (Closes #123)

## CI/CD Checks

All branches trigger automated checks:

- TypeScript compilation
- Linting (ESLint, Prettier)
- Unit tests
- Build verification
- Type checking
- Security scanning (if applicable)

**Merge blocked if checks fail.**

## Common Commands Reference

```bash
# Sync with latest remote
git fetch origin
git rebase origin/dev

# Check branch status
git status
git log --oneline origin/dev..HEAD

# View all branches
git branch -a

# Delete local branch
git branch -d feature/done

# Delete remote branch
git push origin --delete feature/done

# Rename branch
git branch -m old-name new-name

# Unstage changes
git restore --staged file.ts

# Discard local changes
git restore file.ts

# Squash last 3 commits
git rebase -i HEAD~3

# View differences from dev
git diff dev

# View commit history
git log --oneline -n 20
```

## Troubleshooting

### Accidentally committed to master
```bash
git reset --soft HEAD~1
git stash
git checkout dev
git stash pop
git add .
git commit -m "..."
```

### Need to sync with latest dev
```bash
git fetch origin
git rebase origin/dev
```

### Merge conflict
```bash
# View conflicts
git status

# Edit conflicted files

# Mark as resolved
git add conflicted-file.ts

# Continue rebase or merge
git rebase --continue
# or
git merge --continue
```

### Accidentally pushed to wrong branch
```bash
# Reset remote branch to previous state
git push origin +HEAD^:feature/wrong-branch

# Force local to match
git reset --hard origin/feature/correct-branch
```

## Best Practices

1. **Commit Often** - Small, logical commits are easier to review
2. **Write Good Messages** - Future you will appreciate it
3. **Keep Branches Short-Lived** - Merge within 1-2 days if possible
4. **Test Before Push** - Run tests locally first
5. **Communicate** - Use PR descriptions to explain the "why"
6. **Review Thoroughly** - Take time reviewing others' code
7. **Keep Master Stable** - Never merge broken code
8. **Document Changes** - Update README/docs if needed
9. **Use Issues** - Reference issues in commits/PRs
10. **Stay Updated** - Rebase on dev frequently

## Team Roles

### Developer
- Creates feature/fix branches
- Submits PRs
- Responds to reviews
- Follows workflow

### Reviewer
- Reviews code for quality
- Tests changes locally when needed
- Approves or requests changes
- Merges approved PRs

### Release Manager (optional)
- Manages releases to master
- Tags versions
- Updates release notes
- Coordinates hotfixes

## Questions or Issues?

If the workflow doesn't work for your project, update your project's `CLAUDE.md` to document any deviations. Consistency within a project is more important than rigid adherence to this global template.

# Git Update Guide — Push All Projects to GitHub

Step-by-step guide to commit and push all five workspace projects to their GitHub remotes.

---

## Repo Map

| Project | Directory | GitHub Remote | Branch |
|---------|-----------|---------------|--------|
| Retirement Planner | `/home/jpl/app-dev/` (root) | `jtown81/retirement` | `main` |
| Fishing Tournament | `/home/jpl/app-dev/fishing/` | `jtown81/fishing` | `main` |
| Cabin Tracker | `/home/jpl/app-dev/cabin/` | `jtown81/cabin-cost-tracking` | `master` |
| 3Peaks Templates | `/home/jpl/app-dev/3peaks/` | `jtown81/3peaks-production` | `master` |
| Brand Assets | `/home/jpl/app-dev/brand/` | `jtown81/logo-jl-brand` | `master` |

---

## Pre-flight Checks

```bash
# Confirm GitHub CLI is authenticated
gh auth status

# Confirm remotes for all five repos
git -C /home/jpl/app-dev remote -v
git -C /home/jpl/app-dev/fishing remote -v
git -C /home/jpl/app-dev/cabin remote -v
git -C /home/jpl/app-dev/3peaks remote -v
git -C /home/jpl/app-dev/brand remote -v
```

---

## Project 1: retire-app → jtown81/retirement (branch: main)

**What's changing:**
- Deleted: all old `app/src/`, `app/tests/`, etc. file paths (~200+ rename artifacts)
- Added: all new `retire-app/` source tree
- Modified: `CLAUDE.md` — workspace scope enforcement rules added
- Modified: `TO-DO.md` — path reference updated (`app/tests/` → `retire-app/tests/`)
- New: `retire-app/CLAUDE.md` — project-level workspace context

> **Note:** The workspace root `.git/` IS the retirement app repo. Run all commands from
> `/home/jpl/app-dev/`, not from inside `retire-app/`.

```bash
cd /home/jpl/app-dev

# Stage everything — the rename must be committed atomically
git add -A

# Optional: review staged changes before committing
git status --short | head -40
git diff --cached --stat

# Commit
git commit -m "refactor: rename app/ to retire-app/ and update workspace docs

- Rename app/ directory to retire-app/ for clarity in multi-project workspace
- Update CLAUDE.md with strict workspace scope enforcement rules
- Update TO-DO.md path reference (app/tests/ → retire-app/tests/)
- Create retire-app/CLAUDE.md with project-level workspace context"

# Push
git push origin main
```

---

## Project 2: fishing → jtown81/fishing (branch: main)

**What's changing:** `M CLAUDE.md` — workspace context section added

```bash
cd /home/jpl/app-dev/fishing
git add CLAUDE.md
git commit -m "docs: add workspace context and scope restriction section

Clarifies this project runs independently in a multi-project workspace.
Commands must run from fishing/ and commits go to fishing/.git/."
git push origin main
```

---

## Project 3: cabin → jtown81/cabin-cost-tracking (branch: master)

**What's changing:** `M CLAUDE.md` — workspace context section added

```bash
cd /home/jpl/app-dev/cabin
git add CLAUDE.md
git commit -m "docs: add workspace context and scope restriction section

Clarifies this project runs independently in a multi-project workspace.
Commands must run from cabin/ and commits go to cabin/.git/."
git push origin master
```

---

## Project 4: 3peaks → jtown81/3peaks-production (branch: master)

**What's changing:** `M CLAUDE.md` — workspace context section added

```bash
cd /home/jpl/app-dev/3peaks
git add CLAUDE.md
git commit -m "docs: add workspace context and scope restriction section

Clarifies this project runs independently in a multi-project workspace.
Commands must run from 3peaks/ and commits go to 3peaks/.git/."
git push origin master
```

---

## Project 5: brand → jtown81/logo-jl-brand (branch: master)

**What's changing:** `M CLAUDE.md` — workspace context section added

```bash
cd /home/jpl/app-dev/brand
git add CLAUDE.md
git commit -m "docs: add workspace context and scope restriction section

Clarifies this project runs independently in a multi-project workspace.
Commands must run from brand/ and commits go to brand/.git/."
git push origin master
```

---

## Verification

After all pushes, confirm local and remote are in sync:

```bash
# Check latest local commit on each repo
git -C /home/jpl/app-dev log --oneline -1
git -C /home/jpl/app-dev/fishing log --oneline -1
git -C /home/jpl/app-dev/cabin log --oneline -1
git -C /home/jpl/app-dev/3peaks log --oneline -1
git -C /home/jpl/app-dev/brand log --oneline -1

# Open each repo on GitHub to confirm
gh browse -R jtown81/retirement
gh browse -R jtown81/fishing
gh browse -R jtown81/cabin-cost-tracking
gh browse -R jtown81/3peaks-production
gh browse -R jtown81/logo-jl-brand
```

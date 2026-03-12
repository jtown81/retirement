# Merge Plan: projects/ → app-dev/

**Date**: 2026-03-12
**Goal**: Consolidate all active development under `/home/jpl/app-dev/` as a unified workspace. Each project keeps its own git remote but lives under one root directory. Remove `/home/jpl/projects/` as a separate location.

---

## Current State

```
/home/jpl/
├── app-dev/                     ← NEW git root (retirement app)
│   ├── app/                     ← Active Astro+React retirement app
│   ├── docs/, content/          ← Architecture, formulas, regulations
│   └── projects/                ← Only tracked utility scripts (workflow tools)
└── projects/                    ← SEPARATE LOCATION — 5 independent git repos
    ├── retirement-planning/     ← Legacy monorepo snapshot (OVERLAPS app-dev)
    ├── fishing/                 ← Tournament PWA (React 19 + Vite + Capacitor)
    ├── 3peaks-production/       ← HTML templates (no build system)
    ├── cabin-cost-tracking/     ← Expense app (Docker configs + early stage)
    └── logo-jl-brand/           ← Brand/design assets (static files)
```

## Target State

```
/home/jpl/app-dev/               ← Workspace root (retirement app git root)
├── .git/                        ← Retirement app git repo (jtown81/retirement)
├── app/                         ← Retirement Astro+React app (unchanged)
├── docs/, content/              ← Retirement docs (unchanged)
├── CLAUDE.md, TO-DO.md, etc.    ← Root files (unchanged)
│
├── fishing/                     ← Tournament PWA (own git: jtown81/fishing)
├── 3peaks/                      ← Production templates (own git: jtown81/3peaks-production)
├── cabin/                       ← Cabin expense app (own git: jtown81/cabin-cost-tracking)
├── brand/                       ← JL brand assets (own git: jtown81/logo-jl-brand)
│
└── _archive/
    └── retirement-planning/     ← Legacy monorepo snapshot (reference only)
```

Each sub-project remains an independent git repo (its own `.git/`, its own remote). The workspace root (`app-dev/`) is tracked by the retirement git repo and will ignore the sub-project directories via `.gitignore`.

---

## Project Inventory

| Project | Location (current) | Git Remote | Status | Action |
|---------|-------------------|------------|--------|--------|
| **Retirement app** | `app-dev/app/` | jtown81/retirement | ACTIVE | Keep — canonical |
| **retirement-planning** | `projects/retirement-planning/` | jtown81/retirement-planning | ARCHIVE | Compare → archive |
| **fishing** | `projects/fishing/` | jtown81/fishing | ACTIVE | Move to `app-dev/fishing/` |
| **3peaks-production** | `projects/3peaks-production/` | jtown81/3peaks-production | ACTIVE | Move to `app-dev/3peaks/` |
| **cabin-cost-tracking** | `projects/cabin-cost-tracking/` | jtown81/cabin-cost-tracking | EARLY | Move to `app-dev/cabin/` |
| **logo-jl-brand** | `projects/logo-jl-brand/` | jtown81/logo-jl-brand | STATIC | Move to `app-dev/brand/` |

---

## Phase 1 — Compare retirement-planning vs app-dev

The most important comparison: two versions of the same app with divergent git histories.

### 1.1 Side-by-side structure comparison

```bash
# See what's in retirement-planning that app-dev lacks
diff <(find /home/jpl/projects/retirement-planning -type f | sed 's|.*/retirement-planning/||' | sort) \
     <(find /home/jpl/app-dev/app -type f | sed 's|.*/app-dev/||' | sort)
```

Key areas to check manually:

| Category | retirement-planning path | app-dev path | Compare? |
|----------|--------------------------|--------------|----------|
| Annuity formulas | `packages/simulation/src/annuity.ts` | `app/src/modules/simulation/` | YES |
| TSP logic | `packages/tsp/src/` | `app/src/modules/tsp/` | YES |
| Tax brackets | `packages/tax/src/` | `app/src/modules/tax/` | YES |
| Expense modeling | `packages/expenses/src/` | `app/src/modules/expenses/` | YES |
| Leave accrual | `packages/leave/src/` | `app/src/modules/leave/` | YES |
| Military buyback | `packages/military/src/` | `app/src/modules/military/` | YES |
| Data models | `packages/models/src/` | `app/src/models/` | YES |
| Validation | `packages/validation/src/` | `app/src/modules/validation/` | YES |
| UI components | `packages/ui/src/` | `app/src/components/` | YES |
| Formula registry | (inline comments only) | `docs/formula-registry.md` | NOTE |

### 1.2 Determine canonical versions

Run this for each module to see which is newer by commit date:

```bash
# retirement-planning last commit touching a module
git -C /home/jpl/projects/retirement-planning log --oneline -- packages/simulation/src/

# app-dev last commit touching same module
git -C /home/jpl/app-dev log --oneline -- app/src/modules/simulation/
```

**Decision rule**: app-dev is the canonical version. The retirement-planning packages were the *source* of app-dev's flat module structure — the migration history is visible in app-dev's git log. Do NOT port code back from retirement-planning unless a specific formula or regulation is found to be missing from app-dev.

### 1.3 Check retirement-planning for anything not ported

Items to verify are present in app-dev:

```bash
# Check monte-carlo (was this ported?)
ls /home/jpl/app-dev/app/src/modules/simulation/ | grep monte
# If absent: review /home/jpl/projects/retirement-planning/packages/simulation/src/monte-carlo.ts
# and decide whether to port or leave out

# Check state tax (was this ported?)
ls /home/jpl/app-dev/app/src/modules/tax/ | grep state
# If absent: review packages/tax/src/state.ts

# Check IRMAA (was this ported?)
ls /home/jpl/app-dev/app/src/modules/tax/ | grep irmaa
```

**For each item found missing in app-dev**:
1. Read the source file in retirement-planning
2. Compare with app-dev's corresponding module
3. If logic is genuinely absent and needed → create a task to port it
4. If logic was intentionally removed or is in a different module → document why

### 1.4 Check retirement-planning docs for anything useful

```bash
# Are there any docs in retirement-planning not present in app-dev?
ls /home/jpl/projects/retirement-planning/
ls /home/jpl/app-dev/docs/
```

If retirement-planning has regulatory notes, formula sources, or OPM citations not captured in app-dev's `docs/formula-registry.md` or `docs/regulatory-mapping.md`, copy those notes over before archiving.

### 1.5 Archive retirement-planning

Once comparison is complete:

```bash
mkdir -p /home/jpl/app-dev/_archive
mv /home/jpl/projects/retirement-planning/ /home/jpl/app-dev/_archive/retirement-planning/
```

This preserves the full git history and all files as a reference without cluttering the workspace. Do NOT delete — the git history contains formula evolution and regulatory decisions.

---

## Phase 2 — Move fishing to app-dev/fishing/

### 2.1 Verify fishing is clean before moving

```bash
cd /home/jpl/projects/fishing
git status          # should be clean or show only .gitignore modification
git log --oneline -5
git remote -v       # verify: https://github.com/jtown81/fishing.git
```

If there are uncommitted changes, commit them first:

```bash
cd /home/jpl/projects/fishing
git add .gitignore  # the untracked/modified item from git status
git commit -m "chore: update gitignore before workspace reorganization"
```

### 2.2 Confirm latest features are committed

Check that Phase 6 work (auth, cloud sync, calcutta, custom fields, roles, reports, subscription) is fully committed and not sitting as local-only changes:

```bash
git -C /home/jpl/projects/fishing log --oneline -10
git -C /home/jpl/projects/fishing status --short
```

The last commit should be `7f5b854 Phase 6 complete, ready for testing`. Verify the following directories exist and are committed:
- `src/modules/api/`
- `src/modules/auth/`
- `src/modules/reports/`
- `src/modules/roles/`
- `src/modules/sync/`
- `src/modules/subscription/`

### 2.3 Move fishing directory

```bash
mv /home/jpl/projects/fishing/ /home/jpl/app-dev/fishing/
```

### 2.4 Verify git still works in new location

```bash
cd /home/jpl/app-dev/fishing
git status
git remote -v   # should still show https://github.com/jtown81/fishing.git
pnpm install    # reinstall deps in new location
pnpm dev        # verify dev server starts (port 4444)
```

### 2.5 Update fishing CLAUDE.md if it references old paths

```bash
grep -r "/home/jpl/projects/fishing" /home/jpl/app-dev/fishing/
# If found, update references to /home/jpl/app-dev/fishing/
```

---

## Phase 3 — Move 3peaks to app-dev/3peaks/

### 3.1 Verify 3peaks is clean

```bash
git -C /home/jpl/projects/3peaks-production status
```

The `.gitignore` modification noted in git status should be committed:

```bash
cd /home/jpl/projects/3peaks-production
git add .gitignore
git commit -m "chore: update gitignore before workspace reorganization"
```

### 3.2 Move 3peaks directory

```bash
mv /home/jpl/projects/3peaks-production/ /home/jpl/app-dev/3peaks/
```

### 3.3 Verify git still works

```bash
cd /home/jpl/app-dev/3peaks
git status
git remote -v   # should show https://github.com/jtown81/3peaks-production.git
```

**Note on naming**: The directory is renamed from `3peaks-production` to `3peaks` for brevity. The git remote URL is unchanged — only the local directory name changes.

### 3.4 Update 3peaks CLAUDE.md if it references old paths

```bash
grep -r "/home/jpl/projects/3peaks" /home/jpl/app-dev/3peaks/
```

---

## Phase 4 — Move cabin-cost-tracking to app-dev/cabin/

### 4.1 Assess current state

```bash
cd /home/jpl/projects/cabin-cost-tracking
git status
git log --oneline -5
ls -la
ls files/     # Docker configs
```

This project has no `package.json` — it's Docker-based. Determine if there's an active app running somewhere that this config serves:

```bash
# Check if any Docker containers are running for this project
docker ps 2>/dev/null | grep cabin
```

### 4.2 Commit .gitignore change

```bash
cd /home/jpl/projects/cabin-cost-tracking
git add .gitignore
git commit -m "chore: update gitignore before workspace reorganization"
```

### 4.3 Move cabin directory

```bash
mv /home/jpl/projects/cabin-cost-tracking/ /home/jpl/app-dev/cabin/
```

### 4.4 Verify git still works

```bash
cd /home/jpl/app-dev/cabin
git status
git remote -v   # should show https://github.com/jtown81/cabin-cost-tracking.git
```

---

## Phase 5 — Move logo-jl-brand to app-dev/brand/

### 5.1 Move brand assets

No cleanup needed (static files, no build system):

```bash
mv /home/jpl/projects/logo-jl-brand/ /home/jpl/app-dev/brand/
```

### 5.2 Verify git still works

```bash
cd /home/jpl/app-dev/brand
git status
git remote -v   # should show https://github.com/jtown81/logo-jl-brand.git
```

---

## Phase 6 — Update app-dev .gitignore

The `app-dev/` retirement git repo must ignore the sub-project directories so their files don't pollute the retirement app's git status:

```bash
# Read current .gitignore
cat /home/jpl/app-dev/.gitignore
```

Add these entries to `/home/jpl/app-dev/.gitignore`:

```gitignore
# Sub-project workspaces (each has its own git repo)
/fishing/
/3peaks/
/cabin/
/brand/
/_archive/

# Workflow utilities (keep in projects/ reference only)
/projects/credentials/
```

Then commit:

```bash
cd /home/jpl/app-dev
git add .gitignore
git commit -m "chore: ignore sub-project workspace directories in retirement git repo"
```

---

## Phase 7 — Move workflow scripts from projects/ root

The `projects/` directory root contains shared workflow scripts that should move to `app-dev/`:

```bash
# Items in /home/jpl/projects/ root (non-project items):
# git-workflow.sh, git-workflow.bat, workflow.md
# GIT-WORKFLOW-*.md, QUICK-REFERENCE.md, WORKFLOW-SETUP-COMPLETE.md, CREDENTIALS-SETUP-COMPLETE.md

mv /home/jpl/projects/git-workflow.sh /home/jpl/app-dev/git-workflow.sh
mv /home/jpl/projects/git-workflow.bat /home/jpl/app-dev/git-workflow.bat
mv /home/jpl/projects/workflow.md /home/jpl/app-dev/workflow.md
# Move doc files similarly, or leave as reference and delete
```

Then commit these to the retirement repo (they're workspace-level utilities):

```bash
cd /home/jpl/app-dev
git add git-workflow.sh git-workflow.bat workflow.md
git commit -m "chore: move workspace workflow scripts from projects/ root"
```

---

## Phase 8 — Clean up projects/ at /home/jpl/

Once all projects are moved and verified:

### 8.1 Verify nothing was missed

```bash
ls /home/jpl/projects/
# Should only contain the moved items (now empty) or just the .gitignore
```

### 8.2 Remove the now-empty projects/ directory

```bash
rm -rf /home/jpl/projects/
```

**Note**: If `/home/jpl/projects/` still contains any files not yet moved, do NOT delete — investigate first.

---

## Phase 9 — Update CLAUDE.md files

### 9.1 Update app-dev CLAUDE.md

`/home/jpl/app-dev/CLAUDE.md` already reflects the new structure. Verify the "Further Reading" paths and all references are correct relative to the new root.

### 9.2 Update fishing CLAUDE.md (if it exists)

```bash
cat /home/jpl/app-dev/fishing/CLAUDE.md
# Update any absolute paths from /home/jpl/projects/fishing/ → /home/jpl/app-dev/fishing/
```

### 9.3 Update 3peaks CLAUDE.md

```bash
cat /home/jpl/app-dev/3peaks/CLAUDE.md
# Update any absolute paths
```

---

## Phase 10 — Verify all git repos operational

Run a final verification pass:

```bash
# Retirement app — full test suite
cd /home/jpl/app-dev/app && pnpm test && pnpm typecheck

# Fishing app — install + typecheck
cd /home/jpl/app-dev/fishing && pnpm install && pnpm typecheck

# All remotes correct
git -C /home/jpl/app-dev remote -v
git -C /home/jpl/app-dev/fishing remote -v
git -C /home/jpl/app-dev/3peaks remote -v
git -C /home/jpl/app-dev/cabin remote -v
git -C /home/jpl/app-dev/brand remote -v

# All clean git status
git -C /home/jpl/app-dev status --short
git -C /home/jpl/app-dev/fishing status --short
git -C /home/jpl/app-dev/3peaks status --short
```

---

## Final Directory Layout

```
/home/jpl/app-dev/
├── .git/                    ← Retirement app repo (jtown81/retirement)
├── .gitignore               ← Ignores sub-project dirs
├── CLAUDE.md                ← Retirement app project instructions
├── TO-DO.md
├── README.md
├── deployment.md
├── mergeproj.md             ← This file
├── git-workflow.sh/.bat     ← Workspace utility scripts
│
├── app/                     ← Retirement Astro+React app
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── ...
├── docs/                    ← Architecture, formula registry, regulatory mapping
├── content/                 ← Formulas, regulations, overview docs
│
├── fishing/                 ← Tournament PWA (.git → jtown81/fishing)
│   ├── .git/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── 3peaks/                  ← Production templates (.git → jtown81/3peaks-production)
│   ├── .git/
│   └── *.html
│
├── cabin/                   ← Cabin expense app (.git → jtown81/cabin-cost-tracking)
│   ├── .git/
│   └── files/
│
├── brand/                   ← JL brand assets (.git → jtown81/logo-jl-brand)
│   ├── .git/
│   └── RGB/, CMYK/, Icon/
│
└── _archive/
    └── retirement-planning/ ← Legacy monorepo snapshot (jtown81/retirement-planning)
        ├── .git/
        ├── packages/
        └── retire/
```

---

## Ordered Execution Checklist

### Phase 1 — retirement-planning comparison (do first, most critical)
- [ ] Run side-by-side diff to find files unique to retirement-planning
- [ ] Check monte-carlo module: present in app-dev?
- [ ] Check state tax module: present in app-dev?
- [ ] Check IRMAA module: present in app-dev?
- [ ] Compare each package module to app-dev equivalent — note any formula differences
- [ ] Extract any regulatory citations not yet in docs/regulatory-mapping.md
- [ ] Extract any formula details not yet in docs/formula-registry.md
- [ ] Create tasks for any missing logic that should be ported
- [ ] Move retirement-planning to `_archive/`

### Phase 2 — fishing
- [ ] Commit .gitignore change in fishing
- [ ] Verify Phase 6 modules all committed
- [ ] `mv /home/jpl/projects/fishing/ /home/jpl/app-dev/fishing/`
- [ ] `pnpm install` in new location
- [ ] Verify dev server starts

### Phase 3 — 3peaks
- [ ] Commit .gitignore change in 3peaks
- [ ] `mv /home/jpl/projects/3peaks-production/ /home/jpl/app-dev/3peaks/`
- [ ] Verify git works in new location

### Phase 4 — cabin
- [ ] Commit .gitignore change in cabin
- [ ] `mv /home/jpl/projects/cabin-cost-tracking/ /home/jpl/app-dev/cabin/`
- [ ] Verify git works in new location

### Phase 5 — brand
- [ ] `mv /home/jpl/projects/logo-jl-brand/ /home/jpl/app-dev/brand/`
- [ ] Verify git works in new location

### Phase 6 — gitignore
- [ ] Add sub-project dirs to app-dev .gitignore
- [ ] Commit .gitignore update

### Phase 7 — workflow scripts
- [ ] Move git-workflow.sh/.bat and workflow.md to app-dev root
- [ ] Commit to retirement repo

### Phase 8 — cleanup
- [ ] `rm -rf /home/jpl/projects/`
- [ ] Verify projects/ no longer at /home/jpl/

### Phase 9 — CLAUDE.md updates
- [ ] Update fishing CLAUDE.md paths
- [ ] Update 3peaks CLAUDE.md paths
- [ ] Update app-dev CLAUDE.md if needed

### Phase 10 — verification
- [ ] `pnpm test` in app-dev/app/ → 531 pass
- [ ] `pnpm typecheck` in app-dev/app/ → 0 errors
- [ ] `pnpm install && pnpm typecheck` in fishing
- [ ] All git remotes correct
- [ ] All git statuses clean

---

## What Does NOT Change

- App source code in `app/` — zero changes
- All import aliases (`@models/*`, `@modules/*`, etc.)
- pnpm commands — still run from `app/`
- Git remotes for all projects
- Git histories for all projects
- GitHub repository names or URLs
- Test suite (531 tests)

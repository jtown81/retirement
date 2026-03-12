# CLAUDE.md - Retirement Planning App

This file provides project-specific guidance for the retirement planning application.

**For comprehensive project guidance, workspace scope, and regulatory documentation, see the workspace root CLAUDE.md at `/home/jpl/app-dev/CLAUDE.md`.**

---

## ⚠️ Workspace Context

This project is part of a **multi-project workspace** rooted at `/home/jpl/app-dev/`. The workspace contains several independent projects:

| Project | Directory | Git Repo | Status |
|---------|-----------|----------|--------|
| **Retirement Planner** | `retire-app/` | workspace root `.git/` | This project (PRIMARY) |
| **Fishing Tournament** | `fishing/` | `fishing/.git/` (separate) | Independent |
| **3Peaks Templates** | `3peaks/` | `3peaks/.git/` (separate) | Independent |
| **Cabin Tracker** | `cabin/` | `cabin/.git/` (separate) | Independent |
| **Brand Assets** | `brand/` | `brand/.git/` (separate) | Independent |

**Scope Restriction:** This is the **Retirement Planning App** (primary project). It owns the workspace root git repo (`.git/` at `/home/jpl/app-dev/.git/`) and may modify workspace root files (`CLAUDE.md`, `TO-DO.md`, `docs/`, `content/`). However, **never modify files in sibling project directories** (`fishing/`, `3peaks/`, `cabin/`, `brand/`).

### Commands Run From This Directory

All development commands for this project must run from `/home/jpl/app-dev/retire-app/`:

```bash
cd /home/jpl/app-dev/retire-app  # Always navigate here first
pnpm install                     # Then run commands from this directory
pnpm dev
pnpm build
pnpm test
pnpm typecheck
git add .
git commit -m "..."              # Commits go to workspace root .git/
```

**Important:** Do not run commands from the workspace root `/home/jpl/app-dev/`. Always work from `retire-app/`.

---

## Quick Reference

For full project documentation, see `/home/jpl/app-dev/CLAUDE.md`:
- **Scope Restriction** — Workspace boundaries and isolation rules
- **Build & Development Commands** — Full command reference
- **Non-Negotiable Design Principles** — Regulatory accuracy, auditability, separation of concerns
- **App Navigation Structure** — Top-level views and form tabs
- **Required Module Boundaries** — Career, leave, TSP, tax, military, expenses, simulation, validation
- **Data Flow** — How data flows from forms through storage to dashboard
- **Path Aliases** — Import path configuration

For detailed regulatory references and formula documentation, see:
- `docs/regulatory-mapping.md` — All regulatory sources (OPM, IRC, federal statute)
- `docs/formula-registry.md` — Authoritative formula registry with version history
- `content/regulations/fers-handbook.md` — OPM FERS Handbook reference
- `docs/architecture.md` — System architecture and module boundaries

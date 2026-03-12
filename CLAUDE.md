# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚀 Quick Reference: Where to Work

**Always check where you are before running commands:**

```bash
pwd  # Should show: /home/jpl/app-dev/retire-app or /home/jpl/app-dev/fishing, etc.
```

| Project | Directory | Commands From | Git Repo |
|---------|-----------|---------------|----------|
| **Retirement Planner** (main) | `retire-app/` | `retire-app/` | workspace root `.git/` |
| Tournament PWA | `fishing/` | `fishing/` | `fishing/.git/` (separate) |
| Templates | `3peaks/` | `3peaks/` | `3peaks/.git/` (separate) |
| Cabin Tracker | `cabin/` | `cabin/` | `cabin/.git/` (separate) |
| Brand Assets | `brand/` | `brand/` | `brand/.git/` (separate) |

**Never run commands in `/home/jpl/app-dev/` directly.** Always `cd` into your project first.

---

## ⚠️ SCOPE RESTRICTION — STRICTLY ENFORCED

**Each project directory is completely independent. Never cross project boundaries.**

When invoked in any subdirectory of `/home/jpl/app-dev/`:
- **Work ONLY in the directory where you were invoked** (e.g., `retire-app/`, `fishing/`, etc.)
- **Never navigate to parent directories** to modify workspace root files, unless explicitly requested by the user
- **Never modify files in sibling project directories** (e.g., if in `retire-app/`, never touch `fishing/`, `cabin/`, `3peaks/`, or `brand/`)
- **Run all commands from your project directory** — never run commands in the workspace root `/home/jpl/app-dev/`
- **Make all git commits in your project's repo** — `retire-app/`, `fishing/`, etc. have separate `.git/` directories
- **Never cross-import between projects** — each project has its own dependencies and version constraints

**Exception:** The retirement app (`retire-app/`) may modify workspace root files (`CLAUDE.md`, `TO-DO.md`, `docs/`, `content/`) since it owns the workspace root git repo. Other projects (fishing, 3peaks, cabin, brand) must never commit to the workspace root.

## Workspace Overview

This is a **multi-project workspace** with `/home/jpl/app-dev/` as the root. The primary focus is the **retirement planning app** (`retire-app/` directory), but the workspace also contains several other independent projects (fishing, 3peaks, cabin, brand) that share this root location.

### Workspace Structure

```
/home/jpl/app-dev/          ← Workspace root (git root for retirement app only)
├── retire-app/             ← Retirement planning app (PRIMARY FOCUS)
├── fishing/                ← Tournament PWA (independent git repo)
├── 3peaks/                 ← Production templates (independent git repo)
├── cabin/                  ← Cabin expense tracker (independent git repo)
├── brand/                  ← JL brand assets (independent git repo)
├── _archive/               ← Archive of old retirement-planning monorepo
├── docs/, content/         ← Shared documentation (tracked by retirement git)
└── (each sub-project has its own .git/ and remote)
```

Each sub-project is a **separate git repository** with its own remote and can be developed independently.

### ⚠️ How to Navigate: Where to Work From

When you need to work on a project, follow these rules:

| Goal | Action |
|------|--------|
| Work on **retirement app** | `cd /home/jpl/app-dev/retire-app` then run all commands from there |
| Work on **fishing PWA** | `cd /home/jpl/app-dev/fishing` then run all commands from there |
| Work on **3peaks templates** | `cd /home/jpl/app-dev/3peaks` then run all commands from there |
| Work on **cabin tracker** | `cd /home/jpl/app-dev/cabin` then run all commands from there |
| Work on **brand assets** | `cd /home/jpl/app-dev/brand` then run all commands from there |
| **NEVER** work in `/home/jpl/app-dev/` root | ❌ Don't run `pnpm`, `npm`, `git`, or `build` commands in workspace root |

**Default assumption:** If not explicitly redirected to another project, assume you're working on the **retirement app** (`retire-app/`).

### ⚠️ Critical: Development Scope & Project Boundaries

**`/home/jpl/app-dev/` is ONLY a workspace root — never a development directory.**

#### For Each Project:

**Retirement App (`retire-app/`)**
- ✅ Work in: `retire-app/` directory only
- ✅ Run commands from: `retire-app/` (pnpm, npm, build, test, git, etc.)
- ✅ Git repo: `/home/jpl/app-dev/.git` (owns workspace root)
- ✅ May modify: `retire-app/` + workspace root files (`CLAUDE.md`, `TO-DO.md`, `docs/`, `content/`)
- ❌ Never touch: `fishing/`, `3peaks/`, `cabin/`, `brand/`, or their dependencies

**Other Projects (`fishing/`, `3peaks/`, `cabin/`, `brand/`)**
- ✅ Work in: Your project directory only
- ✅ Run commands from: Your project directory (each has its own `package.json`)
- ✅ Git repo: Your project's own `.git/` (independent from workspace root)
- ✅ May modify: Your project directory only
- ❌ Never modify: `retire-app/`, workspace root files, or other projects
- ❌ Never commit to: Workspace root git repo (unless you own it)

#### Project Isolation Checklist:

- [ ] Current working directory is the target project (not workspace root)
- [ ] All commands run from inside the project directory
- [ ] Git commits go to the project's `.git/`, not workspace root
- [ ] No file edits outside the project directory (except retirement app editing workspace root)
- [ ] No imports or dependencies from sibling projects
- [ ] Each project's `node_modules/` is independent (never shared)

## Primary Project: Retirement Planning App

A comprehensive retirement planning simulation for U.S. federal employees. Runs locally only (no backend). Architected for eventual mobile deployment.

### Status

**Phase 8 complete** (2026-03-12). Full UI with three top-level views (My Plan, Leave, Dashboard), four form tabs (FERS Estimate, Career, Expenses, Simulation), leave calendar, and multiple projection charts. Recent highlights:
- ✅ Tax module complete (federal income tax, SS taxation, IRMAA) — E-1
- ✅ SECURE 2.0 RMD age 75 (for births 1960+) — E-2
- ✅ TSP 2026 contribution limits ($24,500) — E-3
- ✅ Performance & responsiveness optimizations (2026-03-11)
- ✅ Workspace structure consolidated (mergeproj.md, 2026-03-12)

See `retire-app/TO-DO.md` for detailed status of all E (Error) and C (Chart) items.

### Tech Stack

Astro 5 (static output) + React 19 (`client:load`) + Tailwind CSS 4 + Recharts 3 + Zod 3 + Vitest 3 + TypeScript 5 (strict). Package manager: pnpm.

## Build & Development Commands

All commands run from the `retire-app/` directory:

```bash
pnpm install                              # install dependencies
pnpm dev                                  # dev server at http://localhost:2222
pnpm build                                # production build
pnpm preview                              # preview production build
pnpm test                                 # run all tests once
pnpm test tests/unit/tsp/rmd.test.ts      # run a single test file
pnpm test:watch                           # run tests in watch mode
pnpm typecheck                            # TypeScript type check (no emit)
```

## Non-Negotiable Design Principles

- **Separation of concerns**: UI, calculations, data models, storage, visuals, and tests must never be mixed.
- **Auditability**: Every formula must have a name, purpose, inputs, outputs, dependencies, source reference, and version history in the formula registry.
- **Federal accuracy**: Regulatory correctness outweighs convenience. Every rule must map to an authoritative source (OPM FERS Handbook, OPM pay/leave guidance, TSP regulations, or federal statute) and be classified as: hard regulatory requirement, assumption, or user-configurable policy.
- **Local-only persistence**: All data stored locally with explicit schema versioning.
- **Deterministic outputs**: All calculations must be explainable and reproducible.

## App Navigation Structure

### Top-Level (AppShell)
1. **My Plan** — Form entry with sub-tabs
2. **Leave** — Leave calendar planner (standalone view)
3. **Dashboard** — Charts & projections (unlocks when all sections complete)

### My Plan Sub-Tabs (FormShell)
1. **FERS Estimate** (`personal`) — Personal info, salary, High-3, annuity options, SS, TSP config
2. **Career** (`career`) — Career events timeline
3. **Expenses** (`expenses`) — 10 expense categories with defaults, dual inflation rates, smile curve
4. **Simulation** (`simulation`) — Post-retirement projection with dual-pot TSP, RMD, smile curve phases

### Orphaned Components (retained in codebase but not rendered)
- `PersonalInfoForm.tsx` — merged into FERSEstimateForm
- `MilitaryServiceForm.tsx` — Military tab disconnected
- `TSPForm.tsx` — TSP fields merged into FERSEstimateForm
- `AssumptionsForm.tsx` — replaced by SimulationForm

## Required Module Boundaries

All modules communicate via well-defined contracts with no business logic crossing boundaries:

- **Career & Pay Progression Engine** (`modules/career/`) — GS/LEO/Title 38 hybrid, grade/step/locality, SCD tracking, salary history, High-3
- **Leave Planning & Tracking** (`modules/leave/`) — Annual + sick leave, rollover, LS/DE breakdown, calendar bridge, federal holidays, retirement credit
- **TSP Modeling** (`modules/tsp/`) — Traditional & Roth balances; agency match always goes to Traditional only; future value; RMD compliance (SECURE 2.0: age 73/75)
- **Tax Computation** (`modules/tax/`) — Federal income tax (progressive brackets), Social Security provisional income taxation, IRMAA surcharges, standard deduction (age 65+ adjustments)
- **Military Service Buyback** (`modules/military/`) — Buyback deposit & service credit (module retained; UI disconnected)
- **Expense Modeling** (`modules/expenses/`) — Categories, expense smile curve, inflation (general + healthcare)
- **Retirement Simulation Engine** (`modules/simulation/`) — Eligibility, annuity, supplement, dual-pot TSP projection, income vs expense projection, scenario comparison
- **Visualization Layer** (`components/charts/`) — Zero business logic; multiple chart components, summary cards; must be mobile-friendly and replaceable
- **Validation** (`modules/validation/`) — Input validation, assumption warnings

## Data Flow

```
Forms → useLocalStorage(key, zodSchema) → localStorage
  → useAssembleInput (reads all keys) → SimulationInput
  → useSimulation (memoized computation) → SimulationData
  → Dashboard → Chart components (zero logic, just render)
```

- Each form persists to localStorage under `retire:*` keys (defined in `storage/schema.ts`)
- `useAssembleInput` aggregates all stored sections; returns `SimulationInput | null` (null until all required sections are filled)
- `useSimulation` runs all projection engines (annuity, TSP, leave, expenses) and returns chart-ready datasets
- Storage is Zod-validated with schema versioning and migration support (`storage/persistence.ts`)

## Astro + React Integration

Single Astro page (`pages/index.astro`) mounts `PlannerApp` via `client:load`. Astro provides the HTML shell only; all state and logic lives in React. Output mode is `static` (no SSR). The `useLocalStorage` hook is SSR-safe (returns null on server).

## Path Aliases

Configured in both `tsconfig.json` and `vitest.config.ts`:

| Alias | Path |
|-------|------|
| `@lib/*` | `src/lib/*` |
| `@models/*` | `src/models/*` |
| `@modules/*` | `src/modules/*` |
| `@utils/*` | `src/utils/*` |
| `@storage/*` | `src/storage/*` |
| `@registry/*` | `src/registry/*` |
| `@components/*` | `src/components/*` |
| `@hooks/*` | `src/hooks/*` |
| `@data/*` | `src/data/*` |

Always import from barrel exports (`@modules/career`) — never import sub-files directly.

## Key Domain Notes

- Flag all regulatory ambiguities explicitly rather than silently assuming.
- Never skip documentation updates when adding or changing logic.
- Always verify new formulas/rules against `docs/regulatory-mapping.md` before implementation.
- Tax year is always calendar year (Jan–Dec). FERS benefit years are calendar years; TSP tax-deferred limits reset Jan 1.

## Testing Conventions

- **Unit tests**: `tests/unit/<module>/` — Test individual functions in isolation with known inputs/outputs.
- **Scenario tests**: `tests/scenarios/` — Integration tests verifying end-to-end retirement projections match expected outputs.
- Run `pnpm test:scenarios` to verify scenario parity after formula changes.
- Coverage thresholds: 80% lines, functions, branches, statements (enforced by vitest).

## Structure

```
retire-app/
  src/
    components/
      layout/          — AppShell (top-level nav)
      forms/           — FERSEstimateForm, CareerEventsForm, ExpensesForm, SimulationForm, FormShell, etc.
        leave-calendar/ — LeaveCalendarGrid, DayCell, MonthCalendar, LeaveEntryModal, etc.
      cards/           — MetricCard, SummaryPanel
      charts/          — PayGrowthChart, LeaveBalancesChart, TSPBalancesChart, IncomeVsExpensesChart, ExpenseSmileCurveChart
      ui/              — Radix UI primitives (Button, Dialog, Input, Select, etc.)
    models/            — Pure data shapes (common, career, leave, leave-calendar, tsp, tax, military, expenses, simulation)
    modules/
      career/          — Grade/step, pay calculator, locality, projection, SCD
      leave/           — Annual/sick accrual, calendar bridge, simulate-year, retirement credit
      tsp/             — Traditional/Roth projection, agency match, future value, RMD (SECURE 2.0: ages 73/75)
      tax/             — Federal income tax, Social Security taxation, IRMAA surcharges
      military/        — Buyback deposit & service credit
      expenses/        — Categories, smile curve, inflation
      simulation/      — Eligibility, annuity, supplement, income projection, scenario comparison
      validation/      — Input validation, assumption warnings
    hooks/             — useLocalStorage, useSimulation
    lib/               — Helper utilities (pure functions, constants, enums)
    storage/           — Schema, Zod schemas, migrations
    data/              — GS pay tables, locality rates, TSP limits, federal holidays, demo fixture
  tests/
    unit/              — Per-module unit tests
    scenarios/         — Integration scenario tests
content/               — Markdown files (docs, formulas, regulations)
docs/                  — Architecture, formula registry, regulatory mapping, scenario tests
```

## Further Reading

**IMPORTANT:** Read relevant docs below before starting any task.

### Architecture & Design
- `docs/architecture.md` — System architecture, navigation structure, module map, component map, data flow, hooks, storage keys, tech stack, and regulatory change safety process.

### Formulas & Calculations
- `docs/formula-registry.md` — Authoritative formula registry. Every formula must have an entry here before it is used in code. Includes name, purpose, inputs, outputs, source reference, classification, version, and changelog.
- `content/formulas/index.md` — Human-readable index of all formulas organized by module.

### Regulatory Accuracy
- `docs/regulatory-mapping.md` — Full regulatory reference table mapping every rule and assumption to its authoritative source (OPM, IRC, federal statute). Includes update monitoring strategy.
- `content/regulations/fers-handbook.md` — OPM FERS Handbook chapter index with MRA table and annuity formula reference.

### Test Scenarios
- `retire-app/tests/scenarios/` — Integration tests covering key retirement scenarios: straight-through GS career, LEO early retirement, military buyback, Roth vs Traditional TSP, High-3 gap handling, and DSR eligibility.

### Application Content
- `content/docs/overview.md` — App feature summary and data sources for end-user documentation.

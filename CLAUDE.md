# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Root

**`app-dev/retire/` is the project root.** All work must happen within this directory. Never create or modify files outside of `app-dev/retire/` unless explicitly instructed. All relative paths in this document are relative to this directory.

## Project Overview

A retirement planning simulation app for U.S. federal employees. Runs locally only (no backend). Architected for eventual mobile deployment. `Retire-original.xlsx` is the authoritative baseline for all formulas and features — app outputs must match it within defined tolerance.

## Current Status

**Phases 1-9 complete.** **Phases A-E (post-Phase-9 refinement) in progress.**

The app has a working UI with three top-level views (My Plan, Leave, Dashboard), nested form tabs within My Plan with sub-form components (FERS Estimate E.1, Career, Expenses, Simulation E.2), a full leave calendar with federal holidays, and a modern Dashboard with 6 projection charts + expanded summary cards.

### Phase E.2 Completion (SimulationForm Split - Feb 2026)
- ✅ Created 4 simulation sub-forms (CoreParameters, TSP, Expenses, Rates)
- ✅ Refactored SimulationForm.tsx from 966 → 143 lines (container pattern)
- ✅ Implemented merge-on-save pattern with SIM_CONFIG_DEFAULTS
- ✅ Removed draft system (retire:simulation-form-draft deprecated)
- ✅ Auto-population hints from FERS estimate and expense profile
- ✅ All 732 tests passing with zero changes needed

### Phase E.1 Completion (FERSEstimateForm Split - Feb 2026)
- ✅ Created 4 FERS sub-forms (Personal, Salary, Annuity & SS, TSP)
- ✅ Refactored FERSEstimateForm to container (Tabs with 4 sub-tabs)
- ✅ Auto-population from default inputs fixture
- ✅ All 732 tests passing

### Phase 9 Completion (Dashboard Replacement - Feb 2026)
- Fixed Roth TSP bug (was always 0 in pre-retirement charts)
- Added 4 new chart components:
  - **IncomeWaterfallChart**: 4-component stacked income (annuity, supplement, SS, TSP) + expense overlay
  - **TSPLifecycleChart**: Pre-retirement accumulation → post-retirement drawdown on single timeline
  - **ExpensePhasesChart**: GoGo/GoSlow/NoGo phases with Blanchett comparison
  - **RMDComplianceChart**: Tax compliance tracking (age 73+)
- Enhanced 2 existing charts:
  - **PayGrowthChart**: High-3 average highlighted with reference lines
  - **LeaveBalancesChart**: Sick leave retirement credit calculation
- Expanded summary cards: 6 → 9 cards (adding Social Security, TSP depletion age, lifetime surplus)
- New data transformations in `useSimulation`: incomeWaterfall, tspLifecycle, expensePhases, rmdTimeline
- All 446 unit tests passing + 18 scenario parity tests passing

## Tech Stack

Astro 5 (static output) + React 19 (`client:load`) + Tailwind CSS 4 + Recharts 3 + Zod 3 + Vitest 3 + TypeScript 5 (strict). Package manager: pnpm.

## Build & Development Commands

All commands run from the `app/` directory:

```bash
pnpm install                              # install dependencies
pnpm dev                                  # dev server at http://localhost:2222
pnpm build                                # production build
pnpm preview                              # preview production build
pnpm test                                 # run all tests once
pnpm test tests/unit/tsp/rmd.test.ts      # run a single test file
pnpm test:watch                           # run tests in watch mode
pnpm test:scenarios                       # run spreadsheet parity scenarios
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
- **TSP Modeling** (`modules/tsp/`) — Traditional & Roth balances; agency match always goes to Traditional only; future value; RMD compliance
- **Military Service Buyback** (`modules/military/`) — Buyback deposit & service credit (module retained; UI disconnected)
- **Expense Modeling** (`modules/expenses/`) — Categories, expense smile curve, inflation (general + healthcare)
- **Retirement Simulation Engine** (`modules/simulation/`) — Eligibility, annuity, supplement, dual-pot TSP projection, income vs expense projection, scenario comparison
- **Visualization Layer** (`components/charts/`) — Zero business logic; 6 chart components + utilities, 9-card summary panel; must be mobile-friendly and replaceable
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
| `@models/*` | `src/models/*` |
| `@modules/*` | `src/modules/*` |
| `@utils/*` | `src/utils/*` |
| `@storage/*` | `src/storage/*` |
| `@registry/*` | `src/registry/*` |
| `@components/*` | `src/components/*` |
| `@hooks/*` | `src/hooks/*` |
| `@data/*` | `src/data/*` |

Always import from barrel exports (`@modules/career`) — never import sub-files directly.

## Sub-Form Pattern (Phase E.1 & E.2)

When a form grows large (600+ lines) with logically distinct sections, split it using the **Container + Sub-Forms** pattern:

1. **Container component** (form name, e.g., `SimulationForm.tsx`):
   - Manages `activeSubTab` state (string)
   - Reads all storage keys with `useLocalStorage`
   - Computes live data (e.g., simulation results) using `useMemo`
   - Renders `<Tabs>` with `<TabsList>` + 4-6 `<TabsContent>` sections
   - Mounts each sub-form component
   - Shows live results panel (read-only, driven by stored state)

2. **Each sub-form component** (e.g., `CoreParametersSubForm.tsx`):
   - Manages local form state (strings for controlled inputs)
   - Loads from storage on mount via `formStateFromStored()`
   - Wrapped in `<FormSection>` (Save/Clear/Defaults buttons + Saved badge)
   - Save handler: merge-on-save pattern:
     ```typescript
     const saved = storedConfig ?? {};
     const merged = { ...DEFAULTS, ...saved, ...myFields };
     const result = Schema.safeParse(merged);
     saveConfig(result.data);
     ```
   - No draft system (state lost on unmount)
   - Auto-population hints from related forms (e.g., FERS estimate, expense profile)

3. **Reusable components**:
   - `FormSection` — Save/Clear/Defaults buttons + Saved badge
   - `FieldGroup` — Label + Input + Error/Hint wrapper
   - `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` — shadcn tabs
   - `useLocalStorage` — Typed storage reads/writes
   - Schema.safeParse — Atomic validation on save

4. **Storage & merge strategy**:
   - Define `*_DEFAULTS` constant (all required fields with defaults)
   - Each sub-form saves to the same storage key
   - Merge: `{ ...DEFAULTS, ...saved, ...myFields }` ensures all fields present
   - No partial updates; each sub-form is atomic

See `app/src/components/forms/simulation/` for Phase E.2 example, `app/src/components/forms/fers/` for Phase E.1.

## Key Domain Notes

- Flag all regulatory ambiguities explicitly rather than silently assuming.
- Never skip documentation updates when adding or changing logic.
- Spreadsheet parity is a success criterion — track which cells map to which formulas.

## Structure

```
app/
  src/
    components/
      layout/          — AppShell (top-level nav)
      forms/           — FERSEstimateForm, CareerEventsForm, ExpensesForm, SimulationForm, FormShell, etc.
        fers/          — PersonalSubForm, SalarySubForm, AnnuitySocialSubForm, TSPSubForm (Phase E.1)
        simulation/    — CoreParametersSubForm, TSPSimulationSubForm, ExpensesSimulationSubForm, RatesSubForm (Phase E.2)
        leave-calendar/ — LeaveCalendarGrid, DayCell, MonthCalendar, LeaveEntryModal, etc.
      cards/           — MetricCard, SummaryPanel
      charts/          — IncomeWaterfallChart, TSPLifecycleChart, ExpensePhasesChart, RMDComplianceChart, PayGrowthChart, LeaveBalancesChart, ChartContainer, ChartTooltip
    models/            — Pure data shapes (common, career, leave, leave-calendar, tsp, military, expenses, simulation)
    modules/
      career/          — Grade/step, pay calculator, locality, projection, SCD
      leave/           — Annual/sick accrual, calendar bridge, simulate-year, retirement credit
      tsp/             — Traditional/Roth projection, agency match, future value, RMD
      military/        — Buyback deposit & service credit
      expenses/        — Categories, smile curve, inflation
      simulation/      — Eligibility, annuity, supplement, income projection, scenario comparison
      validation/      — Input validation, assumption warnings
    hooks/             — useLocalStorage, useSimulation
    storage/           — Schema, Zod schemas, migrations
    data/              — GS pay tables, locality rates, TSP limits, federal holidays, demo fixture
  tests/
    unit/              — Per-module unit tests
    scenarios/         — Spreadsheet parity scenario tests
content/               — Markdown files (docs, formulas, regulations)
docs/                  — Architecture, formula registry, regulatory mapping, spreadsheet parity
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

### Spreadsheet Parity
- `docs/spreadsheet-parity.md` — Tolerance policy, sheet map, cell-level mapping, and discrepancy log for `Retire-original.xlsx` parity verification.
- `app/tests/scenarios/fixtures/baseline.json` — Canonical expected values extracted from the spreadsheet (populated phase-by-phase).

### Test Scenarios
- `app/tests/scenarios/` — Four canonical parity scenarios: straight-through GS, LEO early retirement, military buyback, Roth vs Traditional TSP.

### Application Content
- `content/docs/overview.md` — App feature summary and data sources for end-user documentation.

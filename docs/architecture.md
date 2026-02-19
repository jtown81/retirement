# System Architecture

## Overview

A local-only retirement planning simulation for U.S. federal employees.
Built for eventual mobile deployment. No backend. All data persists locally.

---

## Tech Stack

Locked in Phase 1.

| Layer          | Decision               | Rationale                                                     |
|----------------|------------------------|---------------------------------------------------------------|
| Framework      | Astro 5 + React 19     | SSG + interactive islands; content.config.ts already Astro    |
| Language       | TypeScript 5 (strict)  | Required by design principles; type-safe module contracts     |
| Styling        | TailwindCSS 4          | Mobile-first; utility classes replace component styles        |
| Charts         | Recharts               | React-native chart library; composable, responsive            |
| Testing        | Vitest 3               | Native Vite/Astro ecosystem; supports unit + scenario tests   |
| Persistence    | localStorage           | Local-only requirement; Zod for schema validation at I/O      |
| Validation     | Zod 3                  | Runtime type-safety at storage boundary                       |
| Package Mgr    | pnpm                   | Faster installs, strict dependency resolution                 |

---

## Navigation Structure

### Top-Level (AppShell)

Three top-level views controlled by `AppShell.tsx`:

| View        | ID          | Component               | Purpose                               |
|-------------|-------------|--------------------------|---------------------------------------|
| My Plan     | `input`     | `FormShell` (tab host)   | Data entry via sub-tabs               |
| Leave       | `leave`     | `LeaveBalanceForm`       | Leave calendar planner (standalone)   |
| Dashboard   | `dashboard` | `Dashboard`              | Retirement projection charts + cards  |

Dashboard unlocks when all 4 form sections + Leave section are complete.

### My Plan Sub-Tabs (FormShell)

| Tab ID       | Label         | Component             | Storage Key               | Architecture |
|--------------|---------------|-----------------------|---------------------------|---------------|
| `personal`   | FERS Estimate | `FERSEstimateForm`    | `retire:personal` (+ others) | Container with 4 sub-tabs (E.1) |
| `career`     | Career        | `CareerEventsForm`    | `retire:career`           | Monolithic form |
| `expenses`   | Expenses      | `ExpensesForm`        | `retire:expenses`         | Monolithic form |
| `simulation` | Simulation    | `SimulationForm`      | `retire:simulation-config`| Container with 4 sub-tabs (E.2) |

Managed by `useFormSections.ts`. Each tab tracks completion via its storage key.

**Refactoring Timeline:**
- **Phase E.1**: Split `FERSEstimateForm` into 4 sub-forms (Personal, Salary, Annuity & SS, TSP)
- **Phase E.2**: Split `SimulationForm` into 4 sub-forms (Core Parameters, TSP, Expenses, Rates)

---

## Module Responsibility Map

| Module                          | Directory               | Responsibility                                              |
|---------------------------------|-------------------------|-------------------------------------------------------------|
| Career & Pay Progression Engine | `modules/career/`       | GS/LEO/Title 38, grade/step/locality, SCD, salary history, High-3 |
| Leave Planning & Tracking       | `modules/leave/`        | Annual + sick leave, rollover, LS/DE breakdown, calendar bridge, retirement credit |
| TSP Modeling                    | `modules/tsp/`          | Traditional & Roth balances; agency match; future value; RMD compliance |
| Military Service Buyback        | `modules/military/`     | Buyback deposit & service credit (module retained; UI disconnected) |
| Expense Modeling                | `modules/expenses/`     | Categories, expense smile curve, inflation, healthcare inflation |
| Retirement Simulation Engine    | `modules/simulation/`   | Eligibility, annuity, supplement, dual-pot TSP, income projection, scenario comparison |
| Visualization Layer             | `components/charts/`    | Zero business logic; 6 chart components + utilities, summary cards |
| Validation                      | `modules/validation/`   | Input validation, assumption warnings                       |

---

## Component Map

### Active Form Components (`components/forms/`)

| Component             | File                       | Purpose                                          |
|-----------------------|----------------------------|--------------------------------------------------|
| `FERSEstimateForm`    | FERSEstimateForm.tsx       | Container: Tabs for Personal/Salary/Annuity & SS/TSP (Phase E.1) |
| `FERSEstimateResults` | FERSEstimateResults.tsx    | Display-only results from `useFERSEstimate` hook |
| `CareerEventsForm`    | CareerEventsForm.tsx       | Career timeline: hire, promotion, step-increase, locality-change, separation, rehire |
| `ExpensesForm`        | ExpensesForm.tsx           | 10 expense categories with defaults, totals banner, dual inflation rates, smile curve toggle |
| `SimulationForm`      | SimulationForm.tsx         | Container: Tabs for Core Parameters/TSP/Expenses/Rates (Phase E.2); live results panel |
| `LeaveBalanceForm`    | LeaveBalanceForm.tsx       | Leave calendar orchestrator (toolbar + summary + grid + modal) |
| `FormShell`           | FormShell.tsx              | Tab bar container with completion indicators     |
| `FormSection`         | FormSection.tsx            | Reusable section wrapper with save/clear actions |
| `FieldGroup`          | FieldGroup.tsx             | Label + input wrapper                            |

### FERS Estimate Sub-Components (`components/forms/fers/`, Phase E.1)

| Component                | Purpose                                            |
|--------------------------|-----------------------------------------------------|
| `PersonalSubForm`        | Birth date, SCD, retirement age, pay system         |
| `SalarySubForm`          | Grade/step, locality, raise rate, High-3 override   |
| `AnnuitySocialSubForm`   | Annuity reduction, Social Security benefit          |
| `TSPSubForm`             | TSP balance, contribution rates, growth rate, withdrawal config |

### Simulation Sub-Components (`components/forms/simulation/`, Phase E.2)

| Component                      | Purpose                                                  |
|--------------------------------|-------------------------------------------------------|
| `CoreParametersSubForm`        | Retirement age, end age, birth year, annuity, supplement, SS claiming |
| `TSPSimulationSubForm`         | TSP balance, allocation, ROI, withdrawal strategy (conditional custom split) |
| `ExpensesSimulationSubForm`    | Base expenses, GoGo/GoSlow/NoGo phase configuration      |
| `RatesSubForm`                 | COLA, inflation, healthcare inflation, healthcare expense |

### Leave Calendar Sub-Components (`components/forms/leave-calendar/`)

| Component                | Purpose                                                   |
|--------------------------|-----------------------------------------------------------|
| `LeaveCalendarToolbar`   | Year selector, accrual rate picker, clear/reset buttons   |
| `LeaveBalanceSummaryPanel` | Annual/sick leave breakdown (LS/DE), carry-over, EOY balance |
| `LeaveCalendarGrid`      | 12-month grid with federal holiday integration            |
| `MonthCalendar`          | Single month calendar renderer                            |
| `DayCell`                | Day cell with color coding, holiday indicator, click handler |
| `LeaveEntryModal`        | CRUD modal for leave entries (planned/actual, type, hours, sick code, notes) |
| `useLeaveCalendar`       | Full CRUD hook with localStorage persistence              |

### Dashboard Components

**Main Dashboard Layout:**

| Component                | Directory             | Purpose                                     |
|--------------------------|-----------------------|---------------------------------------------|
| `Dashboard`              | `components/`         | 7-section projection layout with summary cards |
| `SummaryPanel`           | `components/cards/`   | Expanded metric cards (9 cards: core + optional) |
| `MetricCard`             | `components/cards/`   | Single metric with color variants           |

**Chart Components (6 + Utilities):**

| Component                | Directory             | Purpose                                     |
|--------------------------|-----------------------|---------------------------------------------|
| `IncomeWaterfallChart`   | `components/charts/`  | Hero: 4-component stacked income (annuity, supplement, SS, TSP) + expense overlay |
| `TSPLifecycleChart`      | `components/charts/`  | Full timeline: pre-retirement accumulation → post-retirement drawdown with depletion |
| `ExpensePhasesChart`     | `components/charts/`  | GoGo/GoSlow/NoGo phases with Blanchett comparison line |
| `RMDComplianceChart`     | `components/charts/`  | Tax compliance: RMD required vs actual withdrawals (age 73+) |
| `PayGrowthChart`         | `components/charts/`  | Career salary progression with High-3 average highlighted |
| `LeaveBalancesChart`     | `components/charts/`  | Annual & sick leave trajectory with retirement credit calculation |
| `ChartContainer`         | `components/charts/`  | Reusable wrapper with title/subtitle/height |
| `ChartTooltip`           | `components/charts/`  | Styled tooltip container for all charts     |

### Deleted Components (Phase 9 Dashboard Replacement)

| Component             | Reason                                                 |
|-----------------------|--------------------------------------------------------|
| `IncomeVsExpensesChart` | Replaced by `IncomeWaterfallChart` (adds SS, RMD, component decomposition) |
| `TSPBalancesChart`    | Replaced by `TSPLifecycleChart` (adds pre/post lifecycle view, depletion detection) |
| `ExpenseSmileCurveChart` | Replaced by `ExpensePhasesChart` (adds GoGo/GoSlow/NoGo phases, Blanchett comparison) |

### Orphaned Components (retained but not rendered)

| Component             | Reason                                                 |
|-----------------------|--------------------------------------------------------|
| `PersonalInfoForm`    | Merged into `FERSEstimateForm`                         |
| `MilitaryServiceForm` | Military tab disconnected from navigation              |
| `TSPForm`             | TSP fields merged into `FERSEstimateForm`              |
| `AssumptionsForm`     | Replaced by `SimulationForm`                           |

---

## Custom Hooks

| Hook               | File                  | Purpose                                              |
|--------------------|-----------------------|------------------------------------------------------|
| `useLocalStorage`  | hooks/useLocalStorage.ts | Typed localStorage persistence with Zod validation |
| `useSimulation`    | hooks/useSimulation.ts   | Assembles all form data, runs simulation, generates 6 chart datasets (incomeWaterfall, tspLifecycle, expensePhases, rmdTimeline, salaryHistory, leaveBalances, tspBalances, smileCurve) |
| `useFERSEstimate`  | forms/useFERSEstimate.ts | Computes service years, annuity, supplement, TSP depletion from FERS form |
| `useFormSections`  | forms/useFormSections.ts | Tracks tab completion status                       |
| `useLeaveCalendar` | forms/leave-calendar/useLeaveCalendar.ts | Full CRUD for leave calendar entries |

---

## Data Flow Overview

```
[User Input Forms]
       │
       ▼
[localStorage] ── retire:personal, retire:career, retire:expenses,
       │           retire:leave-calendar, retire:simulation-config
       │
       ▼
[useSimulation hook]
       │
       ├── Career Engine ──► buildSalaryHistory(), computeHigh3Salary()
       │
       ├── Leave Module ──► computeCalendarYearSummary(), sickLeaveToServiceCredit()
       │
       ├── TSP Module ──► computeTSPFutureValue(), projectTSPDepletion()
       │
       ├── Expense Module ──► totalAnnualExpenses(), smileCurveMultiplier()
       │
       └── Simulation Engine ──► checkFERSEligibility(), computeFERSAnnuity(),
              │                   computeFERSSupplement(), projectRetirementIncome(),
              │                   projectRetirementSimulation() (dual-pot + RMD)
              │
              │
              ├── New Datasets (Phase 9) ──► incomeWaterfall, tspLifecycle,
              │                               expensePhases, rmdTimeline
              │
              ▼
       [Dashboard] ──► SummaryPanel (9 cards) + 6 Charts (zero business logic)
```

---

## Module Communication Contract

All inter-module communication uses typed interfaces defined in `src/models/`.
No module imports directly from another module's internals.
All shared state is passed explicitly — never via global mutation.

---

## Data Models (`models/`)

| File               | Key Exports                                                    |
|--------------------|----------------------------------------------------------------|
| `common.ts`        | `ISODate`, `USD`, `Rate`, `PayYear`, `GSGrade`, `GSStep`, `PaySystem` |
| `career.ts`        | `CareerEvent`, `CareerProfile`, `PayPeriod`                    |
| `leave.ts`         | `LeaveType`, `LeaveBalance`, `LeaveEvent`                      |
| `leave-calendar.ts`| `CalendarLeaveEntry`, `SickLeaveCode`, `AccrualRate`, `LeaveCalendarData` |
| `tsp.ts`           | `TSPBalances`, `TSPContributionEvent`                          |
| `military.ts`      | `MilitaryService`                                              |
| `expenses.ts`      | `ExpenseCategoryName`, `ExpenseCategory`, `ExpenseProfile`     |
| `simulation.ts`    | `SimulationConfig`, `SimulationYearResult`, `FullSimulationResult`, `RetirementAssumptions`, `SimulationInput`, `AnnualProjection`, `SimulationResult` |

---

## Static Data (`data/`)

| File                   | Purpose                                           |
|------------------------|---------------------------------------------------|
| `gs-pay-tables.ts`     | GS salary lookup by grade/step/year               |
| `locality-rates.ts`    | Locality pay percentages by code and year          |
| `opm-interest-rates.ts`| OPM buyback interest rates                        |
| `tsp-limits.ts`        | IRS contribution limits and catch-up by year       |
| `federal-holidays.ts`  | 11 federal holidays with observed-date logic       |
| `demo-fixture.ts`      | Pre-computed demo scenario for Dashboard fallback  |
| `default-inputs.json`  | Default form values for new users                  |

---

## Local Storage Design

| Key                           | Schema                          | Purpose                         |
|-------------------------------|----------------------------------|---------------------------------|
| `retire:personal`             | `PersonalInfoSchema`            | FERS Estimate form data         |
| `retire:career`               | `CareerProfileSchema`           | Career events timeline          |
| `retire:leave`                | `LeaveBalanceSchema`            | Leave balance snapshot          |
| `retire:leave-calendar`       | `LeaveCalendarDataSchema`       | Detailed 12-month calendar      |
| `retire:tsp`                  | `TSPBalancesSchema`             | TSP account balances            |
| `retire:tsp:contributions`    | `TSPContributionEventSchema[]`  | TSP contribution elections      |
| `retire:military`             | `MilitaryServiceSchema[]`       | Military service records        |
| `retire:expenses`             | `ExpenseProfileSchema`          | Expense categories & inflation  |
| `retire:assumptions`          | `RetirementAssumptionsFullSchema`| Retirement assumptions          |
| `retire:fers-estimate`        | `FERSEstimateSchema`            | FERS form draft                 |
| `retire:simulation-config`    | `SimulationConfigSchema`        | Simulation parameters           |
| `retire:scenarios`            | `RetirementScenarioStoredSchema[]`| Saved scenarios               |

All records wrapped in `StoredRecord<T>` envelope: `{ schemaVersion, updatedAt, data }`.
Schema version: `CURRENT_SCHEMA_VERSION = 1`.

---

## Test Structure

### Scenario Tests (`tests/scenarios/`)

| File                          | Description                                |
|-------------------------------|--------------------------------------------|
| `gs-straight-through.test.ts` | Full GS career, standard FERS retirement  |
| `leo-early-retirement.test.ts`| LEO 20-year early retirement              |
| `military-buyback.test.ts`    | FERS + military buyback credit            |
| `tsp-roth-vs-traditional.test.ts` | Roth vs Traditional TSP paths        |
| `fixtures/baseline.json`      | Canonical expected values from spreadsheet |

### Unit Tests (`tests/unit/`)

| Module       | Test Files                                              |
|--------------|---------------------------------------------------------|
| career       | grade-step, pay-calculator, projection, scd             |
| leave        | annual-leave, sick-leave, retirement-credit, simulate-year, calendar-utils, calendar-bridge, federal-holidays |
| tsp          | agency-match, contribution-limits, projections, future-value, rmd |
| military     | buyback                                                 |
| expenses     | categories, smile-curve, inflation, projection          |
| simulation   | eligibility, annuity, retirement-simulation             |
| hooks        | useSimulation                                           |
| components   | MetricCard, SummaryPanel, 5 chart components            |
| storage      | persistence                                             |

---

## Regulatory Change Safety

1. Every formula references a `sourceRef` field in the formula registry.
2. When a regulation changes, locate affected formulas via registry lookup.
3. Increment formula version, update logic, add changelog entry.
4. Re-run affected scenario tests.
5. Document the change in `docs/regulatory-mapping.md`.

---

## Change History

| Version | Date       | Author | Description                  |
|---------|------------|--------|------------------------------|
| 0.1.0   | 2026-02-10 |        | Initial architecture scaffold |
| 0.2.0   | 2026-02-10 |        | Phase 1 complete — tech stack locked, build tooling established |
| 0.3.0   | 2026-02-10 |        | Phase 2 complete — data models finalized, Zod schemas, persistence layer with migrations |
| 0.4.0   | 2026-02-10 |        | Phase 3 complete — Career & Pay Engine (GS/LEO/Title 38, WGI, locality, SCD, salary history) |
| 0.5.0   | 2026-02-10 |        | Phase 4 complete — Leave module (annual/sick accrual, rollover, LS/DE breakdown, calendar bridge, federal holidays, retirement credit) |
| 0.6.0   | 2026-02-10 |        | Phase 5 complete — TSP module (Traditional/Roth projection, agency match, contribution limits, future value, RMD) + Military buyback |
| 0.7.0   | 2026-02-10 |        | Phase 6 complete — Expense module (10 categories with defaults, smile curve, dual inflation rates) |
| 0.8.0   | 2026-02-10 |        | Phase 7 complete — Simulation engine (eligibility, annuity, supplement, dual-pot TSP, income projection, scenario comparison) |
| 0.9.0   | 2026-02-10 |        | Phase 8 complete — Visualization & UX (AppShell with 3-view nav, FormShell with 4 tabs, Leave calendar, Dashboard with 5 charts, demo fixture) |
| 1.0.0   | 2026-02-11 |        | Documentation updated to reflect current app state; orphaned components noted; full component/hook/storage/test map |

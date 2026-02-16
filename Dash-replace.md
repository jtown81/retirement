# Dashboard Replacement Plan

## Problem Statement

The current dashboard only partially honors data from the app's modules. The `useSimulation` hook computes a `FullSimulationResult` with 17 fields per year (dual-pot TSP balances, RMD compliance, Social Security, GoGo/GoSlow/NoGo expense phases, withdrawal strategy impacts) but the Dashboard ignores it entirely. Instead, it displays only the "simple path" (`SimulationResult`) which has just 8 fields per year and omits Social Security, RMD, dual-pot tracking, and phase-based expenses. The TSP chart also has a bug — it sets `rothBalance: 0` for every year, never showing actual Roth projections.

---

## What Exists Today (5 Charts + 6 Summary Cards)

| Chart | Data Source | What It Shows | Key Gaps |
|-------|-----------|---------------|----------|
| **SummaryPanel** (6 cards) | `SimulationResult` | Annuity, High-3, Service Years, Eligibility, Supplement, Year-1 Surplus | No TSP depletion age, no SS estimate, no lifetime totals, no balance-at-85 |
| **IncomeVsExpensesChart** | `result.projections` (simple path) | 2 lines (income/expenses) + surplus area | Missing SS income, lumps all income together, no component breakdown |
| **PayGrowthChart** | `salaryHistory` | Salary by year/grade/step | Adequate — keep with visual refresh |
| **TSPBalancesChart** | `tspBalances` | Stacked Traditional + Roth areas | Roth is always 0 (bug). Pre-retirement only. No post-retirement drawdown. |
| **LeaveBalancesChart** | `leaveBalances` | Annual + sick leave hours over career | Adequate — keep with visual refresh |
| **ExpenseSmileCurveChart** | `smileCurve` | Blanchett multiplier curve | Only shows Blanchett model, not GoGo/GoSlow/NoGo phases from SimulationConfig |

---

## New Dashboard Design

### Design Principles

1. **Full Simulation First** — When `fullSimulation` data is available (user has completed the Simulation tab), use it as the primary data source. Fall back to simple path only when it isn't.
2. **Income Component Decomposition** — Never lump income into one number. Show annuity, supplement, Social Security, and TSP withdrawals as distinct stacked components.
3. **Lifecycle Continuity** — Charts should span the full lifecycle where applicable (pre-retirement accumulation through post-retirement drawdown on a single timeline).
4. **Actionable Metrics** — Summary cards should highlight decision-relevant numbers (depletion age, RMD shortfall, surplus/deficit trend) not just descriptive labels.
5. **Zero Business Logic in Charts** — All new chart data shapes are computed in `useSimulation` and passed as flat arrays. Charts remain pure renderers.
6. **Mobile-First Responsive** — All charts must work at 320px width. Use Recharts `ResponsiveContainer` consistently.

---

### New Layout (Top to Bottom)

#### Section 1: Summary Cards (Redesigned)

Replace the current 6-card `SummaryPanel` with a 2-row grid of 8 cards:

| Card | Source | Value |
|------|--------|-------|
| **Annual Annuity** | `fersAnnuity` or `result.annualAnnuity` | `$XX,XXX/yr` |
| **High-3 Salary** | `result.high3Salary` | `$XXX,XXX` |
| **Creditable Service** | `result.creditableServiceYears` | `XX.X yrs` |
| **Retirement Eligibility** | `result.eligibility.type` | MRA+30 / 60+20 / 62+5 |
| **FERS Supplement** | `result.fersSupplementEligible` + monthly amount | `$X,XXX/mo until 62` or `Not Eligible` |
| **Social Security (est.)** | `simConfig.ssMonthlyAt62` × claiming multiplier | `$X,XXX/mo at age XX` |
| **TSP Depletion Age** | `fullSimulation.depletionAge` | `Age XX` or `Survives to XX` (color-coded: green if survives past endAge, amber if depletes after 85, red if before 85) |
| **Lifetime Surplus/Deficit** | `fullSimulation.totalLifetimeIncome - totalLifetimeExpenses` | `+$XXX,XXX` or `-$XXX,XXX` (color-coded) |

When `fullSimulation` is unavailable, the last 2 cards show "Complete Simulation tab to unlock" in muted text.

#### Section 2: Retirement Income Waterfall (NEW — Hero Chart)

**Purpose:** Show where every dollar of retirement income comes from, year by year.

**Chart type:** Stacked area chart (Recharts `AreaChart` with `stackId`).

**Data shape (new type: `IncomeWaterfallDataPoint`):**
```typescript
{
  year: number;
  age: number;
  annuity: USD;
  fersSupplement: USD;   // drops to 0 at age 62
  socialSecurity: USD;   // starts at claiming age (62/67/70)
  tspWithdrawal: USD;
  totalIncome: USD;
  totalExpenses: USD;
  surplus: USD;
}
```

**Visual:** 4 stacked colored areas (annuity, supplement, SS, TSP withdrawal) with an expense line overlay and a horizontal reference line at $0 surplus. Tooltip shows all 4 income sources + total + expenses + surplus.

**Data source:** When `fullSimulation` is available, map `fullSimulation.years[]` directly. When not, use `result.projections[]` (which lacks SS breakdown — show annuity + supplement + TSP only).

#### Section 3: TSP Lifecycle Chart (REPLACES current TSPBalancesChart)

**Purpose:** Show TSP balance from accumulation through retirement drawdown on a single timeline, with dual-pot breakdown.

**Chart type:** Stacked area chart with a vertical reference line at retirement year.

**Data shape (new type: `TSPLifecycleDataPoint`):**
```typescript
{
  year: number;
  age?: number;
  phase: 'accumulation' | 'distribution';
  traditionalBalance: USD;
  rothBalance: USD;
  totalBalance: USD;
  // Post-retirement only (from fullSimulation):
  highRiskBalance?: USD;
  lowRiskBalance?: USD;
  rmdRequired?: USD;
  rmdSatisfied?: boolean;
  withdrawal?: USD;
}
```

**Visual:**
- **Pre-retirement segment:** Stacked Traditional (blue) + Roth (green) areas growing upward. Fix the current bug where Roth is always 0 — use `projectRothDetailed()` in `useSimulation`.
- **Post-retirement segment:** Same stacked areas declining. When `fullSimulation` is available, show high-risk/low-risk split as a secondary dashed line overlay.
- **RMD markers:** Small icons or dots on years where RMD applies. Red dot if `rmdSatisfied === false`.
- **Depletion line:** Vertical dashed line at `depletionAge` (if non-null) with label.

**Data source:** Concatenate pre-retirement TSP projections (fix Roth bug) with post-retirement `fullSimulation.years[]` TSP balances. When `fullSimulation` is unavailable, post-retirement segment uses the simple path's TSP withdrawal to project a basic decline curve.

#### Section 4: Expense Phases Chart (REPLACES current ExpenseSmileCurveChart)

**Purpose:** Show actual projected expenses with GoGo/GoSlow/NoGo phase coloring and dual inflation (general + healthcare).

**Chart type:** Area chart with colored bands for phases + a reference line for the Blanchett model.

**Data shape (new type: `ExpensePhaseDataPoint`):**
```typescript
{
  year: number;
  age: number;
  yearsIntoRetirement: number;
  phase: 'GoGo' | 'GoSlow' | 'NoGo';
  baseExpenses: USD;
  adjustedExpenses: USD;         // after smile curve + inflation
  healthcareExpenses?: USD;      // if tracked separately
  nonHealthcareExpenses?: USD;
  blanchettAdjusted: USD;        // Blanchett model for comparison
  smileMultiplier: number;
}
```

**Visual:**
- Main area colored by phase (green for GoGo, amber for GoSlow, gray for NoGo).
- If healthcare is tracked separately, show it as a stacked area on top in a distinct color (showing healthcare growing faster due to higher inflation rate).
- Dashed line showing the Blanchett model for comparison.
- Vertical reference lines at GoGo→GoSlow and GoSlow→NoGo transition ages.

**Data source:** When `fullSimulation` is available, derive from `fullSimulation.years[]` (which has `smileMultiplier` and `totalExpenses` per year with phase-based multipliers). Overlay with current Blanchett `smileCurve[]` data for comparison. When unavailable, show only the Blanchett curve (current behavior).

#### Section 5: Career Pay Growth (REFRESHED — keep)

**No structural changes.** Visual refresh only:
- Add High-3 shaded region highlighting the 3 highest consecutive years.
- Add grade/step annotations at promotion points.
- Keep current `PayGrowthChart` data shape.

#### Section 6: Leave Balances (REFRESHED — keep)

**No structural changes.** Visual refresh only:
- Add annual leave max carryover reference line (240 hrs for most employees).
- Add sick leave retirement credit annotation (showing equivalent months of service credit).
- Keep current `LeaveBalanceDataPoint` data shape.

#### Section 7: RMD Compliance Timeline (NEW)

**Purpose:** Dedicated view of Required Minimum Distributions from age 73+.

**Chart type:** Bar chart with reference line.

**Data shape (new type: `RMDDataPoint`):**
```typescript
{
  year: number;
  age: number;
  rmdRequired: USD;
  actualWithdrawal: USD;
  rmdSatisfied: boolean;
  totalTSPBalance: USD;
}
```

**Visual:**
- Grouped bars: RMD required (red outline) vs actual withdrawal (solid blue).
- Green checkmark/red X indicators for `rmdSatisfied`.
- Secondary Y-axis or overlay line showing total TSP balance declining.
- Only shown when `fullSimulation` is available and age range includes 73+.

**Data source:** Filter `fullSimulation.years[]` to ages 73+, extract RMD fields.

---

## Implementation Steps

### Step 1: Fix Data Layer (`useSimulation.ts`)

1. **Fix Roth TSP bug:** Call `projectRothDetailed()` alongside `projectTraditionalDetailed()` and combine results so `TSPBalanceDataPoint.rothBalance` reflects actual Roth projections.
2. **Add new chart data shapes:** Define `IncomeWaterfallDataPoint`, `TSPLifecycleDataPoint`, `ExpensePhaseDataPoint`, `RMDDataPoint` in `chart-types.ts`.
3. **Compute new datasets in `useSimulation`:**
   - `incomeWaterfall`: Map from `fullSimulation.years[]` when available, else from `result.projections[]`.
   - `tspLifecycle`: Concatenate pre-retirement TSP (with fixed Roth) + post-retirement from `fullSimulation.years[]`.
   - `expensePhases`: Compute from `fullSimulation.years[]` with phase labels derived from `simConfig` age boundaries.
   - `rmdTimeline`: Filter `fullSimulation.years[]` for age >= 73.
4. **Expand `SimulationData` interface** to include new datasets alongside existing ones.

### Step 2: Expand Chart Theme (`useChartTheme.ts`)

Add new color tokens:
- `socialSecurity` (for SS income band)
- `supplement` (for FERS supplement band)
- `annuity` (for annuity band — distinguish from generic `income`)
- `tspWithdrawal` (for TSP withdrawal band)
- `highRisk` / `lowRisk` (for dual-pot TSP overlay)
- `goGo` / `goSlow` / `noGo` (for expense phase bands)
- `rmdRequired` / `rmdActual` (for RMD chart)
- `healthcare` (for healthcare expense overlay)
- `blanchett` (for Blanchett reference line)

### Step 3: Build New Chart Components

Create in `app/src/components/charts/`:

| File | Replaces | Notes |
|------|----------|-------|
| `IncomeWaterfallChart.tsx` | `IncomeVsExpensesChart.tsx` | Stacked area with 4 income components |
| `TSPLifecycleChart.tsx` | `TSPBalancesChart.tsx` | Accumulation + drawdown with dual-pot |
| `ExpensePhasesChart.tsx` | `ExpenseSmileCurveChart.tsx` | Phase-colored with healthcare split |
| `RMDComplianceChart.tsx` | (new) | Bar chart, age 73+ only |
| `PayGrowthChart.tsx` | (refresh) | Add High-3 highlight and annotations |
| `LeaveBalancesChart.tsx` | (refresh) | Add carryover line and credit annotation |

Each chart:
- Uses `ChartContainer` wrapper (keep existing).
- Uses `useChartTheme()` for colors.
- Receives flat data arrays as props — zero business logic.
- Has a custom tooltip component.
- Is fully responsive.

### Step 4: Redesign Summary Cards

1. Update `SummaryPanel` props and `SummaryPanelProps` type to accept new card data.
2. Add conditional rendering: show "Complete Simulation tab" placeholder for cards that require `fullSimulation`.
3. Add color-coding logic for TSP depletion age and lifetime surplus/deficit.
4. Expand card grid from 6 → 8 cards (4×2 on desktop, 2×4 on mobile).

### Step 5: Rebuild Dashboard Component

Rewrite `Dashboard.tsx`:
1. Destructure expanded `SimulationData` to get new datasets.
2. Check `fullSimulation` availability to conditionally render enhanced vs. basic variants.
3. Lay out sections in the new order (Summary → Income Waterfall → TSP Lifecycle → Expense Phases → Pay Growth → Leave → RMD).
4. Update skeleton loading states for new layout.
5. Keep demo mode banner.

### Step 6: Remove Old Chart Components

Delete after new ones are verified:
- `IncomeVsExpensesChart.tsx` (replaced by `IncomeWaterfallChart`)
- `TSPBalancesChart.tsx` (replaced by `TSPLifecycleChart`)
- `ExpenseSmileCurveChart.tsx` (replaced by `ExpensePhasesChart`)

Update barrel exports in `charts/index.ts` (if one exists).

### Step 7: Update Tests

1. Update any existing chart snapshot tests.
2. Add unit tests for new data transformations in `useSimulation.ts` (the new dataset computations).
3. Verify spreadsheet parity scenarios still pass (`pnpm test:scenarios`).
4. Run full type check (`pnpm typecheck`).

### Step 8: Update Documentation

1. Update `docs/architecture.md` — component map, chart list.
2. Update `CLAUDE.md` — current status and chart component list.

---

## Files Modified / Created

| Action | File | Purpose |
|--------|------|---------|
| **Edit** | `src/hooks/useSimulation.ts` | Fix Roth bug, add new datasets |
| **Edit** | `src/hooks/useChartTheme.ts` | Add new color tokens |
| **Edit** | `src/components/charts/chart-types.ts` | Add new data point and prop types |
| **Edit** | `src/components/Dashboard.tsx` | New layout with new charts |
| **Edit** | `src/components/cards/SummaryPanel.tsx` | 8 cards, conditional rendering |
| **Edit** | `src/components/cards/MetricCard.tsx` | Support new variants if needed |
| **Edit** | `src/components/charts/PayGrowthChart.tsx` | High-3 highlight, annotations |
| **Edit** | `src/components/charts/LeaveBalancesChart.tsx` | Carryover line, credit note |
| **Create** | `src/components/charts/IncomeWaterfallChart.tsx` | New hero chart |
| **Create** | `src/components/charts/TSPLifecycleChart.tsx` | Full lifecycle TSP chart |
| **Create** | `src/components/charts/ExpensePhasesChart.tsx` | Phase-colored expense chart |
| **Create** | `src/components/charts/RMDComplianceChart.tsx` | RMD bar chart |
| **Delete** | `src/components/charts/IncomeVsExpensesChart.tsx` | Replaced |
| **Delete** | `src/components/charts/TSPBalancesChart.tsx` | Replaced |
| **Delete** | `src/components/charts/ExpenseSmileCurveChart.tsx` | Replaced |

---

## Risk Mitigation

- **Spreadsheet parity:** No simulation engine changes — only data routing and visualization. Module outputs remain identical. Run `pnpm test:scenarios` to verify.
- **Backward compatibility:** `useSimulation` still returns all existing fields. New fields are additive. Dashboard falls back gracefully when `fullSimulation` is null.
- **No new dependencies:** All charts use Recharts (already installed). No new libraries needed.
- **Demo mode:** Update demo fixture to include `fullSimulation` data so demo mode shows the full dashboard.

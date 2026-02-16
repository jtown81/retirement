# Updates 2/11/26 V2

## FERS Estimate

### 1. Allow user input of annual raises >= 0
**Current state:** The FERS Estimate form has a checkbox "Assume annual pay raises (~2%)" that is either on (2%) or off (0%). There is no way to enter a custom raise percentage.

**Plan:**
- **File:** `retire/app/src/components/forms/FERSEstimateForm.tsx`
  - Replace the checkbox with a numeric input field labeled "Annual raise %" that accepts values >= 0 (e.g., 0, 1.5, 2, 3, etc.)
  - Default the field to `2.0` to preserve current behavior
  - Add input validation: must be a number >= 0, reasonable upper bound (e.g., 10%)
  - When value is 0, effectively the same as "no raises assumed"
- **File:** `retire/app/src/models/` (fers-estimate or career model)
  - Update the data model: replace boolean `assumeAnnualRaises` with numeric `annualRaiseRate: number` (as a percentage, e.g., 2.0 means 2%)
- **File:** `retire/app/src/storage/zod-schemas.ts`
  - Update Zod schema to validate `annualRaiseRate` as `z.number().min(0)`
  - Add migration from old boolean field to new numeric field (true -> 2.0, false -> 0)
- **File:** `retire/app/src/modules/career/projection.ts`
  - Update `buildSalaryHistory()` and High-3 computation to use the user-provided raise rate instead of hard-coded 2%
- **File:** `retire/app/src/components/forms/useFERSEstimate.ts`
  - Pass the custom raise rate through to salary projection logic

### 2. Always display the High-3 salary being used
**Current state:** The High-3 salary is only shown when the user provides a manual override value. The computed High-3 is used internally but not surfaced to the user.

**Plan:**
- **File:** `retire/app/src/components/forms/FERSEstimateResults.tsx`
  - Always render the High-3 salary in the results panel, whether it was computed from career data or manually overridden
  - Add a label/indicator showing the source: "Computed from salary projection" vs "User override"
- **File:** `retire/app/src/components/forms/useFERSEstimate.ts`
  - Ensure the computed High-3 value is returned from the hook so the results component can display it
  - If the user has a High-3 override, display both the override value (used) and the computed value (for reference)

---

## General

### 3. Remove Military tab/feature
**Current state:** Military is an optional tab (tab 5 of 7) with its own form (`MilitaryServiceForm.tsx`), data model, buyback calculation module, and storage key.

**Plan:**
- **File:** `retire/app/src/components/forms/useFormSections.ts`
  - Remove the Military section from the sections array so it no longer appears as a tab
- **File:** `retire/app/src/components/forms/FERSEstimateForm.tsx`
  - Remove the "Military/Previous Service" section (section 3) that collects years of service and buyback status
  - Remove any references to military service years in the FERS estimate calculations
- **File:** `retire/app/src/components/forms/useFERSEstimate.ts`
  - Remove military service credit from creditable service computation
  - Remove SCD Leave adjustment for military service
- **File:** `retire/app/src/modules/simulation/annuity.ts` and `eligibility.ts`
  - Remove military service credit from annuity and eligibility calculations
- **Files to leave in place but disconnect:**
  - `retire/app/src/components/forms/MilitaryServiceForm.tsx` — stop rendering but keep file (can delete later)
  - `retire/app/src/models/military.ts` — keep file (can delete later)
  - `retire/app/src/modules/military/buyback.ts` — keep file (can delete later)
- **File:** `retire/app/src/storage/schema.ts`
  - Remove `retire:military` storage key from active schema (data stays in localStorage but is ignored)
- **File:** `retire/app/src/hooks/useSimulation.ts`
  - Remove military service data from simulation input assembly

### 4. Utilize FERS estimate values in simulation by default; allow user overrides
**Current state:** The Simulation tab (`SimulationForm`) has its own input fields for values that overlap with FERS Estimate (e.g., TSP growth rate, withdrawal rate, COLA, SS benefit). The user must re-enter or manually sync these values.

**Plan:**
- **File:** `retire/app/src/components/forms/SimulationForm.tsx`
  - Pre-populate simulation fields from saved FERS estimate values on load
  - For each field that originates from FERS: show the FERS-derived default with a visual indicator (e.g., "(from FERS Estimate)")
  - Allow the user to override any field — once overridden, mark it as "Custom" and stop auto-syncing that field
  - Add a "Reset to FERS defaults" button/link per field or globally
- **File:** `retire/app/src/hooks/useSimulation.ts`
  - When assembling simulation inputs, prefer FERS estimate values as defaults
  - Layer user overrides on top of FERS defaults
  - Specifically sync: High-3 salary, creditable service, annuity amount, FERS supplement, TSP balance, TSP withdrawal rate, TSP growth rate, retirement date, SS benefit at 62
- **File:** `retire/app/src/models/simulation.ts`
  - Add optional override flags per field (e.g., `high3Override?: USD`, `tspGrowthRateOverride?: Rate`)
  - If override is undefined/null, use the FERS estimate value
- **File:** `retire/app/src/storage/zod-schemas.ts`
  - Update simulation schema to support optional override fields

### 5. Fix Career tab — fails to display anything
**Current state:** The Career tab renders blank content. Need to investigate root cause.

**Plan:**
- **Investigate and diagnose:**
  - **File:** `retire/app/src/components/forms/CareerEventsForm.tsx` — check for rendering issues (conditional rendering that always evaluates false, missing data dependencies, error boundaries swallowing errors)
  - **File:** `retire/app/src/components/forms/useFormSections.ts` — verify the Career section component reference is correct
  - **File:** `retire/app/src/components/forms/FormShell.tsx` — check if the tab content area correctly renders the Career component
- **Likely issues to check:**
  - Component may depend on FERS estimate data that hasn't been saved yet (missing null/undefined guard)
  - Import path may be wrong or component may not be exported correctly
  - React error boundary may be catching and silently swallowing an error
  - State initialization may fail, causing empty render
- **Fix:** Depends on diagnosis. Ensure the Career form renders independently and shows its initial empty state (with an "Add Career Event" button) even when no data exists yet

### 6. Move the Leave tab to top-level alongside My Plan and Dashboard
**Current state:** Leave is tab 3 of 7 inside the "My Plan" form shell, at the same level as FERS Estimate, Career, TSP, etc. The top-level navigation has only "My Plan" and "Dashboard".

**Plan:**
- **File:** `retire/app/src/components/layout/AppShell.tsx`
  - Add "Leave" as a third top-level navigation item alongside "My Plan" and "Dashboard"
  - Navigation order: My Plan | Leave | Dashboard
- **File:** `retire/app/src/components/forms/useFormSections.ts`
  - Remove the Leave section from the form sections array (it's no longer a sub-tab of My Plan)
- **File:** `retire/app/src/components/layout/AppShell.tsx` (or new route/view)
  - When "Leave" is selected in top-level nav, render `LeaveBalanceForm` and the leave calendar widget as a standalone view
  - Preserve all existing Leave functionality (balance form, calendar, accrual display)
- **File:** `retire/app/src/hooks/useSimulation.ts`
  - Ensure leave data is still read from the same storage key regardless of where the form lives
- **Completion tracking:** Leave section's completion status should still be tracked for Dashboard unlock, just sourced from a top-level view instead of a sub-tab

### 7. Ensure common retirement expense categories are included with reasonable estimates
**Current state:** 10 expense categories exist (Housing, Transportation, Food, Healthcare, Insurance, Travel & Leisure, Utilities, Personal Care, Gifts & Charitable, Other). Categories exist but may not have default/suggested values.

**Plan:**
- **File:** `retire/app/src/modules/expenses/categories.ts`
  - Verify all 10 categories are present (they appear to be)
  - Add reasonable default annual estimates for a typical federal retiree:
    - Housing: $18,000 (rent/mortgage, property tax, maintenance)
    - Transportation: $8,000 (vehicle, gas, insurance)
    - Food: $7,200 (groceries + dining)
    - Healthcare: $8,000 (premiums, copays, prescriptions — FEHB + out-of-pocket)
    - Insurance: $3,000 (life, supplemental)
    - Travel & Leisure: $5,000 (vacations, entertainment, hobbies)
    - Utilities: $4,800 (electric, gas, water, internet, phone)
    - Personal Care: $2,400 (clothing, hygiene)
    - Gifts & Charitable: $2,400 (donations, gifts)
    - Other: $2,400
  - Total default: ~$61,200/year (~$5,100/month)
- **File:** `retire/app/src/components/forms/ExpensesForm.tsx`
  - Pre-populate category fields with default estimates when no saved data exists
  - Show defaults as placeholder text or pre-filled values the user can adjust
  - Add a "Reset to defaults" option

### 8. Allow healthcare expenses to increase at a higher inflation rate
**Current state:** All expense categories share a single inflation rate (default 2.5%). Healthcare costs historically grow faster than general inflation (~5-6% annually).

**Plan:**
- **File:** `retire/app/src/models/expenses.ts`
  - Add `healthcareInflationRate: Rate` field to the expense profile (default: 5.5%)
  - Keep the general `inflationRate` for all other categories
- **File:** `retire/app/src/components/forms/ExpensesForm.tsx`
  - Add a separate "Healthcare inflation rate %" input field below the general inflation rate
  - Default to 5.5% with explanatory helper text (e.g., "Healthcare costs historically rise faster than general inflation")
- **File:** `retire/app/src/modules/expenses/inflation.ts` (or equivalent)
  - When projecting expenses year-by-year, apply `healthcareInflationRate` to the Healthcare category and `inflationRate` to all other categories
- **File:** `retire/app/src/modules/simulation/retirement-simulation.ts`
  - Update the year-by-year expense projection to split healthcare from other expenses and apply different inflation rates
  - `yearExpenses = (nonHealthcare × generalInflation^year × smileMultiplier) + (healthcare × healthcareInflation^year × smileMultiplier)`
- **File:** `retire/app/src/storage/zod-schemas.ts`
  - Add `healthcareInflationRate` to expense profile schema with default 5.5%

### 9. Combine TSP tab into FERS Estimate tab
**Current state:** TSP is its own tab (tab 4 of 7) with `TSPForm.tsx`. The FERS Estimate form already has a section 6 for "TSP Configuration" with basic TSP inputs (balance, contribution, growth rate, withdrawal rate). There is overlap/duplication.

**Plan:**
- **File:** `retire/app/src/components/forms/FERSEstimateForm.tsx`
  - Expand the existing TSP section (section 6) to include all fields currently in TSPForm:
    - Traditional balance + as-of date
    - Roth balance + as-of date
    - Employee contribution % per pay period
    - Roth election checkbox
    - Catch-up contribution eligibility
    - Growth rate assumption
    - Withdrawal rate
    - One-time withdrawal (amount + age)
  - Organize into clear subsections: "Current Balances", "Contributions", "Retirement Assumptions"
- **File:** `retire/app/src/components/forms/useFormSections.ts`
  - Remove the TSP section from the sections array so it no longer appears as a separate tab
- **File:** `retire/app/src/components/forms/useFERSEstimate.ts`
  - Integrate TSP calculations that were previously in the TSP tab's logic
  - TSP projection results should be part of the FERS estimate results
- **File:** `retire/app/src/storage/zod-schemas.ts`
  - Consolidate TSP storage into the FERS estimate schema, or keep TSP storage key separate but ensure it's managed from the FERS form
  - Add migration: if user has data in old `retire:tsp` key, merge into FERS estimate data
- **File:** `retire/app/src/components/forms/TSPForm.tsx`
  - Stop rendering (can delete later)
- **Post-merge tab order:** FERS Estimate | Career | Leave (moved to top-level) | Expenses | Simulation
  - With Leave moved out and Military + TSP removed, remaining tabs: FERS Estimate, Career, Expenses, Simulation

---

## Summary of New Tab Structure

### Top-Level Navigation (AppShell)
1. **My Plan** — Form input tabs
2. **Leave** — Leave balance & calendar (promoted from sub-tab)
3. **Dashboard** — Charts & projections (unlocked when sections complete)

### My Plan Sub-Tabs (FormShell)
1. **FERS Estimate** — Personal info, salary, High-3, annuity options, SS, TSP (merged)
2. **Career** — Career events timeline
3. **Expenses** — Expense categories with defaults, dual inflation rates
4. **Simulation** — Retirement assumptions (pre-populated from FERS, user-overridable)

### Removed
- **Military** tab — removed entirely
- **TSP** tab — merged into FERS Estimate

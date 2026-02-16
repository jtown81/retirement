# Dashboard Demo Data Fix Plan

## Problem Summary

The dashboard displays demo data even after the user fills out all sections of "My Plan".

## Root Cause

Two required `localStorage` keys are **never written** by any active form. The data pipeline requires:

```
useAssembleInput() → needs retire:personal ✓
                          retire:career    ✓
                          retire:leave     ✓  (written by Leave Calendar)
                          retire:tsp       ✗  ← NEVER WRITTEN
                          retire:expenses  ✓
                          retire:assumptions ✗ ← NEVER WRITTEN
```

`useAssembleInput` (`src/components/forms/useAssembleInput.ts:37`) returns `null` if **any** of these 6 keys is missing, triggering demo mode.

### Why the keys are missing

Both missing keys are artifacts of orphaned components that were replaced without migrating their writes:

| Missing Key | Previous Writer | Current State |
|---|---|---|
| `retire:tsp` | `TSPForm.tsx` | Orphaned. TSP fields were moved into `FERSEstimateForm`, but `FERSEstimateForm` only writes to `retire:fers-estimate`, not `retire:tsp`. |
| `retire:assumptions` | `AssumptionsForm.tsx` | Orphaned. Replaced by `SimulationForm`, but `SimulationForm` writes to `retire:simulation-config`, not `retire:assumptions`. |

### Secondary issue

`useFormSections` marks the "Simulation" tab complete when `retire:simulation-config` is saved, but `useAssembleInput` checks `retire:assumptions`. So the user sees all tabs with green checkmarks yet the dashboard still shows demo data — no feedback that anything is missing.

---

## Data Needed

### `retire:tsp` (`TSPBalancesSchema`)
```
{ asOf: ISODate, traditionalBalance: USD, rothBalance: USD }
```
All data is already in `FERSEstimateForm` fields saved to `retire:fers-estimate`:
- `traditionalBalance` = `traditionalTspBalance ?? max(0, currentTspBalance − (rothTspBalance ?? 0))`
- `rothBalance` = `rothTspBalance ?? 0`
- `asOf` = today's date at save time

### `retire:assumptions` (`RetirementAssumptionsFullSchema`)
```
{
  proposedRetirementDate,   // required
  tspGrowthRate,            // required
  colaRate,                 // required
  retirementHorizonYears,   // required
  tspWithdrawalRate?,       // optional
  estimatedSSMonthlyAt62?,  // optional
}
```
Data is split across two forms:

| Field | Source |
|---|---|
| `proposedRetirementDate` | `storedFERS.retirementDate` (already read by SimulationForm) |
| `tspGrowthRate` | `storedFERS.tspGrowthRate` (already read by SimulationForm) |
| `colaRate` | `SimulationForm.form.colaRate` (stored as "2" → convert to 0.02) |
| `retirementHorizonYears` | `Number(form.endAge) − Number(form.retirementAge)` |
| `tspWithdrawalRate` | `storedFERS.withdrawalRate` |
| `estimatedSSMonthlyAt62` | `storedFERS.ssaBenefitAt62` |

---

## Fix: Two-File Change

### Change 1 — `FERSEstimateForm.tsx`

**File:** `src/components/forms/FERSEstimateForm.tsx`

Add a write to `retire:tsp` in `handleSave`, right after the existing `saveFERS` call.

1. Import `TSPBalancesSchema` from `@storage/index`.
2. Add `const [, saveTSP] = useLocalStorage(STORAGE_KEYS.TSP_BALANCES, TSPBalancesSchema);` alongside the existing `useLocalStorage` calls (line ~196).
3. In `handleSave` (line ~261), after `saveFERS(fResult.data!)`, derive and save TSP:

```ts
const traditionalBal =
  fersData.traditionalTspBalance ??
  Math.max(0, fersData.currentTspBalance - (fersData.rothTspBalance ?? 0));
const rothBal = fersData.rothTspBalance ?? 0;

saveTSP({
  asOf: new Date().toISOString().slice(0, 10),
  traditionalBalance: traditionalBal,
  rothBalance: rothBal,
});
```

### Change 2 — `SimulationForm.tsx`

**File:** `src/components/forms/SimulationForm.tsx`

Add a write to `retire:assumptions` in `handleSave`, right after the existing `saveConfig` call.

1. Import `RetirementAssumptionsFullSchema` from `@storage/index`.
2. Add `const [, saveAssumptions] = useLocalStorage(STORAGE_KEYS.ASSUMPTIONS, RetirementAssumptionsFullSchema);` alongside the existing `useLocalStorage` calls (line ~269).
3. In `handleSave` (line ~330), after `saveConfig(result.data)`, derive and save assumptions — but only if the FERS data is available (guard with `if (storedFERS)`):

```ts
if (storedFERS) {
  const horizonYears =
    Number(form.endAge) - Number(form.retirementAge);

  saveAssumptions({
    proposedRetirementDate: storedFERS.retirementDate,
    tspGrowthRate: storedFERS.tspGrowthRate,        // already a decimal (e.g. 0.07)
    colaRate: Number(form.colaRate) / 100,           // "2" → 0.02
    retirementHorizonYears: horizonYears,
    ...(storedFERS.withdrawalRate != null
      ? { tspWithdrawalRate: storedFERS.withdrawalRate }
      : {}),
    ...(storedFERS.ssaBenefitAt62 != null
      ? { estimatedSSMonthlyAt62: storedFERS.ssaBenefitAt62 }
      : {}),
  });
}
```

> Note: `storedFERS` is already read at line 274 — no new reads needed.

---

## Files to Change

| File | Change |
|---|---|
| `src/components/forms/FERSEstimateForm.tsx` | Add `saveTSP` write on save |
| `src/components/forms/SimulationForm.tsx` | Add `saveAssumptions` write on save |

No schema changes, no new keys, no migration needed.

---

## Expected Outcome

After both saves are completed by the user (FERS Estimate tab saved, Simulation tab saved), all 6 required `localStorage` keys will be populated and `useAssembleInput` will return a valid `SimulationInput`. The dashboard will display personalized projections.

---

## Verification Steps

1. Open the app and clear all stored data (DevTools → Application → Storage → Clear).
2. Fill out all four My Plan tabs and click Save on each.
3. Go to the Leave tab and configure carry-over balances.
4. Navigate to the Dashboard — it should show user data (no red "demo data" alert).
5. Open DevTools → Application → Local Storage and confirm these keys exist:
   - `retire:personal`
   - `retire:career`
   - `retire:leave`
   - `retire:tsp` ← was missing
   - `retire:expenses`
   - `retire:assumptions` ← was missing

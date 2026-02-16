# Dark Mode Fix Plan

## Problem

Text is impossible to read in dark mode because it renders the same shade (near-black) as the
dark background. This affects inputs, date pickers, and other form controls throughout the app.

---

## Root Cause: Missing `color-scheme` Declarations (Phase 1 Omission)

The plan's Phase 1 token setup in `src/styles/global.css` correctly adds `.dark { }` CSS variable
overrides but **omits the `color-scheme` property**.

Without `color-scheme: dark` on the `.dark` block, browsers treat all system color keywords
(`CanvasText`, `Field`, `ButtonText`, etc.) as belonging to the **light** color scheme — even when
the app's custom `.dark` class has made all backgrounds dark.

**Effect in practice:** Chromium and Firefox apply their UA stylesheet's light-mode defaults to
`<input>`, `<select>`, `<textarea>`, and `<button>` elements. This means native browser rendering
gives those elements **black/near-black text** (`CanvasText` system color) while the app's custom
`dark:bg-input/30` class applies a **very dark background**. The result is dark-on-dark, which is
effectively invisible.

Date inputs (`<input type="date">`) are especially problematic because Chrome renders the
calendar picker icon and field text using OS system colors, which remain black in a non-`dark`
`color-scheme` context. The FERSEstimateForm has three date fields (birth date, SCD-Leave,
SCD-Retirement) that exhibit this problem.

**Why Phase 1 missed it:** The shadcn/ui `components.json` / token snippet the plan references
does not include `color-scheme`. This is a documented companion requirement for class-based dark
mode in Tailwind v4 with shadcn/ui, but the plan's Phase 1 checklist did not list it.

### Compiled evidence

In `dist/_astro/index.C1nyYpdB.css`, the dark-mode block compiles to:

```css
.dark[data-astro-cid-37fxchfa] {
  --background: oklch(14.5% 0 0);
  --foreground: oklch(98.5% 0 0);
  /* ... all other vars ... */
  /* color-scheme: dark;  <-- THIS LINE IS MISSING */
}
```

The `:root` block equally lacks `color-scheme: light`.

---

## Secondary Issues: Phase 8 Sweep Was Incomplete

Phase 8 described a "systematic sweep of all hardcoded Tailwind colors" but several active
components were missed.

### Active components with missing `dark:` variants

| File | Line | Class | Issue |
|------|------|-------|-------|
| `src/components/forms/FERSEstimateResults.tsx` | 139 | `text-green-600` / `text-amber-600` | Eligibility status badge — medium green/amber visible but not WCAG-compliant in dark mode |
| `src/components/forms/FormShell.tsx` | 34 | `text-green-600` | Tab completion checkmark icon — same issue |

These will be readable (green/amber on dark is visible) but fall below WCAG AA contrast ratio in
dark mode. Phase 8's table said `text-green-*` should be converted to `dark:text-green-400`, but
those specific lines were not updated.

### Orphaned components (not rendered, but contain hardcoded colors)

These components are NOT currently rendered (disconnected per the plan) but remain in the
codebase. If they are ever reconnected — for example, when the Military Buyback tab is
re-enabled — they will break dark mode immediately.

| File | Problem classes |
|------|----------------|
| `TSPForm.tsx` | `text-gray-700`, `border-gray-300`, `bg-gray-50`, `bg-white`, `text-blue-600` |
| `MilitaryServiceForm.tsx` | Same family of classes + `text-gray-400`, `text-gray-600`, `bg-gray-100` |
| `PersonalInfoForm.tsx` | `border-gray-300`, `text-gray-*` on all inputs |
| `AssumptionsForm.tsx` | Same input pattern |

---

## Fix Plan

### Fix 1 — Add `color-scheme` to `src/styles/global.css` (CRITICAL)

**File:** `src/styles/global.css`

Add `color-scheme: light` to `:root` and `color-scheme: dark` to `.dark`:

```css
/* ── Light theme tokens ────────────────────────────────── */
:root {
  color-scheme: light;          /* <-- ADD THIS */
  --background: oklch(1 0 0);
  /* ... rest unchanged ... */
}

/* ── Dark theme tokens ─────────────────────────────────── */
.dark {
  color-scheme: dark;           /* <-- ADD THIS */
  --background: oklch(0.145 0 0);
  /* ... rest unchanged ... */
}
```

`color-scheme: dark` instructs the browser to render all UA-styled form controls (inputs,
selects, date pickers, scrollbars, etc.) in dark mode, making their native text and background
colors use light-on-dark values that match the custom theme.

**Verify:** After this change, `pnpm build` should produce a compiled CSS where `:root` includes
`color-scheme:light` and `.dark[data-astro-cid-*]` includes `color-scheme:dark`. In the
browser, Chrome DevTools > Elements > Computed should show `color-scheme: dark` on `<html>`
when dark mode is active. Date pickers and native number-input spinners should have white text.

---

### Fix 2 — Patch missing `dark:` variants in active components

**File:** `src/components/forms/FERSEstimateResults.tsx`, line 139

Replace:
```tsx
<span className={`font-medium ${result.eligibility.eligible ? 'text-green-600' : 'text-amber-600'}`}>
```
With:
```tsx
<span className={`font-medium ${result.eligibility.eligible ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
```

**File:** `src/components/forms/FormShell.tsx`, line 34

Replace:
```tsx
<CheckCircle2 className="w-3 h-3 ml-1 text-green-600" />
```
With:
```tsx
<CheckCircle2 className="w-3 h-3 ml-1 text-green-600 dark:text-green-400" />
```

---

### Fix 3 — Update orphaned components to use semantic tokens (PREVENTIVE)

For each orphaned component, replace all hardcoded input/label colors before they are
reconnected to the UI.

**Pattern for all four orphaned forms:**

| Replace | With |
|---------|------|
| `border border-gray-300` on inputs | `border border-input` |
| `text-gray-700` on labels/headings | `text-foreground` |
| `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `bg-white` on buttons | `bg-background` |
| `bg-gray-50`, `bg-gray-100` on containers | `bg-muted` |
| `border-gray-200` on containers | `border-border` |
| `focus:border-blue-500 focus:ring-blue-500` | `focus-visible:border-ring focus-visible:ring-ring/50` |
| `text-blue-600` on checkboxes | Use shadcn `<Checkbox>` component instead |

Apply to: `TSPForm.tsx`, `MilitaryServiceForm.tsx`, `PersonalInfoForm.tsx`, `AssumptionsForm.tsx`

These four files should be migrated to shadcn primitives when their tabs are reconnected (as
noted in the original plan's Phase 4 for TSPForm and Phase 4 for MilitaryServiceForm).

---

## Verification Checklist

After applying all fixes:

1. `pnpm build && pnpm typecheck && pnpm test` — must all pass
2. In browser DevTools with `.dark` on `<html>`, confirm:
   - `<html>` computed `color-scheme` = `dark`
   - Date inputs show white text
   - Text inputs show white/light text inside dark background
3. Walk every screen in dark mode:
   - **My Plan > FERS Estimate**: All three date fields readable; salary inputs readable
   - **My Plan > FERS Estimate > Results**: Eligibility badge (`Eligible` / `Not yet eligible`) readable
   - **My Plan > Career**: Event cards text readable
   - **My Plan > Expenses**: Input fields and totals readable
   - **My Plan > Simulation**: All collapsible sections readable
   - **Leave tab**: Day numbers, holiday indicators, legend badges readable
   - **Dashboard**: Chart axis labels, metric card values, tooltip text readable
4. Toggle between light and dark mode — no flash of wrong colors
5. Test with OS in light mode + app in dark mode (critical path for the `color-scheme` fix)
6. Test with OS in dark mode + app in dark mode (verify no double-inversion)

---

## Summary

| Issue | Cause | Fix | Priority |
|-------|-------|-----|----------|
| Form control text invisible in dark mode | Missing `color-scheme: dark` in `.dark {}` block — Phase 1 omission | Add `color-scheme: light/dark` to global.css | CRITICAL |
| Eligibility text low-contrast in dark mode | `text-green-600` / `text-amber-600` without `dark:` variant — Phase 8 missed | Add `dark:text-green-400` / `dark:text-amber-400` | MEDIUM |
| Tab completion icon low-contrast | `text-green-600` in FormShell without `dark:` variant — Phase 8 missed | Add `dark:text-green-400` | MEDIUM |
| Orphaned components will break when reconnected | Hardcoded gray/white/blue classes throughout | Migrate to shadcn primitives per Phase 4 approach | LOW (preventive) |

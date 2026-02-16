# UI Modernization Plan

## Context

The app has a functional but plain government-style UI: white cards with gray borders, underline tabs, raw HTML inputs, no icons, no shadows, no dark mode, no animations. All styling is inline Tailwind classes with no component library or design token system. The goal is a full visual redesign: adopt shadcn/ui, add lucide-react icons, dark mode, collapsible sections for data density, and smooth animations — without touching any business logic.

## Approach

Adopt **shadcn/ui** (Tailwind-native, Radix-based) as the component library. Migrate incrementally over 8 phases, each independently testable. No business logic files (`modules/`, `models/`, `storage/`, `hooks/useSimulation.ts`, `hooks/useLocalStorage.ts`) are modified.

---

## Phase 1: Foundation (dependencies, tokens, utilities)

No visual changes — just infrastructure.

**Install deps** (from `app/`):
```bash
pnpm add class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
```

**Create `src/lib/utils.ts`** — the `cn()` utility:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

**Add `@lib` path alias** to `tsconfig.json` and `vitest.config.ts`

**Create `app/components.json`** — shadcn CLI config (style: new-york, rsc: false, aliases mapped to project conventions)

**Replace `src/styles/global.css`** — expand from 1-line `@import "tailwindcss"` to full shadcn/ui Tailwind v4 token system:
- `@import "tw-animate-css"`
- `@custom-variant dark (&:is(.dark *))` for class-based dark mode
- `:root` light theme tokens (background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring, chart-1..5)
- `.dark` overrides for all tokens
- `@theme inline` block mapping CSS vars to Tailwind color names
- `@layer base` applying `bg-background text-foreground` to body

**Update `layouts/BaseLayout.astro`** — add inline `<script>` to apply saved theme before first paint (reads `retire:theme` from localStorage)

**Create `src/hooks/useTheme.ts`** — React hook: `useTheme()` returning `{ theme, setTheme }` with 'light' | 'dark' | 'system' options, persists to localStorage, toggles `.dark` class on `<html>`

**Verify**: `pnpm build` passes, app looks identical, `document.documentElement.classList.add('dark')` in console turns background dark.

---

## Phase 2: Add shadcn/ui primitives

Generate components to `src/components/ui/` via CLI:
```bash
npx shadcn@latest add button input select label card tabs dialog collapsible badge tooltip separator checkbox toggle table skeleton alert
```

Each command creates a file in `components/ui/` and auto-installs required `@radix-ui/*` packages. ~16 new files, all self-contained.

**Verify**: `pnpm build` passes, no import conflicts.

---

## Phase 3: Migrate layout primitives

**`FieldGroup.tsx`** — use shadcn `<Label>`, add `cn()` for conditional classes. Same prop interface.

**`FormSection.tsx`** — replace white-div card with shadcn `<Card>` / `<CardHeader>` / `<CardContent>` / `<CardFooter>`. Replace raw `<button>` with shadcn `<Button>`. Adds shadow, dark mode automatically.

**`AppShell.tsx`** — replace underline tab buttons with shadcn `<Tabs>` / `<TabsList>` / `<TabsTrigger>`. Add lucide icons (`ClipboardList`, `Calendar`, `LayoutDashboard`). Add dark mode toggle (`Sun`/`Moon` icon button). Receive theme props from `PlannerApp`.

**`PlannerApp.tsx`** — add `useTheme()` hook, pass `theme`/`setTheme` to `AppShell`. Replace info callout `<div>` with shadcn `<Alert>`.

**`FormShell.tsx`** — replace tab bar with shadcn `<Tabs>`. Replace green/gray dots with lucide `CheckCircle2`/`Circle` icons. Add tab icons: `Calculator` (FERS), `Briefcase` (Career), `Receipt` (Expenses), `LineChart` (Simulation).

**Verify**: All tabs navigate correctly, completion indicators work, dark mode toggles, mobile layout preserved.

---

## Phase 4: Migrate form inputs

**Strategy**: Delete the `INPUT_CLS` constant from all forms. Replace `<input className={INPUT_CLS}>` with shadcn `<Input>`. Replace short `<select>` with shadcn `<Select>`. Replace `<input type="checkbox">` with shadcn `<Checkbox>`. Wrap `<fieldset>` sections in shadcn `<Collapsible>` with lucide `ChevronDown` chevron + section icons.

**Files** (migrate in order, each is one commit):
1. `FERSEstimateForm.tsx` (543 lines) — 6 collapsible fieldsets, icons: `User`, `DollarSign`, `Shield`, `Building2`, `PiggyBank`, `ArrowDownToLine`
2. `FERSEstimateResults.tsx` — replace inline cards with shadcn `<Card>`, add `<Separator>` between rows
3. `CareerEventsForm.tsx` — `<Button variant="ghost">` + `Trash2` for remove, `<Button variant="outline">` + `Plus` for add
4. `ExpensesForm.tsx` — totals banner uses shadcn `<Card>` + `<Badge>`, inputs use `<Input>`
5. `SimulationForm.tsx` (647 lines) — 4 collapsible fieldsets, results table uses shadcn `<Table>`, "Pull from FERS" becomes `<Button variant="link">`

**Verify**: All forms accept input, validate, save/load localStorage correctly. Collapsible sections open/close. `pnpm test` passes.

---

## Phase 5: Migrate leave calendar

**`LeaveBalanceForm.tsx`** — outer wrapper becomes shadcn `<Card>`. Legend items use `<Badge variant="outline">`.

**`LeaveEntryModal.tsx`** — replace custom fixed-overlay modal with shadcn `<Dialog>` (Radix portal, focus trapping, Escape close). Inputs become `<Input>` / `<Select>`. Delete button uses `<Button variant="destructive">`.

**`DayCell.tsx`** — replace template-literal class concatenation with `cn()`. Add `dark:` variants for holiday (`dark:bg-amber-950 dark:text-amber-200`), weekend (`bg-muted`), selected (`ring-primary bg-primary/10`).

**`LeaveCalendarToolbar.tsx`** — nav buttons become `<Button variant="outline" size="icon">` + `ChevronLeft`/`ChevronRight`. Clear button gets `Trash2` icon.

**`LeaveBalanceSummaryPanel.tsx`** — add `dark:` variants for blue/orange backgrounds.

**`MonthCalendar.tsx`** — outer div becomes compact `<Card>`, text uses semantic tokens.

**Verify**: Calendar renders all 12 months, click opens modal with focus trap, leave type colors correct, holidays render, year navigation works.

---

## Phase 6: Migrate dashboard and charts

**Create `src/hooks/useChartTheme.ts`** — observes `.dark` class on `<html>` via MutationObserver. Returns `ChartTheme` with colors for light/dark: gridColor, tooltipBg, textColor, and named color entries for income, expenses, salary, traditional, roth, etc.

**Create `src/components/charts/ChartTooltip.tsx`** — shared tooltip wrapper using semantic tokens (`bg-popover text-popover-foreground border-border shadow-md`).

**`MetricCard.tsx`** — replace with shadcn `<Card>`, add dark mode variant colors.

**`ChartContainer.tsx`** — replace with shadcn `<Card>` / `<CardHeader>` / `<CardContent>`.

**5 chart components** — import `useChartTheme()`, replace hard-coded hex colors with theme values, replace `CartesianGrid stroke="#e5e7eb"` with `chartTheme.gridColor`, wrap tooltips in `<ChartTooltipWrapper>`.

**`Dashboard.tsx`** — demo banner becomes shadcn `<Alert>` + `AlertTriangle` icon. Add `<Separator>` between sections.

**Verify**: All 5 charts render in both light/dark modes, tooltips readable, summary cards correct.

---

## Phase 7: Polish and animations

**Tab transitions** — add `animate-in fade-in-0 slide-in-from-bottom-2 duration-300` (from tw-animate-css) to tab content wrappers in `FormShell` and `AppShell`.

**Collapsible animations** — shadcn/Radix `<Collapsible>` animates via data-state CSS. Verify `tw-animate-css` provides the keyframes.

**Loading skeletons** — create `MetricCardSkeleton.tsx` and `ChartSkeleton.tsx` using shadcn `<Skeleton>`. Use in `Dashboard.tsx` while `useSimulation` computes.

**Save feedback** — add transient "Saved" `<Badge>` with check icon in `FormSection` footer after successful save.

**Hover effects** — `hover:shadow-md transition-shadow` on MetricCard, `hover:border-primary/50 transition-colors` on career events.

**Error boundary** — replace inline red div in `PlannerApp.tsx` with shadcn `<Alert variant="destructive">` + `AlertCircle` icon + `<Button>` retry.

**Verify**: Transitions smooth, skeletons appear during load, save feedback visible.

---

## Phase 8: Dark mode audit

Systematic sweep of all hardcoded Tailwind colors:

| Replace | With |
|---------|------|
| `text-gray-900`, `text-gray-700` | `text-foreground` |
| `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `bg-white` | `bg-card` or `bg-background` |
| `bg-gray-50`, `bg-gray-100` | `bg-muted` |
| `border-gray-200`, `border-gray-300` | `border-border` / `border-input` |
| `bg-blue-600`, `text-blue-600` | `bg-primary`, `text-primary` |
| `text-red-600` | `text-destructive` |

Domain-specific colors (leave types, holidays, simulation phases) keep their hues but get explicit `dark:` variants.

**Verify**: Walk every screen in dark mode — no white-on-white or dark-on-dark text, all charts readable, focus rings visible.

---

## New files created

```
src/lib/utils.ts                      — cn() utility
src/hooks/useTheme.ts                 — dark mode toggle
src/hooks/useChartTheme.ts            — chart color theming
components.json                       — shadcn CLI config
src/components/ui/*.tsx               — ~16 shadcn primitives (CLI-generated)
src/components/charts/ChartTooltip.tsx — shared themed tooltip wrapper
src/components/cards/MetricCardSkeleton.tsx
src/components/charts/ChartSkeleton.tsx
```

## Files modified (by phase)

- **P1**: package.json, tsconfig.json, vitest.config.ts, global.css, BaseLayout.astro
- **P3**: FieldGroup.tsx, FormSection.tsx, AppShell.tsx, FormShell.tsx, PlannerApp.tsx
- **P4**: FERSEstimateForm.tsx, FERSEstimateResults.tsx, CareerEventsForm.tsx, ExpensesForm.tsx, SimulationForm.tsx
- **P5**: LeaveBalanceForm.tsx, LeaveEntryModal.tsx, DayCell.tsx, LeaveCalendarToolbar.tsx, LeaveBalanceSummaryPanel.tsx, MonthCalendar.tsx, LeaveCalendarGrid.tsx
- **P6**: MetricCard.tsx, SummaryPanel.tsx, ChartContainer.tsx, 5 chart files, Dashboard.tsx
- **P7-8**: Revisit files from earlier phases for polish and dark mode sweep

## Files NOT modified (business logic untouched)

Everything in `modules/`, `models/`, `storage/`, `data/`, `hooks/useLocalStorage.ts`, `hooks/useSimulation.ts`, test files.

## Verification

After each phase: `pnpm build && pnpm typecheck && pnpm test`. After Phase 8: full manual walkthrough of every screen in both light and dark modes.

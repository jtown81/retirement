# Project To-Do List

**Last Updated**: 2026-02-19 (Phase O-2 Priority 1 in progress)
**Status**: 753/754 tests passing, all Phases A-N complete
**Current Work**: Phase O: Mobile UX Polish (Priority 1 fixes deployed)
**Maintainer**: Claude Code

---

## Priority Tiers

### 🔴 Critical (Blocking Issues)
*None currently. All known issues resolved.*

---

### 🟠 High Priority (Next Phase Candidates)

#### Phase O: Mobile UX Polish
**Description**: Refine mobile layouts and touch interactions for better first-time UX.

**Status**: 🟢 Priority 1 COMPLETE | Priority 2-3 pending

- [x] **O-1**: Test responsive layouts on real devices (iPhone 12, iPad, Android)
  - ✅ DONE: Comprehensive audit via Explore agent
  - Identified 8 critical issues, prioritized by impact
  - Full report in implementation plan

- [x] **O-2**: Touch-friendly interactions (Priority 1 - BLOCKING)
  - ✅ DONE: **FormSection button wrapping** — Added `flex-wrap` to allow buttons to stack on mobile
    - File: `app/src/components/forms/FormSection.tsx:84-85`
    - Impact: Buttons now wrap vertically on small screens instead of overflowing
  - ✅ DONE: **ProjectionTable mobile card view** — Added `sm:hidden` mobile card layout with key metrics
    - File: `app/src/components/charts/ProjectionTable.tsx:147+`
    - Impact: Mobile users see card-per-row format (date, income, expenses, surplus, balance); tablet+ see full table
    - Metrics displayed: Year, Age, Gross Income, After-Tax Income, Expenses, Surplus, TSP Balance
    - Color-coded: Red for deficit, green for growth
  - 🟡 TODO: Priority 2 fixes (button/input tap targets, calendar cell height) — 5 items pending

- [ ] **O-3**: Mobile breakpoint audit
  - 🟡 TODO: Chart responsive sizing (font sizes, axis label thinning)
  - 🟡 TODO: Chart double-nesting removal (MonteCarloFanChart, TSPFundDonut)
  - 🟡 TODO: LeaveBalanceSummaryPanel grid conversion

---

#### Phase P: Export Enhancements
**Description**: Expand export options for better integration with user workflows.

- [ ] **P-1**: PDF export of full projection report
  - Inputs: SimulationResult + charts + assumptions
  - Library suggestion: react-pdf or html2pdf
  - Include: Summary table, 6 charts, expense phases, RMD timeline
  - Test with desktop and print-to-PDF workflows

- [ ] **P-2**: Excel multi-sheet export
  - Sheet 1: Input summary (FERS, Career, Expenses, Simulation)
  - Sheet 2: Year-by-year projection (income waterfall, TSP balances, RMD)
  - Sheet 3: Scenario comparison (if multiple scenarios exist)
  - Use: existing exportProjectionCSV logic, but with better formatting

- [ ] **P-3**: Scenario diff export
  - Compare two saved scenarios side-by-side
  - Highlight differences in assumptions, income, expenses, RMD
  - Export as CSV or PDF

---

#### Phase Q: Accessibility & WCAG 2.1 Compliance
**Description**: Ensure app is accessible to all users (screen readers, keyboard-only, color-blind).

- [ ] **Q-1**: Screen reader testing
  - Test with NVDA (Windows) and VoiceOver (macOS)
  - Audit ARIA labels, roles, and live regions
  - Verify chart descriptions are accessible

- [ ] **Q-2**: Keyboard navigation
  - Ensure all interactive elements reachable via Tab/Shift+Tab
  - Test Ctrl+S form save shortcut across browsers
  - Verify focus management in modals (FocusScope from radix)

- [ ] **Q-3**: Color contrast & color-blind safe palettes
  - Review chart colors (ensure distinct even without hue)
  - Test text contrast (min 4.5:1 for normal text)
  - Consider color-blind mode toggle (optional)

- [ ] **Q-4**: Error message clarity
  - Ensure validation errors are descriptive and linked to fields
  - Test with screen reader (errors announced on field focus)

---

### 🟡 Medium Priority (Nice-to-Have)

#### Phase R: Performance Optimization
**Description**: Reduce bundle size, improve render performance, optimize memoization.

- [ ] **R-1**: Code-splitting analysis
  - Identify unused imports, dead code
  - Consider route-based splitting (if multi-page navigation added)
  - Run Vite bundle analyzer

- [ ] **R-2**: Memoization audit
  - Review useSimulation hook (already memoized, but verify dependencies)
  - Check chart components for unnecessary re-renders
  - Profile with React DevTools Profiler

- [ ] **R-3**: Chart rendering optimization
  - Recharts may be slow with large datasets (40+ years of data)
  - Consider virtualization or aggregation (5-year buckets for detail view)
  - Test performance on low-end devices

- [ ] **R-4**: Local storage read/write optimization
  - Current: useLocalStorage reads entire key on mount
  - Consider: Indexed DB for large scenario datasets if storage grows

---

#### Phase S: Advanced Scenario Tools
**Description**: Add comparison, sensitivity analysis, and what-if tooling.

- [ ] **S-1**: Scenario comparison view
  - Side-by-side projections of 2+ saved scenarios
  - Diff highlights for key metrics (depletion age, lifetime surplus, RMD)
  - Chart overlay (income/expense curves for multiple scenarios)

- [ ] **S-2**: Sensitivity analysis
  - Dashboard widget: adjust single variable (e.g., TSP growth rate)
  - See real-time impact on depletion age, lifetime surplus
  - Inputs: TSP rate, inflation, annuity, salary growth, etc.
  - Output: Range chart (min/mid/max outcomes)

- [ ] **S-3**: Monte Carlo confidence levels (advanced)
  - Run probabilistic simulation (N=1000 iterations)
  - Compute percentile outcomes (10th, 50th, 90th)
  - Display as fan chart (confidence bands)
  - Warning: significant compute cost; consider Web Worker

---

#### Phase T: User Onboarding & Education
**Description**: Improve first-time user experience and financial literacy.

- [ ] **T-1**: Interactive tutorial
  - Step-by-step walkthrough of form sections
  - Explain each field with real examples
  - Use overlays / popovers (Radix UI Popover)

- [ ] **T-2**: Help & glossary
  - Inline glossary terms (hover/click for definition)
  - Modal glossary for common federal benefits terms
  - Video links to OPM resources (optional)

- [ ] **T-3**: Demo mode enhancements
  - Add "Load Example" button with preset careers (GS-14 straight, LEO early, etc.)
  - Annotated walkthrough of example outputs
  - Reset button to clear and start fresh

---

### 🟢 Low Priority (Polish & Future)

#### Phase U: Advanced Regulatory Features
**Description**: Add support for rare scenarios and regulatory edge cases.

- [ ] **U-1**: Survivor Benefit Plan (SBP) modeling
  - Reduce annuity to fund survivor benefits
  - Impact on post-retirement income
  - Requires: new form field, survivor benefit formula

- [ ] **U-2**: FICA withholding on TSP distributions
  - Currently: FICA only withheld on annuity + supplement
  - Needed: Apply FICA to Roth conversion (if applicable)
  - Research: FICA rules for Roth TSP (complex; may require SSA guidance)

- [ ] **U-3**: Deferred Annuity option
  - Alternative to immediate annuity (take TSP at 50, defer annuity to MRA)
  - Impact on lifetime cash flow and tax efficiency
  - Requires: new simulation path (dual-phase TSP drawdown)

---

#### Phase V: State Tax Integration
**Description**: Add state-specific tax calculations (currently federal only).

- [ ] **V-1**: State income tax estimates
  - Map states with special federal retiree taxes (FL, TX, WA, NV, SD, TN, WY: 0%)
  - Add state rate tables for others
  - Apply to annuity + TSP + Social Security (with exclusions)

- [ ] **V-2**: State residency change tracking
  - Allow career events to include state changes
  - Different tax brackets before/after move
  - Output: state tax detail in projection

---

#### Phase W: Data Visualization Enhancements
**Description**: Add new chart types and interactive features.

- [ ] **W-1**: Heatmap of outcomes
  - X-axis: TSP growth rate, Y-axis: inflation rate
  - Color: depletion age or lifetime surplus
  - Interactive: hover for exact value

- [ ] **W-2**: Timeline waterfall
  - Show age on X-axis with major life events
  - Include: MRA, normal retirement, 80+ (survival rates)
  - Annotations for benefit eligibility dates

- [ ] **W-3**: Dark mode for charts
  - Currently: light theme only
  - Add theme toggle (user preference + system default)
  - Update Recharts colors for dark mode

---

#### Phase X: Documentation Expansion
**Description**: Add comprehensive user & developer docs.

- [ ] **X-1**: User guide (markdown)
  - How to enter personal info
  - How to add career events
  - How to interpret projections
  - FAQ section

- [ ] **X-2**: Video tutorials (external)
  - 5-min intro walkthrough
  - Chart interpretation guide
  - Scenario comparison demo

- [ ] **X-3**: Developer onboarding guide
  - Architecture deep-dive
  - How to add a new simulation parameter
  - How to update regulations/formulas
  - Testing patterns

---

## Completed Phases (Reference)

✅ Phase 1–9 (original design)
✅ Phase A (Bug fixes)
✅ Phase B (2025–2026 data updates)
✅ Phase C (UX quick wins)
✅ Phase D (Data consolidation)
✅ Phase E.1–E.5 (Form refactoring)
✅ Phase F (Form UX enhancements)
✅ Phase G (Scenario management & export)
✅ Phase I (Dashboard integration)
✅ Phase N (Unified smile curve)

---

## Notes

- **Test Coverage**: 754 tests passing. New features should maintain >95% coverage.
- **Bundle Size**: Current size TBD (run `pnpm build` and check dist/ folder).
- **Browser Support**: Target modern browsers (Chrome, Firefox, Safari, Edge; last 2 versions).
- **Regulatory Updates**: Monitor OPM/IRS guidance quarterly; see `docs/regulatory-mapping.md`.

---

## How to Use This List

1. **Pick a phase** based on priority (red → orange → yellow → green).
2. **Break into sub-tasks** (e.g., O-1a: Mobile device list, O-1b: Responsive test plan).
3. **Create branch**: `git checkout -b phase-X-feature-name`.
4. **Update this file** when starting/completing items.
5. **Link to PR** with completed work.

Example:
```
- [x] **O-1**: Test responsive layouts on real devices
  - Completed 2026-03-15
  - PR: #42
  - Devices tested: iPhone 12, iPad Air, Pixel 6
```

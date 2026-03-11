# Project To-Do List

**Last Updated:** 2026-03-11
**Status:** All core implementation complete; ready for polish and optimization

---

## Completed Work ✅

- ✅ E-10: High-3 salary gap detection (service gaps no longer inflate averages)
- ✅ E-13: DSR eligibility (involuntary separation benefits)
- ✅ C-9: Monte Carlo TSP projection (confidence bands)
- ✅ C-6: Healthcare cost chart (uses actual config values)
- ✅ Form Polish: Ctrl+S shortcuts, error clearing, cross-field validation
- ✅ Testing: 531 tests passing, new scenario tests for E-10 and E-13
- ✅ Documentation: Formula registry, regulatory mapping, architecture docs
- ✅ Cleanup: Removed spreadsheet parity requirements

---

## Next Phase Options

### Option A: Performance & Responsiveness (Medium effort)

**Monte Carlo Performance**
- [ ] Cache Monte Carlo results to avoid re-computation on form changes
- [ ] Memoize `runMonteCarlo()` with dependency tracking
- [ ] Profile simulation runtime and identify bottlenecks
- [ ] Consider reducing default n=200 vs performance trade-off

**Mobile Responsiveness**
- [ ] Responsive chart containers (responsive width, font sizing)
- [ ] Touch-friendly interactions on charts (tap for tooltips)
- [ ] Responsive form layouts for small screens
- [ ] Dashboard grid adapts to mobile viewport

**Dashboard Optimization**
- [ ] Lazy load charts (render only visible charts)
- [ ] Reduce initial bundle by code-splitting charts
- [ ] Profile initial render time
- [ ] Optimize Recharts usage (remove unused features)

---

### Option B: Feature Completeness (Variable effort)

**Survivor Benefit Reduction**
- [ ] Full implementation of 5% (partial) / 10% (full) annuity reduction
- [ ] Verify calculation against OPM FERS Handbook Ch. 50
- [ ] Update annuity formula with reduction factors
- [ ] Test all survivor benefit election paths

**Federal Health Benefits (FEHB)**
- [ ] Model FEHB cost trajectory in retirement
- [ ] Implement 5-year coverage rule (must retire within 5 years of eligible coverage)
- [ ] Add healthcare cost inflation (separate from general inflation)
- [ ] Integrate into expense projection

**COLA Scenarios**
- [ ] Compare 2% vs 3% vs historical average COLA
- [ ] Show lifetime income impact of COLA differences
- [ ] Scenario comparison: "What if COLA changes?"

**Tax Projection**
- [ ] Federal income tax calculation (progressive brackets)
- [ ] Social Security taxation (provisional income rules)
- [ ] Medicare IRMAA (Income-Related Monthly Adjustment Amounts)
- [ ] State income tax (configurable by state)
- [ ] Tax-adjusted income chart

**Scenario Export**
- [ ] PDF export of retirement plan (summary + charts)
- [ ] CSV export of year-by-year projections
- [ ] Email as PDF functionality
- [ ] Archive/load saved scenarios

---

### Option C: UI/UX Polish (Lower effort, high impact)

**Input Validation Hints**
- [ ] Real-time field validation feedback
- [ ] "This field is required" inline messages
- [ ] Range validation (e.g., "Age must be 18-99")
- [ ] Dependency hints (e.g., "High-3 will be calculated from career data")

**Calculation Transparency**
- [ ] "How was this calculated?" tooltips on summary metrics
- [ ] Formula references on chart tooltips
- [ ] Breakdown modals for complex calculations (e.g., High-3 calculation steps)
- [ ] Source citations (OPM FERS Handbook chapter/section)

**Mobile Layout**
- [ ] Responsive tab switching (swipe gestures on mobile)
- [ ] Touch-friendly button sizing (48px minimum)
- [ ] Collapsible form sections on small screens
- [ ] Bottom sheet for modals instead of centered dialogs

**Dark Mode**
- [ ] Toggle dark/light theme
- [ ] Chart colors adapt to theme
- [ ] Persist theme preference to localStorage

**Help System**
- [ ] Contextual help icon (?) next to each field
- [ ] Hover tooltips with plain-language explanations
- [ ] Link to FERS Handbook for regulatory fields
- [ ] FAQ section for common questions

---

### Option D: Testing Expansion (Medium effort)

**Edge Case Testing**
- [ ] Age boundaries (18, 55, 57, 62, 73 critical ages)
- [ ] 50+ year careers (extreme edge case)
- [ ] Early retirees (before MRA)
- [ ] Late retirees (after 62)
- [ ] Service gaps spanning multiple years
- [ ] Military buyback edge cases

**Integration Tests**
- [ ] Full workflow: Create profile → enter career → calculate → view dashboard
- [ ] Scenario comparison: Compare two different retirement dates
- [ ] Leave calendar → retirement credit interaction
- [ ] Form validation: Test all cross-field validators
- [ ] Storage persistence: Save/load scenarios

**Accessibility Testing**
- [ ] WCAG 2.1 Level AA compliance
- [ ] Screen reader testing (keyboard navigation)
- [ ] Color contrast verification
- [ ] Focus management in forms
- [ ] Form label associations

**Performance Benchmarks**
- [ ] Baseline metrics (initial load, simulation time, chart render)
- [ ] Regression detection in test suite
- [ ] Chrome DevTools Lighthouse score
- [ ] Core Web Vitals (LCP, FID, CLS)

---

### Option E: Data & Content (Lower effort)

**Historical Data**
- [ ] COLA rates (2010-2025)
- [ ] Pay raise percentages by year
- [ ] Inflation rates by year
- [ ] Display in "Assumptions" section

**Comparison Tools**
- [ ] FERS vs CSRS comparison (different annuity formula)
- [ ] TSP vs outside investment comparison
- [ ] Early separation vs full career impact

**Decision Trees**
- [ ] "Should I retire now or wait?" interactive tool
- [ ] "Roth vs Traditional TSP" decision helper
- [ ] "Which survivor benefit option?" calculator

**Educational Content**
- [ ] Embedded explainer modals
  - What is High-3?
  - How does the FERS supplement work?
  - What's the difference between DSR and MRA+30?
- [ ] Links to OPM FERS Handbook chapters
- [ ] Video tutorials (optional)

---

## Recommended Priority Order

1. **Phase 1** (Stability): Option A — Performance & mobile responsiveness
2. **Phase 2** (Completeness): Option B — Tax projection, survivor benefits, FEHB
3. **Phase 3** (Polish): Option C — UX improvements, dark mode, help system
4. **Phase 4** (Quality): Option D — Edge case testing, accessibility
5. **Phase 5** (Education): Option E — Historical data, decision tools

---

## Notes for Future Work

- All regulatory sources documented in `docs/regulatory-mapping.md`
- Formula registry at `docs/formula-registry.md`
- Test scenarios in `app/tests/scenarios/`
- Production build succeeds: `pnpm build`
- All 531 tests passing: `pnpm test`
- Zero TypeScript errors: `pnpm typecheck`

---

## Questions for User

Before starting Phase 1, consider:

1. **Deployment target**: Web-only (current) or mobile app eventually?
2. **Priority**: Performance first or new features first?
3. **Tax support**: Is tax projection critical for v1 launch?
4. **Export format**: PDF, CSV, or both needed?
5. **Timeline**: Are there deadline constraints?

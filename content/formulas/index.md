---
title: Formula Index
description: Index of all formulas implemented in the application
---

# Formula Index

This is the human-readable index of all formulas.
The authoritative registry is in `docs/formula-registry.md`.

## By Module

### Career & Pay Progression
- `career/pay-calculator` — Annual pay = base + locality
- `career/grade-step-to-salary` — GS grade/step → base salary
- `career/wgi-timing` — Within-Grade Increase schedule
- `career/locality-rate` — Locality pay percentage lookup
- `career/scd` — Service Computation Date

### Leave Planning
- `leave/annual-accrual-rate` — 4/6/8 hrs per pay period by service years
- `leave/rollover-cap` — 240-hour cap enforcement
- `leave/sick-accrual` — 4 hrs/pay period, no cap
- `leave/sick-leave-service-credit` — Sick leave → creditable service (post-2014: 100%)

### TSP Modeling
- `tsp/traditional-growth` — Pre-tax balance projection
- `tsp/roth-growth` — After-tax balance projection
- `tsp/agency-match` — Automatic 1% + match up to 4%

### Military Buyback
- `military/buyback-deposit` — 3% of military basic pay + interest
- `military/service-credit` — Add military years to creditable service

### Expense Modeling
- `expenses/annual-total` — Sum across all expense categories
- `expenses/smile-curve` — Spending multiplier by year in retirement
- `expenses/inflation-adjustment` — Compound CPI adjustment

### Retirement Simulation
- `simulation/fers-eligibility` — MRA+30, 60+20, 62+5 checks
- `simulation/high-3-salary` — Highest 3 consecutive salary years
- `simulation/fers-basic-annuity` — High-3 × multiplier × service years
- `simulation/income-projection` — Annuity + supplement + TSP by year
- `simulation/scenario-comparison` — Side-by-side scenario runner

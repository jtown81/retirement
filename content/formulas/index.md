---
title: Formula Index
description: Index of all formulas implemented in the application
---

# Formula Index

This is the human-readable index of all formulas.
The authoritative registry is in `docs/formula-registry.md`.

## By Module

### Career & Pay Progression

- `career/grade-step-to-salary` — GS grade/step to base salary lookup (with pay scale projection)
- `career/wgi-timing` — Within-Grade Increase schedule (52/104/156 weeks by step)
- `career/locality-rate` — Locality pay percentage lookup by code and year
- `career/leo-availability-pay` — LEO LEAP supplement (25% of base pay)
- `career/pay-calculator` — Annual pay = base + locality (GS/LEO/Title 38)
- `career/creditable-service` — Total years/months/days from SCD to a target date
- `career/salary-history` — Year-by-year salary record from career events with WGI projections

### Leave Planning

- `leave/annual-accrual-rate` — 4/6/8 hrs per pay period by years of service (6 hrs/pp = 160 hrs/year per 5 U.S.C. 6303)
- `leave/rollover-cap` — 240-hour annual leave cap enforcement (360 hrs overseas)
- `leave/sick-accrual` — 4 hrs/pay period, no cap; 104-hr family care sub-limit
- `leave/sick-leave-service-credit` — Sick leave hours to creditable service (post-2014: 100%, 2087 hrs/work year)
- `leave/retirement-credit` — Adds sick leave service credit to total creditable service
- `leave/simulate-year` — Full leave year simulation (accruals, usage events, rollover)

### TSP Modeling

- `tsp/agency-match` — Automatic 1% + match up to 4% (always to Traditional TSP)
- `tsp/traditional-growth` — Pre-tax Traditional TSP balance projection (mid-year approximation)
- `tsp/roth-growth` — After-tax Roth TSP balance projection (employee contributions only)
- `tsp/contribution-limit` — IRS elective deferral limit enforcement + catch-up
- `tsp/rmd` — Required Minimum Distribution per IRS Uniform Lifetime Table (age 73+ per SECURE 2.0)

### Military Buyback

- `military/buyback-deposit` — 3% of military basic pay + OPM interest
- `military/service-credit` — Add military years to creditable service (requires buyback + waiver)

### Expense Modeling

- `expenses/annual-total` — Sum across all 10 expense categories
- `expenses/smile-curve` — Spending multiplier by year in retirement (Blanchett 2014 piecewise linear)
- `expenses/inflation-adjustment` — Compound CPI adjustment (general + separate healthcare rate)

### Retirement Simulation

- `simulation/fers-eligibility` — MRA+30, 60+20, 62+5, MRA+10-reduced checks
- `simulation/high-3-salary` — Highest 3 consecutive salary years average
- `simulation/fers-basic-annuity` — High-3 x multiplier (1.0% or 1.1%) x service years, with reduction factor
- `simulation/fers-supplement` — FERS Special Retirement Supplement (SRS) until age 62
- `simulation/income-projection` — Year-by-year annuity + supplement + TSP withdrawal vs expenses
- `simulation/scenario-comparison` — Side-by-side scenario runner with delta analysis

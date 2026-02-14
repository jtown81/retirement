---
title: Application Overview
description: High-level overview of the federal retirement planning simulation app
---

# Federal Retirement Planning Simulation

A local-only retirement planning tool for U.S. federal employees under FERS.

## What This App Does

### My Plan
- Models your federal career (pay, grade/step progression, locality pay, WGI timing)
- Calculates your FERS eligibility date, basic annuity, and FERS supplement (SRS)
- Computes High-3 average salary from salary history
- Projects TSP (Traditional & Roth) balances with agency match
- Configures post-retirement simulation with dual-pot TSP (high-risk/low-risk), RMD compliance, and expense smile curve (GoGo/GoSlow/NoGo phases)

### Leave Calendar
- Tracks and projects annual and sick leave balances with a 12-month interactive calendar
- Breaks down sick leave by type: LS (Leave Self) and DE (Dependent Care)
- Displays federal holidays with observed-date logic
- Calculates sick leave retirement credit (post-2014: 100%)

### Expense Planning
- 10 expense categories with reasonable default estimates for federal retirees
- Separate healthcare inflation rate (default 5.5%) vs general inflation (default 2.5%)
- Expense smile curve modeling (Blanchett 2014) for retirement spending patterns

### Dashboard
- Summary cards: annuity, High-3, creditable service, eligibility, supplement, year-1 surplus
- Pay growth chart (salary over career)
- Leave balances chart (annual & sick trajectory)
- TSP balances chart (Traditional & Roth growth)
- Income vs expenses chart (retirement projection)
- Expense smile curve chart (spending multiplier visualization)

### Simulation Engine
- Year-by-year retirement projection from retirement age to end age (default 95)
- Dual-pot TSP: high-risk (C/S/I funds) and low-risk (G/F funds) with separate ROIs
- Required Minimum Distribution (RMD) compliance per SECURE 2.0 Act (age 73+)
- Time-step rebalancing (1-3 year buffer in low-risk pot)
- Scenario comparison (side-by-side analysis)

## What This App Does Not Do

- No backend — all data stored locally on your device
- Does not provide legal, financial, or tax advice
- Does not connect to OPM, MyPay, or TSP systems
- Does not file retirement paperwork

## Data Sources

All formulas are derived from:
- OPM FERS Handbook (eligibility, annuity, supplement, creditable service)
- OPM Pay & Leave guidance (GS pay tables, locality rates, leave accrual)
- IRS TSP regulations (contribution limits, RMD per IRC 401(a)(9))
- SECURE 2.0 Act (RMD age threshold)
- Applicable federal statutes (5 U.S.C. 6303, 8412, 8415, etc.)

See [Regulatory Reference Mapping](/docs/regulatory-mapping) for the full source table.
See [Formula Registry](/docs/formula-registry) for the authoritative formula list.

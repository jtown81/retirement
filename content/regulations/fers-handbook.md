---
title: FERS Handbook Reference Index
description: Index of OPM FERS Handbook chapters relevant to this application
---

# OPM FERS Handbook — Reference Index

Source: [OPM FERS Handbook](https://www.opm.gov/retirement-services/publications-forms/csrsfers-handbook/)

> This index maps handbook chapters to the app modules that implement them.
> Update this file whenever a new formula is added or a chapter is revised.

## Chapter Map

| Chapter | Topic                               | App Module   | Implementation Phase |
|---------|-------------------------------------|--------------|----------------------|
| Ch. 10  | Coverage                            | simulation   | Phase 7              |
| Ch. 20  | Creditable Service                  | career       | Phase 3              |
| Ch. 23  | Military Service Credit             | military     | Phase 5              |
| Ch. 30  | Deposits and Redeposits             | military     | Phase 5              |
| Ch. 40  | Retirement Eligibility              | simulation   | Phase 7              |
| Ch. 50  | Annuity Computation                 | simulation   | Phase 7              |
| Ch. 51  | FERS Annuity Supplement (SRS)       | simulation   | Phase 7              |
| Ch. 70  | Survivor Benefits                   | —            | Future phase         |
| Ch. 75  | FEHB in Retirement                  | simulation   | Phase 7              |

## Key Formulas by Chapter

### Chapter 40 — Retirement Eligibility

MRA table by birth year:

| Birth Year    | MRA |
|---------------|-----|
| Before 1948   | 55  |
| 1948          | 55 + 2 months |
| 1949          | 55 + 4 months |
| 1950          | 55 + 6 months |
| 1951          | 55 + 8 months |
| 1952          | 55 + 10 months |
| 1953–1964     | 56  |
| 1965          | 56 + 2 months |
| 1966          | 56 + 4 months |
| 1967          | 56 + 6 months |
| 1968          | 56 + 8 months |
| 1969          | 56 + 10 months |
| 1970+         | 57  |

### Chapter 50 — Annuity Computation

```
Basic Annuity = High-3 × Multiplier × Creditable Service Years

Multiplier:
  - 1.0% general
  - 1.1% if age 62+ AND 20+ years of service
```

# Spreadsheet Parity

Tracks the correspondence between `Retire-original.xlsx` cells/sheets and app formulas.
App outputs must match spreadsheet results within defined tolerance.

---

## Tolerance Policy

| Output Type        | Acceptable Tolerance |
|--------------------|----------------------|
| Currency (annual)  | ±$1.00               |
| Currency (monthly) | ±$0.10               |
| Percentages        | ±0.001%              |
| Dates              | Exact match          |
| Hours (leave)      | ±0.25 hrs            |

---

## Sheet Map

> Populated as the spreadsheet is analyzed during each phase.

| Sheet Name | Module       | Status     | Notes                          |
|------------|--------------|------------|--------------------------------|
| TBD        | career       | Unmapped   | To be analyzed Phase 3         |
| TBD        | leave        | Unmapped   | To be analyzed Phase 4         |
| TBD        | tsp          | Unmapped   | To be analyzed Phase 5         |
| TBD        | expenses     | Unmapped   | To be analyzed Phase 6         |
| TBD        | simulation   | Unmapped   | To be analyzed Phase 7         |

---

## Cell-Level Mapping

> One row per formula-bearing cell. Populated during analysis.

| Sheet | Cell | Description               | Formula ID                      | Parity Test File                             | Status   |
|-------|------|---------------------------|---------------------------------|----------------------------------------------|----------|
| TBD   | TBD  | FERS basic annuity        | simulation/fers-basic-annuity   | tests/scenarios/gs-straight-through.test.ts  | Pending  |
| TBD   | TBD  | High-3 average salary     | simulation/high-3-salary        | tests/scenarios/gs-straight-through.test.ts  | Pending  |
| TBD   | TBD  | Annual leave accrual      | leave/annual-accrual-rate       | tests/scenarios/gs-straight-through.test.ts  | Pending  |
| TBD   | TBD  | TSP agency match          | tsp/agency-match                | tests/scenarios/gs-straight-through.test.ts  | Pending  |

---

## Parity Test Scenarios

| Scenario File                               | Description                              | Status  |
|---------------------------------------------|------------------------------------------|---------|
| tests/scenarios/gs-straight-through.test.ts | Full GS career, standard FERS retirement | Pending |
| tests/scenarios/leo-early-retirement.test.ts| LEO 20-year early retirement             | Pending |
| tests/scenarios/military-buyback.test.ts    | FERS + military buyback credit           | Pending |
| tests/scenarios/tsp-roth-vs-traditional.test.ts | High Roth vs Traditional paths       | Pending |

---

## Discrepancy Log

> Record any known or resolved discrepancies here.

| Date       | Cell  | App Result | Spreadsheet Result | Delta | Resolution |
|------------|-------|------------|--------------------|-------|------------|
| —          | —     | —          | —                  | —     | —          |

---

## Change History

| Version | Date       | Author | Description                         |
|---------|------------|--------|-------------------------------------|
| 0.1.0   | 2026-02-10 |        | Initial parity tracking scaffold    |

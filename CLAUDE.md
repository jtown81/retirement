# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A retirement planning simulation app for U.S. federal employees. Runs locally only (no backend). Architected for eventual mobile deployment. `Retire-original.xlsx` is the authoritative baseline for all formulas and features — app outputs must match it within defined tolerance.

## Build & Development Commands

```bash
cd app
pnpm install        # install dependencies
pnpm dev            # development server
pnpm build          # production build
pnpm preview        # preview production build
pnpm test           # run all tests once
pnpm test:watch     # run tests in watch mode
pnpm test:scenarios # run spreadsheet parity scenarios
pnpm typecheck      # TypeScript type check (no emit)
```

## Development Workflow

Work one phase at a time per `prompt.md`. **Stop after each phase and wait for user confirmation before proceeding.**

Phases:
1. Product Scope & System Architecture
2. Data Models & Persistence Design
3. Federal Pay & Career Progression Engine
4. Leave Planning & Tracking Module
5. TSP & Military Buyback Modeling
6. Expense Modeling & Expense Smile Curve
7. Retirement Simulation Engine
8. Visualization & UX Layer
9. Living Documentation & Formula Tracking
10. Regulatory Reference Mapping
11. Validation Rules & Data Integrity Checks
12. Testing Strategy & Scenario Verification

## Non-Negotiable Design Principles

- **Separation of concerns**: UI, calculations, data models, storage, visuals, and tests must never be mixed.
- **Auditability**: Every formula must have a name, purpose, inputs, outputs, dependencies, source reference, and version history in the formula registry.
- **Federal accuracy**: Regulatory correctness outweighs convenience. Every rule must map to an authoritative source (OPM FERS Handbook, OPM pay/leave guidance, TSP regulations, or federal statute) and be classified as: hard regulatory requirement, assumption, or user-configurable policy.
- **Local-only persistence**: All data stored locally with explicit schema versioning.
- **Deterministic outputs**: All calculations must be explainable and reproducible.

## Required Module Boundaries

All modules communicate via well-defined contracts with no business logic crossing boundaries:

- **Career & Pay Progression Engine** — GS/LEO/Title 38 hybrid, grade/step/locality, SCD tracking
- **Leave Planning & Tracking** — standalone tool; annual + sick leave, rollover, partial usage, retirement credit integration
- **TSP Modeling** — Traditional & Roth balances; agency match always goes to Traditional only
- **Military Service Buyback** — impacts service time and eligibility
- **Expense Modeling** — categories, expense smile curve, inflation
- **Retirement Simulation Engine** — integrates all modules; eligibility, income vs expense projection, scenario comparison
- **Visualization Layer** — zero business logic; must be mobile-friendly and replaceable
- **Validation & Testing Framework** — clear warning vs error taxonomy; unit + integration + scenario tests
- **Documentation & Regulatory Reference System** — living formula registry; regulatory mapping table

## Key Domain Notes

- Flag all regulatory ambiguities explicitly rather than silently assuming.
- Never skip documentation updates when adding or changing logic.
- Spreadsheet parity is a success criterion — track which cells map to which formulas.

## Structure
- `app/` - application
- `content/` - Markdown files
- `content.config.ts` - Collection schemas


## Further Reading

**IMPORTANT:** Read relevant docs below before starting any task.

### Architecture & Design
- `docs/architecture.md` — System architecture, module map, data flow, tech stack decisions, storage design, and regulatory change safety process.

### Formulas & Calculations
- `docs/formula-registry.md` — Authoritative formula registry. Every formula must have an entry here before it is used in code. Includes name, purpose, inputs, outputs, source reference, classification, version, and changelog.
- `content/formulas/index.md` — Human-readable index of all formulas organized by module.

### Regulatory Accuracy
- `docs/regulatory-mapping.md` — Full regulatory reference table mapping every rule and assumption to its authoritative source (OPM, IRC, federal statute). Includes update monitoring strategy.
- `content/regulations/fers-handbook.md` — OPM FERS Handbook chapter index with MRA table and annuity formula reference.

### Spreadsheet Parity
- `docs/spreadsheet-parity.md` — Tolerance policy, sheet map, cell-level mapping, and discrepancy log for `Retire-original.xlsx` parity verification.
- `app/tests/scenarios/fixtures/baseline.json` — Canonical expected values extracted from the spreadsheet (populated phase-by-phase).

### Test Scenarios
- `app/tests/scenarios/` — Four canonical parity scenarios: straight-through GS, LEO early retirement, military buyback, Roth vs Traditional TSP.

### Application Content
- `content/docs/overview.md` — App feature summary and data sources for end-user documentation.


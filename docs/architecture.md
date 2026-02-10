# System Architecture

## Overview

A local-only retirement planning simulation for U.S. federal employees.
Built for eventual mobile deployment. No backend. All data persists locally.

---

## Tech Stack

Locked in Phase 1.

| Layer          | Decision               | Rationale                                                     |
|----------------|------------------------|---------------------------------------------------------------|
| Framework      | Astro 5 + React 19     | SSG + interactive islands; content.config.ts already Astro    |
| Language       | TypeScript 5 (strict)  | Required by design principles; type-safe module contracts     |
| Styling        | TailwindCSS 4          | Mobile-first; utility classes replace component styles        |
| Testing        | Vitest 3               | Native Vite/Astro ecosystem; supports unit + scenario tests   |
| Persistence    | localStorage           | Local-only requirement; Zod for schema validation at I/O      |
| Validation     | Zod 3                  | Runtime type-safety at storage boundary                       |
| Package Mgr    | pnpm                   | Faster installs, strict dependency resolution                 |

---

## Module Responsibility Map

| Module                          | Responsibility                                              |
|---------------------------------|-------------------------------------------------------------|
| Career & Pay Progression Engine | GS/LEO/Title 38, grade/step/locality, SCD tracking         |
| Leave Planning & Tracking       | Annual + sick leave, rollover, partial usage, retirement credit |
| TSP Modeling                    | Traditional & Roth balances; agency match → Traditional only |
| Military Service Buyback        | Service time and eligibility impact                         |
| Expense Modeling                | Categories, expense smile curve, inflation                  |
| Retirement Simulation Engine    | Eligibility, income vs expense projection, scenario compare |
| Visualization Layer             | Zero business logic; mobile-friendly, replaceable           |
| Validation & Testing Framework  | Warning vs error taxonomy; unit + integration + scenario    |
| Documentation & Regulatory Ref  | Living formula registry; regulatory mapping table           |

---

## Data Flow Overview

```
[User Input / Local Storage]
         │
         ▼
[Models] ─────────────────────────────────────┐
         │                                    │
         ▼                                    │
[Career Engine] ──► [Leave Module]            │
         │                  │                 │
         ▼                  ▼                 │
[TSP Module] ◄── [Military Buyback]           │
         │                                    │
         ▼                                    │
[Expense Module]                              │
         │                                    │
         ▼                                    ▼
[Simulation Engine] ──────────────► [Validation Layer]
         │
         ▼
[Visualization Layer]  (zero business logic)
         │
         ▼
[User Interface]
```

---

## Module Communication Contract

All inter-module communication uses typed interfaces defined in `src/models/`.
No module imports directly from another module's internals.
All shared state is passed explicitly — never via global mutation.

---

## Local Storage Design

- Schema version embedded in every stored record.
- Migrations run automatically on load.
- See `src/storage/schema.ts` for versioned schema definitions.
- See `src/storage/migrations/` for upgrade functions.

---

## Regulatory Change Safety

1. Every formula references a `sourceRef` field in the formula registry.
2. When a regulation changes, locate affected formulas via registry lookup.
3. Increment formula version, update logic, add changelog entry.
4. Re-run affected scenario tests.
5. Document the change in `docs/regulatory-mapping.md`.

---

## Change History

| Version | Date       | Author | Description                  |
|---------|------------|--------|------------------------------|
| 0.1.0   | 2026-02-10 |        | Initial architecture scaffold |
| 0.2.0   | 2026-02-10 |        | Phase 1 complete — tech stack locked, build tooling established |
| 0.3.0   | 2026-02-10 |        | Phase 2 complete — data models finalized, Zod schemas, persistence layer with migrations |
| 0.4.0   | 2026-02-10 |        | Phase 3 complete — Career & Pay Engine (GS/LEO/Title 38, WGI, locality, SCD, salary history) |

GLOBAL INSTRUCTIONS (Applies to All Phases)
You are an experienced financial planner, federal benefits subject-matter expert, and software product architect.
* Use the attached spreadsheet as the baseline for minimum viable features and calculations.
* Assume local-only storage (no backend).
* Design for eventual mobile app deployment.
* Federal accuracy is non-negotiable.
* Every calculation must be:
    * Named
    * Versioned
    * Traceable
    * Documented
* Separate business logic, data, UI, visuals, and tests at all times.

PHASE 1 — Product Scope & System Architecture
Goal: Establish a durable system foundation.
Tasks
* Define app architecture and module boundaries.
* Explain how local storage is structured and versioned.
* Describe how future regulatory changes can be introduced safely.
Output
* Architecture diagram (textual)
* Module responsibility map
* Data flow overview
Stop after Phase 1.

PHASE 2 — Data Models & Persistence Design
Goal: Lock down data integrity before calculations.
Tasks
* Define data models for:
    * Career history
    * Leave balances
    * TSP (Traditional & Roth)
    * Military service buyback
    * Expenses
    * Retirement assumptions
* Ensure historical preservation and forward projections.
* Define schema evolution rules.
Output
* Data model definitions
* Local storage schema examples
* Versioning strategy
Stop after Phase 2.

PHASE 3 — Federal Pay & Career Progression Engine
Goal: Accurately model federal compensation growth.
Tasks
* Grade/step progression logic
* Step increase timing
* Locality pay
* Special pay systems:
    * LEO
    * Title 38 hybrid
* Multi-career timeline handling
Output
* Pay formulas
* Step progression rules
* Projection examples
Stop after Phase 3.

PHASE 4 — Leave Planning & Tracking Module (Standalone Tool)
Goal: Create an independent, reusable leave engine.
Tasks
* Annual leave tracking
* Sick leave tracking (sick + family care)
* Partial leave usage
* Year-to-year rollover
* Integration with retirement credit
Output
* Leave formulas
* Rollover logic
* Edge case handling
Stop after Phase 4.

PHASE 5 — TSP & Military Buyback Modeling
Goal: Correctly model retirement assets and service credit.
Tasks
* Traditional vs Roth TSP modeling
* Future contributions
* Contribution changes over time
* Enforce agency match → Traditional only
* Military buyback service credit logic
Output
* Growth formulas
* Buyback impact analysis
* Projection examples
Stop after Phase 5.

PHASE 6 — Expense Modeling & Expense Smile Curve
Goal: Model realistic retirement spending behavior.
Tasks
* Comprehensive expense categories
* Expense smile curve implementation
* Adjustable curve parameters
* Inflation handling
Output
* Expense formulas
* Curve definitions
* Sample projections
Stop after Phase 6.

PHASE 7 — Retirement Simulation Engine
Goal: Integrate all systems into a single projection engine.
Tasks
* Combine pay, leave, TSP, expenses, service credit
* Model eligibility and retirement timing
* Ensure deterministic calculation order
* Support scenario comparisons
Output
* Simulation workflow
* Calculation dependency graph
* Example walkthrough
Stop after Phase 7.

PHASE 8 — Visualization & UX Layer
Goal: Make complex data understandable.
Tasks
* Visualizations for:
    * Pay growth
    * Leave balances
    * TSP balances
    * Income vs expenses
    * Expense smile curve
* Mobile-friendly UX
* Zero business logic in visuals
Output
* Visualization catalog
* Data bindings per visual
* UX recommendations
Stop after Phase 8.

PHASE 9 — Living Documentation & Formula Tracking (CRITICAL)
Goal: Ensure long-term correctness and auditability.
Tasks
* Create a formula registry where each formula includes:
    * Name
    * Purpose
    * Inputs
    * Outputs
    * Dependencies
    * Source reference
    * Version history
* Document:
    * Architecture
    * Module contracts
    * Assumptions
* Define change-log procedures
Output
* Formula registry template
* Architecture documentation outline
* Change management strategy
Stop after Phase 9.

PHASE 10 — Regulatory Reference Mapping (AUTHORITATIVE SOURCES)
Goal: Tie every rule to its governing authority.
Tasks
1. Create a regulatory reference map linking:
    * Each formula
    * Each assumption
    * Each eligibility rule
2. Reference authoritative sources such as:
    * OPM FERS Handbook
    * OPM Pay & Leave guidance
    * TSP regulations
    * Federal statutes (as applicable)
3. Identify:
    * Hard rules vs assumptions
    * Areas requiring user acknowledgment
Output
* Regulatory reference table:
    * Rule → Formula → Source → Notes
* Assumption disclosure framework
* Update monitoring strategy
Stop after Phase 10.

PHASE 11 — Validation Rules & Data Integrity Checks
Goal: Prevent bad inputs from corrupting projections.
Tasks
* Define validation rules for:
    * Dates (SCD, retirement date)
    * Contribution limits
    * Leave balances
    * Pay grade/step combinations
* Create guardrails for:
    * Impossible states
    * Regulatory violations
* Define warning vs error conditions
Output
* Validation rule catalog
* Error/warning taxonomy
* Example validation flows
Stop after Phase 11.

PHASE 12 — Testing Strategy & Scenario Verification
Goal: Prove the system works and stays correct.
Tasks
1. Define testing layers:
    * Unit tests (formulas)
    * Integration tests (modules)
    * Scenario tests (realistic federal careers)
2. Create canonical test scenarios:
    * Straight-through GS career
    * LEO early retirement
    * Military buyback impact
    * High Roth vs Traditional contribution paths
3. Ensure spreadsheet parity:
    * App outputs must match spreadsheet results within tolerance.
Output
* Test plan
* Scenario catalog
* Expected result benchmarks
Stop after Phase 12.

Final Instruction to Claude
Work through one phase at a time, stopping after each phase and waiting for confirmation before proceeding.

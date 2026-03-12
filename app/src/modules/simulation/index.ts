/**
 * Retirement Simulation Engine
 *
 * The integration layer. Combines all modules into a single projection.
 *
 * Calculation order (must be respected):
 *   1. career  → resolve pay history and High-3
 *   2. leave   → resolve sick leave service credit
 *   3. military → resolve total creditable service
 *   4. tsp     → resolve projected balances
 *   5. expenses → resolve spending curve
 *   6. simulation → compute annuity, supplement, net income
 *
 * All formulas referenced in: docs/formula-registry.md
 */

export type { SimulationInput, SimulationResult, RetirementScenario, AnnualProjection, RetirementAssumptions } from '../../models/simulation';
export type { MRAResult, EligibilityResult } from './eligibility';
export type { FERSAnnuityResult, FERSSupplementResult } from './annuity';
export type { ScenarioSummary, ScenarioComparisonResult } from './scenario';
export type { FilingStatus, TaxInput, TaxYearResult } from '../../models/tax';

export { getMRA, checkFERSEligibility, mra10ReductionFactor, fersCOLARate, getFullRetirementAge, ssAdjustmentFactor } from './eligibility';
export { computeHigh3, computeFERSAnnuity, computeFERSSupplement } from './annuity';
export { projectRetirementIncome } from './income-projection';
export type { SimulationConfig, SimulationYearResult, FullSimulationResult } from '../../models/simulation';
export { runScenario, compareScenarios } from './scenario';
export { computeAnnualTax, computeFederalTax, computeStandardDeduction } from '../tax';

/**
 * CANONICAL UNIFIED ENGINE
 * Use this for all new simulation code. Replaces both income-projection and retirement-simulation.
 */
export { unifiedRetirementSimulation } from './unified-engine';

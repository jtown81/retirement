/**
 * Career & Pay Progression Engine
 *
 * Responsible for:
 * - GS / LEO / Title 38 hybrid pay calculations
 * - Grade, step, and locality pay
 * - Service Computation Date (SCD) tracking
 * - Step increase (WGI) timing
 * - Multi-career timeline handling
 * - Salary history projection for High-3 computation
 *
 * This module exposes a typed public API. No UI logic here.
 * All formulas referenced in: docs/formula-registry.md
 */

export type { CareerProfile, CareerEvent, PayPeriod } from '../../models/career';

export { gradeStepToSalary, getStepIncreaseDate, getNextWGIDate, WGI_WEEKS } from './grade-step';
export { getLocalityRate, applyLocality, getAvailableLocalityCodes } from './locality';
export { calculateAnnualPay, LEO_AVAILABILITY_PAY_RATE } from './pay-calculator';
export type { AnnualPayResult } from './pay-calculator';
export { computeSCD, computeCreditableService, deriveEffectiveSCD } from './scd';
export type { ServiceDuration } from './scd';
export { buildSalaryHistory, computeHigh3Salary } from './projection';
export type { SalaryYear } from './projection';

/**
 * Tax Module Barrel Export
 *
 * Public API for federal income tax, Social Security taxation, and IRMAA computation.
 */

// Main computation function
export { computeAnnualTax } from './federal';

// Bracket calculations
export { computeFederalTax, computeStandardDeduction, computeEffectiveRate } from './brackets';

// Social Security taxation
export {
  computeSSProvisionalIncome,
  computeSSTaxableFraction,
  computeSSTaxableAmount,
} from './social-security';

// IRMAA surcharges
export { computeIRMAASurcharge, getIRMAATier } from './irmaa';

// Type exports
export type { FilingStatus, TaxInput, TaxYearResult } from '../../models/tax';

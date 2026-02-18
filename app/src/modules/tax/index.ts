/**
 * Tax Module — Barrel Export
 *
 * Exposes all tax calculation functions and data types.
 * Import from '@modules/tax' only; never import subfiles directly.
 */

// Data types
export type { TaxProfile, FilingStatus, StateCode, TaxYearResult, StateTaxRule, StandardDeduction, IrmaaTier } from '@models/tax';

// Bracket functions
export { getBracketsForYearAndStatus, getStandardDeduction, getMarginalBracketRate, getEffectiveTaxRate, applyStandardDeduction, getBracketAtIncome } from './brackets';

// Federal tax functions
export { computeFederalTax, computeFederalTaxableIncome, getEffectiveFederalRate, computeFederalTaxFull } from './federal';
export type { FederalTaxResult } from './federal';

// Social Security functions
export { computeProvisionalIncome, computeSSTaxableFraction, computeTaxableSS, getSSTaxationTier, computeSSBenefitTaxation } from './social-security';
export type { SSTaxationResult } from './social-security';

// IRMAA functions
export { getIrmaaTiersForYear, findIrmaaTier, computeIrmaaSurcharge, computeIrmaaDetailed } from './irmaa';
export type { IrmaaResult } from './irmaa';

// State tax functions
export { getStateTaxRule, computeStateTax, computeStateTaxDetailed } from './state';
export type { StateTaxResult } from './state';

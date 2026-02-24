/**
 * Tax Data Models
 *
 * Pure data shapes for tax profile, brackets, and calculation results.
 * No business logic — only interfaces and enums.
 *
 * Source references:
 *   - IRC § 1 (income tax brackets)
 *   - IRC § 86 (Social Security taxation)
 *   - SSA POMS HI 01101.020 (IRMAA thresholds)
 *   - IRS Publication 721 (FERS annuity taxation)
 */

import type { ISODate, Rate, USD } from './common';

/**
 * Filing status per IRC § 1
 */
export type FilingStatus =
  | 'single'
  | 'married-joint'
  | 'married-separate'
  | 'head-of-household';

/**
 * Two-character USPS state code, or null for no state income tax
 */
export type StateCode = string | null;

/**
 * User's tax profile configuration
 *
 * Stored in localStorage under retire:tax-profile
 */
export interface TaxProfile {
  filingStatus: FilingStatus;
  /** USPS 2-letter code; null = "no state income tax" */
  stateCode: StateCode;
  /** Year this state residency applies (tax law varies by year) */
  stateResidencyYear: number;
  /** Deduction strategy: 'standard' or itemized dollar amount */
  deductionStrategy: 'standard' | number;
  /** Whether to model IRMAA surcharges (Medicare Part B/D) */
  modelIrmaa: boolean;
}

/**
 * A single federal income tax bracket for one filing status and year
 */
export interface FederalBracket {
  year: number;
  filingStatus: FilingStatus;
  /** Minimum income in this bracket (cents) */
  minIncome: number;
  /** Maximum income in this bracket (cents); null = unbounded top bracket */
  maxIncome: number | null;
  /** Marginal tax rate for this bracket (e.g., 0.10 for 10%) */
  rate: Rate;
}

/**
 * Per-year federal income tax calculation result
 *
 * Attached to SimulationYearResult for full retirement projection
 */
export interface TaxYearResult {
  year: number;
  age: number;

  // Income components
  grossIncome: number;
  adjustedGrossIncome: number;
  deduction: number;
  federalTaxableIncome: number;

  // Federal income tax
  federalTax: number;
  /**
   * Fraction of Social Security benefit subject to federal income tax.
   * Calculated per IRC § 86 provisional income test.
   * - 0 = no SS taxable
   * - 0.5 = up to 50% of SS taxable (lower tier)
   * - 0.85 = up to 85% of SS taxable (upper tier)
   */
  socialSecurityTaxableFraction: 0 | 0.5 | 0.85;

  // State and other taxes
  stateTax: number;
  /** Medicare IRMAA Part B + Part D surcharge (annual) */
  irmaaSurcharge: number;

  // Totals
  totalTax: number;
  afterTaxIncome: number;

  // Effective rates
  effectiveFederalRate: Rate; // federalTax / grossIncome
  effectiveTotalRate: Rate;   // totalTax / grossIncome
}

/**
 * State tax rule — filing and exemption status
 *
 * MVP uses flat-rate approximation; V2 will have full marginal brackets per state
 */
export interface StateTaxRule {
  stateCode: string;
  year: number;

  /** True if this state exempts FERS annuity income */
  exemptsFersAnnuity: boolean;
  /** True if this state exempts TSP withdrawals */
  exemptsTspWithdrawals: boolean;
  /** True if this state has no income tax at all */
  noIncomeTax: boolean;

  /**
   * Approximated flat tax rate (simplification for MVP).
   * In V2, replace with marginal brackets per tax system.
   */
  approximateFlatRate: Rate;

  /** Source reference (e.g., "Tax Foundation 2024", "State Revenue Department") */
  source: string;
}

/**
 * Standard deduction by filing status and year
 */
export interface StandardDeduction {
  year: number;
  single: USD;
  marriedJoint: USD;
  marriedSeparate: USD;
  headOfHousehold: USD;
}

/**
 * IRMAA threshold for one filing status and year
 */
export interface IrmaaTier {
  /** Year these thresholds apply */
  year: number;
  /** Filing status */
  filingStatus: FilingStatus;
  /** Lower MAGI bound (inclusive) */
  minMagi: USD;
  /** Upper MAGI bound (exclusive); null = top tier */
  maxMagi: USD | null;
  /** Fraction of income above minMagi subject to surcharge (e.g., 0.35) */
  surchargeRate: Rate;
  /** Maximum surcharge for this tier (annual) */
  maxSurcharge: USD;
}

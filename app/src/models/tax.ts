/**
 * Tax Calculation Data Models
 * No business logic — pure data shapes for federal income tax computation.
 */

import type { USD, Rate } from './common';

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';

/**
 * Input parameters for annual federal tax computation.
 * Aggregates income from all sources and user preferences for tax calculation.
 */
export interface TaxInput {
  /** Calendar year for which to compute taxes (YYYY) */
  calendarYear: number;
  /** Age of primary taxpayer during the year */
  age: number;
  /** Filing status for federal tax purposes */
  filingStatus: FilingStatus;

  // ── Income Sources ──────────────────────────────────────────────────
  /** Ordinary income (annuity + traditional TSP withdrawal + taxable SS) */
  ordinaryIncome: USD;
  /** Roth TSP withdrawals (excluded from AGI, not taxable) */
  rothIncome: USD;
  /** Full Social Security benefit before taxation (used for provisional income test) */
  grossSocialSecurity: USD;

  // ── Medicare Options ────────────────────────────────────────────────
  /** Whether to apply IRMAA surcharges (Medicare Part B + D) */
  useIRMAA: boolean;
}

/**
 * Annual federal tax computation result.
 * Shows all tax components: income tax, Social Security taxation, IRMAA, and effective rate.
 */
export interface TaxYearResult {
  /** Taxable ordinary income after standard deduction and SS adjustments */
  taxableIncome: USD;
  /** Federal income tax computed from marginal brackets */
  federalTax: USD;
  /** Effective federal tax rate (federalTax / totalIncome) */
  effectiveFederalRate: Rate;

  /** Social Security taxable fraction (0.0, 0.5, or 0.85) */
  ssTaxableFraction: number;
  /** Amount of Social Security subject to federal income tax */
  ssTaxableAmount: USD;

  /** IRMAA surcharge (Part B + Part D annual) for age 65+ Medicare beneficiaries */
  irmaaSurcharge: USD;
  /** State income tax (placeholder: always 0) */
  stateTax: USD;

  /** Total all taxes (federal + IRMAA + state) */
  totalTax: USD;
  /** Gross income minus all taxes */
  afterTaxIncome: USD;
}

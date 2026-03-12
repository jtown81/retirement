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

/**
 * Federal tax bracket definition
 */
export interface FederalBracket {
  /** Calendar year this bracket applies to */
  year: number;
  /** Filing status: single, married_joint, etc. */
  filingStatus: FilingStatus;
  /** Lower bound of bracket (inclusive) in USD */
  minIncome: USD;
  /** Upper bound of bracket (exclusive) in USD; Infinity for top bracket */
  maxIncome: USD;
  /** Marginal tax rate for this bracket */
  rate: Rate;
}

/**
 * Standard deduction by filing status and year
 */
export interface StandardDeduction {
  /** Calendar year */
  year: number;
  /** Filing status */
  filingStatus: FilingStatus;
  /** Standard deduction amount in USD */
  amount: USD;
  /** Additional standard deduction for age 65+ (if applicable) */
  age65Plus?: USD;
}

/**
 * State tax configuration and computation
 * MVP: Flat-rate approximations for top states; state tax is not included in app projections yet
 */

export type StateCode =
  | 'AK' | 'AL' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'DC' | 'null';

export interface StateTaxRule {
  /** State abbreviation */
  stateCode: StateCode;
  /** Year this rule applies to */
  year: number;
  /** Whether state has no income tax */
  noIncomeTax?: boolean;
  /** Whether FERS annuity is exempt from state tax */
  exemptsFersAnnuity?: boolean;
  /** Whether TSP withdrawals are exempt from state tax */
  exemptsTspWithdrawals?: boolean;
  /** Social Security exemption */
  exemptsSocialSecurity?: boolean;
  /** Flat tax rate (MVP only; full brackets TBD) */
  approximateFlatRate?: Rate;
}

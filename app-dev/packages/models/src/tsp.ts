/**
 * TSP Data Models
 * No business logic — pure data shapes.
 */

import type { ISODate, USD, Rate } from './common';

export interface TSPBalances {
  asOf: ISODate;
  traditionalBalance: USD;
  rothBalance: USD;
}

/**
 * TSP investment fund codes per TSP.gov
 */
export type TSPFundCode =
  | 'G' | 'F' | 'C' | 'S' | 'I'
  | 'L-Income' | 'L2025' | 'L2030' | 'L2035' | 'L2040'
  | 'L2045' | 'L2050' | 'L2055' | 'L2060' | 'L2065';

/**
 * Fund allocation — percentage of TOTAL contributions (employee + agency) directed to this fund.
 * All fund allocations must sum to 100%.
 */
export interface TSPFundAllocation {
  fund: TSPFundCode;
  /** Percentage of total contributions allocated to this fund (0–100). All funds must sum to 100%. */
  percentage: number;
}

/**
 * TSP Account Snapshot (NEW in Phase 10)
 * Records a point-in-time view of TSP account state with fund allocations
 */
export interface TSPAccountSnapshot {
  id: string;
  asOf: ISODate;
  source: 'tsp-statement' | 'manual' | 'import';
  traditionalBalance: USD;
  rothBalance: USD;
  ytdEmployeeContributions?: USD;
  ytdAgencyContributions?: USD;
  fundAllocations: TSPFundAllocation[];
  notes?: string;
}

/**
 * A single parsed row from TSP.gov account activity CSV
 */
export interface TSPTransactionRow {
  date: ISODate;
  description: string;
  fund: TSPFundCode | null;  // null if fund unknown
  source: 'employee' | 'agency-auto' | 'agency-match' | 'earnings' | 'withdrawal' | 'other';
  amount: number;            // positive = deposit, negative = withdrawal (in dollars)
  runningBalance: number;
}

/**
 * TSP CSV import error (parse or validation)
 */
export type TSPImportError =
  | { type: 'parse-error'; message: string; row?: number }
  | { type: 'validation-error'; message: string; row?: number };

export interface TSPContributionEvent {
  id: string;
  effectiveDate: ISODate;
  /**
   * Employee Traditional TSP contribution as a percentage of gross pay (e.g., 0.05 = 5%).
   * Agency match is always deposited to Traditional only (5 U.S.C. § 8432(c)).
   */
  employeeTraditionalPct: Rate;
  /**
   * Employee Roth TSP contribution as a percentage of gross pay (e.g., 0.05 = 5%).
   * Combined with employeeTraditionalPct, the total must not exceed the IRS 402(g) limit.
   * Source: IRC § 402A; TSP regulations 5 CFR Part 1600.
   */
  employeeRothPct: Rate;
  /**
   * True if employee is eligible for and elects catch-up contributions.
   * Catch-up is available at age 50+.
   * Source: IRC § 414(v); TSP regulations 5 CFR Part 1600.
   * ASSUMPTION: Engine validates age eligibility; this flag records the election.
   */
  catchUpEnabled: boolean;
  /**
   * True if the payroll provider performs annual agency match true-up.
   * Background: If an employee front-loads contributions and hits the 402(g) cap
   * mid-year (e.g., in pay period 20 of 26), they stop contributing for the
   * remaining pay periods. Without true-up, the agency stops matching those
   * periods. With true-up, the agency restores match retroactively to reach
   * the annual maximum (5% of salary).
   *
   * Default (false): No true-up. Employee loses match for periods after cap hit.
   * This is the conservative model and matches NFC payroll processing.
   * Set true if your payroll provider (e.g., some DFAS or agency TSP offices) performs true-up.
   *
   * Source: TSP regulations 5 CFR Part 1600; TSP Bulletin 2012-2
   * Classification: Assumption (user-configurable based on payroll provider behavior)
   */
  agencyMatchTrueUp?: boolean;
}

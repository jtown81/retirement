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
 * Fund allocation across Traditional and Roth buckets
 */
export interface TSPFundAllocation {
  fund: TSPFundCode;
  percentTraditional: number;  // 0–100; Traditional portion of this fund
  percentRoth: number;         // 0–100; Roth portion of this fund
  // Note: percentTraditional + percentRoth should = 100 for this fund
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
  /** Employee contribution as a percentage of gross pay (e.g., 0.10 = 10%) */
  employeeContributionPct: Rate;
  /** True if employee's contribution is designated as Roth */
  isRoth: boolean;
  /**
   * True if employee is eligible for and elects catch-up contributions.
   * Catch-up is available at age 50+.
   * Source: IRC § 414(v); TSP regulations 5 CFR Part 1600.
   * ASSUMPTION: Engine validates age eligibility; this flag records the election.
   */
  catchUpEnabled: boolean;
  // Note: agency match always goes to Traditional regardless of isRoth
}

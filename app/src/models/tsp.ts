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

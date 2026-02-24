/**
 * Federal Income Tax Brackets — 2023–2026
 *
 * Source: IRS Revenue Procedures (annual COLA adjustments)
 * These brackets are indexed for inflation each January.
 *
 * Format: cents (multiply by 100 to store as integers to avoid floating-point)
 *
 * IMPORTANT: Brackets change every year. Update this file each January after
 * the IRS publishes annual inflation adjustments (Rev. Proc. typically released
 * in October of prior year, effective Jan 1).
 */

import type { FederalBracket, StandardDeduction } from '@fedplan/models';

/**
 * 2024 Federal income tax brackets (most recent published)
 *
 * Source: IRS Revenue Procedure 2023-45 (released Oct 16, 2023)
 * Effective: January 1, 2024
 * Values in DOLLARS (not cents)
 */
export const BRACKETS_2024: FederalBracket[] = [
  // Single filers
  { year: 2024, filingStatus: 'single', minIncome: 0, maxIncome: 11600, rate: 0.10 },
  { year: 2024, filingStatus: 'single', minIncome: 11600, maxIncome: 47150, rate: 0.12 },
  { year: 2024, filingStatus: 'single', minIncome: 47150, maxIncome: 100525, rate: 0.22 },
  { year: 2024, filingStatus: 'single', minIncome: 100525, maxIncome: 191950, rate: 0.24 },
  { year: 2024, filingStatus: 'single', minIncome: 191950, maxIncome: 243725, rate: 0.32 },
  { year: 2024, filingStatus: 'single', minIncome: 243725, maxIncome: 609675, rate: 0.35 },
  { year: 2024, filingStatus: 'single', minIncome: 609675, maxIncome: null, rate: 0.37 },

  // Married filing jointly
  { year: 2024, filingStatus: 'married-joint', minIncome: 0, maxIncome: 23200, rate: 0.10 },
  { year: 2024, filingStatus: 'married-joint', minIncome: 23200, maxIncome: 94300, rate: 0.12 },
  { year: 2024, filingStatus: 'married-joint', minIncome: 94300, maxIncome: 201050, rate: 0.22 },
  { year: 2024, filingStatus: 'married-joint', minIncome: 201050, maxIncome: 383900, rate: 0.24 },
  { year: 2024, filingStatus: 'married-joint', minIncome: 383900, maxIncome: 487450, rate: 0.32 },
  { year: 2024, filingStatus: 'married-joint', minIncome: 487450, maxIncome: 732000, rate: 0.35 },
  { year: 2024, filingStatus: 'married-joint', minIncome: 732000, maxIncome: null, rate: 0.37 },

  // Married filing separately
  { year: 2024, filingStatus: 'married-separate', minIncome: 0, maxIncome: 11600, rate: 0.10 },
  { year: 2024, filingStatus: 'married-separate', minIncome: 11600, maxIncome: 47150, rate: 0.12 },
  { year: 2024, filingStatus: 'married-separate', minIncome: 47150, maxIncome: 100525, rate: 0.22 },
  { year: 2024, filingStatus: 'married-separate', minIncome: 100525, maxIncome: 191950, rate: 0.24 },
  { year: 2024, filingStatus: 'married-separate', minIncome: 191950, maxIncome: 243725, rate: 0.32 },
  { year: 2024, filingStatus: 'married-separate', minIncome: 243725, maxIncome: 366000, rate: 0.35 },
  { year: 2024, filingStatus: 'married-separate', minIncome: 366000, maxIncome: null, rate: 0.37 },

  // Head of household
  { year: 2024, filingStatus: 'head-of-household', minIncome: 0, maxIncome: 16600, rate: 0.10 },
  { year: 2024, filingStatus: 'head-of-household', minIncome: 16600, maxIncome: 63300, rate: 0.12 },
  { year: 2024, filingStatus: 'head-of-household', minIncome: 63300, maxIncome: 150785, rate: 0.22 },
  { year: 2024, filingStatus: 'head-of-household', minIncome: 150785, maxIncome: 287500, rate: 0.24 },
  { year: 2024, filingStatus: 'head-of-household', minIncome: 287500, maxIncome: 364125, rate: 0.32 },
  { year: 2024, filingStatus: 'head-of-household', minIncome: 364125, maxIncome: 619600, rate: 0.35 },
  { year: 2024, filingStatus: 'head-of-household', minIncome: 619600, maxIncome: null, rate: 0.37 },
];

/**
 * 2025 Federal income tax brackets (estimated with COLA)
 *
 * Source: IRS Revenue Procedure 2024-51 (projected)
 * Effective: January 1, 2025
 * Values in DOLLARS (not cents)
 * Note: These are estimates pending official IRS release. Update when published.
 */
export const BRACKETS_2025: FederalBracket[] = [
  // Single filers (2024 × 1.020 COLA estimate)
  { year: 2025, filingStatus: 'single', minIncome: 0, maxIncome: 11840, rate: 0.10 },
  { year: 2025, filingStatus: 'single', minIncome: 11840, maxIncome: 48090, rate: 0.12 },
  { year: 2025, filingStatus: 'single', minIncome: 48090, maxIncome: 102530, rate: 0.22 },
  { year: 2025, filingStatus: 'single', minIncome: 102530, maxIncome: 195790, rate: 0.24 },
  { year: 2025, filingStatus: 'single', minIncome: 195790, maxIncome: 248590, rate: 0.32 },
  { year: 2025, filingStatus: 'single', minIncome: 248590, maxIncome: 621870, rate: 0.35 },
  { year: 2025, filingStatus: 'single', minIncome: 621870, maxIncome: null, rate: 0.37 },

  // Married filing jointly
  { year: 2025, filingStatus: 'married-joint', minIncome: 0, maxIncome: 23680, rate: 0.10 },
  { year: 2025, filingStatus: 'married-joint', minIncome: 23680, maxIncome: 96180, rate: 0.12 },
  { year: 2025, filingStatus: 'married-joint', minIncome: 96180, maxIncome: 205070, rate: 0.22 },
  { year: 2025, filingStatus: 'married-joint', minIncome: 205070, maxIncome: 391580, rate: 0.24 },
  { year: 2025, filingStatus: 'married-joint', minIncome: 391580, maxIncome: 497180, rate: 0.32 },
  { year: 2025, filingStatus: 'married-joint', minIncome: 497180, maxIncome: 746640, rate: 0.35 },
  { year: 2025, filingStatus: 'married-joint', minIncome: 746640, maxIncome: null, rate: 0.37 },

  // Married filing separately
  { year: 2025, filingStatus: 'married-separate', minIncome: 0, maxIncome: 11840, rate: 0.10 },
  { year: 2025, filingStatus: 'married-separate', minIncome: 11840, maxIncome: 48090, rate: 0.12 },
  { year: 2025, filingStatus: 'married-separate', minIncome: 48090, maxIncome: 102530, rate: 0.22 },
  { year: 2025, filingStatus: 'married-separate', minIncome: 102530, maxIncome: 195790, rate: 0.24 },
  { year: 2025, filingStatus: 'married-separate', minIncome: 195790, maxIncome: 248590, rate: 0.32 },
  { year: 2025, filingStatus: 'married-separate', minIncome: 248590, maxIncome: 373320, rate: 0.35 },
  { year: 2025, filingStatus: 'married-separate', minIncome: 373320, maxIncome: null, rate: 0.37 },

  // Head of household
  { year: 2025, filingStatus: 'head-of-household', minIncome: 0, maxIncome: 16920, rate: 0.10 },
  { year: 2025, filingStatus: 'head-of-household', minIncome: 16920, maxIncome: 64560, rate: 0.12 },
  { year: 2025, filingStatus: 'head-of-household', minIncome: 64560, maxIncome: 153800, rate: 0.22 },
  { year: 2025, filingStatus: 'head-of-household', minIncome: 153800, maxIncome: 293170, rate: 0.24 },
  { year: 2025, filingStatus: 'head-of-household', minIncome: 293170, maxIncome: 371000, rate: 0.32 },
  { year: 2025, filingStatus: 'head-of-household', minIncome: 371000, maxIncome: 632000, rate: 0.35 },
  { year: 2025, filingStatus: 'head-of-household', minIncome: 632000, maxIncome: null, rate: 0.37 },
];

/**
 * 2026 Federal income tax brackets (placeholder — update when official brackets released)
 *
 * Currently using 2025 as estimate pending IRS announcement.
 */
export const BRACKETS_2026: FederalBracket[] = BRACKETS_2025.map((b) => ({
  ...b,
  year: 2026,
}));

/**
 * 2023 Federal income tax brackets (prior year — retained for historical lookups)
 *
 * Source: IRS Revenue Procedure 2022-45
 * Values in DOLLARS (not cents)
 */
export const BRACKETS_2023: FederalBracket[] = [
  // Single
  { year: 2023, filingStatus: 'single', minIncome: 0, maxIncome: 11200, rate: 0.10 },
  { year: 2023, filingStatus: 'single', minIncome: 11200, maxIncome: 45750, rate: 0.12 },
  { year: 2023, filingStatus: 'single', minIncome: 45750, maxIncome: 98500, rate: 0.22 },
  { year: 2023, filingStatus: 'single', minIncome: 98500, maxIncome: 187000, rate: 0.24 },
  { year: 2023, filingStatus: 'single', minIncome: 187000, maxIncome: 235250, rate: 0.32 },
  { year: 2023, filingStatus: 'single', minIncome: 235250, maxIncome: 590000, rate: 0.35 },
  { year: 2023, filingStatus: 'single', minIncome: 590000, maxIncome: null, rate: 0.37 },

  // Married filing jointly
  { year: 2023, filingStatus: 'married-joint', minIncome: 0, maxIncome: 22400, rate: 0.10 },
  { year: 2023, filingStatus: 'married-joint', minIncome: 22400, maxIncome: 91500, rate: 0.12 },
  { year: 2023, filingStatus: 'married-joint', minIncome: 91500, maxIncome: 197000, rate: 0.22 },
  { year: 2023, filingStatus: 'married-joint', minIncome: 197000, maxIncome: 374000, rate: 0.24 },
  { year: 2023, filingStatus: 'married-joint', minIncome: 374000, maxIncome: 470500, rate: 0.32 },
  { year: 2023, filingStatus: 'married-joint', minIncome: 470500, maxIncome: 708000, rate: 0.35 },
  { year: 2023, filingStatus: 'married-joint', minIncome: 708000, maxIncome: null, rate: 0.37 },

  // Married filing separately
  { year: 2023, filingStatus: 'married-separate', minIncome: 0, maxIncome: 11200, rate: 0.10 },
  { year: 2023, filingStatus: 'married-separate', minIncome: 11200, maxIncome: 45750, rate: 0.12 },
  { year: 2023, filingStatus: 'married-separate', minIncome: 45750, maxIncome: 98500, rate: 0.22 },
  { year: 2023, filingStatus: 'married-separate', minIncome: 98500, maxIncome: 187000, rate: 0.24 },
  { year: 2023, filingStatus: 'married-separate', minIncome: 187000, maxIncome: 235250, rate: 0.32 },
  { year: 2023, filingStatus: 'married-separate', minIncome: 235250, maxIncome: 354000, rate: 0.35 },
  { year: 2023, filingStatus: 'married-separate', minIncome: 354000, maxIncome: null, rate: 0.37 },

  // Head of household
  { year: 2023, filingStatus: 'head-of-household', minIncome: 0, maxIncome: 16000, rate: 0.10 },
  { year: 2023, filingStatus: 'head-of-household', minIncome: 16000, maxIncome: 61000, rate: 0.12 },
  { year: 2023, filingStatus: 'head-of-household', minIncome: 61000, maxIncome: 146500, rate: 0.22 },
  { year: 2023, filingStatus: 'head-of-household', minIncome: 146500, maxIncome: 279000, rate: 0.24 },
  { year: 2023, filingStatus: 'head-of-household', minIncome: 279000, maxIncome: 352000, rate: 0.32 },
  { year: 2023, filingStatus: 'head-of-household', minIncome: 352000, maxIncome: 590000, rate: 0.35 },
  { year: 2023, filingStatus: 'head-of-household', minIncome: 590000, maxIncome: null, rate: 0.37 },
];

/**
 * Standard deduction amounts by filing status and year
 *
 * Source: IRS (updated annually for COLA)
 */
export const STANDARD_DEDUCTIONS: StandardDeduction[] = [
  {
    year: 2023,
    single: 13850,
    marriedJoint: 27700,
    marriedSeparate: 13850,
    headOfHousehold: 20800,
  },
  {
    year: 2024,
    single: 14600,
    marriedJoint: 29200,
    marriedSeparate: 14600,
    headOfHousehold: 21900,
  },
  {
    year: 2025,
    single: 14900,
    marriedJoint: 29800,
    marriedSeparate: 14900,
    headOfHousehold: 22350,
  },
  {
    year: 2026,
    single: 15200,
    marriedJoint: 30400,
    marriedSeparate: 15200,
    headOfHousehold: 22850,
  },
];

/**
 * Consolidated bracket lookup by year
 */
export function getBracketsForYear(year: number): FederalBracket[] {
  switch (year) {
    case 2023:
      return BRACKETS_2023;
    case 2024:
      return BRACKETS_2024;
    case 2025:
      return BRACKETS_2025;
    case 2026:
      return BRACKETS_2026;
    default:
      // For years before 2023 or after 2026, use nearest available
      if (year < 2023) return BRACKETS_2023;
      return BRACKETS_2026;
  }
}

/**
 * Standard deduction lookup by year and filing status
 */
export function getStandardDeductionForYear(year: number, filingStatus: 'single' | 'married-joint' | 'married-separate' | 'head-of-household'): number {
  const deduction = STANDARD_DEDUCTIONS.find((d) => d.year === year);
  if (!deduction) {
    // Fallback to closest year
    const closest = STANDARD_DEDUCTIONS.reduce((prev, curr) =>
      Math.abs(curr.year - year) < Math.abs(prev.year - year) ? curr : prev
    );
    return closest[filingStatus === 'married-joint' ? 'marriedJoint' : filingStatus === 'married-separate' ? 'marriedSeparate' : filingStatus === 'head-of-household' ? 'headOfHousehold' : 'single'];
  }
  return deduction[
    filingStatus === 'married-joint'
      ? 'marriedJoint'
      : filingStatus === 'married-separate'
        ? 'marriedSeparate'
        : filingStatus === 'head-of-household'
          ? 'headOfHousehold'
          : 'single'
  ];
}

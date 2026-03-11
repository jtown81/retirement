/**
 * Medicare Income-Related Monthly Adjustment Amounts (IRMAA)
 *
 * IRMAA surcharges apply to Medicare Part B (medical insurance) and Part D (prescription drug)
 * premiums when Modified Adjusted Gross Income (MAGI) exceeds the income-related threshold.
 *
 * Source: 42 U.S.C. § 1395r(i), IRS; Centers for Medicare & Medicaid Services (CMS).
 *
 * IRMAA THRESHOLDS & SURCHARGES (2025):
 * - Part B standard premium: $185/month
 * - Part D standard premium: varies (average ~$40/month)
 * - 5 income tiers with progressively higher surcharges
 * - Thresholds differ by filing status (single vs. MFJ)
 *
 * ASSUMPTION: IRMAA technically uses MAGI from 2 years prior (e.g., 2023 MAGI for 2025 surcharge).
 * This implementation approximates with current-year MAGI (same year). Users should be aware
 * of the 2-year lag in actual Medicare billing.
 * Classification: Hard regulatory (CMS published rates); Assumption (current-year approximation).
 *
 * NOTES:
 * - Applied only to beneficiaries age 65+ (Medicare-eligible)
 * - Married filing separately is subject to stricter thresholds
 * - Thresholds are adjusted annually for inflation
 */

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';

export interface IRMAATier {
  /** Income threshold (MAGI must be > this to apply surcharge) */
  incomeThreshold: number;
  /** Monthly Part B surcharge in USD */
  partBMonthly: number;
  /** Monthly Part D surcharge in USD */
  partDMonthly: number;
}

export interface IRMAATierTable {
  /** Tax year (YYYY) */
  year: number;
  /** Filing status */
  filingStatus: FilingStatus;
  /** IRMAA tiers for this year/status, ordered by income threshold */
  tiers: readonly IRMAATier[];
}

/**
 * 2025 IRMAA Tier Tables (CMS published rates)
 * Applied to beneficiaries age 65+ enrolled in Medicare Parts B and D.
 *
 * Source: CMS Medicare Part B and Part D 2025 Costs & Coverage
 */
export const IRMAA_TIERS_2025: readonly IRMAATierTable[] = [
  {
    year: 2025,
    filingStatus: 'single',
    tiers: [
      // Tier 0: No surcharge (at or below threshold)
      { incomeThreshold: 97000, partBMonthly: 0, partDMonthly: 0 },
      // Tier 1: $97,001 – $123,000
      { incomeThreshold: 123000, partBMonthly: 70, partDMonthly: 12.60 },
      // Tier 2: $123,001 – $153,000
      { incomeThreshold: 153000, partBMonthly: 175, partDMonthly: 32.50 },
      // Tier 3: $153,001 – $183,000
      { incomeThreshold: 183000, partBMonthly: 280, partDMonthly: 52.00 },
      // Tier 4: $183,001 – $213,000
      { incomeThreshold: 213000, partBMonthly: 385, partDMonthly: 71.50 },
      // Tier 5: > $213,000
      { incomeThreshold: Number.MAX_SAFE_INTEGER, partBMonthly: 490, partDMonthly: 91.00 },
    ] as const,
  },
  {
    year: 2025,
    filingStatus: 'married_joint',
    tiers: [
      // Tier 0: No surcharge (at or below threshold)
      { incomeThreshold: 194000, partBMonthly: 0, partDMonthly: 0 },
      // Tier 1: $194,001 – $246,000
      { incomeThreshold: 246000, partBMonthly: 70, partDMonthly: 12.60 },
      // Tier 2: $246,001 – $306,000
      { incomeThreshold: 306000, partBMonthly: 175, partDMonthly: 32.50 },
      // Tier 3: $306,001 – $366,000
      { incomeThreshold: 366000, partBMonthly: 280, partDMonthly: 52.00 },
      // Tier 4: $366,001 – $426,000
      { incomeThreshold: 426000, partBMonthly: 385, partDMonthly: 71.50 },
      // Tier 5: > $426,000
      { incomeThreshold: Number.MAX_SAFE_INTEGER, partBMonthly: 490, partDMonthly: 91.00 },
    ] as const,
  },
  {
    year: 2025,
    filingStatus: 'married_separate',
    tiers: [
      // MFS has stricter thresholds (rarely used; included for completeness)
      { incomeThreshold: 97000, partBMonthly: 0, partDMonthly: 0 },
      { incomeThreshold: Number.MAX_SAFE_INTEGER, partBMonthly: 490, partDMonthly: 91.00 },
    ] as const,
  },
  {
    year: 2025,
    filingStatus: 'head_of_household',
    tiers: [
      // HOH uses single thresholds (conservative approach)
      { incomeThreshold: 97000, partBMonthly: 0, partDMonthly: 0 },
      { incomeThreshold: 123000, partBMonthly: 70, partDMonthly: 12.60 },
      { incomeThreshold: 153000, partBMonthly: 175, partDMonthly: 32.50 },
      { incomeThreshold: 183000, partBMonthly: 280, partDMonthly: 52.00 },
      { incomeThreshold: 213000, partBMonthly: 385, partDMonthly: 71.50 },
      { incomeThreshold: Number.MAX_SAFE_INTEGER, partBMonthly: 490, partDMonthly: 91.00 },
    ] as const,
  },
];

/**
 * All available IRMAA tier tables.
 * Currently only 2025 is defined; future years will be added as CMS publishes them.
 */
export const ALL_IRMAA_TIER_TABLES: readonly IRMAATierTable[] = [
  ...IRMAA_TIERS_2025,
];

/**
 * Retrieves the IRMAA tier table for a given year and filing status.
 * Falls back to the most recent available year for future years.
 *
 * @param year - Tax year (YYYY)
 * @param filingStatus - Filing status
 * @returns IRMAATierTable with IRMAA surcharge tiers
 */
export function getIRMAATiers(year: number, filingStatus: FilingStatus): IRMAATierTable {
  // Try exact year match first
  const exactMatch = ALL_IRMAA_TIER_TABLES.find(
    (t) => t.year === year && t.filingStatus === filingStatus
  );
  if (exactMatch) return exactMatch;

  // Fall back to most recent year
  const sorted = [...ALL_IRMAA_TIER_TABLES]
    .filter((t) => t.filingStatus === filingStatus)
    .sort((a, b) => b.year - a.year);

  if (sorted.length === 0) {
    // Fallback: should not happen, but return 2025 single
    return IRMAA_TIERS_2025[0]!;
  }

  return sorted[0]!;
}

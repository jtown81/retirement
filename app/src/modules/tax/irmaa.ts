/**
 * Medicare IRMAA Surcharge Calculation
 *
 * Formula ID: tax/irmaa-surcharge
 * Source: SSA POMS HI 01101.020 (IRMAA thresholds and surcharges)
 *
 * IRMAA = Income Related Monthly Adjustment Amount
 *
 * Medicare Part B and Part D premiums are income-adjusted for higher-income
 * beneficiaries. The surcharge is based on Modified Adjusted Gross Income (MAGI)
 * from 2 years prior (e.g., 2024 premiums use 2022 income).
 *
 * For retirement projections, we apply current-year MAGI to current-year
 * surcharge thresholds (a simplification; actual Medicare premiums lag by 2 years).
 */

import type { FilingStatus, IrmaaTier } from '@models/tax';

/**
 * 2024 IRMAA tiers for Medicare Part B and Part D combined surcharges
 *
 * Source: CMS Notice of Benefit Parameters for 2025 (using 2024 thresholds as example)
 * These thresholds are NOT indexed for inflation in the statute.
 * SSA announces updates annually, typically in Oct/Nov prior to Jan 1 effective date.
 */
export const IRMAA_TIERS_2024: IrmaaTier[] = [
  // Single filers
  { year: 2024, filingStatus: 'single', minMagi: 0, maxMagi: 103000, surchargeRate: 0, maxSurcharge: 0 },
  { year: 2024, filingStatus: 'single', minMagi: 103000, maxMagi: 129000, surchargeRate: 0.35, maxSurcharge: 91 },
  { year: 2024, filingStatus: 'single', minMagi: 129000, maxMagi: 161000, surchargeRate: 0.35, maxSurcharge: 231 },
  { year: 2024, filingStatus: 'single', minMagi: 161000, maxMagi: 193000, surchargeRate: 0.35, maxSurcharge: 371 },
  { year: 2024, filingStatus: 'single', minMagi: 193000, maxMagi: 500000, surchargeRate: 0.35, maxSurcharge: 503 },
  { year: 2024, filingStatus: 'single', minMagi: 500000, maxMagi: null, surchargeRate: 0.35, maxSurcharge: 503 },

  // Married Filing Jointly
  { year: 2024, filingStatus: 'married-joint', minMagi: 0, maxMagi: 206000, surchargeRate: 0, maxSurcharge: 0 },
  { year: 2024, filingStatus: 'married-joint', minMagi: 206000, maxMagi: 258000, surchargeRate: 0.35, maxSurcharge: 182 },
  { year: 2024, filingStatus: 'married-joint', minMagi: 258000, maxMagi: 322000, surchargeRate: 0.35, maxSurcharge: 462 },
  { year: 2024, filingStatus: 'married-joint', minMagi: 322000, maxMagi: 386000, surchargeRate: 0.35, maxSurcharge: 742 },
  { year: 2024, filingStatus: 'married-joint', minMagi: 386000, maxMagi: 750000, surchargeRate: 0.35, maxSurcharge: 1006 },
  { year: 2024, filingStatus: 'married-joint', minMagi: 750000, maxMagi: null, surchargeRate: 0.35, maxSurcharge: 1006 },

  // Married Filing Separately
  { year: 2024, filingStatus: 'married-separate', minMagi: 0, maxMagi: 103000, surchargeRate: 0, maxSurcharge: 0 },
  { year: 2024, filingStatus: 'married-separate', minMagi: 103000, maxMagi: null, surchargeRate: 0.35, maxSurcharge: 503 },

  // Head of Household (same as single for IRMAA)
  { year: 2024, filingStatus: 'head-of-household', minMagi: 0, maxMagi: 103000, surchargeRate: 0, maxSurcharge: 0 },
  { year: 2024, filingStatus: 'head-of-household', minMagi: 103000, maxMagi: 129000, surchargeRate: 0.35, maxSurcharge: 91 },
  { year: 2024, filingStatus: 'head-of-household', minMagi: 129000, maxMagi: 161000, surchargeRate: 0.35, maxSurcharge: 231 },
  { year: 2024, filingStatus: 'head-of-household', minMagi: 161000, maxMagi: 193000, surchargeRate: 0.35, maxSurcharge: 371 },
  { year: 2024, filingStatus: 'head-of-household', minMagi: 193000, maxMagi: 500000, surchargeRate: 0.35, maxSurcharge: 503 },
  { year: 2024, filingStatus: 'head-of-household', minMagi: 500000, maxMagi: null, surchargeRate: 0.35, maxSurcharge: 503 },
];

/**
 * Placeholder for 2025 IRMAA tiers (update when SSA releases official figures)
 * Currently a copy of 2024; update thresholds when announced.
 */
export const IRMAA_TIERS_2025: IrmaaTier[] = IRMAA_TIERS_2024.map((t) => ({ ...t, year: 2025 }));

/**
 * Placeholder for 2026 IRMAA tiers
 */
export const IRMAA_TIERS_2026: IrmaaTier[] = IRMAA_TIERS_2024.map((t) => ({ ...t, year: 2026 }));

/**
 * Retrieves IRMAA tiers for a given year.
 *
 * @param year - Tax year
 * @returns Array of IrmaaTier definitions for the year
 */
export function getIrmaaTiersForYear(year: number): IrmaaTier[] {
  switch (year) {
    case 2024:
      return IRMAA_TIERS_2024;
    case 2025:
      return IRMAA_TIERS_2025;
    case 2026:
      return IRMAA_TIERS_2026;
    default:
      // For years outside range, use closest available
      if (year < 2024) return IRMAA_TIERS_2024;
      return IRMAA_TIERS_2026;
  }
}

/**
 * Finds the IRMAA tier that applies to a given MAGI and filing status.
 *
 * @param magi - Modified Adjusted Gross Income
 * @param filingStatus - Filing status
 * @param year - Tax year
 * @returns The IrmaaTier that applies, or null if MAGI is below lowest threshold
 */
export function findIrmaaTier(
  magi: number,
  filingStatus: FilingStatus,
  year: number,
): IrmaaTier | null {
  const tiers = getIrmaaTiersForYear(year)
    .filter((t) => t.filingStatus === filingStatus)
    .sort((a, b) => a.minMagi - b.minMagi);

  for (const tier of tiers) {
    if (tier.maxMagi === null || magi < tier.maxMagi) {
      return tier;
    }
  }

  // MAGI above all tiers — use top tier
  return tiers[tiers.length - 1];
}

/**
 * Computes the IRMAA surcharge (Medicare Part B + Part D combined).
 *
 * IRMAA is a monthly adjustment added to the standard Medicare premium.
 * The annual surcharge is the monthly amount × 12.
 *
 * Note: This is a simplified calculation. Actual Medicare premiums have
 * separate Part B and Part D components. This combines them.
 *
 * @param magi - Modified Adjusted Gross Income (current year)
 * @param filingStatus - Filing status
 * @param year - Tax year
 * @returns Annual IRMAA surcharge (dollars)
 *
 * @example
 * computeIrmaaSurcharge(110000, 'single', 2024) // $109.20 (91/month × 12)
 */
export function computeIrmaaSurcharge(
  magi: number,
  filingStatus: FilingStatus,
  year: number,
): number {
  const tier = findIrmaaTier(magi, filingStatus, year);
  if (!tier || tier.maxSurcharge === 0) {
    return 0; // No surcharge in first tier
  }

  // IRMAA surcharge is applied as $X per month. Annualize it.
  return tier.maxSurcharge * 12;
}

/**
 * Detailed IRMAA calculation result.
 */
export interface IrmaaResult {
  magi: number;
  filingStatus: FilingStatus;
  year: number;
  tier: IrmaaTier | null;
  monthlySurcharge: number; // Per month
  annualSurcharge: number;  // × 12 months
}

/**
 * Full IRMAA computation with details.
 *
 * @param magi - MAGI
 * @param filingStatus - Filing status
 * @param year - Tax year
 * @returns Detailed result including tier information
 */
export function computeIrmaaDetailed(
  magi: number,
  filingStatus: FilingStatus,
  year: number,
): IrmaaResult {
  const tier = findIrmaaTier(magi, filingStatus, year);
  const monthlySurcharge = tier ? tier.maxSurcharge : 0;
  const annualSurcharge = monthlySurcharge * 12;

  return {
    magi,
    filingStatus,
    year,
    tier,
    monthlySurcharge,
    annualSurcharge,
  };
}

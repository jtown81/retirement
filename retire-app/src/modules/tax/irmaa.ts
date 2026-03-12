/**
 * IRMAA (Income-Related Monthly Adjustment Amount) Surcharge Computation
 *
 * IRMAA surcharges apply to Medicare Part B (medical insurance) and Part D (prescription drug)
 * premiums when Modified Adjusted Gross Income (MAGI) exceeds threshold income levels.
 *
 * Source: 42 U.S.C. § 1395r(i); CMS Medicare Part B/D premium tables.
 *
 * ASSUMPTION: IRMAA technically uses MAGI from 2 years prior. This implementation uses
 * current-year MAGI for simplicity. Actual Medicare billing may differ by 2 years.
 *
 * ELIGIBILITY: Applied only to beneficiaries age 65+ (Medicare-eligible).
 */

import type { USD } from '../../models/common';
import type { FilingStatus } from '../../models/tax';
import { getIRMAATiers } from '../../data/irmaa-tiers';

/**
 * Computes the annual IRMAA surcharge (Part B + Part D combined).
 *
 * The surcharge is a function of MAGI and filing status:
 *   - If age < 65: returns 0 (not yet on Medicare)
 *   - If MAGI ≤ lower threshold: returns 0
 *   - If MAGI > threshold: applies tiered surcharges per CMS tables
 *
 * @param magi - Modified Adjusted Gross Income
 * @param year - Tax year (YYYY)
 * @param filingStatus - Filing status
 * @param age - Age of primary taxpayer (must be 65+ for IRMAA to apply)
 * @returns Annual IRMAA surcharge in dollars (Part B + Part D × 12 months)
 */
export function computeIRMAASurcharge(
  magi: USD,
  year: number,
  filingStatus: FilingStatus,
  age: number
): USD {
  // IRMAA applies only to Medicare beneficiaries age 65+
  if (age < 65) {
    return 0;
  }

  const tierTable = getIRMAATiers(year, filingStatus);

  // Find the applicable tier: first tier where MAGI is ≤ threshold
  let partBMonthly = 0;
  let partDMonthly = 0;

  for (const tier of tierTable.tiers) {
    if (magi <= tier.incomeThreshold) {
      partBMonthly = tier.partBMonthly;
      partDMonthly = tier.partDMonthly;
      break;
    }
  }

  // Annual surcharge (monthly × 12 months)
  return (partBMonthly + partDMonthly) * 12;
}

/**
 * Helper function to look up the IRMAA tier for a given MAGI.
 * Useful for displaying which tier a retiree falls into.
 *
 * @param magi - Modified Adjusted Gross Income
 * @param year - Tax year (YYYY)
 * @param filingStatus - Filing status
 * @returns Tier index (0 = no surcharge, 1 = lowest surcharge, ..., 5 = highest)
 */
export function getIRMAATier(
  magi: USD,
  year: number,
  filingStatus: FilingStatus
): number {
  const tierTable = getIRMAATiers(year, filingStatus);

  for (let i = 0; i < tierTable.tiers.length; i++) {
    if (magi <= tierTable.tiers[i]!.incomeThreshold) {
      return i;
    }
  }

  return tierTable.tiers.length - 1;
}

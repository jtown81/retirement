/**
 * GS Base Pay Tables
 *
 * Authoritative annual base salaries (before locality) by grade and step.
 * Source: OPM General Schedule Pay Scale — published annually in December.
 * Classification: Hard regulatory requirement.
 *
 * IMPORTANT: These tables must be updated each January when OPM publishes
 * the new pay schedule. See docs/regulatory-mapping.md for the update process.
 *
 * Update checklist:
 *   1. Download new table from https://www.opm.gov/policy-data-oversight/pay-leave/salaries-wages/
 *   2. Add a new year constant (GS_BASE_<YEAR>) below
 *   3. Add the year → table entry to GS_PAY_TABLES
 *   4. Update PAY_SCALE_FACTORS with the year's base pay adjustment percentage
 *   5. Run `pnpm test` — all grade-step tests must pass
 */

/** Annual base salary by [grade][step]. Grade: 1–15, Step: 1–10. */
type GradeStepTable = Record<number, Record<number, number>>;

/**
 * 2024 GS Annual Base Pay Schedule
 * Effective: January 2024
 * Source: OPM GS Pay Schedule FY 2024
 */
const GS_BASE_2024: GradeStepTable = {
   1: { 1: 21621, 2: 22344, 3: 23063, 4: 23782, 5: 24501, 6: 24930, 7: 25644, 8: 26359, 9: 26387, 10: 27055 },
   2: { 1: 24304, 2: 24876, 3: 25678, 4: 25678, 5: 26079, 6: 26922, 7: 27765, 8: 28608, 9: 29451, 10: 30294 },
   3: { 1: 26505, 2: 27389, 3: 28273, 4: 29157, 5: 30041, 6: 30925, 7: 31809, 8: 32693, 9: 33577, 10: 34461 },
   4: { 1: 29764, 2: 30757, 3: 31750, 4: 32743, 5: 33736, 6: 34729, 7: 35722, 8: 36715, 9: 37708, 10: 38701 },
   5: { 1: 33255, 2: 34397, 3: 35539, 4: 36681, 5: 37823, 6: 38965, 7: 40107, 8: 41249, 9: 42391, 10: 43533 },
   6: { 1: 37024, 2: 38291, 3: 39558, 4: 40825, 5: 42092, 6: 43359, 7: 44626, 8: 45893, 9: 47160, 10: 48427 },
   7: { 1: 41148, 2: 42553, 3: 43958, 4: 45363, 5: 46768, 6: 48173, 7: 49578, 8: 50983, 9: 52388, 10: 53793 },
   8: { 1: 45539, 2: 47090, 3: 48641, 4: 50192, 5: 51743, 6: 53294, 7: 54845, 8: 56396, 9: 57947, 10: 59498 },
   9: { 1: 50246, 2: 51921, 3: 53596, 4: 55271, 5: 56946, 6: 58621, 7: 60296, 8: 61971, 9: 63646, 10: 65321 },
  10: { 1: 55328, 2: 57173, 3: 59018, 4: 60863, 5: 62708, 6: 64553, 7: 66398, 8: 68243, 9: 70088, 10: 71933 },
  11: { 1: 60717, 2: 62741, 3: 64765, 4: 66789, 5: 68813, 6: 70837, 7: 72861, 8: 74885, 9: 76909, 10: 78933 },
  12: { 1: 72750, 2: 75175, 3: 77600, 4: 80025, 5: 82450, 6: 84875, 7: 87300, 8: 89725, 9: 92150, 10: 94575 },
  13: { 1: 86468, 2: 89384, 3: 92300, 4: 95216, 5: 98132, 6: 101048, 7: 103964, 8: 106880, 9: 109796, 10: 112712 },
  14: { 1: 102141, 2: 105612, 3: 109083, 4: 112554, 5: 116025, 6: 119496, 7: 122967, 8: 126438, 9: 129909, 10: 133380 },
  15: { 1: 120148, 2: 124153, 3: 128158, 4: 132163, 5: 136168, 6: 140173, 7: 144178, 8: 148183, 9: 152188, 10: 156193 },
};

/**
 * All hardcoded pay tables by year.
 * The earliest entry is the BASE_TABLE_YEAR used for projections.
 */
const GS_PAY_TABLES: Record<number, GradeStepTable> = {
  2024: GS_BASE_2024,
};

/** The anchor year for pay projections. */
export const BASE_TABLE_YEAR = 2024;

/**
 * Known annual base-pay scale adjustment factors.
 * Key: year; Value: cumulative factor relative to BASE_TABLE_YEAR.
 *
 * Source: Executive Orders on Federal Pay Adjustment.
 * ASSUMPTION: Entries beyond last known year use assumedAnnualIncrease.
 */
const PAY_SCALE_FACTORS: Record<number, number> = {
  2024: 1.0000,
  2025: 1.0177,  // ~1.77% base pay increase (2025 EO)
};

/**
 * Returns the GS annual base salary for a given grade, step, and pay year.
 *
 * For years with a hardcoded table the lookup is exact. For other years,
 * the function scales the nearest prior table using known adjustment factors
 * plus an assumed annual rate for any remaining gap.
 *
 * @param grade                    GS grade (1–15)
 * @param step                     GS step (1–10)
 * @param payYear                  Calendar year of the pay period
 * @param assumedAnnualIncrease    Rate used to project beyond last known factor
 *                                 (default 0.02 = 2%). ASSUMPTION — user-configurable.
 * @throws RangeError if grade or step is out of bounds
 */
export function getGSBasePay(
  grade: number,
  step: number,
  payYear: number,
  assumedAnnualIncrease = 0.02,
): number {
  // Exact table match
  const exactTable = GS_PAY_TABLES[payYear];
  if (exactTable) {
    const salary = exactTable[grade]?.[step];
    if (salary === undefined) {
      throw new RangeError(`No GS pay data for grade ${grade}, step ${step}`);
    }
    return salary;
  }

  // Base salary from the 2024 anchor table
  const baseSalary = GS_BASE_2024[grade]?.[step];
  if (baseSalary === undefined) {
    throw new RangeError(`No GS pay data for grade ${grade}, step ${step}`);
  }

  // Determine cumulative factor up to payYear
  const sortedKnownYears = Object.keys(PAY_SCALE_FACTORS)
    .map(Number)
    .sort((a, b) => a - b);

  const closestPriorYear = sortedKnownYears.filter(y => y <= payYear).pop() ?? BASE_TABLE_YEAR;
  const knownFactor = PAY_SCALE_FACTORS[closestPriorYear] ?? 1.0;
  const yearsProjected = payYear - closestPriorYear;
  const totalFactor = knownFactor * Math.pow(1 + assumedAnnualIncrease, yearsProjected);

  return Math.round(baseSalary * totalFactor);
}

/**
 * Military Service Buyback
 * Formulas: military/buyback-deposit, military/service-credit
 *
 * Overview:
 *   Federal employees with prior military service can "buy back" that service to
 *   credit it toward their FERS retirement computation.
 *
 * Deposit calculation:
 *   - 3% of military basic pay for each year of service
 *   - Plus OPM interest if not paid promptly (accrues from the employee's FERS
 *     coverage date or 2 years after separation, whichever is later)
 *
 * Eligibility:
 *   - Employee must waive military retirement pay if they are receiving it.
 *   - If military retirement pay is NOT being received, waiver is not required.
 *
 * Source: OPM FERS Handbook, Ch. 23; 5 U.S.C. § 8411(b); 5 CFR § 842.304
 */

import { getOPMInterestRate } from '../../data/opm-interest-rates';

export interface BuybackDepositResult {
  /** Sum of 3% of basic pay for each year of military service */
  principalDeposit: number;
  /** Accrued interest on outstanding principal */
  interestAccrued: number;
  /** Total amount owed (principal + interest) */
  totalDeposit: number;
}

/**
 * Computes the military service deposit (principal + interest).
 *
 * Formula ID: military/buyback-deposit
 *
 * Interest accrues annually on the outstanding principal balance.
 * The interest start year is the year of FERS coverage (typically hire date year + 1)
 * or 2 years after military separation, whichever is later.
 *
 * ASSUMPTION: If interestStartYear is not provided, no interest is applied
 * (i.e., deposit is paid promptly within the grace period).
 *
 * @param militaryBasicPayByYear - Record of { year: basicPay } for each service year
 * @param depositYear - Calendar year the deposit is being paid
 * @param interestStartYear - Year interest began accruing (undefined = no interest)
 * @returns Principal, interest, and total deposit amounts
 */
export function computeBuybackDeposit(
  militaryBasicPayByYear: Record<number, number>,
  depositYear: number,
  interestStartYear?: number,
): BuybackDepositResult {
  const years = Object.keys(militaryBasicPayByYear).map(Number);
  if (years.length === 0) {
    return { principalDeposit: 0, interestAccrued: 0, totalDeposit: 0 };
  }

  // Principal: 3% of each year's military basic pay
  const principal = years.reduce((sum, yr) => {
    const pay = militaryBasicPayByYear[yr];
    if (pay < 0) throw new RangeError(`Basic pay for year ${yr} must be >= 0`);
    return sum + pay * 0.03;
  }, 0);

  if (!interestStartYear || depositYear <= interestStartYear) {
    return { principalDeposit: principal, interestAccrued: 0, totalDeposit: principal };
  }

  // Interest compounds annually on the outstanding principal
  let balance = principal;
  for (let yr = interestStartYear; yr < depositYear; yr++) {
    const rate = getOPMInterestRate(yr);
    balance = balance * (1 + rate);
  }

  const interest = balance - principal;
  return {
    principalDeposit: principal,
    interestAccrued: interest,
    totalDeposit: balance,
  };
}

/**
 * Applies military service credit to civilian service years.
 *
 * Formula ID: military/service-credit
 *
 * Military service years are added to civilian creditable service only when:
 *   1. The buyback deposit has been completed (fully paid), AND
 *   2. The employee has waived military retirement pay (if applicable).
 *
 * @param civilianServiceYears - Current FERS creditable civilian service years
 * @param militaryServiceYears - Years of creditable military service
 * @param buybackCompleted - True if the full deposit has been paid
 * @param militaryRetirementPayReceived - True if employee is receiving military retirement
 * @param militaryRetirementWaived - True if employee has formally waived military retirement pay
 * @returns Total creditable service years (civilian + military if eligible)
 */
export function applyMilitaryServiceCredit(
  civilianServiceYears: number,
  militaryServiceYears: number,
  buybackCompleted: boolean,
  militaryRetirementPayReceived = false,
  militaryRetirementWaived = false,
): number {
  if (civilianServiceYears < 0) throw new RangeError('civilianServiceYears must be >= 0');
  if (militaryServiceYears < 0) throw new RangeError('militaryServiceYears must be >= 0');

  // If receiving military retirement, waiver is required before credit can be applied.
  if (militaryRetirementPayReceived && !militaryRetirementWaived) {
    // Regulatory block — cannot combine military retirement pay + buyback service credit.
    return civilianServiceYears;
  }

  if (!buybackCompleted) {
    return civilianServiceYears;
  }

  return civilianServiceYears + militaryServiceYears;
}

/**
 * Computes the number of military service years from a basic-pay-by-year record.
 * Fractional years are NOT supported — each entry represents one full year.
 *
 * @param militaryBasicPayByYear - Record of { year: basicPay }
 * @returns Number of creditable military service years (integer count of entries)
 */
export function militaryServiceYearsFromRecord(
  militaryBasicPayByYear: Record<number, number>,
): number {
  return Object.keys(militaryBasicPayByYear).length;
}

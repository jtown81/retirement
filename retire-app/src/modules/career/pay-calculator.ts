/**
 * Pay Calculator
 * Formula: career/pay-calculator, career/leo-availability-pay
 *
 * Computes annual total pay for GS, LEO, and Title 38 employees.
 *
 * GS:      basePay + localityAdjustment
 * LEO:     (basePay × 1.25) × (1 + localityRate)  [availability pay + locality]
 * Title38: uses annualSalary from the career event (VA-set rate, not GS table)
 *
 * Sources:
 *   - GS: OPM GS Pay Schedule; 5 U.S.C. § 5332
 *   - Locality: OPM Locality Pay Schedule; 5 U.S.C. § 5304
 *   - LEO Availability Pay: 5 U.S.C. § 5545a
 *   - Title 38: 38 U.S.C. §§ 7431–7432 (VA-administered pay)
 */

import type { PaySystem } from '../../models/common';
import { registerFormula } from '../../registry/index';
import { gradeStepToSalary } from './grade-step';
import { getLocalityRate, applyLocality } from './locality';

// ---------------------------------------------------------------------------
// Formula registry
// ---------------------------------------------------------------------------

registerFormula({
  id: 'career/pay-calculator',
  name: 'Annual Pay Calculator (GS/LEO/Title 38)',
  module: 'career',
  purpose: 'Computes total annual compensation including base pay, locality, and any applicable special pay supplements.',
  sourceRef: '5 U.S.C. § 5332 (GS base); 5 U.S.C. § 5304 (locality); 5 U.S.C. § 5545a (LEO); 38 U.S.C. §§ 7431–7432 (Title 38)',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Phase 3 implementation' }],
});

registerFormula({
  id: 'career/leo-availability-pay',
  name: 'LEO Law Enforcement Availability Pay (LEAP)',
  module: 'career',
  purpose: 'Adds 25% of basic pay as LEAP to qualifying law enforcement officers before locality is applied.',
  sourceRef: '5 U.S.C. § 5545a(b)',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Phase 3 implementation' }],
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * LEO availability pay supplement rate.
 * Source: 5 U.S.C. § 5545a(b).
 * Classification: Hard regulatory requirement.
 */
export const LEO_AVAILABILITY_PAY_RATE = 0.25;

// ---------------------------------------------------------------------------
// Core calculator
// ---------------------------------------------------------------------------

export interface AnnualPayResult {
  baseSalary: number;        // GS table value before any supplement
  leapSupplement: number;    // LEO availability pay (0 for non-LEO)
  adjustedBase: number;      // baseSalary + leapSupplement
  localityRate: number;      // decimal, e.g. 0.3326
  localityAmount: number;    // dollar amount of locality adjustment
  totalAnnualPay: number;    // final annual pay
  paySystem: PaySystem;
}

/**
 * Computes total annual pay for a federal employee.
 *
 * For Title 38 positions the pay schedule is set by the VA Administrator
 * (not the GS table). Pass the known annual salary via `title38Salary`
 * and locality will be applied to it.
 *
 * @param grade               GS grade (1–15)
 * @param step                GS step (1–10)
 * @param localityCode        OPM locality area code
 * @param payYear             Calendar year
 * @param paySystem           'GS' | 'LEO' | 'Title38'
 * @param title38Salary       Required when paySystem is 'Title38'
 * @param assumedPayIncrease  Annual pay scale assumption for projected years
 */
export function calculateAnnualPay(
  grade: number,
  step: number,
  localityCode: string,
  payYear: number,
  paySystem: PaySystem = 'GS',
  title38Salary?: number,
  assumedPayIncrease = 0.02,
): AnnualPayResult {
  const localityRate = getLocalityRate(localityCode, payYear);

  if (paySystem === 'Title38') {
    if (title38Salary === undefined) {
      throw new Error(
        'calculateAnnualPay: title38Salary is required for Title38 pay system. ' +
        'VA-administered pay rates are set by the facility, not the GS table.',
      );
    }
    // Title 38 salaries already incorporate any applicable supplements;
    // locality is applied to the VA-set base rate.
    const localityAmount = title38Salary * localityRate;
    return {
      baseSalary: title38Salary,
      leapSupplement: 0,
      adjustedBase: title38Salary,
      localityRate,
      localityAmount,
      totalAnnualPay: Math.round(applyLocality(title38Salary, localityRate)),
      paySystem,
    };
  }

  const baseSalary = gradeStepToSalary(grade, step, payYear, assumedPayIncrease);

  if (paySystem === 'LEO') {
    // LEAP is 25% of basic pay; locality then applies to (basic + LEAP).
    // Source: 5 U.S.C. § 5545a; 5 CFR § 531.603(d).
    const leapSupplement = Math.round(baseSalary * LEO_AVAILABILITY_PAY_RATE);
    const adjustedBase = baseSalary + leapSupplement;
    const localityAmount = Math.round(adjustedBase * localityRate);
    return {
      baseSalary,
      leapSupplement,
      adjustedBase,
      localityRate,
      localityAmount,
      totalAnnualPay: adjustedBase + localityAmount,
      paySystem,
    };
  }

  // Standard GS
  const localityAmount = Math.round(baseSalary * localityRate);
  return {
    baseSalary,
    leapSupplement: 0,
    adjustedBase: baseSalary,
    localityRate,
    localityAmount,
    totalAnnualPay: baseSalary + localityAmount,
    paySystem,
  };
}

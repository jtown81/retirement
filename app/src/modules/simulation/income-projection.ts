/**
 * Retirement Income Projection
 * Formula: simulation/income-projection
 *
 * Projects total annual retirement income vs expenses over the retirement horizon.
 *
 * Income sources per year:
 *   1. FERS basic annuity (grows by COLA each year)
 *   2. FERS Supplement (until age 62)
 *   3. TSP withdrawal (initial = tspBalance × withdrawalRate; grows by COLA)
 *
 * Expense sources per year:
 *   - Base expenses from profile, adjusted by smile curve and inflation
 *
 * Calculation order (per architecture contract):
 *   1. career  → High-3 and salary history
 *   2. leave   → sick leave service credit
 *   3. military → total creditable service
 *   4. tsp     → projected balance at retirement
 *   5. expenses → spending profile
 *   6. simulation → annuity + supplement + projection
 *
 * Source: OPM FERS Handbook; docs/architecture.md
 */

import type { SimulationInput, SimulationResult, AnnualProjection } from '../../models/simulation';
import { checkFERSEligibility } from './eligibility';
import { computeFERSAnnuity, computeFERSSupplement, computeHigh3 } from './annuity';
import { totalAnnualExpenses } from '../expenses/categories';
import { applySmileCurve, defaultSmileCurveParams } from '../expenses/smile-curve';
import { adjustForInflation } from '../expenses/inflation';
import { computeLeaveRetirementCredit } from '../leave/retirement-credit';
import { applyMilitaryServiceCredit } from '../military/buyback';

/** Default TSP withdrawal rate (4% of balance at retirement). */
const DEFAULT_TSP_WITHDRAWAL_RATE = 0.04;

/**
 * Computes employee's age (in decimal years) at a given date, given their birth date.
 */
function ageAt(birthDate: string, atDate: string): number {
  const birth = new Date(birthDate);
  const at = new Date(atDate);
  const diffMs = at.getTime() - birth.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Projects total annual retirement income, expenses, and net surplus.
 *
 * Formula ID: simulation/income-projection
 *
 * @param input - Full simulation input (career, leave, TSP, expenses, assumptions)
 * @returns Complete simulation result with per-year projections
 */
export function projectRetirementIncome(input: SimulationInput): SimulationResult {
  const { profile, assumptions } = input;
  const {
    proposedRetirementDate,
    tspGrowthRate,
    colaRate,
    retirementHorizonYears,
    tspWithdrawalRate = DEFAULT_TSP_WITHDRAWAL_RATE,
    estimatedSSMonthlyAt62 = 0,
  } = assumptions;

  // ── Step 1: career — High-3 and creditable service ──────────────────────────
  const salaryHistory: Array<{ year: number; annualSalary: number }> = profile.career.events
    .filter((e) => e.type !== 'separation')
    .map((e) => ({ year: new Date(e.effectiveDate).getFullYear(), annualSalary: e.annualSalary }));

  const high3Salary = computeHigh3(salaryHistory);

  // ── Step 2: leave — sick leave service credit ────────────────────────────────
  const sickLeaveHours = profile.leaveBalance.sickLeaveHours;
  // Derive hire date from the SCD for retirement (most accurate service start date)
  const hireDate = profile.career.scdRetirement;
  const retirementDate = proposedRetirementDate;
  const civilianYears =
    (new Date(retirementDate).getTime() - new Date(hireDate).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  const serviceWithSickLeave = computeLeaveRetirementCredit(sickLeaveHours, civilianYears);

  // ── Step 3: military — total creditable service ──────────────────────────────
  const militaryServices = profile.militaryService ?? [];
  const totalMilitaryYears = militaryServices.reduce((sum, m) => {
    const start = new Date(m.startDate).getFullYear();
    const end = new Date(m.endDate).getFullYear();
    return sum + (end - start);
  }, 0);
  const totalMilitaryBuybackCompleted = militaryServices.every(
    (m) => m.buybackDepositPaid > 0,
  );
  const totalCreditableService = applyMilitaryServiceCredit(
    serviceWithSickLeave,
    totalMilitaryYears,
    totalMilitaryBuybackCompleted,
    militaryServices.some((m) => !m.militaryRetirementWaived),
    militaryServices.every((m) => m.militaryRetirementWaived),
  );

  // ── Step 4: eligibility ──────────────────────────────────────────────────────
  const birthDate = profile.birthDate;
  const birthYear = new Date(birthDate).getFullYear();
  const ageAtRetirement = ageAt(birthDate, retirementDate);
  const eligibility = checkFERSEligibility(ageAtRetirement, totalCreditableService, birthYear);

  if (!eligibility.eligible) {
    return {
      inputSummary: input,
      high3Salary,
      creditableServiceYears: totalCreditableService,
      annualAnnuity: 0,
      fersSupplementEligible: false,
      projections: [],
      eligibility: { eligible: false, type: null },
    };
  }

  // ── Step 5: annuity ──────────────────────────────────────────────────────────
  const annuityResult = computeFERSAnnuity(
    high3Salary,
    totalCreditableService,
    ageAtRetirement,
    eligibility.type,
  );
  const baseAnnuity = annuityResult.netAnnualAnnuity;

  // ── Step 6: FERS Supplement ──────────────────────────────────────────────────
  const supplementResult = computeFERSSupplement(
    ageAtRetirement,
    eligibility.type,
    civilianYears,
    estimatedSSMonthlyAt62,
  );

  // ── Step 7: TSP balance at retirement ────────────────────────────────────────
  const tspBalance = profile.tspBalances.traditionalBalance + profile.tspBalances.rothBalance;
  // No further contributions post-retirement; balance continues to grow while withdrawals occur
  // Initial withdrawal = balance × withdrawalRate
  const initialTSPWithdrawal = tspBalance * tspWithdrawalRate;

  // ── Step 8: expense base ─────────────────────────────────────────────────────
  const baseExpenses = totalAnnualExpenses(profile.expenses);
  const smileParams = profile.expenses.smileCurveEnabled
    ? (profile.expenses.smileCurveParams ?? defaultSmileCurveParams)
    : null;

  // ── Step 9: year-by-year projection ─────────────────────────────────────────
  const projections: AnnualProjection[] = [];
  let currentTSPBalance = tspBalance;

  for (let yr = 0; yr < retirementHorizonYears; yr++) {
    const calendarYear = new Date(retirementDate).getFullYear() + yr;
    const ageThisYear = ageAtRetirement + yr;

    // Annuity grows by COLA each year
    const annuity = baseAnnuity * Math.pow(1 + colaRate, yr);

    // FERS Supplement ends at age 62
    const fersSupplementAmount =
      supplementResult.eligible && ageThisYear < 62
        ? supplementResult.annualAmount * Math.pow(1 + colaRate, yr)
        : 0;

    // TSP: withdraw first, then grow remaining balance (standard drawdown convention)
    const tspWithdrawal = initialTSPWithdrawal * Math.pow(1 + colaRate, yr);
    currentTSPBalance = Math.max(0, currentTSPBalance - tspWithdrawal);
    currentTSPBalance = currentTSPBalance * (1 + tspGrowthRate);

    const totalIncome = annuity + fersSupplementAmount + tspWithdrawal;

    // Expenses: smile curve (if enabled) + inflation
    const smileAdjusted = smileParams
      ? applySmileCurve(baseExpenses, yr, smileParams)
      : baseExpenses;
    const totalExpenses = adjustForInflation(
      smileAdjusted,
      yr,
      profile.expenses.inflationRate,
    );

    projections.push({
      year: calendarYear,
      age: Math.round(ageThisYear * 10) / 10,
      annuity,
      fersSupplementAmount,
      tspWithdrawal,
      totalIncome,
      totalExpenses,
      surplus: totalIncome - totalExpenses,
    });
  }

  return {
    inputSummary: input,
    high3Salary,
    creditableServiceYears: totalCreditableService,
    annualAnnuity: baseAnnuity,
    fersSupplementEligible: supplementResult.eligible,
    projections,
    eligibility: { eligible: true, type: eligibility.type },
  };
}

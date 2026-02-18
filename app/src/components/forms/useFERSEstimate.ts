import { useMemo } from 'react';
import { checkFERSEligibility, getMRA, type EligibilityResult, type MRAResult } from '@modules/simulation/eligibility';
import { computeFERSAnnuity, computeFERSSupplement, type FERSAnnuityResult, type FERSSupplementResult } from '@modules/simulation/annuity';
import { sickLeaveToServiceCredit } from '@modules/leave/sick-leave';
import { computeTSPFutureValue, projectTSPDepletion, type TSPDepletionResult } from '@modules/tsp/future-value';
import { calculateAnnualPay } from '@modules/career/pay-calculator';

export interface FERSEstimateInput {
  birthDate: string;       // YYYY-MM-DD
  scdRetirement: string;   // YYYY-MM-DD
  retirementDate: string;  // YYYY-MM-DD
  gsGrade?: number;
  gsStep?: number;
  localityCode?: string;
  annualRaiseRate?: number;
  high3Override?: number;
  sickLeaveHours: number;
  annuityReductionPct: number;
  ssaBenefitAt62?: number;
  annualEarnings?: number;
  currentTspBalance: number;
  biweeklyTspContribution: number;
  tspGrowthRate: number;
  withdrawalRate: number;
  withdrawalStartAge: number;
  oneTimeWithdrawalAmount?: number;
  oneTimeWithdrawalAge?: number;
}

export interface FERSEstimateResult {
  // Service
  serviceYears: number;
  serviceMonths: number;
  sickLeaveCredit: number;
  totalCreditableService: number;
  annuityPct: number;
  // Eligibility
  eligibility: EligibilityResult;
  mra: MRAResult;
  // Annuity
  high3Salary: number;
  high3Source: 'computed' | 'override';
  computedHigh3: number;
  grossAnnuity: number;
  reductionAmount: number;
  netAnnuity: number;
  monthlyAnnuity: number;
  // Supplement
  supplementEligible: boolean;
  supplementMonthly: number;
  supplementAnnual: number;
  // TSP
  tspFutureValue: number;
  tspGrowthAmount: number;
  annualWithdrawal: number;
  depletionAge: number | null;
  balanceAt85: number;
  // Metadata
  ageAtRetirement: number;
  yearsToRetirement: number;
  canCompute: boolean;
}

function parseDate(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function yearsBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

export function useFERSEstimate(input: FERSEstimateInput): FERSEstimateResult | null {
  return useMemo(() => {
    const birthD = parseDate(input.birthDate);
    const scdD = parseDate(input.scdRetirement);
    const retD = parseDate(input.retirementDate);

    if (!birthD || !scdD || !retD) return null;
    if (retD <= scdD || retD <= birthD) return null;

    const ageAtRetirement = yearsBetween(birthD, retD);
    const civilianServiceYears = yearsBetween(scdD, retD);
    const yearsToRetirement = yearsBetween(new Date(), retD);

    if (civilianServiceYears < 0 || ageAtRetirement < 0) return null;

    const birthYear = birthD.getFullYear();

    // Service credit from sick leave
    const sickLeaveCredit = sickLeaveToServiceCredit(input.sickLeaveHours);

    const totalCreditableService = civilianServiceYears + sickLeaveCredit;

    // Eligibility
    const mra = getMRA(birthYear);
    const eligibility = checkFERSEligibility(ageAtRetirement, totalCreditableService, birthYear);

    // High-3: compute from grade/step/locality, with optional override
    const raiseRate = input.annualRaiseRate ?? 0;
    let computedHigh3 = 0;
    if (input.gsGrade && input.gsStep && input.localityCode) {
      const currentYear = new Date().getFullYear();
      const baseSalary = calculateAnnualPay(input.gsGrade, input.gsStep, input.localityCode, currentYear).totalAnnualPay;
      if (raiseRate > 0 && yearsToRetirement > 0) {
        // Project salary for the last 3 years before retirement using the raise rate
        const retYear = retD.getFullYear();
        const salaries = [retYear, retYear - 1, retYear - 2].map((y) => {
          const yearsFromNow = Math.max(0, y - currentYear);
          return baseSalary * Math.pow(1 + raiseRate, yearsFromNow);
        });
        computedHigh3 = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
      } else {
        computedHigh3 = baseSalary;
      }
    }
    const high3Source: 'computed' | 'override' = input.high3Override ? 'override' : 'computed';
    const high3Salary = input.high3Override ?? computedHigh3;

    // Annuity
    const annuityResult: FERSAnnuityResult = computeFERSAnnuity(
      high3Salary,
      totalCreditableService,
      ageAtRetirement,
      eligibility.type,
    );

    const annuityPct = annuityResult.multiplier * 100;

    // Apply user-specified survivor benefit reduction
    const survivorReduction = annuityResult.netAnnualAnnuity * input.annuityReductionPct;
    const netAnnuity = annuityResult.netAnnualAnnuity - survivorReduction;
    const monthlyAnnuity = netAnnuity / 12;

    // FERS Supplement
    const ssAt62 = input.ssaBenefitAt62 ?? 0;
    const supplementResult: FERSSupplementResult = computeFERSSupplement(
      ageAtRetirement,
      eligibility.type,
      civilianServiceYears,
      ssAt62,
    );

    // TSP Projection
    const monthlyContrib = (input.biweeklyTspContribution * 26) / 12;
    const yrsToRet = Math.max(0, yearsToRetirement);
    const tspFutureValue = computeTSPFutureValue(
      input.currentTspBalance,
      monthlyContrib,
      input.tspGrowthRate,
      yrsToRet,
    );
    const tspGrowthAmount = tspFutureValue - input.currentTspBalance;

    // TSP Depletion
    const annualWithdrawal = tspFutureValue * input.withdrawalRate;
    const retirementAge = Math.round(ageAtRetirement);
    const oneTime = input.oneTimeWithdrawalAmount && input.oneTimeWithdrawalAge
      ? { amount: input.oneTimeWithdrawalAmount, age: input.oneTimeWithdrawalAge }
      : undefined;

    const depletion: TSPDepletionResult = projectTSPDepletion(
      tspFutureValue,
      annualWithdrawal,
      input.tspGrowthRate,
      retirementAge,
      oneTime,
      birthYear,
    );

    const serviceYears = Math.floor(civilianServiceYears);
    const serviceMonths = Math.round((civilianServiceYears - serviceYears) * 12);

    return {
      serviceYears,
      serviceMonths,
      sickLeaveCredit,
      totalCreditableService,
      annuityPct,
      eligibility,
      mra,
      high3Salary,
      high3Source,
      computedHigh3,
      grossAnnuity: annuityResult.grossAnnualAnnuity,
      reductionAmount: survivorReduction + (annuityResult.grossAnnualAnnuity - annuityResult.netAnnualAnnuity),
      netAnnuity,
      monthlyAnnuity,
      supplementEligible: supplementResult.eligible,
      supplementMonthly: supplementResult.annualAmount / 12,
      supplementAnnual: supplementResult.annualAmount,
      tspFutureValue,
      tspGrowthAmount,
      annualWithdrawal,
      depletionAge: depletion.depletionAge,
      balanceAt85: depletion.balanceAt85,
      ageAtRetirement,
      yearsToRetirement: yrsToRet,
      canCompute: high3Salary > 0,
    };
  }, [
    input.birthDate,
    input.scdRetirement,
    input.retirementDate,
    input.gsGrade,
    input.gsStep,
    input.localityCode,
    input.annualRaiseRate,
    input.high3Override,
    input.sickLeaveHours,
    input.annuityReductionPct,
    input.ssaBenefitAt62,
    input.annualEarnings,
    input.currentTspBalance,
    input.biweeklyTspContribution,
    input.tspGrowthRate,
    input.withdrawalRate,
    input.withdrawalStartAge,
    input.oneTimeWithdrawalAmount,
    input.oneTimeWithdrawalAge,
  ]);
}

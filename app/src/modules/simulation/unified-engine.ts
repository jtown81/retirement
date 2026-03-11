/**
 * Unified Retirement Simulation Engine
 *
 * Canonical single-source-of-truth for all retirement projections.
 * Merges income-projection.ts (simple) and retirement-simulation.ts (complex)
 * into a unified engine that handles both use cases.
 *
 * Features (all optional via config):
 *   - FERS annuity + supplement
 *   - Social Security (optional: config.ssClaimingAge)
 *   - Dual-pot TSP with high/low risk allocation (if tspBalanceAtRetirement > 0)
 *   - RMD enforcement on Traditional TSP (if birthYear specified)
 *   - Federal income tax (if config.filingStatus specified)
 *   - Dual inflation rates (healthcare + general)
 *   - Expense smile curve (GoGo/GoSlow/NoGo)
 *
 * Input: SimulationConfig (comprehensive configuration)
 * Output: FullSimulationResult (all projection years with full details)
 *
 * Source: OPM FERS Handbook, IRC §§ 401-402, IRS Pub 590-B, 42 U.S.C. § 1395r
 */

import type { SimulationConfig, SimulationYearResult, FullSimulationResult } from '../../models/simulation';
import { computeRMD, isRMDRequired } from '../tsp/rmd';
import { fersCOLARate, getFullRetirementAge, ssAdjustmentFactor } from './eligibility';
import { computeAnnualTax } from '../tax';

/**
 * Computes the expense smile curve multiplier for GoGo/GoSlow/NoGo phases.
 * Linear interpolation within each phase for smooth transitions.
 */
function smileMultiplier(age: number, config: SimulationConfig): number {
  if (age < config.goGoEndAge) return config.goGoRate;
  if (age < config.goSlowEndAge) return config.goSlowRate;
  return config.noGoRate;
}

/**
 * Unified retirement simulation engine.
 *
 * Comprehensive year-by-year projection supporting simple and complex scenarios.
 *
 * Processing order per year:
 *   1. Compute income (annuity, supplement, SS)
 *   1.5. Compute tax (if filing status configured)
 *   2. Compute expenses (smile curve × inflation)
 *   3. Determine TSP withdrawal needed
 *   4. Enforce RMD on Traditional (if applicable)
 *   5. Withdraw from TSP (low-risk pot first)
 *   6. Grow balances by ROI
 *   7. Rebalance high→low to maintain time-step buffer
 *   8. Record year results
 *
 * @param config - SimulationConfig with all parameters
 * @returns FullSimulationResult with year-by-year projections
 */
export function unifiedRetirementSimulation(config: SimulationConfig): FullSimulationResult {
  const years: SimulationYearResult[] = [];
  const startYear = new Date().getFullYear();

  // ── Validate config ──────────────────────────────────────────────────────
  if (config.retirementAge > config.endAge) {
    return {
      config,
      years: [],
      depletionAge: null,
      balanceAt85: 0,
      totalLifetimeIncome: 0,
      totalLifetimeExpenses: 0,
    };
  }

  // ── Apply FERS COLA cap ──────────────────────────────────────────────────
  const actualFERSCOLA = fersCOLARate(config.colaRate);

  // ── Compute Social Security adjustment factor ───────────────────────────
  const ssAdjustment = ssAdjustmentFactor(config.ssClaimingAge, config.birthYear);
  const adjustedSSMonthly = config.ssMonthlyAt62 * ssAdjustment;

  // ── Initialize TSP balances ──────────────────────────────────────────────
  const totalTSP = config.tspBalanceAtRetirement;
  let traditionalBalance = totalTSP * config.traditionalPct;
  let rothBalance = totalTSP * (1 - config.traditionalPct);

  // Split each into high-risk / low-risk
  let highRiskTrad = traditionalBalance * config.highRiskPct;
  let lowRiskTrad = traditionalBalance * (1 - config.highRiskPct);
  let highRiskRoth = rothBalance * config.highRiskPct;
  let lowRiskRoth = rothBalance * (1 - config.highRiskPct);

  // Base annual withdrawal from initial balance
  const baseAnnualWithdrawal = totalTSP * config.withdrawalRate;

  let depletionAge: number | null = null;
  let balanceAt85 = 0;
  let totalLifetimeIncome = 0;
  let totalLifetimeExpenses = 0;

  const numYears = config.endAge - config.retirementAge + 1;

  for (let yr = 0; yr < numYears; yr++) {
    const age = config.retirementAge + yr;
    const calendarYear = startYear + yr;

    // ── 1. Income ────────────────────────────────────────────────────────
    const annuity = config.fersAnnuity * Math.pow(1 + actualFERSCOLA, yr);
    const fersSupplement = age < 62 ? config.fersSupplement * Math.pow(1 + actualFERSCOLA, yr) : 0;

    // Social Security: begins at ssClaimingAge, grows by COLA from claiming year
    const socialSecurity =
      age >= config.ssClaimingAge
        ? adjustedSSMonthly * 12 * Math.pow(1 + actualFERSCOLA, Math.max(0, yr - (config.ssClaimingAge - config.retirementAge)))
        : 0;

    const otherIncome = annuity + fersSupplement + socialSecurity;

    // ── 2. Expenses ──────────────────────────────────────────────────────
    const smile = smileMultiplier(age, config);
    const hcExpenses = config.healthcareAnnualExpenses ?? 0;
    const nonHcExpenses = config.baseAnnualExpenses - hcExpenses;
    const hcInflation = config.healthcareInflationRate ?? config.inflationRate;
    const totalExpenses =
      (nonHcExpenses * Math.pow(1 + config.inflationRate, yr) +
       hcExpenses * Math.pow(1 + hcInflation, yr)) * smile;

    // ── 3. TSP withdrawal needed ─────────────────────────────────────────
    const plannedWithdrawal = baseAnnualWithdrawal * Math.pow(1 + actualFERSCOLA, yr);

    // Current total balances
    traditionalBalance = highRiskTrad + lowRiskTrad;
    rothBalance = highRiskRoth + lowRiskRoth;
    const totalBalance = traditionalBalance + rothBalance;

    // ── 4. RMD enforcement ───────────────────────────────────────────────
    const rmdRequired = computeRMD(traditionalBalance, age);
    // Actual Traditional withdrawal must be at least the RMD
    const tradWithdrawalNeeded = Math.max(
      totalBalance > 0 ? plannedWithdrawal * (traditionalBalance / totalBalance) : 0,
      rmdRequired,
    );
    // Remaining from Roth
    const rothWithdrawalNeeded = Math.max(0, plannedWithdrawal - tradWithdrawalNeeded);

    // Actual withdrawals capped to available balance
    const tradWithdrawal = Math.min(tradWithdrawalNeeded, traditionalBalance);
    const rothWithdrawal = Math.min(rothWithdrawalNeeded, rothBalance);
    const actualTSPWithdrawal = tradWithdrawal + rothWithdrawal;

    // ── 5. Withdraw from low-risk pots first ─────────────────────────────
    // Traditional withdrawal
    let tradRemaining = tradWithdrawal;
    const lowTradDraw = Math.min(tradRemaining, lowRiskTrad);
    lowRiskTrad -= lowTradDraw;
    tradRemaining -= lowTradDraw;
    highRiskTrad = Math.max(0, highRiskTrad - tradRemaining);

    // Roth withdrawal
    let rothRemaining = rothWithdrawal;
    const lowRothDraw = Math.min(rothRemaining, lowRiskRoth);
    lowRiskRoth -= lowRothDraw;
    rothRemaining -= lowRothDraw;
    highRiskRoth = Math.max(0, highRiskRoth - rothRemaining);

    // ── 6. Grow balances by ROI ──────────────────────────────────────────
    highRiskTrad *= 1 + config.highRiskROI;
    highRiskRoth *= 1 + config.highRiskROI;
    lowRiskTrad *= 1 + config.lowRiskROI;
    lowRiskRoth *= 1 + config.lowRiskROI;

    // ── 7. Rebalance: high → low to maintain time-step buffer ────────────
    const nextYearWithdrawal = baseAnnualWithdrawal * Math.pow(1 + actualFERSCOLA, yr + 1);
    const targetLowRisk = nextYearWithdrawal * config.timeStepYears;
    const currentLowRisk = lowRiskTrad + lowRiskRoth;
    const currentHighRisk = highRiskTrad + highRiskRoth;

    if (currentLowRisk < targetLowRisk && currentHighRisk > 0) {
      const deficit = Math.min(targetLowRisk - currentLowRisk, currentHighRisk);
      const highTotal = highRiskTrad + highRiskRoth;
      if (highTotal > 0) {
        const tradShare = highRiskTrad / highTotal;
        const tradTransfer = deficit * tradShare;
        const rothTransfer = deficit * (1 - tradShare);
        highRiskTrad -= tradTransfer;
        lowRiskTrad += tradTransfer;
        highRiskRoth -= rothTransfer;
        lowRiskRoth += rothTransfer;
      }
    }

    // ── 1.5. Tax Computation ────────────────────────────────────────────
    const taxResult = config.filingStatus
      ? computeAnnualTax({
          calendarYear,
          age,
          filingStatus: config.filingStatus,
          ordinaryIncome: annuity + fersSupplement + tradWithdrawal,
          rothIncome: rothWithdrawal,
          grossSocialSecurity: socialSecurity,
          useIRMAA: config.applyIRMAA ?? true,
        })
      : null;

    // ── 8. Record results ────────────────────────────────────────────────
    // Ensure no negative balances from floating point
    highRiskTrad = Math.max(0, highRiskTrad);
    highRiskRoth = Math.max(0, highRiskRoth);
    lowRiskTrad = Math.max(0, lowRiskTrad);
    lowRiskRoth = Math.max(0, lowRiskRoth);

    traditionalBalance = highRiskTrad + lowRiskTrad;
    rothBalance = highRiskRoth + lowRiskRoth;
    const endHighRisk = highRiskTrad + highRiskRoth;
    const endLowRisk = lowRiskTrad + lowRiskRoth;
    const endTotal = traditionalBalance + rothBalance;

    const totalTax = taxResult?.totalTax ?? 0;
    const afterTaxIncome = otherIncome + actualTSPWithdrawal - totalTax;
    totalLifetimeIncome += otherIncome + actualTSPWithdrawal;
    totalLifetimeExpenses += totalExpenses;

    if (endTotal <= 0 && depletionAge === null) {
      depletionAge = age;
    }
    if (age === 85) {
      balanceAt85 = endTotal;
    }

    years.push({
      year: calendarYear,
      age,
      annuity,
      fersSupplement,
      socialSecurity,
      tradTspWithdrawal: tradWithdrawal,
      rothTspWithdrawal: rothWithdrawal,
      tspWithdrawal: actualTSPWithdrawal,
      totalIncome: otherIncome + actualTSPWithdrawal,
      federalTax: taxResult?.federalTax,
      irmaaSurcharge: taxResult?.irmaaSurcharge,
      stateTax: taxResult?.stateTax,
      totalTax: taxResult?.totalTax,
      effectiveTaxRate: taxResult?.effectiveFederalRate,
      smileMultiplier: smile,
      totalExpenses,
      highRiskBalance: endHighRisk,
      lowRiskBalance: endLowRisk,
      traditionalBalance,
      rothBalance,
      totalTSPBalance: endTotal,
      rmdRequired,
      rmdSatisfied: isRMDRequired(age) ? tradWithdrawal >= rmdRequired : true,
      surplus: otherIncome + actualTSPWithdrawal - totalExpenses,
      afterTaxSurplus: afterTaxIncome - totalExpenses,
    });
  }

  // If retirement age > 85, use initial balance
  if (config.retirementAge > 85) {
    balanceAt85 = totalTSP;
  }

  return {
    config,
    years,
    depletionAge,
    balanceAt85,
    totalLifetimeIncome,
    totalLifetimeExpenses,
  };
}

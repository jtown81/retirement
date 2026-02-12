/**
 * Retirement Simulation Engine
 *
 * Year-by-year post-retirement projection with:
 *   - Dual-pot TSP (high-risk / low-risk) with separate ROIs
 *   - Traditional / Roth balance tracking through both pots
 *   - RMD compliance (SECURE 2.0: age 73+)
 *   - GoGo / GoSlow / NoGo expense smile curve
 *   - Time-step buffer rebalancing (1–3 years in low-risk pot)
 *   - FERS annuity + Supplement + Social Security income
 *   - COLA and inflation adjustments
 *
 * Source: Retire-original.xlsx "Retirement Assumptions" tab; OPM FERS Handbook;
 *         IRC § 401(a)(9); IRS Pub 590-B
 */

import type {
  SimulationConfig,
  SimulationYearResult,
  FullSimulationResult,
} from '../../models/simulation';
import { computeRMD, isRMDRequired } from '../tsp/rmd';

/**
 * Computes the expense smile curve multiplier for GoGo/GoSlow/NoGo phases.
 */
function smileMultiplier(age: number, config: SimulationConfig): number {
  if (age < config.goGoEndAge) return config.goGoRate;
  if (age < config.goSlowEndAge) return config.goSlowRate;
  return config.noGoRate;
}

/**
 * Runs the full post-retirement simulation.
 *
 * Processing order per year:
 *   1. Compute income (annuity, supplement, SS)
 *   2. Compute expenses (smile curve × inflation)
 *   3. Determine TSP withdrawal needed (expenses - other income)
 *   4. Enforce RMD on Traditional balance
 *   5. Withdraw from TSP (low-risk pot first)
 *   6. Grow balances by ROI
 *   7. Rebalance high→low to maintain time-step buffer
 *   8. Record year results
 */
export function projectRetirementSimulation(
  config: SimulationConfig,
): FullSimulationResult {
  const years: SimulationYearResult[] = [];
  const startYear = new Date().getFullYear(); // calendar year for year 0

  // Initial TSP split into Traditional / Roth
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

    // ── 1. Income ────────────────────────────────────────────────────
    const annuity = config.fersAnnuity * Math.pow(1 + config.colaRate, yr);
    const fersSupplement = age < 62
      ? config.fersSupplement * Math.pow(1 + config.colaRate, yr)
      : 0;
    const socialSecurity = age >= 62
      ? config.ssMonthlyAt62 * 12 * Math.pow(1 + config.colaRate, Math.max(0, yr - (62 - config.retirementAge)))
      : 0;

    const otherIncome = annuity + fersSupplement + socialSecurity;

    // ── 2. Expenses ──────────────────────────────────────────────────
    const smile = smileMultiplier(age, config);
    const hcExpenses = config.healthcareAnnualExpenses ?? 0;
    const nonHcExpenses = config.baseAnnualExpenses - hcExpenses;
    const hcInflation = config.healthcareInflationRate ?? config.inflationRate;
    const totalExpenses = (nonHcExpenses * Math.pow(1 + config.inflationRate, yr)
      + hcExpenses * Math.pow(1 + hcInflation, yr)) * smile;

    // ── 3. TSP withdrawal needed ─────────────────────────────────────
    // Annual withdrawal grows with COLA from base amount
    const plannedWithdrawal = baseAnnualWithdrawal * Math.pow(1 + config.colaRate, yr);

    // Current total balances
    traditionalBalance = highRiskTrad + lowRiskTrad;
    rothBalance = highRiskRoth + lowRiskRoth;
    const totalBalance = traditionalBalance + rothBalance;

    // ── 4. RMD enforcement ───────────────────────────────────────────
    const rmdRequired = computeRMD(traditionalBalance, age);
    // Actual Traditional withdrawal must be at least the RMD
    const tradWithdrawalNeeded = Math.max(
      // Proportional share of planned withdrawal from Traditional
      totalBalance > 0 ? plannedWithdrawal * (traditionalBalance / totalBalance) : 0,
      rmdRequired,
    );
    // Remaining from Roth
    const rothWithdrawalNeeded = Math.max(0, plannedWithdrawal - tradWithdrawalNeeded);

    // Actual withdrawals capped to available balance
    const tradWithdrawal = Math.min(tradWithdrawalNeeded, traditionalBalance);
    const rothWithdrawal = Math.min(rothWithdrawalNeeded, rothBalance);
    const actualTSPWithdrawal = tradWithdrawal + rothWithdrawal;

    // ── 5. Withdraw from low-risk pots first ─────────────────────────
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

    // ── 6. Grow balances by ROI ──────────────────────────────────────
    highRiskTrad *= (1 + config.highRiskROI);
    highRiskRoth *= (1 + config.highRiskROI);
    lowRiskTrad *= (1 + config.lowRiskROI);
    lowRiskRoth *= (1 + config.lowRiskROI);

    // ── 7. Rebalance: high → low to maintain time-step buffer ────────
    // Target low-risk balance = timeStepYears × next year's expected withdrawal
    const nextYearWithdrawal = baseAnnualWithdrawal * Math.pow(1 + config.colaRate, yr + 1);
    const targetLowRisk = nextYearWithdrawal * config.timeStepYears;
    const currentLowRisk = lowRiskTrad + lowRiskRoth;
    const currentHighRisk = highRiskTrad + highRiskRoth;

    if (currentLowRisk < targetLowRisk && currentHighRisk > 0) {
      const deficit = Math.min(targetLowRisk - currentLowRisk, currentHighRisk);
      // Transfer proportionally from high-risk Trad and Roth
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

    // ── 8. Record results ────────────────────────────────────────────
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

    const totalIncome = otherIncome + actualTSPWithdrawal;
    totalLifetimeIncome += totalIncome;
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
      tspWithdrawal: actualTSPWithdrawal,
      totalIncome,
      smileMultiplier: smile,
      totalExpenses,
      highRiskBalance: endHighRisk,
      lowRiskBalance: endLowRisk,
      traditionalBalance,
      rothBalance,
      totalTSPBalance: endTotal,
      rmdRequired,
      rmdSatisfied: isRMDRequired(age) ? tradWithdrawal >= rmdRequired : true,
      surplus: totalIncome - totalExpenses,
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

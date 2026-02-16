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
 *
 * NOTE: Two expense smile curve models exist in this codebase and serve different purposes:
 *
 * 1. **Blanchett linear interpolation** (modules/expenses/smile-curve.ts):
 *    - Smooth piecewise-linear curve through 3 anchor points (year 0 → midDip → 2×midDip)
 *    - Year-based progression through retirement
 *    - Used by income-projection.ts (simple retirement income path)
 *    - Research-based (Blanchett 2014)
 *
 * 2. **GoGo/GoSlow/NoGo step function** (this file):
 *    - Three age-based spending phases with discrete multipliers
 *    - Age-based transitions (defined by goGoEndAge, goSlowEndAge)
 *    - Used by retirement-simulation.ts (full dual-pot TSP simulation)
 *    - Simpler, more intuitive for user input (common in retirement planning)
 *
 * Both models are valid representations of retirement spending patterns. The choice of which
 * to use is intentional per calculation path:
 * - Simple path uses the academic Blanchett model (smooth, empirically grounded)
 * - Full simulation uses the practitioner GoGo/GoSlow/NoGo model (simple, user-configurable by age)
 *
 * Future enhancement: Allow user to choose between models, or unify if spreadsheet specifies one.
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
  const startYear = config.retirementYear; // calendar year for year 0

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

    // Social Security: claiming age from config (default 62, Phase D: 67 or 70)
    const ssClaimingAge = config.ssClaimingAge ?? 62;
    const socialSecurity = age >= ssClaimingAge
      ? config.ssMonthlyAt62 * 12 * Math.pow(1 + config.colaRate, Math.max(0, yr - (ssClaimingAge - config.retirementAge)))
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
    const rmdRequired = computeRMD(traditionalBalance, age, config.birthYear);

    // Determine Traditional/Roth withdrawal split based on strategy
    let tradWithdrawalNeeded: number;
    let rothWithdrawalNeeded: number;

    const strategy = config.withdrawalStrategy ?? 'proportional';

    if (strategy === 'traditional-first') {
      // Traditional first, then Roth
      tradWithdrawalNeeded = Math.min(plannedWithdrawal, traditionalBalance);
      rothWithdrawalNeeded = Math.max(0, plannedWithdrawal - tradWithdrawalNeeded);
    } else if (strategy === 'roth-first') {
      // Roth first, then Traditional
      rothWithdrawalNeeded = Math.min(plannedWithdrawal, rothBalance);
      tradWithdrawalNeeded = Math.max(0, plannedWithdrawal - rothWithdrawalNeeded);
    } else if (strategy === 'custom' && config.customWithdrawalSplit) {
      // Custom split percentage
      tradWithdrawalNeeded = plannedWithdrawal * config.customWithdrawalSplit.traditionalPct;
      rothWithdrawalNeeded = plannedWithdrawal * config.customWithdrawalSplit.rothPct;
    } else {
      // Default: proportional to balance ratio
      tradWithdrawalNeeded = totalBalance > 0 ? plannedWithdrawal * (traditionalBalance / totalBalance) : 0;
      rothWithdrawalNeeded = Math.max(0, plannedWithdrawal - tradWithdrawalNeeded);
    }

    // RMD enforcement: Traditional withdrawal must satisfy RMD requirement
    tradWithdrawalNeeded = Math.max(tradWithdrawalNeeded, rmdRequired);
    // If RMD forces a larger Traditional withdrawal, reduce Roth to maintain total
    if (tradWithdrawalNeeded > plannedWithdrawal) {
      rothWithdrawalNeeded = 0;
    }

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
      rmdSatisfied: isRMDRequired(age, config.birthYear) ? tradWithdrawal >= rmdRequired : true,
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

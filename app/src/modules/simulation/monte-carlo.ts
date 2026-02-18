/**
 * Monte Carlo Stochastic Analysis
 *
 * Sequence-of-returns risk assessment via Monte Carlo simulation.
 * Runs 1000 simplified TSP balance simulations with randomized annual returns
 * to show the distribution of outcomes (confidence bands: P10/P25/P50/P75/P90).
 *
 * This is a simplified simulation focused on TSP balance volatility only.
 * It does not run the full tax/RMD/expense logic (which would be too slow for 1000 iterations).
 * Instead, it tracks:
 *   - TSP balance growth/drawdown per year
 *   - Withdrawal strategy (proportional, traditional-first, roth-first, tax-bracket-fill, custom)
 *   - Depletion detection
 *
 * Return distribution model:
 *   - High-risk funds: Normal(μ=config.highRiskROI, σ=0.16) [16% std dev based on 100yr US stock market]
 *   - Low-risk funds: Normal(μ=config.lowRiskROI, σ=0.05) [5% std dev based on bond market]
 *   - Box-Muller transform for efficient normal distribution generation
 */

import type { SimulationConfig } from '@models/simulation';

export interface MonteCarloConfig {
  iterations?: number; // Number of simulations (default: 1000)
  highRiskStdDev?: number; // Annual std dev for high-risk funds (default: 0.16 = 16%)
  lowRiskStdDev?: number; // Annual std dev for low-risk funds (default: 0.05 = 5%)
}

export interface MonteCarloYearBand {
  year: number;
  age: number;
  p10_balance: number; // 10th percentile TSP balance at end of year
  p25_balance: number;
  p50_balance: number; // Median (50th percentile)
  p75_balance: number;
  p90_balance: number; // 90th percentile
  successRate: number; // Fraction of trials where balance > 0 at this age
}

export interface MonteCarloResult {
  bands: MonteCarloYearBand[];
  overallSuccessRate: number; // Fraction of trials where TSP survives to endAge
  successRateAt85: number; // Fraction surviving to age 85
  medianDepletionAge: number | null;
}

/**
 * Box-Muller normal distribution generator.
 *
 * Generates normally-distributed random numbers with given mean and standard deviation.
 * Uses two uniform random values to produce one normal value.
 *
 * Formula: z = sqrt(-2 * ln(u1)) * cos(2π * u2)
 *          x = μ + σ * z
 *
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation
 * @returns - A normally-distributed random number
 */
function boxMullerRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

/**
 * Computes the pth percentile of an array of values.
 *
 * Uses linear interpolation between sorted values.
 * Example: percentile([1, 2, 3, 4, 5], 0.5) = 3 (50th percentile / median)
 *
 * @param values - Array of numeric values
 * @param p - Percentile to compute (0 to 1, e.g., 0.5 = 50th percentile)
 * @returns - The pth percentile value
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];

  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sorted[lower];
  }
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Runs Monte Carlo simulation with randomized annual returns.
 *
 * For each of 1000 trials:
 *   1. Initialize Traditional/Roth balances from config
 *   2. For each year to endAge:
 *      - Randomize high-risk and low-risk ROI via normal distribution
 *      - Apply planned withdrawal (grows with COLA from base)
 *      - Apply withdrawal strategy (split between Traditional/Roth)
 *      - Grow balances by randomized ROI
 *      - Track balance and detect depletion
 *   3. Store trial's balance trajectory
 *
 * After all trials:
 *   - Aggregate balances per age across all trials
 *   - Compute P10, P25, P50, P75, P90 percentiles
 *   - Compute success rate = fraction with balance > 0 at each age
 *
 * @param config - Simulation configuration (from FERS Estimate or SimulationForm)
 * @param monteCarloConfig - MC-specific parameters (iterations, volatility)
 * @returns MonteCarloResult with confidence bands and success rates
 */
export function runMonteCarlo(
  config: SimulationConfig,
  monteCarloConfig?: MonteCarloConfig,
): MonteCarloResult {
  const iterations = monteCarloConfig?.iterations ?? 1000;
  const highRiskStdDev = monteCarloConfig?.highRiskStdDev ?? 0.16;
  const lowRiskStdDev = monteCarloConfig?.lowRiskStdDev ?? 0.05;

  // Store balance at each age for each trial
  const balancesByAge: Map<number, number[]> = new Map();
  const depletionAges: number[] = [];

  const numYears = config.endAge - config.retirementAge + 1;

  // Run 1000 trials
  for (let trial = 0; trial < iterations; trial++) {
    // Initialize TSP from config
    let traditionalBalance = config.tspBalanceAtRetirement * config.traditionalPct;
    let rothBalance = config.tspBalanceAtRetirement * (1 - config.traditionalPct);

    // Split into high/low risk pots
    let highRiskTrad = traditionalBalance * config.highRiskPct;
    let lowRiskTrad = traditionalBalance * (1 - config.highRiskPct);
    let highRiskRoth = rothBalance * config.highRiskPct;
    let lowRiskRoth = rothBalance * (1 - config.highRiskPct);

    const baseAnnualWithdrawal = config.tspBalanceAtRetirement * config.withdrawalRate;
    let depletedAge: number | null = null;

    for (let yr = 0; yr < numYears; yr++) {
      const age = config.retirementAge + yr;
      traditionalBalance = highRiskTrad + lowRiskTrad;
      rothBalance = highRiskRoth + lowRiskRoth;
      const totalBalance = traditionalBalance + rothBalance;

      // Record balance before withdrawal
      if (!balancesByAge.has(age)) {
        balancesByAge.set(age, []);
      }
      balancesByAge.get(age)!.push(totalBalance);

      // If balance depleted, record depletion age and continue with zeros
      if (totalBalance <= 0) {
        if (!depletedAge) {
          depletedAge = age;
          depletionAges.push(age);
        }
        continue; // Skip withdrawal logic if depleted
      }

      // Annual withdrawal grows with COLA
      const plannedWithdrawal = baseAnnualWithdrawal * Math.pow(1 + config.colaRate, yr);

      // Determine withdrawal strategy split
      let tradWithdrawalNeeded: number;
      let rothWithdrawalNeeded: number;
      const strategy = config.withdrawalStrategy ?? 'proportional';

      if (strategy === 'traditional-first') {
        tradWithdrawalNeeded = Math.min(plannedWithdrawal, traditionalBalance);
        rothWithdrawalNeeded = Math.max(0, plannedWithdrawal - tradWithdrawalNeeded);
      } else if (strategy === 'roth-first') {
        rothWithdrawalNeeded = Math.min(plannedWithdrawal, rothBalance);
        tradWithdrawalNeeded = Math.max(0, plannedWithdrawal - rothWithdrawalNeeded);
      } else if (strategy === 'custom' && config.customWithdrawalSplit) {
        tradWithdrawalNeeded = plannedWithdrawal * config.customWithdrawalSplit.traditionalPct;
        rothWithdrawalNeeded = plannedWithdrawal * config.customWithdrawalSplit.rothPct;
      } else {
        // Default: proportional
        tradWithdrawalNeeded = totalBalance > 0 ? plannedWithdrawal * (traditionalBalance / totalBalance) : 0;
        rothWithdrawalNeeded = Math.max(0, plannedWithdrawal - tradWithdrawalNeeded);
      }

      // Cap withdrawals to available balance
      const tradWithdrawal = Math.min(tradWithdrawalNeeded, traditionalBalance);
      const rothWithdrawal = Math.min(rothWithdrawalNeeded, rothBalance);

      // Withdraw from low-risk pots first
      let tradRemaining = tradWithdrawal;
      const lowTradDraw = Math.min(tradRemaining, lowRiskTrad);
      lowRiskTrad -= lowTradDraw;
      tradRemaining -= lowTradDraw;
      highRiskTrad = Math.max(0, highRiskTrad - tradRemaining);

      let rothRemaining = rothWithdrawal;
      const lowRothDraw = Math.min(rothRemaining, lowRiskRoth);
      lowRiskRoth -= lowRothDraw;
      rothRemaining -= lowRothDraw;
      highRiskRoth = Math.max(0, highRiskRoth - rothRemaining);

      // Randomize returns via Box-Muller normal distribution
      const highRiskROI = boxMullerRandom(config.highRiskROI, highRiskStdDev);
      const lowRiskROI = boxMullerRandom(config.lowRiskROI, lowRiskStdDev);

      // Grow balances by randomized returns
      highRiskTrad *= 1 + highRiskROI;
      highRiskRoth *= 1 + highRiskROI;
      lowRiskTrad *= 1 + lowRiskROI;
      lowRiskRoth *= 1 + lowRiskROI;

      // Simple rebalance: maintain time-step buffer (not as detailed as full simulation)
      // For Monte Carlo, we keep it simple: no explicit rebalancing
      // High-risk can go negative from losses; clamp at 0
      highRiskTrad = Math.max(0, highRiskTrad);
      highRiskRoth = Math.max(0, highRiskRoth);
      lowRiskTrad = Math.max(0, lowRiskTrad);
      lowRiskRoth = Math.max(0, lowRiskRoth);
    }
  }

  // Aggregate results: compute percentiles for each age
  const bands: MonteCarloYearBand[] = [];
  let successfulTrialsAt85 = 0;

  for (let age = config.retirementAge; age <= config.endAge; age++) {
    const balances = balancesByAge.get(age) ?? [];

    // Ensure we have data for all trials
    while (balances.length < iterations) {
      balances.push(0); // Pad with zero if depletion happened earlier
    }

    const p10 = percentile(balances, 0.10);
    const p25 = percentile(balances, 0.25);
    const p50 = percentile(balances, 0.50);
    const p75 = percentile(balances, 0.75);
    const p90 = percentile(balances, 0.90);

    const successCount = balances.filter((b) => b > 0).length;
    const successRate = successCount / iterations;

    bands.push({
      year: config.retirementYear + (age - config.retirementAge),
      age,
      p10_balance: p10,
      p25_balance: p25,
      p50_balance: p50,
      p75_balance: p75,
      p90_balance: p90,
      successRate,
    });

    if (age === 85) {
      successfulTrialsAt85 = successCount;
    }
  }

  // Overall success rate: survived to endAge
  const finalAgeBalances = balancesByAge.get(config.endAge) ?? [];
  const overallSuccess = finalAgeBalances.filter((b) => b > 0).length / iterations;

  // Median depletion age
  let medianDepletionAge: number | null = null;
  if (depletionAges.length > 0) {
    medianDepletionAge = percentile(depletionAges, 0.5);
  }

  return {
    bands,
    overallSuccessRate: overallSuccess,
    successRateAt85: successfulTrialsAt85 / iterations,
    medianDepletionAge: medianDepletionAge === 0 ? null : medianDepletionAge,
  };
}

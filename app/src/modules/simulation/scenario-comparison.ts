/**
 * Scenario Comparison & Analysis
 *
 * Tools for comparing retirement scenarios and computing present-value
 * adjusted metrics for scenario selection and sensitivity analysis.
 *
 * Phase E enhancement: Enables apples-to-apples scenario comparison
 * by normalizing for discount rate and extracting key decision metrics.
 */

import type { SimulationYearResult } from '../../models/simulation';

export interface ScenarioMetrics {
  /** Scenario label or identifier */
  scenarioId: string;
  /** Age when TSP depletes, or null if "NEVER" */
  depletionAge: number | null;
  /** TSP balance at age 85 */
  balanceAt85: number;
  /** Cumulative surplus in year 10 (or last available year if < 10 years) */
  surplusYear10: number;
  /** Cumulative surplus in year 20 (or last available year if < 20 years) */
  surplusYear20: number;
  /** Cumulative surplus in year 30 (or last available year if < 30 years) */
  surplusYear30: number;
  /** Total lifetime income across all years */
  totalLifetimeIncome: number;
  /** Total lifetime expenses across all years */
  totalLifetimeExpenses: number;
}

/**
 * Extracts key metrics from a retirement simulation for scenario comparison.
 *
 * @param scenarioId - Identifier for this scenario
 * @param years - Year-by-year projection results
 * @returns ScenarioMetrics with key decision points
 */
export function extractScenarioMetrics(
  scenarioId: string,
  years: SimulationYearResult[],
): ScenarioMetrics {
  let depletionAge: number | null = null;
  let balanceAt85 = 0;
  let surplusYear10 = 0;
  let surplusYear20 = 0;
  let surplusYear30 = 0;
  const totalLifetimeIncome = years.reduce((sum, yr) => sum + yr.totalIncome, 0);
  const totalLifetimeExpenses = years.reduce((sum, yr) => sum + yr.totalExpenses, 0);

  for (const yr of years) {
    // Track depletion age
    if (yr.totalTSPBalance <= 0 && depletionAge === null) {
      depletionAge = yr.age;
    }

    // Track balance at 85
    if (yr.age === 85) {
      balanceAt85 = yr.totalTSPBalance;
    }

    // Track cumulative surplus at year milestones
    // Use simple index-based check (year 10 = index 9 from start)
    const yearsFromStart = yr.age - years[0].age;
    if (yearsFromStart === 9) {
      surplusYear10 = years.slice(0, 10).reduce((sum, y) => sum + y.surplus, 0);
    }
    if (yearsFromStart === 19) {
      surplusYear20 = years.slice(0, 20).reduce((sum, y) => sum + y.surplus, 0);
    }
    if (yearsFromStart === 29) {
      surplusYear30 = years.slice(0, 30).reduce((sum, y) => sum + y.surplus, 0);
    }
  }

  // Handle case where projections are shorter than expected milestones
  if (years.length < 10) {
    surplusYear10 = years.reduce((sum, yr) => sum + yr.surplus, 0);
  }
  if (years.length < 20) {
    surplusYear20 = years.reduce((sum, yr) => sum + yr.surplus, 0);
  }
  if (years.length < 30) {
    surplusYear30 = years.reduce((sum, yr) => sum + yr.surplus, 0);
  }

  return {
    scenarioId,
    depletionAge,
    balanceAt85,
    surplusYear10,
    surplusYear20,
    surplusYear30,
    totalLifetimeIncome,
    totalLifetimeExpenses,
  };
}

/**
 * Computes present value of a future amount, discounted to today's dollars.
 *
 * Formula: PV = FV / (1 + r)^n
 *
 * @param futureValue - Amount in future year dollars
 * @param yearsInFuture - Number of years from now
 * @param discountRate - Annual discount rate (e.g., 0.02 = 2%)
 * @returns Present value in today's dollars
 */
export function computePresentValue(
  futureValue: number,
  yearsInFuture: number,
  discountRate: number,
): number {
  if (yearsInFuture === 0) return futureValue;
  if (discountRate === 0) return futureValue;
  return futureValue / Math.pow(1 + discountRate, yearsInFuture);
}

export interface PresentValueMetrics extends ScenarioMetrics {
  /** Balance at 85 in present value (today's dollars) */
  balanceAt85PV: number;
  /** Cumulative surplus year 10 in PV */
  surplusYear10PV: number;
  /** Cumulative surplus year 20 in PV */
  surplusYear20PV: number;
  /** Cumulative surplus year 30 in PV */
  surplusYear30PV: number;
  /** Total lifetime income in PV */
  totalLifetimeIncomePV: number;
  /** Total lifetime expenses in PV */
  totalLifetimeExpensesPV: number;
}

/**
 * Computes present-value adjusted metrics for scenario comparison.
 *
 * Allows apples-to-apples comparison by discounting future values
 * to today's purchasing power. Uses a configurable discount rate
 * (typically 2-3% to match long-term inflation expectations).
 *
 * @param metrics - Base scenario metrics
 * @param years - Year-by-year projection results
 * @param discountRate - Discount rate (e.g., 0.02 = 2%)
 * @returns Metrics with PV-adjusted values added
 */
export function computePresentValueMetrics(
  metrics: ScenarioMetrics,
  years: SimulationYearResult[],
  discountRate: number = 0.02,
): PresentValueMetrics {
  // Find years at key milestones
  let yr10: SimulationYearResult | undefined;
  let yr20: SimulationYearResult | undefined;
  let yr30: SimulationYearResult | undefined;

  for (const yr of years) {
    const yearsFromStart = yr.age - years[0].age;
    if (yearsFromStart === 9) yr10 = yr;
    if (yearsFromStart === 19) yr20 = yr;
    if (yearsFromStart === 29) yr30 = yr;
  }

  // Compute PV of balance at 85
  const age85Year = years.find((yr) => yr.age === 85);
  const yearsTo85 = age85Year ? age85Year.age - years[0].age : null;
  const balanceAt85PV = yearsTo85
    ? computePresentValue(metrics.balanceAt85, yearsTo85, discountRate)
    : metrics.balanceAt85;

  // Compute PV of surplus milestones
  const surplusYear10PV = yr10
    ? computePresentValue(metrics.surplusYear10, 9, discountRate)
    : metrics.surplusYear10;

  const surplusYear20PV = yr20
    ? computePresentValue(metrics.surplusYear20, 19, discountRate)
    : metrics.surplusYear20;

  const surplusYear30PV = yr30
    ? computePresentValue(metrics.surplusYear30, 29, discountRate)
    : metrics.surplusYear30;

  // Compute PV of lifetime totals (use middle year as approximation)
  const midpointYear = Math.floor(years.length / 2);
  const totalLifetimeIncomePV = computePresentValue(
    metrics.totalLifetimeIncome,
    midpointYear,
    discountRate,
  );
  const totalLifetimeExpensesPV = computePresentValue(
    metrics.totalLifetimeExpenses,
    midpointYear,
    discountRate,
  );

  return {
    ...metrics,
    balanceAt85PV,
    surplusYear10PV,
    surplusYear20PV,
    surplusYear30PV,
    totalLifetimeIncomePV,
    totalLifetimeExpensesPV,
  };
}

export interface ScenarioComparison {
  scenarios: PresentValueMetrics[];
  discountRate: number;
}

/**
 * Compares multiple scenarios and ranks them by key metrics.
 *
 * @param scenarioMetricsList - Array of scenario metrics
 * @param years - Array of year-by-year results (parallel to scenarioMetricsList)
 * @param discountRate - Discount rate for PV adjustment
 * @returns Comparison with PV-adjusted metrics
 */
export function compareScenarios(
  scenarioMetricsList: ScenarioMetrics[],
  years: SimulationYearResult[][],
  discountRate: number = 0.02,
): ScenarioComparison {
  const scenarios = scenarioMetricsList.map((metrics, idx) =>
    computePresentValueMetrics(metrics, years[idx], discountRate),
  );

  return {
    scenarios,
    discountRate,
  };
}

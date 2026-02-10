/**
 * Inflation Adjustment
 * Formula: expenses/inflation-adjustment
 *
 * Adjusts a base dollar amount for compound inflation over a given number of years.
 *
 * Default rate: 2.5% (approximate long-run U.S. CPI average).
 * ASSUMPTION: Single constant inflation rate over the entire projection.
 *             Real inflation varies year-to-year; this is a planning estimate.
 * User-configurable. Flag (return warning metadata) if rate is outside 1%–6%.
 *
 * Source: U.S. Bureau of Labor Statistics, CPI historical data;
 *         Social Security Administration cost-of-living adjustment history
 */

/** Soft bounds for the inflation rate — outside this range is unusual but not blocked. */
export const INFLATION_RATE_WARN_LOW = 0.01;
export const INFLATION_RATE_WARN_HIGH = 0.06;

/** Default CPI-based inflation rate assumption. */
export const DEFAULT_INFLATION_RATE = 0.025;

export interface InflationAdjustmentResult {
  /** Inflation-adjusted amount after the given years */
  adjustedAmount: number;
  /** Total inflation multiplier applied */
  multiplier: number;
  /** True if the inflation rate is outside the expected 1%–6% range */
  rateOutOfRange: boolean;
}

/**
 * Adjusts a base amount for compound inflation over a number of years.
 *
 * Formula ID: expenses/inflation-adjustment
 *
 * Formula: adjustedAmount = baseAmount × (1 + annualRate)^years
 *
 * @param baseAmount - Dollar amount in base year (e.g., retirement year)
 * @param years - Number of years of inflation to apply (0 = no adjustment)
 * @param annualRate - Annual inflation rate as decimal (default: 2.5%)
 * @returns Adjusted amount, multiplier, and out-of-range flag
 */
export function adjustForInflation(
  baseAmount: number,
  years: number,
  annualRate = DEFAULT_INFLATION_RATE,
): number {
  if (baseAmount < 0) throw new RangeError('baseAmount must be >= 0');
  if (years < 0) throw new RangeError('years must be >= 0');
  if (annualRate <= -1) throw new RangeError('annualRate must be > -1');

  return baseAmount * Math.pow(1 + annualRate, years);
}

/**
 * Full inflation adjustment with warning metadata.
 * Use this variant when you need to surface rate-out-of-range warnings to the UI.
 *
 * Formula ID: expenses/inflation-adjustment (detailed)
 */
export function adjustForInflationDetailed(
  baseAmount: number,
  years: number,
  annualRate = DEFAULT_INFLATION_RATE,
): InflationAdjustmentResult {
  if (baseAmount < 0) throw new RangeError('baseAmount must be >= 0');
  if (years < 0) throw new RangeError('years must be >= 0');
  if (annualRate <= -1) throw new RangeError('annualRate must be > -1');

  const multiplier = Math.pow(1 + annualRate, years);
  const adjustedAmount = baseAmount * multiplier;
  const rateOutOfRange =
    annualRate < INFLATION_RATE_WARN_LOW || annualRate > INFLATION_RATE_WARN_HIGH;

  return { adjustedAmount, multiplier, rateOutOfRange };
}

/**
 * Projects an annual expense series over a retirement horizon,
 * applying compound inflation year by year.
 *
 * Formula ID: expenses/inflation-adjustment (series)
 *
 * @param baseAmount - Expense amount in year 0 (retirement year)
 * @param horizonYears - Number of years to project
 * @param annualRate - Annual inflation rate as decimal
 * @returns Array of inflation-adjusted amounts, one per year (index 0 = retirement year)
 */
export function inflationSeries(
  baseAmount: number,
  horizonYears: number,
  annualRate = DEFAULT_INFLATION_RATE,
): number[] {
  if (baseAmount < 0) throw new RangeError('baseAmount must be >= 0');
  if (horizonYears < 0) throw new RangeError('horizonYears must be >= 0');
  if (annualRate <= -1) throw new RangeError('annualRate must be > -1');

  return Array.from({ length: horizonYears + 1 }, (_, year) =>
    baseAmount * Math.pow(1 + annualRate, year),
  );
}

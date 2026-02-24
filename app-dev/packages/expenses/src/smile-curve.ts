/**
 * Expense Smile Curve
 * Formula: expenses/smile-curve
 *
 * Models the empirical U-shaped pattern of retirement spending:
 *   - Early retirement: elevated spending (travel, activities)
 *   - Mid-retirement: reduced spending ("go-go" to "slow-go" transition)
 *   - Late retirement: rising spending again (healthcare-driven)
 *
 * Shape: piecewise linear interpolation across three anchor points:
 *   Year 0       → earlyMultiplier (default 1.00)
 *   Year midDip  → midMultiplier   (default 0.85)
 *   Year 2×midDip → lateMultiplier  (default 0.95)
 *   Year 2×midDip+ → lateMultiplier (held constant)
 *
 * ASSUMPTION: Curve shape is based on academic research, not a regulatory requirement.
 * The Blanchett (2014) model is widely used in retirement planning but is an estimate.
 * Users should acknowledge this assumption before it affects their projection.
 *
 * Source: Blanchett (2014) "Exploring the Retirement Consumption Puzzle",
 *         Journal of Financial Planning
 */

export interface SmileCurveParams {
  /** Spending multiplier at retirement start (year 0). Default: 1.00 */
  earlyMultiplier: number;
  /** Spending multiplier at the trough (year midDipYear). Default: 0.85 */
  midMultiplier: number;
  /** Spending multiplier at late retirement (year 2×midDipYear and beyond). Default: 0.95 */
  lateMultiplier: number;
  /** Year into retirement at which the mid-dip trough occurs. Default: 15 */
  midDipYear: number;
}

/** Default smile curve parameters per Blanchett (2014). */
export const defaultSmileCurveParams: SmileCurveParams = {
  earlyMultiplier: 1.00,
  midMultiplier: 0.85,
  lateMultiplier: 0.95,
  midDipYear: 15,
};

/**
 * Validates smile curve parameters. Throws if any are out of reasonable bounds.
 */
export function validateSmileCurveParams(params: SmileCurveParams): void {
  if (params.earlyMultiplier <= 0) throw new RangeError('earlyMultiplier must be > 0');
  if (params.midMultiplier <= 0) throw new RangeError('midMultiplier must be > 0');
  if (params.lateMultiplier <= 0) throw new RangeError('lateMultiplier must be > 0');
  if (params.midDipYear <= 0) throw new RangeError('midDipYear must be > 0');
}

/**
 * Returns the smile curve multiplier for a given year into retirement.
 *
 * Uses piecewise linear interpolation:
 *   Segment 1: [year 0, midDipYear]     → earlyMultiplier → midMultiplier
 *   Segment 2: [midDipYear, 2×midDipYear] → midMultiplier → lateMultiplier
 *   Beyond 2×midDipYear                  → lateMultiplier (constant)
 *
 * Formula ID: expenses/smile-curve (multiplier only)
 *
 * NOTE: This is the Blanchett (2014) linear interpolation model, used by income-projection.ts
 * (simple retirement income path). A separate GoGo/GoSlow/NoGo step-function model exists in
 * modules/simulation/retirement-simulation.ts for the full dual-pot TSP simulation.
 * See retirement-simulation.ts smileMultiplier() for design notes.
 *
 * @param yearsIntoRetirement - Years elapsed since retirement date (0 = retirement year)
 * @param params - Curve parameters (defaults to Blanchett model)
 * @returns Multiplier to apply to base expenses
 */
export function smileCurveMultiplier(
  yearsIntoRetirement: number,
  params: SmileCurveParams = defaultSmileCurveParams,
): number {
  if (yearsIntoRetirement < 0) throw new RangeError('yearsIntoRetirement must be >= 0');
  validateSmileCurveParams(params);

  const { earlyMultiplier, midMultiplier, lateMultiplier, midDipYear } = params;
  const lateYear = midDipYear * 2;

  if (yearsIntoRetirement <= midDipYear) {
    // Segment 1: linear from earlyMultiplier → midMultiplier
    const t = yearsIntoRetirement / midDipYear;
    return earlyMultiplier + t * (midMultiplier - earlyMultiplier);
  }

  if (yearsIntoRetirement <= lateYear) {
    // Segment 2: linear from midMultiplier → lateMultiplier
    const t = (yearsIntoRetirement - midDipYear) / midDipYear;
    return midMultiplier + t * (lateMultiplier - midMultiplier);
  }

  // Beyond the late year: hold lateMultiplier constant
  return lateMultiplier;
}

/**
 * Applies the smile curve to a base annual expense amount.
 *
 * Formula ID: expenses/smile-curve
 *
 * @param baseExpenses - Annual expenses at retirement (year 0, before curve)
 * @param yearsIntoRetirement - Years elapsed since retirement
 * @param params - Curve parameters (defaults to Blanchett model)
 * @returns Adjusted annual expenses for this year
 */
export function applySmileCurve(
  baseExpenses: number,
  yearsIntoRetirement: number,
  params: SmileCurveParams = defaultSmileCurveParams,
): number {
  if (baseExpenses < 0) throw new RangeError('baseExpenses must be >= 0');
  const multiplier = smileCurveMultiplier(yearsIntoRetirement, params);
  return baseExpenses * multiplier;
}

/**
 * Expense Modeling Module
 *
 * Responsible for:
 * - Comprehensive expense category definitions and totaling
 * - Expense "smile curve" implementation (spending dips mid-retirement, rises late)
 * - Adjustable curve parameters (user-configurable)
 * - Inflation adjustment (default 2.5% CPI; user-configurable)
 *
 * Note: The smile curve shape is an assumption (not a hard rule).
 * Users must acknowledge this before it affects their projection.
 * Source: Blanchett (2014) retirement spending research
 *
 * All formulas referenced in: docs/formula-registry.md
 */

export type { ExpenseProfile, ExpenseCategory, ExpenseCategoryName } from '../../models/expenses';
export type { AnnualExpensesResult } from './categories';
export type { SmileCurveParams } from './smile-curve';
export type { InflationAdjustmentResult } from './inflation';

export { VALID_CATEGORY_NAMES, computeAnnualExpenses, totalAnnualExpenses } from './categories';
export {
  defaultSmileCurveParams,
  validateSmileCurveParams,
  smileCurveMultiplier,
  applySmileCurve,
} from './smile-curve';
export {
  DEFAULT_INFLATION_RATE,
  INFLATION_RATE_WARN_LOW,
  INFLATION_RATE_WARN_HIGH,
  adjustForInflation,
  adjustForInflationDetailed,
  inflationSeries,
} from './inflation';

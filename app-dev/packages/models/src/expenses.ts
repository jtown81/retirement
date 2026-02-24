/**
 * Expense Data Models
 * No business logic — pure data shapes.
 */

import type { USD, Rate } from './common';

export type ExpenseCategoryName =
  | 'housing'
  | 'transportation'
  | 'food'
  | 'healthcare'
  | 'insurance'
  | 'travel-leisure'
  | 'utilities'
  | 'personal-care'
  | 'gifts-charitable'
  | 'other';

export interface ExpenseCategory {
  name: ExpenseCategoryName;
  annualAmount: USD;
  notes?: string;
}

export interface SmileCurveParams {
  /** Spending multiplier at retirement start (year 0). Default: 1.00 */
  earlyMultiplier: number;
  /** Spending multiplier at the trough (year midDipYear). Default: 0.85 */
  midMultiplier: number;
  /** Spending multiplier at late retirement (year 2×midDipYear and beyond). Default: 0.95 */
  lateMultiplier: number;
  /** Year when spending reaches minimum (the "dip"). Default: 10 */
  midDipYear: number;
}

export interface ExpenseProfile {
  id: string;
  baseYear: number;
  categories: ExpenseCategory[];
  inflationRate: Rate;
  healthcareInflationRate?: Rate;
  smileCurveEnabled: boolean;
  smileCurveParams?: SmileCurveParams;
}

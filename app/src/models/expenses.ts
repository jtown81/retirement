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

export interface ExpenseProfile {
  id: string;
  baseYear: number;
  categories: ExpenseCategory[];
  inflationRate: Rate;
  smileCurveEnabled: boolean;
  smileCurveParams?: import('../modules/expenses/smile-curve').SmileCurveParams;
}

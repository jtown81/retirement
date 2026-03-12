/**
 * Expense Categories
 * Formula: expenses/annual-total
 *
 * Sums all expense categories from an ExpenseProfile to produce the base
 * annual retirement spending figure.
 *
 * Categories are defined in the data model (models/expenses.ts).
 * This module validates input and computes totals — no curve or inflation logic.
 *
 * Source: User-defined inputs; category list based on BLS Consumer Expenditure Survey
 */

import type { ExpenseProfile, ExpenseCategory, ExpenseCategoryName } from '../../models/expenses';

/** All valid expense category names (mirrors the type union in models/expenses.ts). */
export const VALID_CATEGORY_NAMES: ReadonlySet<ExpenseCategoryName> = new Set([
  'housing',
  'transportation',
  'food',
  'healthcare',
  'insurance',
  'travel-leisure',
  'utilities',
  'personal-care',
  'gifts-charitable',
  'other',
]);

export interface AnnualExpensesResult {
  /** Sum of all category amounts */
  totalAnnual: number;
  /** Per-category breakdown (preserves input order) */
  breakdown: Array<{ name: ExpenseCategoryName; amount: number }>;
}

/**
 * Validates a single expense category entry.
 * Throws if the category name is unknown or the amount is negative.
 */
function validateCategory(category: ExpenseCategory): void {
  if (!VALID_CATEGORY_NAMES.has(category.name)) {
    throw new RangeError(`Unknown expense category: "${category.name}"`);
  }
  if (category.annualAmount < 0) {
    throw new RangeError(
      `Expense amount for "${category.name}" must be >= 0, got ${category.annualAmount}`,
    );
  }
}

/**
 * Computes the total annual retirement expenses from an ExpenseProfile.
 *
 * Formula ID: expenses/annual-total
 *
 * @param profile - The expense profile containing categorized spending
 * @returns Total and per-category breakdown
 */
export function computeAnnualExpenses(profile: ExpenseProfile): AnnualExpensesResult {
  for (const category of profile.categories) {
    validateCategory(category);
  }

  const breakdown = profile.categories.map((c) => ({
    name: c.name,
    amount: c.annualAmount,
  }));

  const totalAnnual = breakdown.reduce((sum, c) => sum + c.amount, 0);

  return { totalAnnual, breakdown };
}

/**
 * Returns the sum of all category amounts for a given profile.
 * Convenience wrapper around computeAnnualExpenses for use by the simulation engine.
 *
 * @param profile - The expense profile
 * @returns Total annual expense amount in USD
 */
export function totalAnnualExpenses(profile: ExpenseProfile): number {
  return computeAnnualExpenses(profile).totalAnnual;
}

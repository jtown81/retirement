import { describe, it, expect } from 'vitest';
import { computeAnnualExpenses, totalAnnualExpenses } from '../../../src/modules/expenses/categories';
import type { ExpenseProfile } from '../../../src/models/expenses';

const BASE_PROFILE: ExpenseProfile = {
  id: 'test-1',
  baseYear: 2025,
  categories: [
    { name: 'housing', annualAmount: 24_000 },
    { name: 'food', annualAmount: 12_000 },
    { name: 'healthcare', annualAmount: 8_000 },
    { name: 'transportation', annualAmount: 6_000 },
  ],
  inflationRate: 0.025,
  smileCurveEnabled: false,
};

describe('computeAnnualExpenses', () => {
  it('sums all categories correctly', () => {
    const result = computeAnnualExpenses(BASE_PROFILE);
    expect(result.totalAnnual).toBe(50_000);
  });

  it('returns a breakdown entry per category', () => {
    const result = computeAnnualExpenses(BASE_PROFILE);
    expect(result.breakdown).toHaveLength(4);
    expect(result.breakdown[0]).toEqual({ name: 'housing', amount: 24_000 });
  });

  it('preserves category order', () => {
    const result = computeAnnualExpenses(BASE_PROFILE);
    expect(result.breakdown.map((b) => b.name)).toEqual([
      'housing', 'food', 'healthcare', 'transportation',
    ]);
  });

  it('returns zero total for empty categories', () => {
    const emptyProfile: ExpenseProfile = { ...BASE_PROFILE, categories: [] };
    const result = computeAnnualExpenses(emptyProfile);
    expect(result.totalAnnual).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('handles all ten known categories', () => {
    const allCategories: ExpenseProfile = {
      ...BASE_PROFILE,
      categories: [
        { name: 'housing', annualAmount: 1 },
        { name: 'transportation', annualAmount: 1 },
        { name: 'food', annualAmount: 1 },
        { name: 'healthcare', annualAmount: 1 },
        { name: 'insurance', annualAmount: 1 },
        { name: 'travel-leisure', annualAmount: 1 },
        { name: 'utilities', annualAmount: 1 },
        { name: 'personal-care', annualAmount: 1 },
        { name: 'gifts-charitable', annualAmount: 1 },
        { name: 'other', annualAmount: 1 },
      ],
    };
    const result = computeAnnualExpenses(allCategories);
    expect(result.totalAnnual).toBe(10);
  });

  it('allows zero amount for a category', () => {
    const profile: ExpenseProfile = {
      ...BASE_PROFILE,
      categories: [
        { name: 'housing', annualAmount: 0 },
        { name: 'food', annualAmount: 5_000 },
      ],
    };
    expect(computeAnnualExpenses(profile).totalAnnual).toBe(5_000);
  });

  it('throws for unknown category name', () => {
    const badProfile = {
      ...BASE_PROFILE,
      categories: [{ name: 'luxury-yacht' as never, annualAmount: 100 }],
    };
    expect(() => computeAnnualExpenses(badProfile)).toThrow(RangeError);
  });

  it('throws for negative category amount', () => {
    const badProfile: ExpenseProfile = {
      ...BASE_PROFILE,
      categories: [{ name: 'housing', annualAmount: -1 }],
    };
    expect(() => computeAnnualExpenses(badProfile)).toThrow(RangeError);
  });
});

describe('totalAnnualExpenses', () => {
  it('returns same value as computeAnnualExpenses.totalAnnual', () => {
    expect(totalAnnualExpenses(BASE_PROFILE)).toBe(
      computeAnnualExpenses(BASE_PROFILE).totalAnnual,
    );
  });
});

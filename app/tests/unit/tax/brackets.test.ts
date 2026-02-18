import { describe, it, expect } from 'vitest';
import { getBracketsForYearAndStatus, getStandardDeduction, getMarginalBracketRate, applyStandardDeduction } from '@modules/tax';

describe('Tax Brackets', () => {
  describe('getBracketsForYearAndStatus', () => {
    it('returns 7 brackets for 2024 single filer', () => {
      const brackets = getBracketsForYearAndStatus(2024, 'single');
      expect(brackets).toHaveLength(7);
      expect(brackets[0].minIncome).toBe(0);
      expect(brackets[0].rate).toBe(0.10); // 10% bracket
      expect(brackets[6].maxIncome).toBe(null); // Top bracket unbounded
      expect(brackets[6].rate).toBe(0.37); // 37% bracket
    });

    it('returns 7 brackets for 2024 married-joint filer', () => {
      const brackets = getBracketsForYearAndStatus(2024, 'married-joint');
      expect(brackets).toHaveLength(7);
      expect(brackets[0].minIncome).toBe(0);
      expect(brackets[0].maxIncome).toBe(23200); // $23,200
    });

    it('married-joint brackets are wider than single', () => {
      const single = getBracketsForYearAndStatus(2024, 'single');
      const mfj = getBracketsForYearAndStatus(2024, 'married-joint');

      // 10% bracket: single $11,600 vs MFJ $23,200
      expect(single[0]?.maxIncome).toBe(11600);
      expect(mfj[0]?.maxIncome).toBe(23200);
      expect(mfj[0]?.maxIncome).toBe((single[0]?.maxIncome ?? 0) * 2);
    });

    it('returns 2025 brackets when requested', () => {
      const brackets = getBracketsForYearAndStatus(2025, 'single');
      expect(brackets).toHaveLength(7);
      expect(brackets[0].year).toBe(2025);
    });

    it('brackets are sorted by income ascending', () => {
      const brackets = getBracketsForYearAndStatus(2024, 'married-joint');
      for (let i = 0; i < brackets.length - 1; i++) {
        expect(brackets[i].minIncome).toBeLessThan(brackets[i + 1].minIncome);
      }
    });
  });

  describe('getStandardDeduction', () => {
    it('returns $14,600 for 2024 single', () => {
      expect(getStandardDeduction(2024, 'single')).toBe(14600);
    });

    it('returns $29,200 for 2024 married-joint', () => {
      expect(getStandardDeduction(2024, 'married-joint')).toBe(29200);
    });

    it('returns $14,600 for 2024 married-separate', () => {
      expect(getStandardDeduction(2024, 'married-separate')).toBe(14600);
    });

    it('returns $21,900 for 2024 head-of-household', () => {
      expect(getStandardDeduction(2024, 'head-of-household')).toBe(21900);
    });

    it('2024 single is higher than 2023', () => {
      expect(getStandardDeduction(2024, 'single')).toBeGreaterThan(getStandardDeduction(2023, 'single'));
    });

    it('returns fallback for future year outside defined range', () => {
      const deduction = getStandardDeduction(2030, 'single');
      expect(deduction).toBeGreaterThan(0);
    });
  });

  describe('getMarginalBracketRate', () => {
    it('returns 0.10 for income in first bracket (single)', () => {
      expect(getMarginalBracketRate(5000, 2024, 'single')).toBe(0.10);
    });

    it('returns 0.12 for income in second bracket (single)', () => {
      expect(getMarginalBracketRate(20000, 2024, 'single')).toBe(0.12);
    });

    it('returns 0.22 for income in third bracket (single)', () => {
      expect(getMarginalBracketRate(60000, 2024, 'single')).toBe(0.22);
    });

    it('returns 0.37 for very high income (single)', () => {
      expect(getMarginalBracketRate(1000000, 2024, 'single')).toBe(0.37);
    });

    it('married-joint has lower marginal rates at same income', () => {
      const singleRate = getMarginalBracketRate(100000, 2024, 'single');
      const mfjRate = getMarginalBracketRate(100000, 2024, 'married-joint');
      expect(mfjRate).toBeLessThanOrEqual(singleRate);
    });

    it('zero income returns 0.10 (base bracket)', () => {
      expect(getMarginalBracketRate(0, 2024, 'single')).toBe(0.10);
    });
  });

  describe('applyStandardDeduction', () => {
    it('reduces gross income by standard deduction', () => {
      const result = applyStandardDeduction(60000, 2024, 'single');
      expect(result).toBe(60000 - 14600); // 45,400
    });

    it('returns 0 if gross income is below standard deduction', () => {
      const result = applyStandardDeduction(10000, 2024, 'single');
      expect(result).toBe(0); // Minimum 0
    });

    it('returns exact difference when above deduction', () => {
      const result = applyStandardDeduction(100000, 2024, 'married-joint');
      expect(result).toBe(100000 - 29200);
    });
  });
});

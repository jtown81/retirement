import { describe, it, expect } from 'vitest';
import { computeLeaveRetirementCredit } from '../../../src/modules/leave/retirement-credit';
import { HOURS_PER_WORK_YEAR } from '../../../src/modules/leave/sick-leave';

describe('computeLeaveRetirementCredit', () => {
  it('adds no credit when sick leave is zero', () => {
    expect(computeLeaveRetirementCredit(0, 20)).toBe(20);
  });

  it('adds exactly 1 year for one full work year of sick leave', () => {
    expect(computeLeaveRetirementCredit(HOURS_PER_WORK_YEAR, 20)).toBeCloseTo(21);
  });

  it('adds fractional credit for partial sick leave', () => {
    // 500 hrs ≈ 0.2396 years
    const result = computeLeaveRetirementCredit(500, 20);
    expect(result).toBeGreaterThan(20.23);
    expect(result).toBeLessThan(20.25);
  });

  it('works with zero service years (edge case)', () => {
    const result = computeLeaveRetirementCredit(HOURS_PER_WORK_YEAR, 0);
    expect(result).toBeCloseTo(1);
  });

  it('throws for negative service years', () => {
    expect(() => computeLeaveRetirementCredit(0, -1)).toThrow(RangeError);
  });

  it('returns sum of service years + sick leave credit', () => {
    const sickCredit = 1044 / HOURS_PER_WORK_YEAR;
    const expected = 15 + sickCredit;
    expect(computeLeaveRetirementCredit(1044, 15)).toBeCloseTo(expected, 5);
  });
});

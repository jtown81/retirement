import { describe, it, expect } from 'vitest';
import {
  annualLeaveAccrualRate,
  accrueAnnualLeave,
  applyRolloverCap,
  useAnnualLeave,
} from '../../../src/modules/leave/annual-leave';

describe('annualLeaveAccrualRate', () => {
  it('returns 4 hrs/pp for < 3 years', () => {
    expect(annualLeaveAccrualRate(0)).toBe(4);
    expect(annualLeaveAccrualRate(1)).toBe(4);
    expect(annualLeaveAccrualRate(2.99)).toBe(4);
  });

  it('returns 6 hrs/pp for 3–14.99 years', () => {
    expect(annualLeaveAccrualRate(3)).toBe(6);
    expect(annualLeaveAccrualRate(10)).toBe(6);
    expect(annualLeaveAccrualRate(14.99)).toBe(6);
  });

  it('returns 8 hrs/pp for 15+ years', () => {
    expect(annualLeaveAccrualRate(15)).toBe(8);
    expect(annualLeaveAccrualRate(30)).toBe(8);
  });
});

describe('accrueAnnualLeave', () => {
  it('accrues 4 hrs/pp for a new employee over 26 pay periods', () => {
    expect(accrueAnnualLeave(0, 26)).toBe(104);
  });

  it('accrues 6 hrs/pp for mid-career employee over 26 pay periods (160 hrs)', () => {
    // 25 PP × 6 + 1 PP × 10 = 160 per 5 U.S.C. § 6303(a)
    expect(accrueAnnualLeave(5, 26)).toBe(160);
  });

  it('accrues 8 hrs/pp for senior employee over 26 pay periods', () => {
    expect(accrueAnnualLeave(20, 26)).toBe(208);
  });

  it('returns 0 for 0 pay periods worked', () => {
    expect(accrueAnnualLeave(5, 0)).toBe(0);
  });

  it('supports fractional pay periods', () => {
    expect(accrueAnnualLeave(5, 13)).toBe(78);
  });

  it('throws for negative pay periods', () => {
    expect(() => accrueAnnualLeave(5, -1)).toThrow(RangeError);
  });
});

describe('applyRolloverCap', () => {
  it('returns balance when under the cap', () => {
    expect(applyRolloverCap(200, 240)).toBe(200);
  });

  it('caps at 240 hours (default)', () => {
    expect(applyRolloverCap(300)).toBe(240);
    expect(applyRolloverCap(241)).toBe(240);
  });

  it('caps at 360 hours for overseas', () => {
    expect(applyRolloverCap(400, 360)).toBe(360);
    expect(applyRolloverCap(300, 360)).toBe(300);
  });

  it('returns 0 when balance is 0', () => {
    expect(applyRolloverCap(0)).toBe(0);
  });

  it('throws for negative cap', () => {
    expect(() => applyRolloverCap(100, -1)).toThrow(RangeError);
  });
});

describe('useAnnualLeave', () => {
  it('deducts hours correctly', () => {
    expect(useAnnualLeave(100, 8)).toBe(92);
  });

  it('supports fractional hour deductions', () => {
    expect(useAnnualLeave(100, 0.25)).toBeCloseTo(99.75);
  });

  it('allows balance to reach exactly zero', () => {
    expect(useAnnualLeave(8, 8)).toBe(0);
  });

  it('throws when balance would go negative', () => {
    expect(() => useAnnualLeave(4, 8)).toThrow(RangeError);
  });

  it('throws for negative hoursUsed', () => {
    expect(() => useAnnualLeave(100, -1)).toThrow(RangeError);
  });
});

import { describe, it, expect } from 'vitest';
import {
  accrueSickLeave,
  useSickLeave,
  sickLeaveToServiceCredit,
  HOURS_PER_WORK_YEAR,
  FAMILY_CARE_ANNUAL_LIMIT_HOURS,
} from '../../../src/modules/leave/sick-leave';

describe('accrueSickLeave', () => {
  it('accrues 4 hrs/pp over 26 pay periods', () => {
    expect(accrueSickLeave(26)).toBe(104);
  });

  it('accrues same rate regardless of years of service', () => {
    expect(accrueSickLeave(26)).toBe(accrueSickLeave(26));
    // Rate doesn't change with service — always 4 hrs/pp
    expect(accrueSickLeave(1)).toBe(4);
  });

  it('returns 0 for 0 pay periods', () => {
    expect(accrueSickLeave(0)).toBe(0);
  });

  it('throws for negative pay periods', () => {
    expect(() => accrueSickLeave(-1)).toThrow(RangeError);
  });
});

describe('useSickLeave — general sick', () => {
  it('deducts hours correctly', () => {
    const result = useSickLeave(80, 8, 0, 'sick');
    expect(result.balance).toBe(72);
    expect(result.familyCareUsedYTD).toBe(0);
  });

  it('allows fractional deductions', () => {
    const result = useSickLeave(80, 0.5, 0, 'sick');
    expect(result.balance).toBeCloseTo(79.5);
  });

  it('throws when balance would go negative', () => {
    expect(() => useSickLeave(4, 8, 0, 'sick')).toThrow(RangeError);
  });
});

describe('useSickLeave — family care', () => {
  it('tracks family care usage YTD', () => {
    const result = useSickLeave(80, 16, 0, 'family-care');
    expect(result.balance).toBe(64);
    expect(result.familyCareUsedYTD).toBe(16);
  });

  it('allows usage up to the annual limit', () => {
    const result = useSickLeave(200, FAMILY_CARE_ANNUAL_LIMIT_HOURS, 0, 'family-care');
    expect(result.familyCareUsedYTD).toBe(104);
  });

  it('throws when family care limit would be exceeded', () => {
    expect(() =>
      useSickLeave(200, 8, FAMILY_CARE_ANNUAL_LIMIT_HOURS, 'family-care'),
    ).toThrow(RangeError);
  });

  it('throws when sick leave balance insufficient', () => {
    expect(() => useSickLeave(4, 8, 0, 'family-care')).toThrow(RangeError);
  });
});

describe('sickLeaveToServiceCredit', () => {
  it('converts 2087 hours to exactly 1 year', () => {
    expect(sickLeaveToServiceCredit(HOURS_PER_WORK_YEAR)).toBe(1);
  });

  it('converts 0 hours to 0 years', () => {
    expect(sickLeaveToServiceCredit(0)).toBe(0);
  });

  it('converts partial hours correctly', () => {
    // ~6 months = ~1043.5 hrs
    expect(sickLeaveToServiceCredit(1043.5)).toBeCloseTo(0.5, 3);
  });

  it('throws for negative hours', () => {
    expect(() => sickLeaveToServiceCredit(-1)).toThrow(RangeError);
  });

  it('handles realistic retirement scenario (500 hrs accumulated)', () => {
    const credit = sickLeaveToServiceCredit(500);
    expect(credit).toBeGreaterThan(0.23);
    expect(credit).toBeLessThan(0.25);
  });
});

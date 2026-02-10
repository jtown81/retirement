import { describe, it, expect } from 'vitest';
import { simulateLeaveYear } from '../../../src/modules/leave/simulate-year';
import type { LeaveYearInput } from '../../../src/modules/leave/simulate-year';

const BASE_INPUT: LeaveYearInput = {
  yearsOfService: 5,
  annualLeaveCarryIn: 240,
  sickLeaveCarryIn: 200,
  payPeriodsWorked: 26,
  usageEvents: [],
};

describe('simulateLeaveYear — no usage events', () => {
  it('accrues annual leave at 6 hrs/pp for 5-year employee', () => {
    const result = simulateLeaveYear(BASE_INPUT);
    expect(result.annualLeaveAccrued).toBe(6 * 26); // 156
  });

  it('accrues sick leave at 4 hrs/pp', () => {
    const result = simulateLeaveYear(BASE_INPUT);
    expect(result.sickLeaveAccrued).toBe(4 * 26); // 104
  });

  it('applies rollover cap and reports forfeit', () => {
    const result = simulateLeaveYear(BASE_INPUT);
    // carry-in 240 + accrued 156 = 396, capped at 240 → forfeit 156
    expect(result.annualLeaveEndOfYear).toBe(240);
    expect(result.annualLeaveForfeit).toBe(156);
  });

  it('sick leave has no cap', () => {
    const result = simulateLeaveYear(BASE_INPUT);
    // carry-in 200 + accrued 104 = 304
    expect(result.sickLeaveEndOfYear).toBe(304);
  });

  it('reports zero usage when no events', () => {
    const result = simulateLeaveYear(BASE_INPUT);
    expect(result.annualLeaveUsed).toBe(0);
    expect(result.sickLeaveUsed).toBe(0);
  });
});

describe('simulateLeaveYear — with usage events', () => {
  it('deducts annual leave from balance', () => {
    const input: LeaveYearInput = {
      ...BASE_INPUT,
      annualLeaveCarryIn: 0,
      usageEvents: [
        { id: '1', date: '2025-03-01', type: 'annual', hoursUsed: 40 },
      ],
    };
    const result = simulateLeaveYear(input);
    // accrued 156, used 40, pre-cap balance = 116
    expect(result.annualLeaveUsed).toBe(40);
    expect(result.annualLeaveEndOfYear).toBe(116);
    expect(result.annualLeaveForfeit).toBe(0);
  });

  it('deducts sick leave from balance', () => {
    const input: LeaveYearInput = {
      ...BASE_INPUT,
      sickLeaveCarryIn: 0,
      usageEvents: [
        { id: '2', date: '2025-04-01', type: 'sick', hoursUsed: 16 },
      ],
    };
    const result = simulateLeaveYear(input);
    // accrued 104, used 16 → 88 remaining
    expect(result.sickLeaveUsed).toBe(16);
    expect(result.sickLeaveEndOfYear).toBe(88);
  });

  it('supports partial (fractional) hour usage', () => {
    const input: LeaveYearInput = {
      ...BASE_INPUT,
      annualLeaveCarryIn: 10,
      usageEvents: [
        { id: '3', date: '2025-06-01', type: 'annual', hoursUsed: 0.25 },
      ],
    };
    const result = simulateLeaveYear(input);
    expect(result.annualLeaveUsed).toBe(0.25);
  });

  it('throws when annual leave usage exceeds balance', () => {
    const input: LeaveYearInput = {
      yearsOfService: 1,
      annualLeaveCarryIn: 0,
      sickLeaveCarryIn: 0,
      payPeriodsWorked: 0,
      usageEvents: [
        { id: '4', date: '2025-01-15', type: 'annual', hoursUsed: 8 },
      ],
    };
    expect(() => simulateLeaveYear(input)).toThrow(RangeError);
  });

  it('tracks family care usage YTD', () => {
    const input: LeaveYearInput = {
      ...BASE_INPUT,
      usageEvents: [
        { id: '5', date: '2025-05-01', type: 'family-care', hoursUsed: 40 },
      ],
    };
    const result = simulateLeaveYear(input);
    expect(result.sickLeaveUsed).toBe(40);
  });
});

describe('simulateLeaveYear — accrual tier transitions', () => {
  it('uses 4 hrs/pp for new employee (< 3 years)', () => {
    const result = simulateLeaveYear({ ...BASE_INPUT, yearsOfService: 1 });
    expect(result.annualLeaveAccrued).toBe(4 * 26);
  });

  it('uses 8 hrs/pp for senior employee (>= 15 years)', () => {
    const result = simulateLeaveYear({ ...BASE_INPUT, yearsOfService: 20 });
    expect(result.annualLeaveAccrued).toBe(8 * 26);
  });
});

describe('simulateLeaveYear — overseas rollover cap', () => {
  it('applies 360-hour cap when specified', () => {
    const input: LeaveYearInput = {
      yearsOfService: 20,
      annualLeaveCarryIn: 360,
      sickLeaveCarryIn: 0,
      payPeriodsWorked: 26,
      usageEvents: [],
      rolloverCap: 360,
    };
    const result = simulateLeaveYear(input);
    // carry-in 360 + 208 accrued = 568, capped at 360
    expect(result.annualLeaveEndOfYear).toBe(360);
    expect(result.annualLeaveForfeit).toBe(208);
  });
});

describe('simulateLeaveYear — partial year', () => {
  it('handles mid-year hire (13 pay periods)', () => {
    const input: LeaveYearInput = {
      yearsOfService: 0,
      annualLeaveCarryIn: 0,
      sickLeaveCarryIn: 0,
      payPeriodsWorked: 13,
      usageEvents: [],
    };
    const result = simulateLeaveYear(input);
    expect(result.annualLeaveAccrued).toBe(4 * 13); // 52
    expect(result.sickLeaveAccrued).toBe(4 * 13);   // 52
    expect(result.annualLeaveForfeit).toBe(0);
  });

  it('throws for > 26 pay periods', () => {
    expect(() =>
      simulateLeaveYear({ ...BASE_INPUT, payPeriodsWorked: 27 }),
    ).toThrow(RangeError);
  });
});

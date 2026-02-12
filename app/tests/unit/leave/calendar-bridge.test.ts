import { describe, it, expect } from 'vitest';
import {
  computeCalendarYearSummary,
  calendarEntriesToLeaveEvents,
  calendarToLeaveBalance,
} from '@modules/leave/calendar-bridge';
import type { LeaveCalendarYear, CalendarLeaveEntry } from '@models/leave-calendar';

function makeYear(overrides: Partial<LeaveCalendarYear> = {}): LeaveCalendarYear {
  return {
    year: 2026,
    accrualRatePerPP: 4,
    carryOver: { annualLeaveHours: 0, sickLeaveHours: 0 },
    entries: [],
    ...overrides,
  };
}

function makeEntry(overrides: Partial<CalendarLeaveEntry>): CalendarLeaveEntry {
  return {
    id: 'test-1',
    date: '2026-03-15',
    leaveType: 'planned-annual',
    hours: 8,
    ...overrides,
  };
}

describe('computeCalendarYearSummary', () => {
  it('computes accruals for 26 pay periods at 4 hrs/PP', () => {
    const summary = computeCalendarYearSummary(makeYear({ accrualRatePerPP: 4 }));
    expect(summary.annualAccrued).toBe(104); // 4 * 26
    expect(summary.sickAccrued).toBe(104); // 4 * 26
  });

  it('computes accruals at 6 hrs/PP (160 hrs/year per 5 U.S.C. § 6303)', () => {
    const summary = computeCalendarYearSummary(makeYear({ accrualRatePerPP: 6 }));
    expect(summary.annualAccrued).toBe(160); // 25 PP × 6 + 1 PP × 10
  });

  it('computes accruals at 8 hrs/PP', () => {
    const summary = computeCalendarYearSummary(makeYear({ accrualRatePerPP: 8 }));
    expect(summary.annualAccrued).toBe(208); // 8 * 26
  });

  it('includes carry-over in projected EOY', () => {
    const summary = computeCalendarYearSummary(
      makeYear({
        accrualRatePerPP: 4,
        carryOver: { annualLeaveHours: 100, sickLeaveHours: 200 },
      }),
    );
    expect(summary.projectedAnnualEOY).toBe(204); // 100 + 104
    expect(summary.projectedSickEOY).toBe(304); // 200 + 104
  });

  it('tallies planned and actual usage separately', () => {
    const entries: CalendarLeaveEntry[] = [
      makeEntry({ id: '1', leaveType: 'planned-annual', hours: 8 }),
      makeEntry({ id: '2', leaveType: 'actual-annual', hours: 4, date: '2026-03-16' }),
      makeEntry({ id: '3', leaveType: 'planned-sick', hours: 8, date: '2026-04-01' }),
      makeEntry({ id: '4', leaveType: 'actual-sick', hours: 2, date: '2026-04-02' }),
    ];
    const summary = computeCalendarYearSummary(makeYear({ entries }));
    expect(summary.plannedAnnualUsed).toBe(8);
    expect(summary.actualAnnualUsed).toBe(4);
    expect(summary.plannedSickUsed).toBe(8);
    expect(summary.actualSickUsed).toBe(2);
    expect(summary.totalAnnualUsed).toBe(12);
    expect(summary.totalSickUsed).toBe(10);
  });

  it('tallies LS and DE sick leave separately', () => {
    const entries: CalendarLeaveEntry[] = [
      makeEntry({ id: '1', leaveType: 'planned-sick', hours: 8, date: '2026-03-10', sickCode: 'LS' }),
      makeEntry({ id: '2', leaveType: 'planned-sick', hours: 4, date: '2026-03-11', sickCode: 'DE' }),
      makeEntry({ id: '3', leaveType: 'actual-sick', hours: 8, date: '2026-04-01', sickCode: 'LS' }),
      makeEntry({ id: '4', leaveType: 'actual-sick', hours: 2, date: '2026-04-02', sickCode: 'DE' }),
      makeEntry({ id: '5', leaveType: 'planned-sick', hours: 6, date: '2026-05-01' }), // no code → defaults to LS
    ];
    const summary = computeCalendarYearSummary(makeYear({ entries }));
    expect(summary.plannedSickLS).toBe(14); // 8 + 6 (default)
    expect(summary.plannedSickDE).toBe(4);
    expect(summary.actualSickLS).toBe(8);
    expect(summary.actualSickDE).toBe(2);
    expect(summary.totalSickUsed).toBe(28); // 14 + 4 + 8 + 2
  });

  it('computes use-or-lose when projected balance exceeds 240', () => {
    const summary = computeCalendarYearSummary(
      makeYear({
        accrualRatePerPP: 8, // 208 accrued
        carryOver: { annualLeaveHours: 240, sickLeaveHours: 0 },
      }),
    );
    // 240 + 208 = 448 projected; 448 - 240 = 208 use-or-lose
    expect(summary.useOrLoseHours).toBe(208);
    expect(summary.projectedAnnualAfterCap).toBe(240);
  });

  it('no use-or-lose when balance is under 240', () => {
    const summary = computeCalendarYearSummary(
      makeYear({
        accrualRatePerPP: 4, // 104 accrued
        carryOver: { annualLeaveHours: 100, sickLeaveHours: 0 },
      }),
    );
    expect(summary.useOrLoseHours).toBe(0);
  });
});

describe('calendarEntriesToLeaveEvents', () => {
  it('converts entries and maps leave types correctly', () => {
    const entries: CalendarLeaveEntry[] = [
      makeEntry({ id: '1', leaveType: 'planned-annual', date: '2026-03-15' }),
      makeEntry({ id: '2', leaveType: 'actual-sick', hours: 4, date: '2026-01-05' }),
    ];
    const events = calendarEntriesToLeaveEvents(entries);
    expect(events).toHaveLength(2);
    // Sorted by date
    expect(events[0].date).toBe('2026-01-05');
    expect(events[0].type).toBe('sick');
    expect(events[0].hoursUsed).toBe(4);
    expect(events[1].date).toBe('2026-03-15');
    expect(events[1].type).toBe('annual');
    expect(events[1].hoursUsed).toBe(8);
  });

  it('returns empty array for no entries', () => {
    expect(calendarEntriesToLeaveEvents([])).toEqual([]);
  });
});

describe('calendarToLeaveBalance', () => {
  it('returns a LeaveBalance with projected EOY values', () => {
    const year = makeYear({
      carryOver: { annualLeaveHours: 100, sickLeaveHours: 200 },
      accrualRatePerPP: 4,
    });
    const balance = calendarToLeaveBalance(year, '2026-06-15');
    expect(balance.asOf).toBe('2026-06-15');
    expect(balance.annualLeaveHours).toBe(204); // 100 + 104
    expect(balance.sickLeaveHours).toBe(304); // 200 + 104
    expect(balance.familyCareUsedCurrentYear).toBe(0);
  });

  it('clamps negative balances to 0', () => {
    const entries: CalendarLeaveEntry[] = Array.from({ length: 20 }, (_, i) =>
      makeEntry({
        id: `e-${i}`,
        leaveType: 'planned-annual',
        hours: 8,
        date: `2026-${String(Math.floor(i / 5) + 1).padStart(2, '0')}-${String((i % 5) * 2 + 1).padStart(2, '0')}`,
      }),
    );
    const year = makeYear({
      carryOver: { annualLeaveHours: 0, sickLeaveHours: 0 },
      accrualRatePerPP: 4,
      entries,
    });
    const balance = calendarToLeaveBalance(year);
    // 0 + 104 - 160 = -56 → clamped to 0
    expect(balance.annualLeaveHours).toBe(0);
  });
});

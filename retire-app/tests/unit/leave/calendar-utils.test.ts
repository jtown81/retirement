import { describe, it, expect } from 'vitest';
import {
  isWeekend,
  weekdaysInRange,
  weekdaysInMonth,
  weekdaysInYear,
  formatDate,
  parseDate,
} from '@modules/leave/calendar-utils';

describe('isWeekend', () => {
  it('returns true for Saturday', () => {
    expect(isWeekend(new Date(2026, 0, 3))).toBe(true); // Jan 3 2026 is Saturday
  });

  it('returns true for Sunday', () => {
    expect(isWeekend(new Date(2026, 0, 4))).toBe(true); // Jan 4 2026 is Sunday
  });

  it('returns false for Monday', () => {
    expect(isWeekend(new Date(2026, 0, 5))).toBe(false); // Jan 5 2026 is Monday
  });

  it('returns false for Friday', () => {
    expect(isWeekend(new Date(2026, 0, 2))).toBe(false); // Jan 2 2026 is Friday
  });
});

describe('formatDate', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('pads month and day', () => {
    expect(formatDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('parseDate', () => {
  it('parses YYYY-MM-DD string', () => {
    const d = parseDate('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // 0-indexed
    expect(d.getDate()).toBe(15);
  });
});

describe('weekdaysInRange', () => {
  it('returns only weekdays for a Mon-Fri week', () => {
    // Jan 5-9 2026 = Mon-Fri
    const result = weekdaysInRange(new Date(2026, 0, 5), new Date(2026, 0, 9));
    expect(result).toEqual([
      '2026-01-05',
      '2026-01-06',
      '2026-01-07',
      '2026-01-08',
      '2026-01-09',
    ]);
  });

  it('excludes weekends in a full week', () => {
    // Jan 5-11 2026 = Mon-Sun
    const result = weekdaysInRange(new Date(2026, 0, 5), new Date(2026, 0, 11));
    expect(result).toHaveLength(5);
    expect(result).not.toContain('2026-01-10'); // Saturday
    expect(result).not.toContain('2026-01-11'); // Sunday
  });

  it('returns empty for weekend-only range', () => {
    // Jan 3-4 2026 = Sat-Sun
    const result = weekdaysInRange(new Date(2026, 0, 3), new Date(2026, 0, 4));
    expect(result).toEqual([]);
  });

  it('returns single day for same start and end on weekday', () => {
    const result = weekdaysInRange(new Date(2026, 0, 5), new Date(2026, 0, 5));
    expect(result).toEqual(['2026-01-05']);
  });
});

describe('weekdaysInMonth', () => {
  it('returns correct count for January 2026', () => {
    const result = weekdaysInMonth(2026, 0); // January
    expect(result.length).toBe(22); // Jan 2026: 22 weekdays
  });

  it('returns correct count for February 2026 (non-leap)', () => {
    const result = weekdaysInMonth(2026, 1);
    expect(result.length).toBe(20); // Feb 2026: 20 weekdays
  });

  it('all dates are in the correct month', () => {
    const result = weekdaysInMonth(2026, 5); // June
    for (const d of result) {
      expect(d).toMatch(/^2026-06-\d{2}$/);
    }
  });
});

describe('weekdaysInYear', () => {
  it('returns 261 weekdays for 2026', () => {
    expect(weekdaysInYear(2026)).toBe(261);
  });

  it('returns a reasonable number (260-262) for any year', () => {
    const count = weekdaysInYear(2024);
    expect(count).toBeGreaterThanOrEqual(260);
    expect(count).toBeLessThanOrEqual(262);
  });
});

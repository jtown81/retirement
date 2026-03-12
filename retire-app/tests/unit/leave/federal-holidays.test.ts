import { describe, it, expect } from 'vitest';
import { getFederalHolidays } from '../../../src/data/federal-holidays';

describe('getFederalHolidays', () => {
  it('returns 11 holidays for a typical year', () => {
    const holidays = getFederalHolidays(2026);
    expect(holidays.size).toBe(11);
  });

  it('computes correct dates for 2026', () => {
    const h = getFederalHolidays(2026);
    expect(h.get('2026-01-01')).toBe("New Year's Day");
    expect(h.get('2026-01-19')).toBe('MLK Jr. Day');           // 3rd Monday
    expect(h.get('2026-02-16')).toBe("Presidents' Day");       // 3rd Monday
    expect(h.get('2026-05-25')).toBe('Memorial Day');           // Last Monday
    expect(h.get('2026-06-19')).toBe('Juneteenth');             // Friday
    expect(h.get('2026-07-03')).toBe('Independence Day');       // July 4 is Saturday → observed Friday Jul 3
    expect(h.get('2026-09-07')).toBe('Labor Day');              // 1st Monday
    expect(h.get('2026-10-12')).toBe('Columbus Day');           // 2nd Monday
    expect(h.get('2026-11-11')).toBe('Veterans Day');           // Wednesday
    expect(h.get('2026-11-26')).toBe('Thanksgiving');           // 4th Thursday
    expect(h.get('2026-12-25')).toBe('Christmas Day');          // Friday
  });

  it('applies observed-date rule for Sunday holidays', () => {
    // 2027: July 4 is Sunday → observed Monday July 5
    const h = getFederalHolidays(2027);
    expect(h.get('2027-07-05')).toBe('Independence Day');
    expect(h.has('2027-07-04')).toBe(false);
  });

  it('applies observed-date rule for Saturday holidays', () => {
    // 2026: July 4 is Saturday → observed Friday July 3
    const h = getFederalHolidays(2026);
    expect(h.get('2026-07-03')).toBe('Independence Day');
    expect(h.has('2026-07-04')).toBe(false);
  });

  it('handles 2025 correctly', () => {
    const h = getFederalHolidays(2025);
    expect(h.get('2025-01-01')).toBe("New Year's Day");
    expect(h.get('2025-01-20')).toBe('MLK Jr. Day');
    expect(h.get('2025-12-25')).toBe('Christmas Day');
  });
});

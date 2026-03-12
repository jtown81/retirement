/**
 * Federal Holidays
 *
 * Computes the 11 federal holidays for any given year, including
 * observed date adjustments (Saturday → Friday, Sunday → Monday).
 *
 * Source: 5 U.S.C. § 6103; OPM Federal Holidays
 */

/** Returns the Nth occurrence of a weekday in a month (1-indexed). */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  let dayOffset = weekday - first.getDay();
  if (dayOffset < 0) dayOffset += 7;
  const day = 1 + dayOffset + (n - 1) * 7;
  return new Date(year, month, day);
}

/** Returns the last occurrence of a weekday in a month. */
function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  let dayOffset = lastDay.getDay() - weekday;
  if (dayOffset < 0) dayOffset += 7;
  return new Date(year, month, lastDay.getDate() - dayOffset);
}

/** Applies the federal observed-date rule: Sat → Fri, Sun → Mon. */
function observedDate(date: Date): Date {
  const day = date.getDay();
  if (day === 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  if (day === 0) return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return date;
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface HolidayDef {
  name: string;
  date: (year: number) => Date;
}

const HOLIDAY_DEFS: HolidayDef[] = [
  { name: "New Year's Day", date: (y) => new Date(y, 0, 1) },
  { name: 'MLK Jr. Day', date: (y) => nthWeekdayOfMonth(y, 0, 1, 3) }, // 3rd Monday Jan
  { name: "Presidents' Day", date: (y) => nthWeekdayOfMonth(y, 1, 1, 3) }, // 3rd Monday Feb
  { name: 'Memorial Day', date: (y) => lastWeekdayOfMonth(y, 4, 1) }, // Last Monday May
  { name: 'Juneteenth', date: (y) => new Date(y, 5, 19) },
  { name: 'Independence Day', date: (y) => new Date(y, 6, 4) },
  { name: 'Labor Day', date: (y) => nthWeekdayOfMonth(y, 8, 1, 1) }, // 1st Monday Sep
  { name: 'Columbus Day', date: (y) => nthWeekdayOfMonth(y, 9, 1, 2) }, // 2nd Monday Oct
  { name: 'Veterans Day', date: (y) => new Date(y, 10, 11) },
  { name: 'Thanksgiving', date: (y) => nthWeekdayOfMonth(y, 10, 4, 4) }, // 4th Thursday Nov
  { name: 'Christmas Day', date: (y) => new Date(y, 11, 25) },
];

/**
 * Returns a Map of observed federal holiday dates for a given year.
 * Keys are ISO date strings (YYYY-MM-DD), values are holiday names.
 */
export function getFederalHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();
  for (const def of HOLIDAY_DEFS) {
    const raw = def.date(year);
    const observed = observedDate(raw);
    holidays.set(formatISO(observed), def.name);
  }
  return holidays;
}

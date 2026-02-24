/**
 * Calendar Date Utilities
 *
 * Pure functions for working with weekdays in leave calendar context.
 * No side effects, no business logic beyond date math.
 */

/**
 * Returns true if the given date falls on a Saturday or Sunday.
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Returns all weekdays (Mon–Fri) between start and end (inclusive).
 * Dates are returned as YYYY-MM-DD strings.
 */
export function weekdaysInRange(start: Date, end: Date): string[] {
  const result: string[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (current <= endDate) {
    if (!isWeekend(current)) {
      result.push(formatDate(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

/**
 * Returns all weekdays (Mon–Fri) in a given month.
 * Dates are returned as YYYY-MM-DD strings.
 *
 * @param year - Full year (e.g. 2026)
 * @param month - 0-indexed month (0 = January)
 */
export function weekdaysInMonth(year: number, month: number): string[] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0); // last day of month
  return weekdaysInRange(start, end);
}

/**
 * Returns the number of weekdays in a year (typically 260 or 261).
 */
export function weekdaysInYear(year: number): number {
  return weekdaysInRange(new Date(year, 0, 1), new Date(year, 11, 31)).length;
}

/**
 * Formats a Date as YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date (local time).
 */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

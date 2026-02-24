/**
 * Date Utilities — pure functions, no side effects.
 */

/** Returns fractional years between two ISO date strings */
export function yearsBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

/** Returns age in whole years as of a given date */
export function ageAsOf(birthDate: string, asOfDate: string): number {
  return Math.floor(yearsBetween(birthDate, asOfDate));
}

/** Formats a Date to ISO date string YYYY-MM-DD */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Currency Utilities — pure functions, no side effects.
 */

/** Rounds to nearest cent */
export function roundToCent(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Formats a USD amount as a string with 2 decimal places */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

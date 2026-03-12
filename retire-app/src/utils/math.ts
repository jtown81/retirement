/**
 * Math Utilities — pure functions, no side effects.
 */

/** Compound growth: principal × (1 + rate)^years */
export function compoundGrowth(principal: number, annualRate: number, years: number): number {
  return principal * Math.pow(1 + annualRate, years);
}

/** Future value of annuity (regular payments growing at rate) */
export function futureValueAnnuity(payment: number, annualRate: number, periods: number): number {
  if (annualRate === 0) return payment * periods;
  return payment * ((Math.pow(1 + annualRate, periods) - 1) / annualRate);
}

/** Clamps value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

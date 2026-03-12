/**
 * Unit tests: Annual Pay Calculator (GS, LEO, Title 38)
 */

import { describe, it, expect } from 'vitest';
import { calculateAnnualPay, LEO_AVAILABILITY_PAY_RATE } from '@modules/career/pay-calculator';

describe('calculateAnnualPay — GS', () => {
  it('computes GS-13 Step 1 Washington DC total pay for 2024', () => {
    const result = calculateAnnualPay(13, 1, 'WASHINGTON', 2024, 'GS');
    // Base: $86,468; DC locality: 33.26%
    // Total: 86468 × 1.3326 ≈ $115,249
    expect(result.baseSalary).toBe(86_468);
    expect(result.leapSupplement).toBe(0);
    expect(result.localityRate).toBeCloseTo(0.3326, 4);
    expect(result.totalAnnualPay).toBeCloseTo(86_468 * 1.3326, -1);
  });

  it('computes GS-7 Step 1 RUS total pay for 2024', () => {
    const result = calculateAnnualPay(7, 1, 'RUS', 2024, 'GS');
    // Base: $41,148; RUS locality: 16.82%
    expect(result.baseSalary).toBe(41_148);
    expect(result.totalAnnualPay).toBeCloseTo(41_148 * 1.1682, -1);
  });

  it('locality amount is baseSalary × localityRate (rounded)', () => {
    const result = calculateAnnualPay(11, 5, 'CHICAGO', 2024, 'GS');
    expect(result.localityAmount).toBe(Math.round(result.baseSalary * result.localityRate));
    expect(result.totalAnnualPay).toBe(result.baseSalary + result.localityAmount);
  });

  it('defaults to GS pay system when not specified', () => {
    const withDefault = calculateAnnualPay(9, 3, 'RUS', 2024);
    const withExplicit = calculateAnnualPay(9, 3, 'RUS', 2024, 'GS');
    expect(withDefault.totalAnnualPay).toBe(withExplicit.totalAnnualPay);
  });

  it('falls back to RUS for unknown locality code', () => {
    const result = calculateAnnualPay(9, 1, 'UNKNOWN_LOC', 2024, 'GS');
    const rus = calculateAnnualPay(9, 1, 'RUS', 2024, 'GS');
    expect(result.totalAnnualPay).toBe(rus.totalAnnualPay);
  });
});

describe('calculateAnnualPay — LEO', () => {
  it('LEO pay includes 25% LEAP supplement', () => {
    const result = calculateAnnualPay(13, 1, 'WASHINGTON', 2024, 'LEO');
    expect(result.leapSupplement).toBe(Math.round(86_468 * LEO_AVAILABILITY_PAY_RATE));
    expect(result.adjustedBase).toBe(result.baseSalary + result.leapSupplement);
  });

  it('locality applies to adjustedBase (base + LEAP), not just base', () => {
    const result = calculateAnnualPay(13, 1, 'WASHINGTON', 2024, 'LEO');
    // Locality is applied to adjustedBase
    expect(result.localityAmount).toBe(Math.round(result.adjustedBase * result.localityRate));
    expect(result.totalAnnualPay).toBe(result.adjustedBase + result.localityAmount);
  });

  it('LEO total is always greater than equivalent GS pay', () => {
    const leo = calculateAnnualPay(12, 5, 'DALLAS', 2024, 'LEO');
    const gs = calculateAnnualPay(12, 5, 'DALLAS', 2024, 'GS');
    expect(leo.totalAnnualPay).toBeGreaterThan(gs.totalAnnualPay);
  });

  it('LEO_AVAILABILITY_PAY_RATE is 0.25', () => {
    expect(LEO_AVAILABILITY_PAY_RATE).toBe(0.25);
  });
});

describe('calculateAnnualPay — Title 38', () => {
  it('uses the provided title38Salary, not the GS table', () => {
    const result = calculateAnnualPay(12, 5, 'WASHINGTON', 2024, 'Title38', 120_000);
    expect(result.baseSalary).toBe(120_000);
    expect(result.leapSupplement).toBe(0);
  });

  it('applies locality to the VA-set base salary', () => {
    const result = calculateAnnualPay(12, 5, 'WASHINGTON', 2024, 'Title38', 120_000);
    expect(result.totalAnnualPay).toBeCloseTo(120_000 * 1.3326, -1);
  });

  it('throws if title38Salary is not provided for Title38 pay system', () => {
    expect(() => calculateAnnualPay(12, 5, 'WASHINGTON', 2024, 'Title38')).toThrow();
  });
});

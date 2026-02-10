import { describe, it, expect } from 'vitest';
import { computeFERSAnnuity, computeFERSSupplement, computeHigh3 } from '../../../src/modules/simulation/annuity';

describe('computeHigh3', () => {
  it('returns single salary for one year of history', () => {
    expect(computeHigh3([{ year: 2024, annualSalary: 90_000 }])).toBe(90_000);
  });

  it('returns correct 3-year average for exactly 3 years', () => {
    const history = [
      { year: 2022, annualSalary: 80_000 },
      { year: 2023, annualSalary: 85_000 },
      { year: 2024, annualSalary: 90_000 },
    ];
    expect(computeHigh3(history)).toBeCloseTo((80_000 + 85_000 + 90_000) / 3, 2);
  });

  it('finds the highest 3-year window', () => {
    const history = [
      { year: 2020, annualSalary: 70_000 },
      { year: 2021, annualSalary: 75_000 },
      { year: 2022, annualSalary: 85_000 },
      { year: 2023, annualSalary: 90_000 },
      { year: 2024, annualSalary: 95_000 },
    ];
    // Highest 3-year window is 2022-2024: (85k+90k+95k)/3
    expect(computeHigh3(history)).toBeCloseTo((85_000 + 90_000 + 95_000) / 3, 2);
  });
});

describe('computeFERSAnnuity', () => {
  it('applies 1.0% multiplier for standard retirement (under 62)', () => {
    const result = computeFERSAnnuity(90_000, 30, 57);
    expect(result.multiplier).toBe(0.01);
    expect(result.grossAnnualAnnuity).toBeCloseTo(90_000 * 30 * 0.01);
    expect(result.netAnnualAnnuity).toBeCloseTo(27_000);
  });

  it('applies 1.1% multiplier at age 62 with 20+ years', () => {
    const result = computeFERSAnnuity(90_000, 30, 62);
    expect(result.multiplier).toBe(0.011);
    expect(result.grossAnnualAnnuity).toBeCloseTo(90_000 * 30 * 0.011);
    expect(result.netAnnualAnnuity).toBeCloseTo(29_700);
  });

  it('applies 1.0% multiplier at age 62 with < 20 years', () => {
    const result = computeFERSAnnuity(90_000, 15, 62);
    expect(result.multiplier).toBe(0.01);
  });

  it('no MRA+10 reduction for standard eligibility', () => {
    const result = computeFERSAnnuity(90_000, 30, 57, 'MRA+30');
    expect(result.reductionFactor).toBe(1.0);
    expect(result.netAnnualAnnuity).toBe(result.grossAnnualAnnuity);
  });

  it('applies MRA+10 reduction for reduced retirement', () => {
    // Age 58, 4 years under 62 → 80% factor
    const result = computeFERSAnnuity(90_000, 15, 58, 'MRA+10-reduced');
    expect(result.reductionFactor).toBeCloseTo(0.80);
    expect(result.netAnnualAnnuity).toBeCloseTo(result.grossAnnualAnnuity * 0.80);
  });

  it('throws for negative high3Salary', () => {
    expect(() => computeFERSAnnuity(-1, 30, 57)).toThrow(RangeError);
  });

  it('throws for negative service years', () => {
    expect(() => computeFERSAnnuity(90_000, -1, 57)).toThrow(RangeError);
  });
});

describe('computeFERSSupplement', () => {
  it('eligible for MRA+30 retirement before age 62', () => {
    const result = computeFERSSupplement(57, 'MRA+30', 30, 1500);
    expect(result.eligible).toBe(true);
    // Monthly: 1500 × (30/40) = 1125; Annual: 13,500
    expect(result.annualAmount).toBeCloseTo(1500 * (30 / 40) * 12, 1);
  });

  it('eligible for Age60+20 retirement', () => {
    const result = computeFERSSupplement(60, 'Age60+20', 20, 1500);
    expect(result.eligible).toBe(true);
  });

  it('NOT eligible for MRA+10-reduced retirement', () => {
    const result = computeFERSSupplement(57, 'MRA+10-reduced', 15, 1500);
    expect(result.eligible).toBe(false);
    expect(result.annualAmount).toBe(0);
  });

  it('NOT eligible for Age62+5 retirement (age >= 62)', () => {
    const result = computeFERSSupplement(62, 'Age62+5', 25, 1500);
    expect(result.eligible).toBe(false);
    expect(result.annualAmount).toBe(0);
  });

  it('caps federal years at 40 for SRS calculation', () => {
    const r40 = computeFERSSupplement(57, 'MRA+30', 40, 1500);
    const r45 = computeFERSSupplement(57, 'MRA+30', 45, 1500);
    expect(r40.annualAmount).toBe(r45.annualAmount);
  });

  it('returns 0 when estimatedSSAt62 is 0', () => {
    const result = computeFERSSupplement(57, 'MRA+30', 30, 0);
    expect(result.eligible).toBe(true);
    expect(result.annualAmount).toBe(0);
  });

  it('throws for negative estimatedSSAt62', () => {
    expect(() => computeFERSSupplement(57, 'MRA+30', 30, -1)).toThrow(RangeError);
  });
});

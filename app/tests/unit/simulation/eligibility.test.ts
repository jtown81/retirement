import { describe, it, expect } from 'vitest';
import { getMRA, checkFERSEligibility, mra10ReductionFactor } from '../../../src/modules/simulation/eligibility';

describe('getMRA', () => {
  it('returns 55 for birth years before 1948', () => {
    const r = getMRA(1945);
    expect(r.years).toBe(55);
    expect(r.months).toBe(0);
    expect(r.decimalAge).toBe(55);
  });

  it('returns 55y 2m for birth year 1948', () => {
    const r = getMRA(1948);
    expect(r.years).toBe(55);
    expect(r.months).toBe(2);
    expect(r.decimalAge).toBeCloseTo(55 + 2 / 12, 5);
  });

  it('returns 55y 10m for birth year 1952', () => {
    const r = getMRA(1952);
    expect(r.years).toBe(55);
    expect(r.months).toBe(10);
  });

  it('returns 56 for birth years 1953–1964', () => {
    for (const yr of [1953, 1958, 1964]) {
      const r = getMRA(yr);
      expect(r.years).toBe(56);
      expect(r.months).toBe(0);
      expect(r.decimalAge).toBe(56);
    }
  });

  it('returns 56y 2m for birth year 1965', () => {
    const r = getMRA(1965);
    expect(r.years).toBe(56);
    expect(r.months).toBe(2);
  });

  it('returns 56y 10m for birth year 1969', () => {
    const r = getMRA(1969);
    expect(r.years).toBe(56);
    expect(r.months).toBe(10);
  });

  it('returns 57 for birth year 1970', () => {
    const r = getMRA(1970);
    expect(r.years).toBe(57);
    expect(r.months).toBe(0);
    expect(r.decimalAge).toBe(57);
  });

  it('returns 57 for all birth years >= 1970', () => {
    expect(getMRA(1980).decimalAge).toBe(57);
    expect(getMRA(2000).decimalAge).toBe(57);
  });

  it('throws for obviously invalid birth year', () => {
    expect(() => getMRA(1800)).toThrow(RangeError);
    expect(() => getMRA(2200)).toThrow(RangeError);
  });
});

describe('checkFERSEligibility', () => {
  const BIRTH_1970 = 1970; // MRA = 57

  it('eligible at MRA+30 (age 57, 30 years, born 1970)', () => {
    const r = checkFERSEligibility(57, 30, BIRTH_1970);
    expect(r.eligible).toBe(true);
    expect(r.type).toBe('MRA+30');
    expect(r.enhancedMultiplier).toBe(false);
  });

  it('eligible at Age 60+20', () => {
    const r = checkFERSEligibility(60, 20, BIRTH_1970);
    expect(r.eligible).toBe(true);
    expect(r.type).toBe('Age60+20');
    expect(r.enhancedMultiplier).toBe(false);
  });

  it('eligible at Age 62+5 (standard multiplier, < 20 years)', () => {
    const r = checkFERSEligibility(62, 10, BIRTH_1970);
    expect(r.eligible).toBe(true);
    expect(r.type).toBe('Age62+5');
    expect(r.enhancedMultiplier).toBe(false);
  });

  it('eligible at Age 62+20 with enhanced 1.1% multiplier', () => {
    const r = checkFERSEligibility(62, 20, BIRTH_1970);
    expect(r.eligible).toBe(true);
    expect(r.type).toBe('Age62+5');
    expect(r.enhancedMultiplier).toBe(true);
  });

  it('eligible MRA+10-reduced at MRA with 10–29 years', () => {
    const r = checkFERSEligibility(57, 15, BIRTH_1970);
    expect(r.eligible).toBe(true);
    expect(r.type).toBe('MRA+10-reduced');
  });

  it('not eligible before MRA', () => {
    const r = checkFERSEligibility(55, 30, BIRTH_1970);
    expect(r.eligible).toBe(false);
    expect(r.type).toBeNull();
  });

  it('not eligible at MRA with < 10 years service', () => {
    const r = checkFERSEligibility(57, 9, BIRTH_1970);
    expect(r.eligible).toBe(false);
  });

  it('Age62+5 takes priority over Age60+20', () => {
    // At 62 with 20+ years, should return Age62+5 (enhanced multiplier eligible)
    const r = checkFERSEligibility(62, 25, BIRTH_1970);
    expect(r.type).toBe('Age62+5');
    expect(r.enhancedMultiplier).toBe(true);
  });

  it('throws for negative age', () => {
    expect(() => checkFERSEligibility(-1, 30, BIRTH_1970)).toThrow(RangeError);
  });
});

describe('mra10ReductionFactor', () => {
  it('returns 1.0 at age 62 (no reduction)', () => {
    expect(mra10ReductionFactor(62)).toBe(1.0);
  });

  it('returns 1.0 above age 62', () => {
    expect(mra10ReductionFactor(65)).toBe(1.0);
  });

  it('returns 0.95 at age 61 (1 year under 62)', () => {
    expect(mra10ReductionFactor(61)).toBeCloseTo(0.95);
  });

  it('returns 0.80 at age 58 (4 years under 62)', () => {
    expect(mra10ReductionFactor(58)).toBeCloseTo(0.80);
  });

  it('uses floor for partial years', () => {
    // 58.5 → floor(62 - 58.5) = floor(3.5) = 3 years → 0.85
    expect(mra10ReductionFactor(58.5)).toBeCloseTo(0.85);
  });
});

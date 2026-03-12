import { describe, it, expect } from 'vitest';
import {
  computeBuybackDeposit,
  applyMilitaryServiceCredit,
  militaryServiceYearsFromRecord,
} from '../../../src/modules/military/buyback';

describe('computeBuybackDeposit — principal only', () => {
  it('computes 3% of one year of basic pay', () => {
    const result = computeBuybackDeposit({ 2010: 30_000 }, 2015);
    expect(result.principalDeposit).toBeCloseTo(900); // 30k × 0.03
    expect(result.interestAccrued).toBe(0);
    expect(result.totalDeposit).toBeCloseTo(900);
  });

  it('sums 3% across multiple years of service', () => {
    const result = computeBuybackDeposit(
      { 2005: 20_000, 2006: 21_000, 2007: 22_000 },
      2010,
    );
    expect(result.principalDeposit).toBeCloseTo((20_000 + 21_000 + 22_000) * 0.03);
  });

  it('returns zero for empty record', () => {
    const result = computeBuybackDeposit({}, 2024);
    expect(result.totalDeposit).toBe(0);
    expect(result.principalDeposit).toBe(0);
    expect(result.interestAccrued).toBe(0);
  });

  it('no interest when depositYear <= interestStartYear', () => {
    const result = computeBuybackDeposit({ 2010: 30_000 }, 2015, 2015);
    expect(result.interestAccrued).toBe(0);
  });

  it('no interest when interestStartYear is not provided', () => {
    const result = computeBuybackDeposit({ 2010: 30_000 }, 2020);
    expect(result.interestAccrued).toBe(0);
    expect(result.totalDeposit).toBe(result.principalDeposit);
  });

  it('throws for negative pay in any year', () => {
    expect(() =>
      computeBuybackDeposit({ 2010: -1000 }, 2020),
    ).toThrow(RangeError);
  });
});

describe('computeBuybackDeposit — with interest', () => {
  it('applies interest when deposit is made after interestStartYear', () => {
    const principal = 30_000 * 0.03; // 900
    const result = computeBuybackDeposit({ 2010: 30_000 }, 2025, 2023);
    expect(result.principalDeposit).toBeCloseTo(900);
    expect(result.interestAccrued).toBeGreaterThan(0);
    expect(result.totalDeposit).toBeGreaterThan(900);
  });

  it('total deposit exceeds principal when interest is applied', () => {
    const result = computeBuybackDeposit({ 2000: 25_000 }, 2024, 2005);
    expect(result.totalDeposit).toBeGreaterThan(result.principalDeposit);
    expect(result.totalDeposit).toBeCloseTo(
      result.principalDeposit + result.interestAccrued, 2,
    );
  });

  it('more years of interest = larger total deposit', () => {
    const shorter = computeBuybackDeposit({ 2010: 30_000 }, 2020, 2018);
    const longer = computeBuybackDeposit({ 2010: 30_000 }, 2020, 2010);
    expect(longer.totalDeposit).toBeGreaterThan(shorter.totalDeposit);
  });
});

describe('applyMilitaryServiceCredit', () => {
  it('adds military years when buyback is complete', () => {
    expect(applyMilitaryServiceCredit(20, 4, true)).toBe(24);
  });

  it('does not add years when buyback is not complete', () => {
    expect(applyMilitaryServiceCredit(20, 4, false)).toBe(20);
  });

  it('blocks credit if receiving military retirement without waiver', () => {
    expect(
      applyMilitaryServiceCredit(20, 4, true, true, false),
    ).toBe(20); // no credit — waiver required
  });

  it('grants credit if receiving military retirement AND waiver is filed', () => {
    expect(
      applyMilitaryServiceCredit(20, 4, true, true, true),
    ).toBe(24);
  });

  it('grants credit if NOT receiving military retirement (no waiver needed)', () => {
    expect(
      applyMilitaryServiceCredit(20, 4, true, false, false),
    ).toBe(24);
  });

  it('works with zero military service years', () => {
    expect(applyMilitaryServiceCredit(20, 0, true)).toBe(20);
  });

  it('works with zero civilian service years', () => {
    expect(applyMilitaryServiceCredit(0, 4, true)).toBe(4);
  });

  it('throws for negative civilian service years', () => {
    expect(() => applyMilitaryServiceCredit(-1, 4, true)).toThrow(RangeError);
  });

  it('throws for negative military service years', () => {
    expect(() => applyMilitaryServiceCredit(20, -1, true)).toThrow(RangeError);
  });
});

describe('militaryServiceYearsFromRecord', () => {
  it('counts years correctly', () => {
    expect(militaryServiceYearsFromRecord({ 2005: 20_000, 2006: 21_000 })).toBe(2);
  });

  it('returns 0 for empty record', () => {
    expect(militaryServiceYearsFromRecord({})).toBe(0);
  });
});

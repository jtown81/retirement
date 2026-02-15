import { describe, it, expect } from 'vitest';
import { computeRMD, isRMDRequired, getDistributionPeriod, getRMDStartAge } from '../../../src/modules/tsp/rmd';

describe('isRMDRequired', () => {
  it('returns false below age 73', () => {
    expect(isRMDRequired(72)).toBe(false);
    expect(isRMDRequired(60)).toBe(false);
    expect(isRMDRequired(0)).toBe(false);
  });

  it('returns true at age 73 and above', () => {
    expect(isRMDRequired(73)).toBe(true);
    expect(isRMDRequired(85)).toBe(true);
    expect(isRMDRequired(100)).toBe(true);
  });
});

describe('getDistributionPeriod', () => {
  it('returns correct period for age 73', () => {
    expect(getDistributionPeriod(73)).toBe(26.5);
  });

  it('returns correct period for age 80', () => {
    expect(getDistributionPeriod(80)).toBe(20.2);
  });

  it('returns correct period for age 90', () => {
    expect(getDistributionPeriod(90)).toBe(12.2);
  });

  it('returns correct period for age 100', () => {
    expect(getDistributionPeriod(100)).toBe(6.4);
  });

  it('clamps below minimum table age to age 72', () => {
    expect(getDistributionPeriod(50)).toBe(27.4);
  });

  it('clamps above maximum table age to age 115', () => {
    expect(getDistributionPeriod(120)).toBe(2.9);
  });
});

describe('computeRMD', () => {
  it('returns 0 when below RMD age', () => {
    expect(computeRMD(500_000, 72)).toBe(0);
    expect(computeRMD(500_000, 60)).toBe(0);
  });

  it('returns 0 when balance is 0', () => {
    expect(computeRMD(0, 75)).toBe(0);
  });

  it('returns 0 for negative balance', () => {
    expect(computeRMD(-100, 75)).toBe(0);
  });

  it('computes RMD at age 73 correctly', () => {
    // $500,000 / 26.5 = $18,867.92...
    const rmd = computeRMD(500_000, 73);
    expect(rmd).toBeCloseTo(18_867.92, 0);
  });

  it('computes RMD at age 80 correctly', () => {
    // $300,000 / 20.2 = $14,851.49...
    const rmd = computeRMD(300_000, 80);
    expect(rmd).toBeCloseTo(14_851.49, 0);
  });

  it('computes RMD at age 90 correctly', () => {
    // $200,000 / 12.2 = $16,393.44...
    const rmd = computeRMD(200_000, 90);
    expect(rmd).toBeCloseTo(16_393.44, 0);
  });

  it('RMD increases as a percentage with age', () => {
    const balance = 500_000;
    const rmd73 = computeRMD(balance, 73);
    const rmd80 = computeRMD(balance, 80);
    const rmd90 = computeRMD(balance, 90);
    // Percentage should increase with age (shorter distribution period)
    expect(rmd73 / balance).toBeLessThan(rmd80 / balance);
    expect(rmd80 / balance).toBeLessThan(rmd90 / balance);
  });

  describe('Phase D: Birth Year-based RMD Age (SECURE 2.0)', () => {
    it('getRMDStartAge returns 73 for those born before 1960', () => {
      expect(getRMDStartAge(1959)).toBe(73);
      expect(getRMDStartAge(1945)).toBe(73);
      expect(getRMDStartAge(1920)).toBe(73);
    });

    it('getRMDStartAge returns 75 for those born 1960 and later', () => {
      expect(getRMDStartAge(1960)).toBe(75);
      expect(getRMDStartAge(1965)).toBe(75);
      expect(getRMDStartAge(2000)).toBe(75);
    });

    it('isRMDRequired respects birth year for age 73-74', () => {
      // Born 1950 (before 1960) → RMD at 73
      expect(isRMDRequired(72, 1950)).toBe(false);
      expect(isRMDRequired(73, 1950)).toBe(true);

      // Born 1960+ → RMD at 75
      expect(isRMDRequired(73, 1960)).toBe(false);
      expect(isRMDRequired(74, 1960)).toBe(false);
      expect(isRMDRequired(75, 1960)).toBe(true);
    });

    it('computeRMD respects birth year threshold', () => {
      // Age 73, born 1950 → RMD applies
      expect(computeRMD(500_000, 73, 1950)).toBeGreaterThan(0);

      // Age 73, born 1960 → no RMD
      expect(computeRMD(500_000, 73, 1960)).toBe(0);

      // Age 75, born 1960 → RMD applies
      expect(computeRMD(500_000, 75, 1960)).toBeGreaterThan(0);
    });

    it('backward compatibility: isRMDRequired without birth year defaults to 73', () => {
      expect(isRMDRequired(72)).toBe(false);
      expect(isRMDRequired(73)).toBe(true);
    });

    it('backward compatibility: computeRMD without birth year defaults to 73', () => {
      expect(computeRMD(500_000, 72)).toBe(0);
      expect(computeRMD(500_000, 73)).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  adjustForInflation,
  adjustForInflationDetailed,
  inflationSeries,
  DEFAULT_INFLATION_RATE,
  INFLATION_RATE_WARN_LOW,
  INFLATION_RATE_WARN_HIGH,
} from '../../../src/modules/expenses/inflation';

describe('adjustForInflation', () => {
  it('returns base amount with no inflation over 0 years', () => {
    expect(adjustForInflation(50_000, 0)).toBe(50_000);
  });

  it('applies default 2.5% inflation for 1 year', () => {
    expect(adjustForInflation(50_000, 1)).toBeCloseTo(51_250);
  });

  it('compounds correctly over 10 years at 2.5%', () => {
    const expected = 50_000 * Math.pow(1.025, 10);
    expect(adjustForInflation(50_000, 10)).toBeCloseTo(expected, 2);
  });

  it('applies custom inflation rate', () => {
    expect(adjustForInflation(100_000, 5, 0.03)).toBeCloseTo(
      100_000 * Math.pow(1.03, 5), 2,
    );
  });

  it('handles 0% inflation rate (no growth)', () => {
    expect(adjustForInflation(50_000, 10, 0)).toBe(50_000);
  });

  it('throws for negative base amount', () => {
    expect(() => adjustForInflation(-1, 5)).toThrow(RangeError);
  });

  it('throws for negative years', () => {
    expect(() => adjustForInflation(50_000, -1)).toThrow(RangeError);
  });

  it('throws for rate <= -1 (mathematical nonsense)', () => {
    expect(() => adjustForInflation(50_000, 5, -1)).toThrow(RangeError);
    expect(() => adjustForInflation(50_000, 5, -2)).toThrow(RangeError);
  });
});

describe('adjustForInflationDetailed', () => {
  it('returns correct adjustedAmount', () => {
    const result = adjustForInflationDetailed(60_000, 5);
    expect(result.adjustedAmount).toBeCloseTo(60_000 * Math.pow(1.025, 5), 2);
  });

  it('returns correct multiplier', () => {
    const result = adjustForInflationDetailed(100_000, 10, 0.025);
    expect(result.multiplier).toBeCloseTo(Math.pow(1.025, 10), 6);
  });

  it('rateOutOfRange is false for default 2.5%', () => {
    expect(adjustForInflationDetailed(50_000, 5).rateOutOfRange).toBe(false);
  });

  it('rateOutOfRange is true below 1%', () => {
    expect(adjustForInflationDetailed(50_000, 5, 0.005).rateOutOfRange).toBe(true);
  });

  it('rateOutOfRange is true above 6%', () => {
    expect(adjustForInflationDetailed(50_000, 5, 0.07).rateOutOfRange).toBe(true);
  });

  it('rateOutOfRange is false at boundary 1%', () => {
    expect(adjustForInflationDetailed(50_000, 5, INFLATION_RATE_WARN_LOW).rateOutOfRange).toBe(false);
  });

  it('rateOutOfRange is false at boundary 6%', () => {
    expect(adjustForInflationDetailed(50_000, 5, INFLATION_RATE_WARN_HIGH).rateOutOfRange).toBe(false);
  });
});

describe('inflationSeries', () => {
  it('returns horizonYears + 1 entries (year 0 through horizonYears)', () => {
    const series = inflationSeries(50_000, 10);
    expect(series).toHaveLength(11);
  });

  it('first entry equals base amount (year 0, no inflation)', () => {
    expect(inflationSeries(50_000, 10)[0]).toBe(50_000);
  });

  it('each entry is larger than the previous (positive inflation)', () => {
    const series = inflationSeries(50_000, 5, 0.03);
    for (let i = 1; i < series.length; i++) {
      expect(series[i]).toBeGreaterThan(series[i - 1]);
    }
  });

  it('last entry matches adjustForInflation for the same years', () => {
    const years = 20;
    const series = inflationSeries(60_000, years);
    expect(series[years]).toBeCloseTo(adjustForInflation(60_000, years), 2);
  });

  it('returns single-element array for horizonYears = 0', () => {
    const series = inflationSeries(50_000, 0);
    expect(series).toHaveLength(1);
    expect(series[0]).toBe(50_000);
  });

  it('throws for negative horizonYears', () => {
    expect(() => inflationSeries(50_000, -1)).toThrow(RangeError);
  });
});

describe('constants', () => {
  it('DEFAULT_INFLATION_RATE is 2.5%', () => {
    expect(DEFAULT_INFLATION_RATE).toBe(0.025);
  });

  it('warn bounds are 1% and 6%', () => {
    expect(INFLATION_RATE_WARN_LOW).toBe(0.01);
    expect(INFLATION_RATE_WARN_HIGH).toBe(0.06);
  });
});

/**
 * OPM Military Service Deposit Interest Rates
 *
 * Interest accrues on unpaid military service deposits at OPM-published rates.
 * Rates are set annually and published by OPM (typically in the Federal Register
 * or OPM guidance). The same rate table is used for civilian service deposits.
 *
 * Source: OPM FERS Handbook, Ch. 23; 5 CFR Part 831 / 842 (deposit/redeposit)
 *
 * ASSUMPTION: For years beyond the table, the most recent known rate is used.
 * Users should verify current OPM interest rates before relying on future projections.
 * Classification: Hard regulatory (historical); Assumption (extrapolated years).
 *
 * Rates below are the OPM "long-term Treasury bond" interest rates used for
 * service credit deposit interest calculations.
 */

export interface OPMInterestRate {
  year: number;
  /** Annual interest rate as a decimal (e.g., 0.0375 = 3.75%) */
  rate: number;
}

/**
 * OPM interest rates for service deposit calculations.
 * Source: OPM published guidance / Federal Register notices.
 */
export const OPM_INTEREST_RATES: readonly OPMInterestRate[] = [
  { year: 2000, rate: 0.0575 },
  { year: 2001, rate: 0.0625 },
  { year: 2002, rate: 0.0575 },
  { year: 2003, rate: 0.0500 },
  { year: 2004, rate: 0.0425 },
  { year: 2005, rate: 0.0400 },
  { year: 2006, rate: 0.0475 },
  { year: 2007, rate: 0.0500 },
  { year: 2008, rate: 0.0475 },
  { year: 2009, rate: 0.0425 },
  { year: 2010, rate: 0.0400 },
  { year: 2011, rate: 0.0375 },
  { year: 2012, rate: 0.0350 },
  { year: 2013, rate: 0.0300 },
  { year: 2014, rate: 0.0325 },
  { year: 2015, rate: 0.0275 },
  { year: 2016, rate: 0.0250 },
  { year: 2017, rate: 0.0275 },
  { year: 2018, rate: 0.0300 },
  { year: 2019, rate: 0.0300 },
  { year: 2020, rate: 0.0225 },
  { year: 2021, rate: 0.0175 },
  { year: 2022, rate: 0.0200 },
  { year: 2023, rate: 0.0400 },
  { year: 2024, rate: 0.0450 },
  { year: 2025, rate: 0.0425 },
  { year: 2026, rate: 0.0425 },  // Source: OPM BAL 26-301
  // ASSUMPTION: 2027+ uses most recent published rate until updated
] as const;

/**
 * Returns the OPM interest rate for a given year.
 * Falls back to the most recent known rate for future years.
 */
export function getOPMInterestRate(year: number): number {
  const sorted = [...OPM_INTEREST_RATES].sort((a, b) => a.year - b.year);
  const entry = sorted.find((r) => r.year === year);
  if (entry) return entry.rate;
  if (year < sorted[0].year) return sorted[0].rate;
  return sorted[sorted.length - 1].rate;
}

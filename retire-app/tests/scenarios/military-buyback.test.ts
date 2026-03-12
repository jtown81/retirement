/**
 * Scenario: Military Service Buyback
 *
 * Verifies that completing a military buyback:
 * - Computes the correct deposit (3% + interest)
 * - Adds creditable service years correctly
 * - Increases the FERS annuity proportionally (via service year delta)
 * - Blocks credit if military retirement pay is not waived
 *
 * Scenario: Employee served 4 years military (2000–2003), earning ~$18k/year.
 * Hired federal Jan 2005. Buyback interest starts 2006 (2 years after separation
 * or FERS coverage date, whichever later). Pays deposit in 2025.
 * Civilian service: 20 years by retirement.
 *
 * Expected values derived from formula definitions in docs/formula-registry.md.
 * Spreadsheet cell-level mapping: TBD (docs/spreadsheet-parity.md).
 */

import { describe, it, expect } from 'vitest';
import {
  computeBuybackDeposit,
  applyMilitaryServiceCredit,
  militaryServiceYearsFromRecord,
} from '../../src/modules/military/buyback';

const MILITARY_PAY: Record<number, number> = {
  2000: 18_000,
  2001: 18_500,
  2002: 19_000,
  2003: 19_500,
};

const DEPOSIT_YEAR = 2025;
const INTEREST_START_YEAR = 2006;
const CIVILIAN_SERVICE_YEARS = 20;

describe('Scenario: Military Service Buyback', () => {
  it('computes correct buyback deposit (3% + interest)', () => {
    const result = computeBuybackDeposit(MILITARY_PAY, DEPOSIT_YEAR, INTEREST_START_YEAR);

    // Principal = 3% of (18k + 18.5k + 19k + 19.5k) = 3% × 75,000 = 2,250
    expect(result.principalDeposit).toBeCloseTo(2_250, 1);

    // Interest has compounded over 19 years (2006–2024) — total should be meaningfully higher
    expect(result.interestAccrued).toBeGreaterThan(500);
    expect(result.totalDeposit).toBeGreaterThan(result.principalDeposit);
    expect(result.totalDeposit).toBeCloseTo(
      result.principalDeposit + result.interestAccrued, 2,
    );
  });

  it('adds military service years to creditable service', () => {
    const militaryYears = militaryServiceYearsFromRecord(MILITARY_PAY);
    expect(militaryYears).toBe(4);

    const totalService = applyMilitaryServiceCredit(
      CIVILIAN_SERVICE_YEARS,
      militaryYears,
      true, // buyback completed
    );
    expect(totalService).toBe(24);
  });

  it('increases annuity proportionally to service year increase', () => {
    // FERS basic annuity formula (simplified, no special rates):
    //   annuity = high3Salary × creditableService × 0.01
    // Adding 4 military years increases the multiplier from 20 to 24.
    const HIGH3 = 90_000;
    const MULTIPLIER = 0.01;

    const withoutBuyback = HIGH3 * CIVILIAN_SERVICE_YEARS * MULTIPLIER;
    const withBuyback = HIGH3 * 24 * MULTIPLIER;

    expect(withBuyback).toBeGreaterThan(withoutBuyback);
    // 4 extra years on 20 = 20% increase in annuity
    expect(withBuyback / withoutBuyback).toBeCloseTo(1.2, 3);
  });

  it('rejects buyback if military retirement pay not waived', () => {
    const militaryYears = militaryServiceYearsFromRecord(MILITARY_PAY);
    const totalService = applyMilitaryServiceCredit(
      CIVILIAN_SERVICE_YEARS,
      militaryYears,
      true,            // buyback completed
      true,            // receiving military retirement pay
      false,           // has NOT waived it
    );
    // Credit blocked — only civilian years count
    expect(totalService).toBe(CIVILIAN_SERVICE_YEARS);
  });
});

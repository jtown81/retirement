/**
 * Service Computation Date (SCD) and Creditable Service
 * Formula: career/creditable-service
 *
 * Computes total creditable federal service for retirement eligibility
 * and annuity calculations.
 *
 * Sources:
 *   - OPM FERS Handbook, Ch. 20 (Service Credit)
 *   - 5 CFR Part 630, Subpart A (leave SCD)
 *   - 5 U.S.C. § 8411 (creditable service for retirement)
 *
 * REGULATORY NOTE: Creditable service is measured from the SCD-Retirement
 * date to the retirement date. The SCD-Retirement may differ from SCD-Leave.
 * Gaps created by separations are excluded unless the employee was rehired
 * and the service was credited back. Military buyback extends service
 * and is handled in the military module.
 */

import type { CareerEvent } from '../../models/career';
import type { ISODate } from '../../models/common';
import { registerFormula } from '../../registry/index';

registerFormula({
  id: 'career/creditable-service',
  name: 'Creditable Service Duration',
  module: 'career',
  purpose: 'Computes total years/months/days of creditable federal service from SCD-Retirement to a given date.',
  sourceRef: 'OPM FERS Handbook Ch. 20; 5 U.S.C. § 8411',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Phase 3 implementation' }],
});

export interface ServiceDuration {
  years: number;
  months: number;
  days: number;
  /** Total years as a decimal (used for annuity computation) */
  fractionalYears: number;
}

/**
 * Computes creditable service duration from an SCD-Retirement date to a target date.
 *
 * The FERS annuity multiplier uses whole years; this function returns both
 * the component breakdown and a fractional total.
 *
 * Per OPM convention, service is rounded DOWN to the nearest whole year for
 * the basic annuity multiplier. Excess months and days do not count toward
 * the multiplier.
 *
 * @param scdRetirement  Service Computation Date — Retirement (ISO date string)
 * @param asOfDate       Date to compute service through (ISO date string)
 */
export function computeCreditableService(
  scdRetirement: ISODate,
  asOfDate: ISODate,
): ServiceDuration {
  const start = new Date(scdRetirement);
  const end = new Date(asOfDate);

  if (end < start) {
    return { years: 0, months: 0, days: 0, fractionalYears: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Borrow from months until days is non-negative (handles short months)
  let borrowRef = end.getMonth();
  while (days < 0) {
    months -= 1;
    borrowRef -= 1;
    const prevMonthDays = new Date(end.getFullYear(), borrowRef + 1, 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msTotal = end.getTime() - start.getTime();
  const fractionalYears = msTotal / (1000 * 60 * 60 * 24 * 365.25);

  return { years, months, days, fractionalYears };
}

/**
 * Derives the effective SCD-Retirement date from a list of career events.
 *
 * Algorithm:
 *   1. Find the earliest hire/rehire event.
 *   2. Subtract any non-creditable separation gaps.
 *   3. Return the adjusted start date as the effective SCD.
 *
 * Returns null if no hire event is found.
 *
 * REGULATORY NOTE: Certain separations are creditable (e.g., military leave
 * with buyback, approved LWOP). These require manual SCD adjustment.
 * The CareerProfile should store the authoritative SCD from the employee's
 * SF-50; use this function only for validation or reconstruction purposes.
 *
 * @param events  Sorted or unsorted list of career events
 */
export function deriveEffectiveSCD(events: CareerEvent[]): ISODate | null {
  const sorted = [...events].sort(
    (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(),
  );

  // Find the initial hire
  const hireEvent = sorted.find(e => e.type === 'hire');
  if (!hireEvent) return null;

  let scdMs = new Date(hireEvent.effectiveDate).getTime();
  let lastSeparationMs: number | null = null;

  for (const event of sorted) {
    if (event.type === 'separation') {
      lastSeparationMs = new Date(event.effectiveDate).getTime();
    } else if (event.type === 'rehire' && lastSeparationMs !== null) {
      // Gap = rehire date − separation date → subtract from SCD
      const gapMs = new Date(event.effectiveDate).getTime() - lastSeparationMs;
      scdMs += gapMs;
      lastSeparationMs = null;
    }
  }

  return new Date(scdMs).toISOString().slice(0, 10);
}

/**
 * @deprecated Use computeCreditableService() instead.
 * Kept for backward compatibility with existing module index imports.
 */
export function computeSCD(
  events: CareerEvent[],
): { years: number; months: number; days: number } {
  const scd = deriveEffectiveSCD(events);
  if (!scd) return { years: 0, months: 0, days: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const { years, months, days } = computeCreditableService(scd, today);
  return { years, months, days };
}

/**
 * Federal Tax Computation Engine
 *
 * Orchestrates all tax calculations: income tax, Social Security taxation, IRMAA, and state tax.
 * Main public entry point for annual tax computation.
 *
 * Computation order:
 * 1. Compute standard deduction (including age 65+ adjustment)
 * 2. Determine Social Security taxable fraction (provisional income test)
 * 3. Compute taxable income = ordinary income + (SS × fraction) − standard deduction
 * 4. Compute federal income tax from brackets
 * 5. Compute IRMAA surcharge if age ≥ 65
 * 6. Assemble result with all tax components
 */

import type { USD, Rate } from '../../models/common';
import type { TaxInput, TaxYearResult } from '../../models/tax';
import {
  computeFederalTax,
  computeStandardDeduction,
  computeEffectiveRate,
} from './brackets';
import {
  computeSSProvisionalIncome,
  computeSSTaxableFraction,
  computeSSTaxableAmount,
} from './social-security';
import { computeIRMAASurcharge } from './irmaa';

/**
 * Computes annual federal taxes for a given income profile.
 *
 * Main entry point that orchestrates the full tax calculation pipeline.
 *
 * @param input - TaxInput with income, age, filing status, etc.
 * @returns TaxYearResult with all tax components and effective rates
 */
export function computeAnnualTax(input: TaxInput): TaxYearResult {
  const { calendarYear, age, filingStatus, ordinaryIncome, rothIncome, grossSocialSecurity, useIRMAA } = input;

  // ── Step 1: Standard Deduction ────────────────────────────────────
  const standardDeduction = computeStandardDeduction(calendarYear, filingStatus, age);

  // ── Step 2: Social Security Taxation ──────────────────────────────
  // Provisional income for SS taxation test (includes all ordinary income, before std ded)
  const provisionalIncome = computeSSProvisionalIncome(ordinaryIncome, grossSocialSecurity);
  const ssTaxableFraction = computeSSTaxableFraction(provisionalIncome, filingStatus);
  const ssTaxableAmount = computeSSTaxableAmount(provisionalIncome, grossSocialSecurity, filingStatus);

  // ── Step 3: Taxable Income ───────────────────────────────────────
  // Taxable income = ordinary income + taxable SS − standard deduction
  const grossIncomeForTax = ordinaryIncome + ssTaxableAmount;
  const taxableIncome = Math.max(0, grossIncomeForTax - standardDeduction);

  // ── Step 4: Federal Income Tax ───────────────────────────────────
  const federalTax = computeFederalTax(taxableIncome, calendarYear, filingStatus);

  // ── Step 5: IRMAA Surcharge ──────────────────────────────────────
  // MAGI for IRMAA = Ordinary Income + Roth (non-taxable but counts for IRMAA) + taxable SS
  const magiForIRMAA = ordinaryIncome + rothIncome + ssTaxableAmount;
  const irmaaSurcharge = useIRMAA ? computeIRMAASurcharge(magiForIRMAA, calendarYear, filingStatus, age) : 0;

  // ── Step 6: State Tax (Placeholder) ──────────────────────────────
  // State tax is deferred (too many state rules). Returns 0.
  const stateTax = 0;

  // ── Step 7: Assemble Result ──────────────────────────────────────
  const totalTax = federalTax + irmaaSurcharge + stateTax;
  const totalIncome = ordinaryIncome + rothIncome + grossSocialSecurity;
  const afterTaxIncome = totalIncome - totalTax;
  const effectiveFederalRate = computeEffectiveRate(federalTax, totalIncome);

  return {
    taxableIncome,
    federalTax,
    effectiveFederalRate,
    ssTaxableFraction,
    ssTaxableAmount,
    irmaaSurcharge,
    stateTax,
    totalTax,
    afterTaxIncome,
  };
}

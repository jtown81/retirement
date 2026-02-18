/**
 * State Income Tax Calculator
 *
 * Formula ID: tax/state-income-tax
 * Source: Individual state tax codes (varies by state)
 *
 * MVP: Flat-rate approximation for top 10 states + stub for others
 * V2: Full marginal bracket support for all 50 states
 */

import type { StateCode, StateTaxRule } from '@models/tax';

/**
 * State tax rules for top 10 states + DC + no-tax states
 *
 * MVP scope: basic exemptions (FERS annuity, TSP withdrawals) and flat-rate approx.
 * This is intentionally simplified; actual state tax is more complex.
 */
export const STATE_TAX_RULES: Record<string, StateTaxRule> = {
  // States with no income tax
  AK: {
    stateCode: 'AK',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'Alaska has no state income tax',
  },
  FL: {
    stateCode: 'FL',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'Florida has no state income tax',
  },
  NV: {
    stateCode: 'NV',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'Nevada has no state income tax',
  },
  SD: {
    stateCode: 'SD',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'South Dakota has no state income tax',
  },
  TX: {
    stateCode: 'TX',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'Texas has no state income tax',
  },
  TN: {
    stateCode: 'TN',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'Tennessee has no state income tax',
  },
  WA: {
    stateCode: 'WA',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'Washington has no state income tax',
  },
  WY: {
    stateCode: 'WY',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: true,
    approximateFlatRate: 0,
    source: 'Wyoming has no state income tax',
  },

  // States with federal pension exemptions (partial or full)
  VA: {
    stateCode: 'VA',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: true,
    noIncomeTax: false,
    approximateFlatRate: 0.0575, // ~5.75% average
    source: 'Virginia exempts federal pensions; income tax ~5.75%',
  },
  NC: {
    stateCode: 'NC',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.049, // ~4.9% flat
    source: 'North Carolina exempts federal pensions; ~4.9% income tax',
  },
  SC: {
    stateCode: 'SC',
    year: 2024,
    exemptsFersAnnuity: true,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.065, // ~6.5% marginal top
    source: 'South Carolina exempts federal military pensions; ~6.5% income tax',
  },

  // States that tax all income (no federal pension exemption)
  CA: {
    stateCode: 'CA',
    year: 2024,
    exemptsFersAnnuity: false,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.093, // ~9.3% average (progressive, top ~13%)
    source: 'California taxes FERS annuity; ~9.3% average income tax',
  },
  NY: {
    stateCode: 'NY',
    year: 2024,
    exemptsFersAnnuity: false,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.065, // ~6.5% average
    source: 'New York taxes FERS annuity; ~6.5% average income tax',
  },
  MD: {
    stateCode: 'MD',
    year: 2024,
    exemptsFersAnnuity: false,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.057, // ~5.7% average
    source: 'Maryland taxes FERS annuity; ~5.7% average income tax',
  },
  PA: {
    stateCode: 'PA',
    year: 2024,
    exemptsFersAnnuity: false,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.0307, // 3.07% flat (no local supplement here)
    source: 'Pennsylvania has 3.07% flat income tax',
  },
  OH: {
    stateCode: 'OH',
    year: 2024,
    exemptsFersAnnuity: false,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.035, // ~3.5% average
    source: 'Ohio taxes FERS annuity; ~3.5% average income tax',
  },

  // Stub rule for states not yet fully defined
  // (All others default to a conservative 5% estimate)
};

/**
 * Retrieves the state tax rule for a given state code.
 *
 * If the state code is not explicitly defined, returns a conservative default.
 *
 * @param stateCode - USPS 2-letter state code (or null for no state income tax)
 * @param year - Tax year (currently all rules are year-independent; v2 will parameterize)
 * @returns StateTaxRule for the state
 */
export function getStateTaxRule(stateCode: StateCode, year: number): StateTaxRule {
  if (!stateCode || stateCode === 'null') {
    // No state income tax
    return {
      stateCode: 'null',
      year,
      exemptsFersAnnuity: true,
      exemptsTspWithdrawals: true,
      noIncomeTax: true,
      approximateFlatRate: 0,
      source: 'No state income tax',
    };
  }

  if (STATE_TAX_RULES[stateCode]) {
    return { ...STATE_TAX_RULES[stateCode], year };
  }

  // Default for unspecified states: conservative 5% estimate, no exemptions
  return {
    stateCode,
    year,
    exemptsFersAnnuity: false,
    exemptsTspWithdrawals: false,
    noIncomeTax: false,
    approximateFlatRate: 0.05, // 5% conservative default
    source: 'Default conservative estimate (full rules TBD in V2)',
  };
}

/**
 * Computes state income tax using flat-rate approximation (MVP).
 *
 * Applies the rule's flat rate to the taxable income, accounting for
 * FERS annuity and TSP withdrawal exemptions if applicable.
 *
 * @param grossIncome - Total retirement income
 * @param fersAnnuity - FERS annuity portion (may be exempt)
 * @param tspWithdrawal - TSP withdrawal portion (may be exempt)
 * @param stateCode - State code (null or two-letter code)
 * @param year - Tax year
 * @returns State income tax (dollars)
 *
 * @example
 * // Virginia: $30k annuity + $20k TSP = $50k total
 * // Both exempted → $0 state tax
 * computeStateTax(50000, 30000, 20000, 'VA', 2024) // $0
 *
 * @example
 * // California: $30k annuity + $20k TSP = $50k total
 * // No exemptions → 50k × 0.093 = $4,650
 * computeStateTax(50000, 30000, 20000, 'CA', 2024) // $4,650
 */
export function computeStateTax(
  grossIncome: number,
  fersAnnuity: number,
  tspWithdrawal: number,
  stateCode: StateCode,
  year: number,
): number {
  const rule = getStateTaxRule(stateCode, year);

  if (rule.noIncomeTax) {
    return 0;
  }

  // Calculate taxable income after exemptions
  let taxableIncome = grossIncome;

  if (rule.exemptsFersAnnuity) {
    taxableIncome -= fersAnnuity;
  }

  if (rule.exemptsTspWithdrawals) {
    taxableIncome -= tspWithdrawal;
  }

  taxableIncome = Math.max(0, taxableIncome);

  // Apply flat rate
  const stateTax = taxableIncome * rule.approximateFlatRate;

  // Round to cents
  return Math.round(stateTax * 100) / 100;
}

/**
 * Detailed state tax computation result.
 */
export interface StateTaxResult {
  stateCode: StateCode;
  year: number;
  rule: StateTaxRule;
  grossIncome: number;
  taxableIncome: number;
  stateTax: number;
}

/**
 * Full state tax computation with details.
 *
 * @param grossIncome - Total income
 * @param fersAnnuity - FERS annuity amount
 * @param tspWithdrawal - TSP withdrawal amount
 * @param stateCode - State code
 * @param year - Tax year
 * @returns Detailed result
 */
export function computeStateTaxDetailed(
  grossIncome: number,
  fersAnnuity: number,
  tspWithdrawal: number,
  stateCode: StateCode,
  year: number,
): StateTaxResult {
  const rule = getStateTaxRule(stateCode, year);

  // Same calculation as computeStateTax
  let taxableIncome = grossIncome;
  if (rule.exemptsFersAnnuity) taxableIncome -= fersAnnuity;
  if (rule.exemptsTspWithdrawals) taxableIncome -= tspWithdrawal;
  taxableIncome = Math.max(0, taxableIncome);

  const stateTax = Math.round(taxableIncome * rule.approximateFlatRate * 100) / 100;

  return {
    stateCode,
    year,
    rule,
    grossIncome,
    taxableIncome,
    stateTax,
  };
}

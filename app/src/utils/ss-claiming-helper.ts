/**
 * Social Security Claiming Age Helper
 *
 * Computes what-if SS benefits at different claiming ages based on current PIA.
 */

import { getFullRetirementAge, ssAdjustmentFactor } from '@modules/simulation/eligibility';

export interface SSClaimingVariants {
  monthlyBenefit62: number;
  monthlyBenefitFRA: number;
  monthlyBenefit70: number;
  fullRetirementAge: number;
}

/**
 * Compute monthly SS benefits at ages 62, FRA, and 70 given a PIA and birth year.
 * Applies actuarial adjustment factors per Social Security Administration rules.
 *
 * @param annualPIA - Annual Primary Insurance Amount (what they'd get at FRA)
 * @param birthYear - Birth year to determine FRA
 * @returns Object with monthly benefits at each claiming age
 */
export function computeSSClaimingVariants(
  annualPIA: number,
  birthYear: number,
): SSClaimingVariants {
  const fra = getFullRetirementAge(birthYear);
  const monthlyPIA = annualPIA / 12;

  const monthlyBenefit62 = monthlyPIA * ssAdjustmentFactor(62, fra);
  const monthlyBenefitFRA = monthlyPIA * ssAdjustmentFactor(fra, fra);
  const monthlyBenefit70 = monthlyPIA * ssAdjustmentFactor(70, fra);

  return {
    monthlyBenefit62,
    monthlyBenefitFRA,
    monthlyBenefit70,
    fullRetirementAge: fra,
  };
}

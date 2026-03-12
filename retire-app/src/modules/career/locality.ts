/**
 * Locality Pay
 * Formula: career/locality-rate
 *
 * Applies OPM locality pay percentage to base salary.
 * Source: OPM Locality Pay Schedule; 5 U.S.C. § 5304.
 * Classification: Hard regulatory requirement.
 *
 * Tables are updated annually — see docs/regulatory-mapping.md.
 */

import { registerFormula } from '../../registry/index';
import {
  getLocalityRate as lookupLocalityRate,
  getAvailableLocalityCodes,
} from '../../data/locality-rates';

registerFormula({
  id: 'career/locality-rate',
  name: 'Locality Pay Rate Lookup',
  module: 'career',
  purpose: 'Returns the OPM locality pay percentage for a given duty station and pay year.',
  sourceRef: 'OPM Locality Pay Schedule; 5 U.S.C. § 5304',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Phase 3 implementation' }],
});

/**
 * Returns the locality pay rate (as a decimal, e.g., 0.3326 = 33.26%)
 * for the given locality code and pay year.
 *
 * Falls back to RUS (Rest of U.S.) for unrecognized codes.
 *
 * @param localityCode  OPM locality area code (e.g., 'WASHINGTON', 'RUS')
 * @param payYear       Calendar year
 */
export function getLocalityRate(localityCode: string, payYear: number): number {
  return lookupLocalityRate(localityCode, payYear);
}

/**
 * Applies a locality pay rate to a base salary.
 * total = baseSalary × (1 + localityRate)
 */
export function applyLocality(baseSalary: number, localityRate: number): number {
  return baseSalary * (1 + localityRate);
}

/** Returns all OPM locality area codes available for a given year. */
export { getAvailableLocalityCodes };

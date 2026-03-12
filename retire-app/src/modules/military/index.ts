/**
 * Military Service Buyback Module
 *
 * Responsible for:
 * - Computing the military service deposit (3% of military basic pay + interest)
 * - Adding creditable military service to FERS service computation
 * - Validating buyback eligibility (requires waiver of military retirement if applicable)
 *
 * Source: OPM FERS Handbook, Ch. 23; 5 U.S.C. § 8411(b)
 * All formulas referenced in: docs/formula-registry.md
 */

export type { MilitaryService } from '../../models/military';
export type { BuybackDepositResult } from './buyback';

export {
  computeBuybackDeposit,
  applyMilitaryServiceCredit,
  militaryServiceYearsFromRecord,
} from './buyback';

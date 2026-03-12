/**
 * TSP Modeling Module
 *
 * Responsible for:
 * - Traditional TSP balance growth and projections
 * - Roth TSP balance growth and projections
 * - Agency automatic contribution (1%) — always to Traditional
 * - Agency match (up to 4%) — always to Traditional
 * - Contribution limit enforcement (IRS annual limits)
 * - Future contribution changes over time
 *
 * Key invariant: Agency contributions ALWAYS go to Traditional TSP only.
 * See: 5 U.S.C. § 8432(c); formula registry entry tsp/agency-match
 *
 * All formulas referenced in: docs/formula-registry.md
 */

export type { TSPBalances, TSPContributionEvent } from '../../models/tsp';
export type { AgencyMatchResult } from './agency-match';
export type { TraditionalProjectionYear, TraditionalProjectionInput } from './traditional';
export type { RothProjectionYear, RothProjectionInput } from './roth';

export { computeAgencyMatch } from './agency-match';
export { projectTraditionalBalance, projectTraditionalDetailed } from './traditional';
export { projectRothBalance, projectRothDetailed } from './roth';
export { getTSPLimits, clampToContributionLimit } from '../../data/tsp-limits';
export type { TSPDepletionResult } from './future-value';
export { computeTSPFutureValue, projectTSPDepletion } from './future-value';

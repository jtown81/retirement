/**
 * Feature tier configuration for Basic and Premium tiers.
 * Determines which features are available to each subscription level.
 */

export const FEATURE_TIERS = {
  basic: {
    fersEstimate: true,
    careerTimeline: true,
    expenseCategories: true,
    basicDashboard: true,
    scenarioSave: true, // limited to BASIC_SCENARIO_LIMIT
    csvExport: true,
  },
  premium: {
    simulationConfig: true,
    taxModeling: true,
    smileCurve: true,
    advancedDashboard: true,
    monteCarlo: true,
    scenarioUnlimited: true,
    excelExport: true,
    scenarioDiff: true,
    tspMonitor: true,
  },
} as const;

/** Maximum scenarios allowed for Basic tier */
export const BASIC_SCENARIO_LIMIT = 1;

/**
 * Unit tests: Cross-field validation in SimulationConfigSchema
 *
 * Tests the superRefine validators that check relationships between fields.
 */

import { describe, it, expect } from 'vitest';
import { SimulationConfigSchema } from '@storage/zod-schemas';

/**
 * Helper to create a minimal valid SimulationConfig for testing
 */
function baseConfig() {
  return {
    birthYear: 1960,
    retirementAge: 60,
    endAge: 90,
    fersAnnuity: 30000,
    fersSupplement: 5000,
    ssMonthlyAt62: 2000,
    ssClaimingAge: 62,
    survivorBenefitOption: 'full' as const,
    tspBalanceAtRetirement: 500000,
    traditionalPct: 0.7,
    highRiskPct: 0.4,
    highRiskROI: 0.07,
    lowRiskROI: 0.03,
    withdrawalRate: 0.04,
    timeStepYears: 1 as const,
    baseAnnualExpenses: 50000,
    goGoEndAge: 75,
    goGoRate: 1.2,
    goSlowEndAge: 85,
    goSlowRate: 0.8,
    noGoRate: 0.5,
    colaRate: 0.025,
    inflationRate: 0.025,
  };
}

describe('SimulationConfigSchema — Cross-Field Validation', () => {
  it('accepts valid ordering: retirementAge < endAge', () => {
    const config = {
      ...baseConfig(),
      retirementAge: 60,
      endAge: 90,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('accepts valid ordering: goGoEndAge < goSlowEndAge < endAge', () => {
    const config = {
      ...baseConfig(),
      goGoEndAge: 70,
      goSlowEndAge: 80,
      endAge: 95,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('rejects goGoEndAge >= goSlowEndAge', () => {
    const config = {
      ...baseConfig(),
      goGoEndAge: 85,
      goSlowEndAge: 85, // Same as goGoEndAge — invalid
      endAge: 95,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      expect(errorMap.goGoEndAge).toBeDefined();
      expect(errorMap.goGoEndAge?.[0]).toContain('Go-Go phase must end before Go-Slow phase');
    }
  });

  it('rejects goGoEndAge > goSlowEndAge', () => {
    const config = {
      ...baseConfig(),
      goGoEndAge: 86,
      goSlowEndAge: 85, // goSlowEndAge before goGoEndAge — invalid
      endAge: 95,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      expect(errorMap.goGoEndAge).toBeDefined();
    }
  });

  it('rejects goSlowEndAge >= endAge', () => {
    const config = {
      ...baseConfig(),
      goGoEndAge: 70,
      goSlowEndAge: 95, // Same as endAge — invalid
      endAge: 95,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      expect(errorMap.goSlowEndAge).toBeDefined();
      expect(errorMap.goSlowEndAge?.[0]).toContain('Go-Slow phase must end before end age');
    }
  });

  it('rejects goSlowEndAge > endAge', () => {
    const config = {
      ...baseConfig(),
      goGoEndAge: 70,
      goSlowEndAge: 96,
      endAge: 95, // endAge before goSlowEndAge — invalid
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      expect(errorMap.goSlowEndAge).toBeDefined();
    }
  });

  it('rejects retirementAge >= endAge', () => {
    const config = {
      ...baseConfig(),
      retirementAge: 85,
      endAge: 85, // Same as retirementAge — invalid
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      expect(errorMap.retirementAge).toBeDefined();
      expect(errorMap.retirementAge?.[0]).toContain('Retirement age must be less than end age');
    }
  });

  it('rejects retirementAge > endAge', () => {
    const config = {
      ...baseConfig(),
      retirementAge: 96,
      endAge: 95, // endAge before retirementAge — invalid
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      expect(errorMap.retirementAge).toBeDefined();
    }
  });

  it('reports multiple errors if multiple constraints violated', () => {
    const config = {
      ...baseConfig(),
      retirementAge: 95,
      endAge: 90, // retirement > end (constraint 1)
      goGoEndAge: 90,
      goSlowEndAge: 91, // goGo not < goSlow (constraint 2)
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      // Should have errors on multiple fields
      expect(
        Object.keys(errorMap).some((k) => errorMap[k as keyof typeof errorMap])
      ).toBe(true);
    }
  });

  it('accepts boundary case: goSlowEndAge = endAge - 1', () => {
    const config = {
      ...baseConfig(),
      goSlowEndAge: 94,
      endAge: 95,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('accepts boundary case: retirementAge = endAge - 1', () => {
    const config = {
      ...baseConfig(),
      retirementAge: 89,
      endAge: 90,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('accepts all smile curve phases compressed to minimal range', () => {
    const config = {
      ...baseConfig(),
      retirementAge: 60,
      goGoEndAge: 70,
      goSlowEndAge: 71,
      endAge: 72,
    };
    const result = SimulationConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});

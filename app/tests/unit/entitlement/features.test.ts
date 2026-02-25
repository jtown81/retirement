import { describe, it, expect } from 'vitest';
import { FEATURE_TIERS, BASIC_SCENARIO_LIMIT } from '@config/features';

describe('Feature Tiers Configuration', () => {
  describe('FEATURE_TIERS', () => {
    it('defines basic tier features', () => {
      expect(FEATURE_TIERS.basic).toEqual({
        fersEstimate: true,
        careerTimeline: true,
        expenseCategories: true,
        basicDashboard: true,
        scenarioSave: true,
        csvExport: true,
      });
    });

    it('defines premium tier features', () => {
      expect(FEATURE_TIERS.premium).toEqual({
        simulationConfig: true,
        taxModeling: true,
        smileCurve: true,
        advancedDashboard: true,
        monteCarlo: true,
        scenarioUnlimited: true,
        excelExport: true,
        scenarioDiff: true,
        tspMonitor: true,
      });
    });

    it('has no overlapping features between tiers', () => {
      const basicKeys = Object.keys(FEATURE_TIERS.basic);
      const premiumKeys = Object.keys(FEATURE_TIERS.premium);
      const overlap = basicKeys.filter((key) => premiumKeys.includes(key));
      expect(overlap).toHaveLength(0);
    });

    it('all feature values are true', () => {
      const allBasicTrue = Object.values(FEATURE_TIERS.basic).every((v) => v === true);
      const allPremiumTrue = Object.values(FEATURE_TIERS.premium).every((v) => v === true);
      expect(allBasicTrue).toBe(true);
      expect(allPremiumTrue).toBe(true);
    });
  });

  describe('BASIC_SCENARIO_LIMIT', () => {
    it('is a positive number', () => {
      expect(typeof BASIC_SCENARIO_LIMIT).toBe('number');
      expect(BASIC_SCENARIO_LIMIT).toBeGreaterThan(0);
    });

    it('is set to 1', () => {
      expect(BASIC_SCENARIO_LIMIT).toBe(1);
    });
  });

  describe('Feature Tier Semantics', () => {
    it('basic tier includes core input features', () => {
      expect(FEATURE_TIERS.basic.fersEstimate).toBe(true);
      expect(FEATURE_TIERS.basic.careerTimeline).toBe(true);
      expect(FEATURE_TIERS.basic.expenseCategories).toBe(true);
    });

    it('basic tier includes basic dashboard and csv export', () => {
      expect(FEATURE_TIERS.basic.basicDashboard).toBe(true);
      expect(FEATURE_TIERS.basic.csvExport).toBe(true);
      expect(FEATURE_TIERS.basic.scenarioSave).toBe(true);
    });

    it('premium tier includes simulation and tax features', () => {
      expect(FEATURE_TIERS.premium.simulationConfig).toBe(true);
      expect(FEATURE_TIERS.premium.taxModeling).toBe(true);
    });

    it('premium tier includes advanced projections and analysis', () => {
      expect(FEATURE_TIERS.premium.advancedDashboard).toBe(true);
      expect(FEATURE_TIERS.premium.monteCarlo).toBe(true);
      expect(FEATURE_TIERS.premium.scenarioUnlimited).toBe(true);
    });

    it('premium tier includes advanced exports', () => {
      expect(FEATURE_TIERS.premium.excelExport).toBe(true);
      expect(FEATURE_TIERS.premium.scenarioDiff).toBe(true);
    });
  });
});

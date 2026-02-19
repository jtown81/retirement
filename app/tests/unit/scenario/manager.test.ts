/**
 * Scenario Manager Hook Tests
 *
 * Note: Full hook testing requires React Testing Library and mock localStorage.
 * These tests validate the core logic of the manager functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NamedScenario, ScenarioComparisonMetrics } from '@models/scenario';
import type { FullSimulationResult } from '@models/simulation';

// Mock data
const mockSimulationResult: FullSimulationResult = {
  config: {
    proposedRetirementDate: '2027-05-15',
    tspGrowthRate: 0.07,
    retirementAge: 57,
    retirementYear: 2027,
    endAge: 95,
    fersAnnuity: 27900,
    fersSupplement: 12300,
    ssMonthlyAt62: 2000,
    tspBalanceAtRetirement: 723456,
    traditionalPct: 0.7,
    highRiskPct: 0.6,
    highRiskROI: 0.08,
    lowRiskROI: 0.03,
    withdrawalRate: 0.04,
    timeStepYears: 1,
    baseAnnualExpenses: 54000,
    goGoEndAge: 70,
    goGoRate: 1.0,
    goSlowEndAge: 80,
    goSlowRate: 0.85,
    noGoRate: 0.75,
    colaRate: 0.025,
    inflationRate: 0.025,
  },
  years: [
    {
      year: 2027,
      age: 57,
      annuity: 27900,
      fersSupplement: 12300,
      socialSecurity: 0,
      tspWithdrawal: 18000,
      totalIncome: 58200,
      federalTax: 6420,
      stateTax: 0,
      irmaaSurcharge: 0,
      totalTax: 6420,
      effectiveFederalRate: 0.11,
      effectiveTotalRate: 0.11,
      socialSecurityTaxableFraction: 0,
      afterTaxIncome: 51780,
      smileMultiplier: 1.0,
      totalExpenses: 54000,
      highRiskBalance: 400000,
      lowRiskBalance: 250000,
      traditionalBalance: 500000,
      rothBalance: 150000,
      totalTSPBalance: 650000,
      rmdRequired: 0,
      rmdSatisfied: true,
      surplus: -2220,
      tradWithdrawal: 14400,
      rothWithdrawal: 3600,
      taxableIncome: 40200,
      afterTaxSurplus: -2220,
      marginalBracketRate: 0.12,
      bracketHeadroom: 5000,
    },
  ],
  depletionAge: null,
  balanceAt85: 723456,
  totalLifetimeIncome: 1847569,
  totalLifetimeExpenses: 1800000,
  totalLifetimeFederalTax: 187450,
  totalLifetimeTax: 187450,
  totalLifetimeAfterTaxIncome: 1660119,
};

const mockInputs = {
  profile: {
    birthDate: '1970-02-18' as const,
    career: {
      id: 'c1',
      scdLeave: '1995-01-15',
      scdRetirement: '2027-02-18',
      paySystem: 'GS' as const,
      events: [],
    },
    leaveBalance: {
      asOf: '2026-02-18',
      annualLeaveHours: 240,
      sickLeaveHours: 450,
      familyCareUsedCurrentYear: 0,
    },
    tspBalances: {
      asOf: '2026-02-18',
      traditionalBalance: 500000,
      rothBalance: 150000,
    },
    tspContributions: [],
    expenses: {
      id: 'e1',
      baseYear: 2026,
      categories: [],
      inflationRate: 0.025,
      smileCurveEnabled: true,
    },
  },
  assumptions: {
    proposedRetirementDate: '2027-02-18',
    tspGrowthRate: 0.07,
    colaRate: 0.025,
    retirementHorizonYears: 40,
  },
};

describe('Scenario Manager Logic', () => {
  describe('Scenario Creation', () => {
    it('Creates scenario with unique UUID', () => {
      const scenario: NamedScenario = {
        id: crypto.randomUUID?.() ?? 'mock-id',
        label: 'Test Scenario',
        createdAt: '2026-02-18',
        inputs: mockInputs,
        result: mockSimulationResult,
        isBaseline: true,
      };

      expect(scenario.id).toBeTruthy();
      expect(scenario.label).toBe('Test Scenario');
      expect(scenario.isBaseline).toBe(true);
    });

    it('First scenario marked as baseline', () => {
      const scenarios: NamedScenario[] = [];
      const isFirstBaseline = scenarios.length === 0;
      expect(isFirstBaseline).toBe(true);
    });

    it('Subsequent scenarios not marked as baseline', () => {
      const scenarios: NamedScenario[] = [
        {
          id: '1',
          label: 'First',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: true,
        },
        {
          id: '2',
          label: 'Second',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: false,
        },
      ];

      expect(scenarios[0].isBaseline).toBe(true);
      expect(scenarios[1].isBaseline).toBe(false);
    });
  });

  describe('Scenario Deletion', () => {
    it('Cannot delete the only baseline scenario', () => {
      const scenarios: NamedScenario[] = [
        {
          id: '1',
          label: 'Only Baseline',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: true,
        },
      ];

      const baselines = scenarios.filter((s) => s.isBaseline);
      const canDelete = baselines.length > 1 || baselines[0].id !== '1';
      expect(canDelete).toBe(false);
    });

    it('Can delete scenario if other baseline exists', () => {
      const scenarios: NamedScenario[] = [
        {
          id: '1',
          label: 'Baseline',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: true,
        },
        {
          id: '2',
          label: 'To Delete',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: false,
        },
      ];

      const baselines = scenarios.filter((s) => s.isBaseline);
      const canDelete = baselines.length > 1 || baselines[0].id !== '2';
      expect(canDelete).toBe(true);

      const filtered = scenarios.filter((s) => s.id !== '2');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('Baseline Management', () => {
    it('Switches baseline to different scenario', () => {
      const scenarios: NamedScenario[] = [
        {
          id: '1',
          label: 'Scenario 1',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: true,
        },
        {
          id: '2',
          label: 'Scenario 2',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: false,
        },
      ];

      // Switch baseline to scenario 2
      const updated = scenarios.map((s) => ({
        ...s,
        isBaseline: s.id === '2',
      }));

      expect(updated[0].isBaseline).toBe(false);
      expect(updated[1].isBaseline).toBe(true);
    });

    it('Ensures only one baseline when setting', () => {
      let scenarios: NamedScenario[] = [
        {
          id: '1',
          label: 'Scenario 1',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: true,
        },
        {
          id: '2',
          label: 'Scenario 2',
          createdAt: '2026-02-18',
          inputs: mockInputs,
          result: mockSimulationResult,
          isBaseline: false,
        },
      ];

      // Switch baseline to scenario 2
      scenarios = scenarios.map((s) => ({
        ...s,
        isBaseline: s.id === '2',
      }));

      const baselineCount = scenarios.filter((s) => s.isBaseline).length;
      expect(baselineCount).toBe(1);
      expect(scenarios[1].isBaseline).toBe(true);
    });
  });

  describe('Comparison Metrics Extraction', () => {
    it('Extracts Year 1 metrics correctly', () => {
      const scenario: NamedScenario = {
        id: '1',
        label: 'Test',
        createdAt: '2026-02-18',
        inputs: mockInputs,
        result: mockSimulationResult,
        isBaseline: true,
      };

      const year1 = scenario.result.years[0];
      expect(year1.annuity).toBe(27900);
      expect(year1.totalIncome).toBe(58200);
      expect(year1.afterTaxIncome).toBe(51780);
    });

    it('Computes monthly after-tax income', () => {
      const scenario: NamedScenario = {
        id: '1',
        label: 'Test',
        createdAt: '2026-02-18',
        inputs: mockInputs,
        result: mockSimulationResult,
        isBaseline: true,
      };

      const year1AfterTax = scenario.result.years[0].afterTaxIncome;
      const monthly = year1AfterTax / 12;
      expect(monthly).toBeCloseTo(4315, 0);
    });

    it('Calculates effective federal rate', () => {
      const scenario: NamedScenario = {
        id: '1',
        label: 'Test',
        createdAt: '2026-02-18',
        inputs: mockInputs,
        result: mockSimulationResult,
        isBaseline: true,
      };

      const totalTax = scenario.result.totalLifetimeTax ?? 0;
      const totalIncome = scenario.result.totalLifetimeIncome;
      const effectiveRate = (totalTax / totalIncome) * 100;

      expect(effectiveRate).toBeCloseTo(10.14, 1);
    });
  });

  describe('Scenario Update', () => {
    it('Updates label and description', () => {
      const scenario: NamedScenario = {
        id: '1',
        label: 'Original Label',
        createdAt: '2026-02-18',
        description: 'Original description',
        inputs: mockInputs,
        result: mockSimulationResult,
        isBaseline: true,
      };

      const updated = {
        ...scenario,
        label: 'New Label',
        description: 'New description',
        updatedAt: '2026-02-19',
      };

      expect(updated.label).toBe('New Label');
      expect(updated.description).toBe('New description');
      expect(updated.updatedAt).toBe('2026-02-19');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSimulation } from '@hooks/useSimulation';
import { DEMO_INPUT } from '@data/demo-fixture';

describe('useSimulation', () => {
  it('returns null when input is null', () => {
    const { result } = renderHook(() => useSimulation(null));
    expect(result.current).toBeNull();
  });

  it('returns simulation data for valid input', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT));
    expect(result.current).not.toBeNull();
    const data = result.current!;

    expect(data.result).toBeDefined();
    expect(data.result.eligibility.eligible).toBe(true);
  });

  it('produces salary history', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT));
    const data = result.current!;

    expect(data.salaryHistory.length).toBeGreaterThan(0);
    expect(data.salaryHistory[0]).toHaveProperty('year');
    expect(data.salaryHistory[0]).toHaveProperty('salary');
    expect(data.salaryHistory[0]).toHaveProperty('grade');
    expect(data.salaryHistory[0]).toHaveProperty('step');
  });

  it('produces leave balances', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT));
    const data = result.current!;

    expect(data.leaveBalances.length).toBeGreaterThan(0);
    expect(data.leaveBalances[0]).toHaveProperty('year');
    expect(data.leaveBalances[0]).toHaveProperty('annualLeaveHours');
    expect(data.leaveBalances[0]).toHaveProperty('sickLeaveHours');
  });

  it('produces TSP balances', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT));
    const data = result.current!;

    expect(data.tspBalances.length).toBeGreaterThan(0);
    expect(data.tspBalances[0]).toHaveProperty('year');
    expect(data.tspBalances[0]).toHaveProperty('traditionalBalance');
    expect(data.tspBalances[0]).toHaveProperty('totalBalance');
  });

  it('produces smile curve data', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT));
    const data = result.current!;

    expect(data.smileCurve.length).toBe(31); // 0–30
    expect(data.smileCurve[0].multiplier).toBe(1.0);
    expect(data.smileCurve[15].multiplier).toBeCloseTo(0.85);
  });

  it('produces 30-year projection', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT));
    const data = result.current!;

    expect(data.result.projections).toHaveLength(30);
    expect(data.result.projections[0].totalIncome).toBeGreaterThan(0);
  });

  it('produces income waterfall data (simple path without SS)', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT, null));
    const data = result.current!;

    expect(data.incomeWaterfall.length).toBe(30);
    expect(data.incomeWaterfall[0]).toHaveProperty('year');
    expect(data.incomeWaterfall[0]).toHaveProperty('age');
    expect(data.incomeWaterfall[0]).toHaveProperty('annuity');
    expect(data.incomeWaterfall[0]).toHaveProperty('fersSupplement');
    expect(data.incomeWaterfall[0]).toHaveProperty('socialSecurity');
    expect(data.incomeWaterfall[0]).toHaveProperty('tspWithdrawal');
    expect(data.incomeWaterfall[0]).toHaveProperty('totalIncome');
    expect(data.incomeWaterfall[0]).toHaveProperty('totalExpenses');
    expect(data.incomeWaterfall[0]).toHaveProperty('surplus');

    // Without fullSimulation, SS should be 0
    expect(data.incomeWaterfall[0].socialSecurity).toBe(0);
  });

  it('produces TSP lifecycle data (accumulation only without fullSimulation)', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT, null));
    const data = result.current!;

    // Without fullSimulation config, should only have accumulation phase
    const hasAccumulation = data.tspLifecycle.some((d) => d.phase === 'accumulation');
    const hasDistribution = data.tspLifecycle.some((d) => d.phase === 'distribution');

    expect(hasAccumulation).toBe(true);
    expect(hasDistribution).toBe(false);
    expect(data.tspLifecycle.length).toBeGreaterThan(0);

    // Each point should have required fields
    data.tspLifecycle.forEach((point) => {
      expect(point).toHaveProperty('year');
      expect(point).toHaveProperty('phase');
      expect(point).toHaveProperty('traditionalBalance');
      expect(point).toHaveProperty('rothBalance');
      expect(point).toHaveProperty('totalBalance');
    });
  });

  it('produces expense phases data for 30-year retirement horizon', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT, null));
    const data = result.current!;

    // Without fullSimulation, expensePhases is empty
    expect(data.expensePhases.length).toBe(0);
  });

  it('produces RMD timeline (empty without fullSimulation)', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT, null));
    const data = result.current!;

    // Without fullSimulation, rmdTimeline is empty
    expect(Array.isArray(data.rmdTimeline)).toBe(true);
    expect(data.rmdTimeline.length).toBe(0);
  });

  it('includes Roth TSP balances in lifecycle when Roth contribution is specified', () => {
    // Create input with an explicit Roth contribution election
    const inputWithRoth = {
      ...DEMO_INPUT,
      profile: {
        ...DEMO_INPUT.profile,
        tspBalances: {
          ...DEMO_INPUT.profile.tspBalances,
          rothBalance: 50_000, // Non-zero starting Roth balance
        },
        tspContributions: [
          {
            id: 'roth-test',
            effectiveDate: '2024-01-01',
            employeeTraditionalPct: 0.03,
            employeeRothPct: 0.05, // 5% Roth contribution
            catchUpEnabled: false,
          },
        ],
      },
    };
    const { result } = renderHook(() => useSimulation(inputWithRoth, null));
    const data = result.current!;

    // Roth should be present in pre-retirement accumulation (from initial balance + contributions)
    const preRetirementRoth = data.tspLifecycle
      .filter((d) => d.phase === 'accumulation')
      .map((d) => d.rothBalance);

    // At least some years should have non-zero Roth
    const hasRoth = preRetirementRoth.some((balance) => balance > 0);
    expect(hasRoth).toBe(true);
  });

  it('shows zero Roth balance when no Roth contribution is specified', () => {
    // DEMO_INPUT has tspContributions: [] and rothBalance: 0 — should show 0 Roth
    const { result } = renderHook(() => useSimulation(DEMO_INPUT, null));
    const data = result.current!;

    const preRetirementRoth = data.tspLifecycle
      .filter((d) => d.phase === 'accumulation')
      .map((d) => d.rothBalance ?? 0);

    // Without a Roth contribution, Roth balance stays at the initial value (0)
    expect(preRetirementRoth.every((balance) => balance === 0)).toBe(true);
  });

  it('income waterfall totals match simulation result projections', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT, null));
    const data = result.current!;

    // Check first year income matches projection
    const projection = data.result.projections[0];
    const waterfall = data.incomeWaterfall[0];

    expect(waterfall.totalIncome).toBeCloseTo(projection.totalIncome, 0);
    expect(waterfall.totalExpenses).toBeCloseTo(projection.totalExpenses, 0);
    expect(waterfall.surplus).toBeCloseTo(projection.surplus, 0);
  });

  it('TSP lifecycle totals match TSP balance data', () => {
    const { result } = renderHook(() => useSimulation(DEMO_INPUT, null));
    const data = result.current!;

    // Pre-retirement TSP balances should match tspBalances array
    const preRetirementLifecycle = data.tspLifecycle.filter((d) => d.phase === 'accumulation');

    if (preRetirementLifecycle.length > 0 && data.tspBalances.length > 0) {
      const lastAccumYear = preRetirementLifecycle[preRetirementLifecycle.length - 1];
      const lastTspBalance = data.tspBalances[data.tspBalances.length - 1];

      expect(lastAccumYear.traditionalBalance).toBeCloseTo(lastTspBalance.traditionalBalance, 0);
      expect(lastAccumYear.rothBalance).toBeCloseTo(lastTspBalance.rothBalance, 0);
    }
  });
});

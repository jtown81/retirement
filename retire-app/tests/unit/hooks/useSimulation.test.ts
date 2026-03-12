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
});

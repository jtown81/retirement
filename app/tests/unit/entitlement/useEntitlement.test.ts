import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEntitlement } from '@hooks/useEntitlement';
import { STORAGE_KEYS } from '@storage/index';

describe('useEntitlement', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('defaults to basic tier when subscription key absent', () => {
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.tier).toBe('basic');
    expect(result.current.isBasic).toBe(true);
    expect(result.current.isPremium).toBe(false);
  });

  it('defaults to basic tier when subscription value is null', () => {
    localStorage.setItem(
      STORAGE_KEYS.SUBSCRIPTION,
      JSON.stringify({
        schemaVersion: 5,
        updatedAt: new Date().toISOString(),
        data: null,
      })
    );
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.tier).toBe('basic');
    expect(result.current.isBasic).toBe(true);
    expect(result.current.isPremium).toBe(false);
  });

  it('detects premium tier from storage', () => {
    localStorage.setItem(
      STORAGE_KEYS.SUBSCRIPTION,
      JSON.stringify({
        schemaVersion: 5,
        updatedAt: new Date().toISOString(),
        data: {
          tier: 'premium',
          activatedAt: new Date().toISOString(),
        },
      })
    );
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.tier).toBe('premium');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isBasic).toBe(false);
  });

  it('correctly evaluates basic tier features', () => {
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.isFeatureEnabled('fersEstimate')).toBe(true);
    expect(result.current.isFeatureEnabled('careerTimeline')).toBe(true);
    expect(result.current.isFeatureEnabled('expenseCategories')).toBe(true);
    expect(result.current.isFeatureEnabled('basicDashboard')).toBe(true);
    expect(result.current.isFeatureEnabled('scenarioSave')).toBe(true);
    expect(result.current.isFeatureEnabled('csvExport')).toBe(true);
  });

  it('blocks premium features for basic tier', () => {
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.isFeatureEnabled('simulationConfig')).toBe(false);
    expect(result.current.isFeatureEnabled('taxModeling')).toBe(false);
    expect(result.current.isFeatureEnabled('smileCurve')).toBe(false);
    expect(result.current.isFeatureEnabled('advancedDashboard')).toBe(false);
    expect(result.current.isFeatureEnabled('monteCarlo')).toBe(false);
    expect(result.current.isFeatureEnabled('scenarioUnlimited')).toBe(false);
    expect(result.current.isFeatureEnabled('excelExport')).toBe(false);
    expect(result.current.isFeatureEnabled('scenarioDiff')).toBe(false);
    expect(result.current.isFeatureEnabled('tspMonitor')).toBe(false);
  });

  it('allows all features for premium tier', () => {
    localStorage.setItem(
      STORAGE_KEYS.SUBSCRIPTION,
      JSON.stringify({
        schemaVersion: 5,
        updatedAt: new Date().toISOString(),
        data: {
          tier: 'premium',
          activatedAt: new Date().toISOString(),
        },
      })
    );
    const { result } = renderHook(() => useEntitlement());

    // Basic features
    expect(result.current.isFeatureEnabled('fersEstimate')).toBe(true);
    expect(result.current.isFeatureEnabled('careerTimeline')).toBe(true);

    // Premium features
    expect(result.current.isFeatureEnabled('simulationConfig')).toBe(true);
    expect(result.current.isFeatureEnabled('taxModeling')).toBe(true);
    expect(result.current.isFeatureEnabled('excelExport')).toBe(true);
    expect(result.current.isFeatureEnabled('monteCarlo')).toBe(true);
  });

  it('handles unknown features gracefully', () => {
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.isFeatureEnabled('unknownFeature')).toBe(false);
  });

  it('returns consistent tier value on re-renders', () => {
    const { result, rerender } = renderHook(() => useEntitlement());
    const tier1 = result.current.tier;

    rerender();
    const tier2 = result.current.tier;

    expect(tier1).toBe(tier2);
  });
});

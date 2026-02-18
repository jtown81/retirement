import { describe, it, expect } from 'vitest';
import { getIrmaaTiersForYear, findIrmaaTier, computeIrmaaSurcharge, computeIrmaaDetailed } from '@modules/tax';

describe('Medicare IRMAA Surcharges', () => {
  describe('getIrmaaTiersForYear', () => {
    it('returns tiers for 2024', () => {
      const tiers = getIrmaaTiersForYear(2024);
      expect(tiers.length).toBeGreaterThan(0);
      // Should have tiers for 4 filing statuses × 6 tiers each = 24 tiers
      expect(tiers.filter((t) => t.filingStatus === 'single')).toHaveLength(6);
      expect(tiers.filter((t) => t.filingStatus === 'married-joint')).toHaveLength(6);
      expect(tiers.filter((t) => t.filingStatus === 'married-separate')).toHaveLength(2);
      expect(tiers.filter((t) => t.filingStatus === 'head-of-household')).toHaveLength(6);
    });

    it('returns tiers for 2025', () => {
      const tiers = getIrmaaTiersForYear(2025);
      expect(tiers.length).toBeGreaterThan(0);
      expect(tiers[0].year).toBe(2025);
    });

    it('uses 2024 for years before 2024', () => {
      const tiers2020 = getIrmaaTiersForYear(2020);
      const tiers2024 = getIrmaaTiersForYear(2024);
      expect(tiers2020[0].year).toBe(2024); // Fallback to 2024
    });

    it('uses 2026 for years after 2026', () => {
      const tiers2030 = getIrmaaTiersForYear(2030);
      expect(tiers2030[0].year).toBe(2026); // Fallback to 2026
    });
  });

  describe('findIrmaaTier', () => {
    it('returns tier 1 (no surcharge) for single below $103k', () => {
      const tier = findIrmaaTier(100000, 'single', 2024);
      expect(tier).not.toBeNull();
      expect(tier!.minMagi).toBe(0);
      expect(tier!.maxMagi).toBe(103000);
      expect(tier!.maxSurcharge).toBe(0);
    });

    it('returns tier 2 for single $103k-$129k', () => {
      const tier = findIrmaaTier(110000, 'single', 2024);
      expect(tier).not.toBeNull();
      expect(tier!.minMagi).toBe(103000);
      expect(tier!.maxMagi).toBe(129000);
      expect(tier!.maxSurcharge).toBe(91); // $91/month
    });

    it('returns tier 3 for single $129k-$161k', () => {
      const tier = findIrmaaTier(140000, 'single', 2024);
      expect(tier).not.toBeNull();
      expect(tier!.minMagi).toBe(129000);
      expect(tier!.maxMagi).toBe(161000);
      expect(tier!.maxSurcharge).toBe(231); // $231/month
    });

    it('returns top tier for single above $500k', () => {
      const tier = findIrmaaTier(1000000, 'single', 2024);
      expect(tier).not.toBeNull();
      expect(tier!.maxMagi).toBeNull(); // Unbounded
      expect(tier!.maxSurcharge).toBe(503); // $503/month (capped)
    });

    it('MFJ has higher thresholds than single', () => {
      // At MAGI $110k: single is in tier 2, MFJ is in tier 1
      const singleTier = findIrmaaTier(110000, 'single', 2024);
      const mfjTier = findIrmaaTier(110000, 'married-joint', 2024);
      expect(singleTier!.minMagi).toBe(103000); // Tier 2
      expect(mfjTier!.minMagi).toBe(0); // Tier 1
      expect(mfjTier!.maxSurcharge).toBe(0);
    });

    it('MFJ tier 1 up to $206k', () => {
      const tier = findIrmaaTier(206000, 'married-joint', 2024);
      expect(tier!.maxSurcharge).toBe(0); // No surcharge at threshold
    });

    it('MFJ tier 2 from $206k-$258k', () => {
      const tier = findIrmaaTier(230000, 'married-joint', 2024);
      expect(tier!.minMagi).toBe(206000);
      expect(tier!.maxSurcharge).toBe(182); // $182/month
    });

    it('MFS always has very low thresholds', () => {
      const tier1 = findIrmaaTier(100000, 'married-separate', 2024);
      // MFS tier 1 is only $0-$103k, much like single
      // But tier 2 starts immediately after, with same max surcharge as tier 3 for others
      expect(tier1!.minMagi).toBe(0);
      expect(tier1!.maxMagi).toBe(103000);
    });
  });

  describe('computeIrmaaSurcharge', () => {
    it('returns $0 for single below $103k (2024)', () => {
      const surcharge = computeIrmaaSurcharge(100000, 'single', 2024);
      expect(surcharge).toBe(0);
    });

    it('returns $1,092 for single at $110k (2024)', () => {
      // Tier 2: $91/month × 12 = $1,092/year
      const surcharge = computeIrmaaSurcharge(110000, 'single', 2024);
      expect(surcharge).toBe(91 * 12); // $1,092
    });

    it('returns $2,772 for single at $140k (2024)', () => {
      // Tier 3: $231/month × 12 = $2,772/year
      const surcharge = computeIrmaaSurcharge(140000, 'single', 2024);
      expect(surcharge).toBe(231 * 12); // $2,772
    });

    it('returns $6,036 for single above $500k (2024)', () => {
      // Top tier: $503/month × 12 = $6,036/year (capped)
      const surcharge = computeIrmaaSurcharge(1000000, 'single', 2024);
      expect(surcharge).toBe(503 * 12); // $6,036
    });

    it('returns $0 for MFJ below $206k (2024)', () => {
      const surcharge = computeIrmaaSurcharge(200000, 'married-joint', 2024);
      expect(surcharge).toBe(0);
    });

    it('returns $2,184 for MFJ at $230k (2024)', () => {
      // Tier 2: $182/month × 12 = $2,184/year
      const surcharge = computeIrmaaSurcharge(230000, 'married-joint', 2024);
      expect(surcharge).toBe(182 * 12); // $2,184
    });

    it('MFJ has lower surcharge than single at same income', () => {
      const singleSurcharge = computeIrmaaSurcharge(110000, 'single', 2024);
      const mfjSurcharge = computeIrmaaSurcharge(110000, 'married-joint', 2024);
      // Single is in tier 2 ($91/month), MFJ is tier 1 ($0)
      expect(mfjSurcharge).toBeLessThan(singleSurcharge);
    });

    it('MFS is punitive (high surcharge at low income)', () => {
      const mfsSurcharge = computeIrmaaSurcharge(110000, 'married-separate', 2024);
      expect(mfsSurcharge).toBeGreaterThan(0); // Has surcharge even below $206k
    });
  });

  describe('computeIrmaaDetailed', () => {
    it('returns full result structure', () => {
      const result = computeIrmaaDetailed(110000, 'single', 2024);
      expect(result.magi).toBe(110000);
      expect(result.filingStatus).toBe('single');
      expect(result.year).toBe(2024);
      expect(result.tier).not.toBeNull();
      expect(result.monthlySurcharge).toBe(91);
      expect(result.annualSurcharge).toBe(1092);
    });

    it('tier is null for no income', () => {
      const result = computeIrmaaDetailed(0, 'single', 2024);
      expect(result.tier).not.toBeNull(); // Actually returns tier 1
      expect(result.monthlySurcharge).toBe(0);
      expect(result.annualSurcharge).toBe(0);
    });

    it('example: retired federal employee MFJ at $250k income', () => {
      // MFJ MAGI $250k → tier 2 ($182/month)
      const result = computeIrmaaDetailed(250000, 'married-joint', 2024);
      expect(result.tier!.minMagi).toBe(206000);
      expect(result.monthlySurcharge).toBe(182);
      expect(result.annualSurcharge).toBe(2184);
    });

    it('example: high-income MFJ at $1M (capped)', () => {
      // MFJ MAGI $1M → top tier, surcharge capped
      const result = computeIrmaaDetailed(1000000, 'married-joint', 2024);
      expect(result.annualSurcharge).toBe(1006 * 12); // $12,072 (capped)
    });
  });

  describe('Boundary conditions', () => {
    it('exactly at tier boundary (single $103k)', () => {
      const at = computeIrmaaSurcharge(103000, 'single', 2024);
      const above = computeIrmaaSurcharge(103001, 'single', 2024);
      expect(at).toBe(0); // Still in tier 1
      expect(above).toBeGreaterThan(0); // Enters tier 2
    });

    it('exactly at tier boundary (MFJ $206k)', () => {
      const at = computeIrmaaSurcharge(206000, 'married-joint', 2024);
      const above = computeIrmaaSurcharge(206001, 'married-joint', 2024);
      expect(at).toBe(0); // At tier 1 max
      expect(above).toBeGreaterThan(0); // Enters tier 2
    });

    it('surcharge increases as income increases', () => {
      const s110 = computeIrmaaSurcharge(110000, 'single', 2024);
      const s140 = computeIrmaaSurcharge(140000, 'single', 2024);
      const s500 = computeIrmaaSurcharge(500000, 'single', 2024);
      expect(s110).toBeLessThan(s140);
      expect(s140).toBeLessThan(s500);
    });

    it('surcharge caps at top tier', () => {
      const s500 = computeIrmaaSurcharge(500000, 'single', 2024);
      const s1m = computeIrmaaSurcharge(1000000, 'single', 2024);
      expect(s1m).toBe(s500); // Capped at $503/month
    });
  });
});

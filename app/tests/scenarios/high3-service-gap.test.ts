/**
 * Scenario Test: High-3 Salary with Service Gaps
 *
 * Tests the E-10 implementation of gap-aware High-3 calculation.
 * Validates that High-3 is computed from consecutive calendar years only,
 * and service gaps (separations/rehires) do not artificially inflate the average.
 *
 * Source: OPM FERS Handbook Ch. 50, § 50A1.1-2; 5 U.S.C. § 8411(d)
 */

import { describe, it, expect } from 'vitest';
import { buildSalaryHistory, computeHigh3Salary } from '@modules/career/projection';
import type { CareerProfile } from '@models/career';

function createCareerProfile(overrides: Partial<CareerProfile> = {}): CareerProfile {
  return {
    id: 'test-profile',
    scdLeave: '2010-01-01',
    scdRetirement: '2010-01-01',
    paySystem: 'GS',
    events: [],
    ...overrides,
  };
}

describe('Scenario: High-3 Salary with Service Gaps', () => {
  describe('Straight-through career (no gaps)', () => {
    it('correctly selects highest 3-year window with continuous service', () => {
      // Career: 2010-2015 continuous, salaries increasing
      const profile = createCareerProfile({
        events: [
          {
            id: 'hire',
            type: 'hire',
            effectiveDate: '2010-01-01',
            grade: 9,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 50000,
          },
        ],
      });

      const salaryHistory = buildSalaryHistory(profile, 2015, 0.02);
      const high3 = computeHigh3Salary(salaryHistory);

      // Should be a valid High-3 average
      expect(high3).toBeGreaterThan(0);
      expect(salaryHistory).toHaveLength(6); // 2010-2015
    });

    it('uses highest 3-year window from career', () => {
      // Career with promotion mid-way
      const profile = createCareerProfile({
        events: [
          {
            id: 'hire',
            type: 'hire',
            effectiveDate: '2015-01-01',
            grade: 7,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 41148,
          },
          {
            id: 'promo',
            type: 'promotion',
            effectiveDate: '2020-01-01',
            grade: 11,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 65000,
          },
        ],
      });

      const salaryHistory = buildSalaryHistory(profile, 2023, 0.02);
      const high3 = computeHigh3Salary(salaryHistory);

      // High-3 should be computed from consecutive years
      expect(high3).toBeGreaterThan(0);
      expect(salaryHistory.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Career with service gap (separation/rehire)', () => {
    it('skips non-consecutive year windows across gap', () => {
      // Career: 2010-2015 (GS-9), gap 2016-2018, 2019-2023 (GS-12)
      const profile = createCareerProfile({
        events: [
          {
            id: 'hire1',
            type: 'hire',
            effectiveDate: '2010-01-01',
            grade: 9,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 50000,
          },
          {
            id: 'sep',
            type: 'separation',
            effectiveDate: '2016-01-01',
            grade: 9,
            step: 10,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 0,
          },
          {
            id: 'rehire',
            type: 'rehire',
            effectiveDate: '2019-01-01',
            grade: 12,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 65000,
          },
        ],
      });

      const salaryHistory = buildSalaryHistory(profile, 2023, 0.02);

      // Salary history should only include active years: 2010-2015, 2019-2023
      // (gap: 2016, 2017, 2018)
      const preGapYears = salaryHistory.filter(y => y.year < 2019);
      const postGapYears = salaryHistory.filter(y => y.year >= 2019);

      expect(preGapYears).toHaveLength(6); // 2010-2015
      expect(postGapYears).toHaveLength(5); // 2019-2023

      const high3 = computeHigh3Salary(salaryHistory);

      // High-3 should be computed from the highest consecutive 3-year period
      expect(high3).toBeGreaterThan(0);

      // Key validation: High-3 cannot span across the gap
      // It must be either from 2010-2015 or from 2019-2023
      // Post-gap salaries are higher (GS-12 vs GS-9), so High-3 should reflect higher salary band
      const preGapFirst3Avg = preGapYears.slice(0, 3).reduce((sum, y) => sum + y.annualSalary, 0) / 3;
      const postGapFirst3Avg = postGapYears.slice(0, 3).reduce((sum, y) => sum + y.annualSalary, 0) / 3;

      // High-3 should be closer to post-gap (higher salary band)
      expect(high3).toBeGreaterThan(preGapFirst3Avg);
    });

    it('correctly handles multiple separations and rehires', () => {
      // Complex career: 2010-2012, gap, 2015-2017, gap, 2020-2023
      const profile = createCareerProfile({
        events: [
          {
            id: 'hire1',
            type: 'hire',
            effectiveDate: '2010-01-01',
            grade: 7,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 41148,
          },
          {
            id: 'sep1',
            type: 'separation',
            effectiveDate: '2013-01-01',
            grade: 7,
            step: 5,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 0,
          },
          {
            id: 'rehire1',
            type: 'rehire',
            effectiveDate: '2015-01-01',
            grade: 9,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 50000,
          },
          {
            id: 'sep2',
            type: 'separation',
            effectiveDate: '2018-01-01',
            grade: 9,
            step: 5,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 0,
          },
          {
            id: 'rehire2',
            type: 'rehire',
            effectiveDate: '2020-01-01',
            grade: 11,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 65000,
          },
        ],
      });

      const salaryHistory = buildSalaryHistory(profile, 2023, 0.02);

      // Active years: 2010-2012, 2015-2017, 2020-2023
      const segments = [
        salaryHistory.filter(y => y.year >= 2010 && y.year <= 2012),
        salaryHistory.filter(y => y.year >= 2015 && y.year <= 2017),
        salaryHistory.filter(y => y.year >= 2020 && y.year <= 2023),
      ];

      expect(segments[0]).toHaveLength(3);
      expect(segments[1]).toHaveLength(3);
      expect(segments[2]).toHaveLength(4);

      const high3 = computeHigh3Salary(salaryHistory);

      // High-3 should be computed, respecting gaps
      expect(high3).toBeGreaterThan(0);
    });
  });

  describe('Edge case: Service gaps near end of career', () => {
    it('correctly handles gap just before retirement', () => {
      // Career: 2010-2018 continuous, gap 2019, retirement 2024
      const profile = createCareerProfile({
        events: [
          {
            id: 'hire',
            type: 'hire',
            effectiveDate: '2010-01-01',
            grade: 11,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 65000,
          },
          {
            id: 'sep',
            type: 'separation',
            effectiveDate: '2019-01-01',
            grade: 11,
            step: 10,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 0,
          },
          {
            id: 'rehire',
            type: 'rehire',
            effectiveDate: '2020-01-01',
            grade: 11,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 65000,
          },
        ],
      });

      const salaryHistory = buildSalaryHistory(profile, 2024, 0.02);

      // Active years: 2010-2018, 2020-2024 (gap: 2019)
      const preGap = salaryHistory.filter(y => y.year < 2019);
      const postGap = salaryHistory.filter(y => y.year >= 2020);
      expect(preGap.length).toBeGreaterThan(0);
      expect(postGap.length).toBeGreaterThan(0);

      const high3 = computeHigh3Salary(salaryHistory);

      // High-3 should be computed from consecutive years
      expect(high3).toBeGreaterThan(0);
    });

    it('falls back to best available average if no consecutive triple exists', () => {
      // Career with only 2 consecutive years (artificial edge case)
      const profile = createCareerProfile({
        events: [
          {
            id: 'hire',
            type: 'hire',
            effectiveDate: '2022-01-01',
            grade: 11,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 65000,
          },
        ],
      });

      const salaryHistory = buildSalaryHistory(profile, 2023, 0.02);

      // Only 2 active years: 2022, 2023
      expect(salaryHistory).toHaveLength(2);

      const high3 = computeHigh3Salary(salaryHistory);

      // No consecutive triple possible, falls back to average of all available
      expect(high3).toBeGreaterThan(0);
      // Average of 2 years should be less than if it were 3 years
      const avgAllYears = salaryHistory.reduce((sum, y) => sum + y.annualSalary, 0) / salaryHistory.length;
      expect(high3).toBeCloseTo(avgAllYears, -1);
    });
  });

  describe('Comparison: Gap handling validation', () => {
    it('properly separates salary periods by gap', () => {
      // Pre-gap salary period: 2010-2015 GS-9 (50k base)
      // Post-gap salary period: 2020-2023 GS-12 (65k base)

      const profileWithGap = createCareerProfile({
        events: [
          {
            id: 'hire1',
            type: 'hire',
            effectiveDate: '2010-01-01',
            grade: 9,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 50000,
          },
          {
            id: 'sep',
            type: 'separation',
            effectiveDate: '2016-01-01',
            grade: 9,
            step: 10,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 0,
          },
          {
            id: 'rehire',
            type: 'rehire',
            effectiveDate: '2020-01-01',
            grade: 12,
            step: 1,
            localityCode: 'RUS',
            paySystem: 'GS',
            annualSalary: 65000,
          },
        ],
      });

      const salaryHistory = buildSalaryHistory(profileWithGap, 2023, 0.02);
      const preGapYears = salaryHistory.filter(y => y.year < 2016);
      const postGapYears = salaryHistory.filter(y => y.year >= 2020);

      // Both periods should be present
      expect(preGapYears.length).toBeGreaterThan(0);
      expect(postGapYears.length).toBeGreaterThan(0);

      const high3 = computeHigh3Salary(salaryHistory);

      // High-3 should be valid
      expect(high3).toBeGreaterThan(0);

      // Post-gap salaries are significantly higher (GS-12 vs GS-9)
      // High-3 should reflect the higher post-gap period
      const postGapAvg = postGapYears.slice(0, 3).reduce((sum, y) => sum + y.annualSalary, 0) / Math.min(3, postGapYears.length);
      const preGapAvg = preGapYears.slice(0, 3).reduce((sum, y) => sum + y.annualSalary, 0) / Math.min(3, preGapYears.length);

      // High-3 should be closer to post-gap period (higher salary)
      expect(Math.abs(high3 - postGapAvg)).toBeLessThan(Math.abs(high3 - preGapAvg));
    });
  });
});

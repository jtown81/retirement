/**
 * Unit tests: Career Salary History & High-3 Computation
 */

import { describe, it, expect } from 'vitest';
import { buildSalaryHistory, computeHigh3Salary } from '@modules/career/projection';
import type { CareerProfile } from '@models/career';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProfile(overrides: Partial<CareerProfile> = {}): CareerProfile {
  return {
    id: 'test-profile',
    scdLeave: '1994-06-01',
    scdRetirement: '1994-06-01',
    paySystem: 'GS',
    events: [],
    ...overrides,
  };
}

// A simple GS-7 Step 1 hire that stays put (no promotions)
const staticProfile: CareerProfile = makeProfile({
  events: [
    {
      id: 'hire',
      type: 'hire',
      effectiveDate: '2020-01-01',
      grade: 7,
      step: 1,
      localityCode: 'RUS',
      paySystem: 'GS',
      annualSalary: 41_148,
    },
  ],
});

// A career with a promotion mid-way
const promotionProfile: CareerProfile = makeProfile({
  events: [
    {
      id: 'hire',
      type: 'hire',
      effectiveDate: '2018-01-01',
      grade: 9,
      step: 1,
      localityCode: 'WASHINGTON',
      paySystem: 'GS',
      annualSalary: 50_246,
    },
    {
      id: 'promo',
      type: 'promotion',
      effectiveDate: '2022-01-01',
      grade: 11,
      step: 1,
      localityCode: 'WASHINGTON',
      paySystem: 'GS',
      annualSalary: 60_717,
    },
  ],
});

// ---------------------------------------------------------------------------
// buildSalaryHistory
// ---------------------------------------------------------------------------

describe('buildSalaryHistory', () => {
  it('returns empty array for a profile with no events', () => {
    const result = buildSalaryHistory(makeProfile(), 2024);
    expect(result).toHaveLength(0);
  });

  it('returns one entry per active year', () => {
    const result = buildSalaryHistory(staticProfile, 2024);
    // 2020, 2021, 2022, 2023, 2024 = 5 years
    expect(result).toHaveLength(5);
  });

  it('salary is positive for all years', () => {
    const result = buildSalaryHistory(staticProfile, 2024);
    result.forEach(yr => expect(yr.annualSalary).toBeGreaterThan(0));
  });

  it('grade reflects promotion in the year it occurs', () => {
    const result = buildSalaryHistory(promotionProfile, 2024);
    const yr2021 = result.find(y => y.year === 2021);
    const yr2022 = result.find(y => y.year === 2022);
    expect(yr2021?.grade).toBe(9);
    expect(yr2022?.grade).toBe(11);
  });

  it('omits years before hire', () => {
    const result = buildSalaryHistory(staticProfile, 2024);
    expect(result.find(y => y.year < 2020)).toBeUndefined();
  });

  it('salary grows over time due to annual WGI step increases', () => {
    // An employee hired at step 1 with 52-week WGI: step 2 in year 2
    const result = buildSalaryHistory(staticProfile, 2024);
    const yr2020 = result.find(y => y.year === 2020)!;
    const yr2024 = result.find(y => y.year === 2024)!;
    expect(yr2024.annualSalary).toBeGreaterThan(yr2020.annualSalary);
  });

  it('handles separation: omits years during gap', () => {
    const profile = makeProfile({
      events: [
        {
          id: 'hire',
          type: 'hire',
          effectiveDate: '2018-01-01',
          grade: 9,
          step: 1,
          localityCode: 'RUS',
          paySystem: 'GS',
          annualSalary: 50_000,
        },
        {
          id: 'sep',
          type: 'separation',
          effectiveDate: '2020-01-01',
          grade: 9,
          step: 3,
          localityCode: 'RUS',
          paySystem: 'GS',
          annualSalary: 50_000,
        },
        {
          id: 'rehire',
          type: 'rehire',
          effectiveDate: '2022-01-01',
          grade: 9,
          step: 3,
          localityCode: 'RUS',
          paySystem: 'GS',
          annualSalary: 50_000,
        },
      ],
    });
    const result = buildSalaryHistory(profile, 2024);
    // During separation (2020–2021) there should be no entries
    expect(result.find(y => y.year === 2020)).toBeUndefined();
    expect(result.find(y => y.year === 2021)).toBeUndefined();
    expect(result.find(y => y.year === 2022)).toBeDefined();
  });

  it('isTitle38Override is false for GS positions', () => {
    const result = buildSalaryHistory(staticProfile, 2024);
    result.forEach(yr => expect(yr.isTitle38Override).toBe(false));
  });

  it('isTitle38Override is true for Title 38 positions', () => {
    const profile = makeProfile({
      paySystem: 'Title38',
      events: [
        {
          id: 'hire',
          type: 'hire',
          effectiveDate: '2020-01-01',
          grade: 11,
          step: 1,
          localityCode: 'WASHINGTON',
          paySystem: 'Title38',
          annualSalary: 100_000,
        },
      ],
    });
    const result = buildSalaryHistory(profile, 2024);
    result.forEach(yr => expect(yr.isTitle38Override).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// computeHigh3Salary
// ---------------------------------------------------------------------------

describe('computeHigh3Salary', () => {
  it('returns the highest 3-year average', () => {
    const history = [
      { year: 2020, annualSalary: 80_000, grade: 11 as const, step: 1 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
      { year: 2021, annualSalary: 90_000, grade: 11 as const, step: 3 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
      { year: 2022, annualSalary: 100_000, grade: 12 as const, step: 1 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
      { year: 2023, annualSalary: 110_000, grade: 12 as const, step: 3 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
    ];
    // Best 3-year window is [90k, 100k, 110k] = avg 100k
    expect(computeHigh3Salary(history)).toBe(100_000);
  });

  it('returns average of all years when fewer than 3 are available', () => {
    const history = [
      { year: 2022, annualSalary: 80_000, grade: 9 as const, step: 1 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
      { year: 2023, annualSalary: 90_000, grade: 9 as const, step: 2 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
    ];
    expect(computeHigh3Salary(history)).toBe(85_000);
  });

  it('returns 0 for an empty salary history', () => {
    expect(computeHigh3Salary([])).toBe(0);
  });

  it('returns salary as-is for a single year', () => {
    const history = [
      { year: 2024, annualSalary: 95_000, grade: 12 as const, step: 1 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
    ];
    expect(computeHigh3Salary(history)).toBe(95_000);
  });

  it('picks the highest window, not just the last 3 years', () => {
    // Salaries peak in the middle then drop (unusual but valid test)
    const history = [
      { year: 2018, annualSalary: 100_000, grade: 13 as const, step: 5 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
      { year: 2019, annualSalary: 110_000, grade: 13 as const, step: 6 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
      { year: 2020, annualSalary: 120_000, grade: 13 as const, step: 7 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
      { year: 2021, annualSalary: 80_000, grade: 7 as const, step: 1 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },  // demotion scenario
      { year: 2022, annualSalary: 85_000, grade: 7 as const, step: 3 as const, localityCode: 'RUS', paySystem: 'GS' as const, isTitle38Override: false },
    ];
    // Best window is [100k, 110k, 120k] = 110k
    expect(computeHigh3Salary(history)).toBe(110_000);
  });
});

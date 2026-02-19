/**
 * Unit tests: Grade/Step Salary Lookup and WGI Timing
 */

import { describe, it, expect } from 'vitest';
import { gradeStepToSalary, getStepIncreaseDate, getNextWGIDate, WGI_WEEKS } from '@modules/career/grade-step';

describe('gradeStepToSalary', () => {
  it('returns exact 2024 GS-13 Step 1 salary', () => {
    expect(gradeStepToSalary(13, 1, 2024)).toBe(86_468);
  });

  it('returns exact 2024 GS-15 Step 10 salary', () => {
    expect(gradeStepToSalary(15, 10, 2024)).toBe(156_193);
  });

  it('returns exact 2024 GS-7 Step 1 salary', () => {
    expect(gradeStepToSalary(7, 1, 2024)).toBe(41_148);
  });

  it('returns exact 2024 GS-1 Step 1 salary', () => {
    expect(gradeStepToSalary(1, 1, 2024)).toBe(21_621);
  });

  it('projects 2026 salary as approximately 2024 × 1.0390 × 1.02 (known + 1 projected year)', () => {
    const base = gradeStepToSalary(13, 1, 2024);
    const projected = gradeStepToSalary(13, 1, 2026, 0.02);
    // 2025 factor: 1.0390 (actual avg GS table increase 2024→2025); 2026 = 1.0390 × 1.02
    const expectedFactor = 1.0390 * 1.02;
    expect(projected).toBeCloseTo(base * expectedFactor, -2);  // within $100
  });

  it('throws RangeError for grade 0', () => {
    expect(() => gradeStepToSalary(0, 1, 2024)).toThrow(RangeError);
  });

  it('throws RangeError for grade 16', () => {
    expect(() => gradeStepToSalary(16, 1, 2024)).toThrow(RangeError);
  });

  it('throws RangeError for step 0', () => {
    expect(() => gradeStepToSalary(7, 0, 2024)).toThrow(RangeError);
  });

  it('throws RangeError for step 11', () => {
    expect(() => gradeStepToSalary(7, 11, 2024)).toThrow(RangeError);
  });

  it('step 10 salary is always greater than step 1 salary for any grade', () => {
    for (let g = 1; g <= 15; g++) {
      expect(gradeStepToSalary(g, 10, 2024)).toBeGreaterThan(gradeStepToSalary(g, 1, 2024));
    }
  });

  it('GS-15 step 1 salary exceeds GS-1 step 10 salary', () => {
    expect(gradeStepToSalary(15, 1, 2024)).toBeGreaterThan(gradeStepToSalary(1, 10, 2024));
  });
});

describe('WGI_WEEKS', () => {
  it('has 9 entries (steps 1–9 can advance)', () => {
    expect(WGI_WEEKS).toHaveLength(9);
  });

  it('first 3 entries are 52 weeks (steps 1–3)', () => {
    expect(WGI_WEEKS[0]).toBe(52);
    expect(WGI_WEEKS[1]).toBe(52);
    expect(WGI_WEEKS[2]).toBe(52);
  });

  it('entries 3–5 are 104 weeks (steps 4–6)', () => {
    expect(WGI_WEEKS[3]).toBe(104);
    expect(WGI_WEEKS[4]).toBe(104);
    expect(WGI_WEEKS[5]).toBe(104);
  });

  it('entries 6–8 are 156 weeks (steps 7–9)', () => {
    expect(WGI_WEEKS[6]).toBe(156);
    expect(WGI_WEEKS[7]).toBe(156);
    expect(WGI_WEEKS[8]).toBe(156);
  });
});

describe('getStepIncreaseDate', () => {
  it('step 1 → 2 fires after exactly 52 weeks', () => {
    const start = new Date('2024-01-01');
    const result = getStepIncreaseDate(1, start);
    expect(result).not.toBeNull();
    const expectedMs = 52 * 7 * 24 * 60 * 60 * 1000;
    expect(result!.getTime() - start.getTime()).toBe(expectedMs);
  });

  it('step 4 → 5 fires after exactly 104 weeks', () => {
    const start = new Date('2024-01-01');
    const result = getStepIncreaseDate(4, start);
    expect(result).not.toBeNull();
    const expectedMs = 104 * 7 * 24 * 60 * 60 * 1000;
    expect(result!.getTime() - start.getTime()).toBe(expectedMs);
  });

  it('step 7 → 8 fires after exactly 156 weeks', () => {
    const start = new Date('2024-01-01');
    const result = getStepIncreaseDate(7, start);
    expect(result).not.toBeNull();
    const expectedMs = 156 * 7 * 24 * 60 * 60 * 1000;
    expect(result!.getTime() - start.getTime()).toBe(expectedMs);
  });

  it('returns null at step 10 (no further WGI)', () => {
    expect(getStepIncreaseDate(10, new Date('2024-01-01'))).toBeNull();
  });

  it('throws RangeError for step 0', () => {
    expect(() => getStepIncreaseDate(0, new Date())).toThrow(RangeError);
  });

  it('throws RangeError for step 11', () => {
    expect(() => getStepIncreaseDate(11, new Date())).toThrow(RangeError);
  });
});

describe('getNextWGIDate', () => {
  it('returns ISO date string for step 1', () => {
    const result = getNextWGIDate(1, '2024-01-01');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns null for step 10', () => {
    expect(getNextWGIDate(10, '2024-01-01')).toBeNull();
  });
});

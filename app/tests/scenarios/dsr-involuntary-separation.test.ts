/**
 * Scenario Test: DSR (Discontinued Service Retirement) — Involuntary Separation
 *
 * Tests the E-13 implementation of DSR eligibility under 5 U.S.C. § 8414(b).
 * Validates that involuntary separation with age 50+20 or any age +25 years
 * qualifies for immediate unreduced FERS annuity with supplement eligibility.
 *
 * Source: 5 U.S.C. § 8414(b)(1)(A); OPM FERS Handbook Ch. 50, § 50B2.1-2
 */

import { describe, it, expect } from 'vitest';
import { checkFERSEligibility } from '@modules/simulation/eligibility';
import { computeFERSAnnuity, computeFERSSupplement } from '@modules/simulation/annuity';

describe('Scenario: DSR (Involuntary Separation)', () => {
  describe('Eligibility: Age 50 + 20 years involuntary', () => {
    it('qualifies for immediate unreduced DSR annuity', () => {
      const age = 50;
      const yearsOfService = 20;
      const birthYear = 1974; // Age 50 in 2024
      const involuntarySeparation = true;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(true);
      expect(eligibility.type).toBe('DSR');
      expect(eligibility.enhancedMultiplier).toBe(false);
    });

    it('receives FERS supplement (age 50+20 DSR)', () => {
      const age = 50;
      const yearsOfService = 20;
      const birthYear = 1974;
      const involuntarySeparation = true;
      const ssMonthlyAt62 = 1500;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);
      const supplement = computeFERSSupplement(age, eligibility.type, yearsOfService, ssMonthlyAt62);

      expect(supplement.eligible).toBe(true);
      expect(supplement.annualAmount).toBeGreaterThan(0);
      // Formula: monthlyAmount = ssMonthlyAt62 * (min(yearsOfService, 40) / 40) * 12
      // = 1500 * (20/40) * 12 = 1500 * 0.5 * 12 = $9,000/year
      expect(supplement.annualAmount).toBe(9000);
    });

    it('qualifies for annuity calculation at age 50+20 DSR', () => {
      const age = 50;
      const yearsOfService = 20;
      const birthYear = 1974;
      const involuntarySeparation = true;
      const high3 = 75000;
      const survivorBenefit = 'none';

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      // DSR eligibility should be confirmed
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.type).toBe('DSR');

      // Annuity calculation should work with DSR
      if (eligibility.type === 'DSR') {
        const annuity = computeFERSAnnuity(high3, yearsOfService, age, eligibility.type, survivorBenefit);
        expect(annuity).toBeDefined();
      }
    });
  });

  describe('Eligibility: Any age + 25 years involuntary', () => {
    it('qualifies at age 40 with 25 years DSR', () => {
      const age = 40;
      const yearsOfService = 25;
      const birthYear = 1984; // Age 40 in 2024
      const involuntarySeparation = true;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(true);
      expect(eligibility.type).toBe('DSR');
    });

    it('qualifies at age 35 with 25 years DSR', () => {
      const age = 35;
      const yearsOfService = 25;
      const birthYear = 1989; // Age 35 in 2024
      const involuntarySeparation = true;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(true);
      expect(eligibility.type).toBe('DSR');
    });

    it('receives FERS supplement (age 35+25 DSR)', () => {
      const age = 35;
      const yearsOfService = 25;
      const birthYear = 1989;
      const involuntarySeparation = true;
      const ssMonthlyAt62 = 2000;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);
      const supplement = computeFERSSupplement(age, eligibility.type, yearsOfService, ssMonthlyAt62);

      expect(supplement.eligible).toBe(true);
      // Formula: 2000 * (min(25, 40) / 40) * 12 = 2000 * 0.625 * 12 = $15,000/year
      expect(supplement.annualAmount).toBe(15000);
    });

    it('qualifies for annuity calculation at age 35+25 DSR', () => {
      const age = 35;
      const yearsOfService = 25;
      const birthYear = 1989;
      const involuntarySeparation = true;
      const high3 = 80000;
      const survivorBenefit = 'none';

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      // DSR eligibility should be confirmed
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.type).toBe('DSR');

      // Annuity calculation should be possible with DSR eligibility
      if (eligibility.type === 'DSR') {
        const annuity = computeFERSAnnuity(high3, yearsOfService, age, eligibility.type, survivorBenefit);
        expect(annuity).toBeDefined();
      }
    });
  });

  describe('Non-DSR comparison', () => {
    it('age 50+20 WITHOUT involuntary separation does NOT qualify DSR', () => {
      const age = 50;
      const yearsOfService = 20;
      const birthYear = 1974;
      const involuntarySeparation = false; // Normal separation

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(false); // Does not meet any standard criteria
      expect(eligibility.type).toBe(null);
    });

    it('age 40+25 WITHOUT involuntary separation does NOT qualify DSR', () => {
      const age = 40;
      const yearsOfService = 25;
      const birthYear = 1984;
      const involuntarySeparation = false; // Normal separation

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(false); // Does not meet MRA+30
      expect(eligibility.type).toBe(null);
    });
  });

  describe('Edge cases', () => {
    it('age 50+19 years involuntary does NOT qualify DSR', () => {
      const age = 50;
      const yearsOfService = 19; // One year short
      const birthYear = 1974;
      const involuntarySeparation = true;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.type).toBe(null);
    });

    it('age 49+20 years involuntary does NOT qualify DSR', () => {
      const age = 49; // One year short
      const yearsOfService = 20;
      const birthYear = 1975;
      const involuntarySeparation = true;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.type).toBe(null);
    });

    it('age 30+24 years involuntary does NOT qualify DSR', () => {
      const age = 30;
      const yearsOfService = 24; // One year short of 25
      const birthYear = 1994;
      const involuntarySeparation = true;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.type).toBe(null);
    });

    it('DSR takes priority over MRA+10-reduced when both apply', () => {
      // Age 50+20 involuntary DOES qualify for DSR
      const age = 50;
      const yearsOfService = 20;
      const birthYear = 1974; // Age 50 in 2024
      const involuntarySeparation = true;

      const eligibility = checkFERSEligibility(age, yearsOfService, birthYear, involuntarySeparation);

      // Would also potentially qualify for other schemes, but DSR takes priority
      expect(eligibility.type).toBe('DSR');
      expect(eligibility.eligible).toBe(true);
    });
  });
});

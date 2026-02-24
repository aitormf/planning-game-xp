import { describe, it, expect } from 'vitest';
import {
  calculatePriorityValue,
  calculatePriorityRank,
  findClosestRank,
  getPriorityDisplay,
  getPriorityColor,
  getAllPriorityRanks
} from '@/utils/priority-utils.js';

describe('priority-utils', () => {
  describe('calculatePriorityValue', () => {
    it('should calculate priority value correctly for 5/1', () => {
      expect(calculatePriorityValue(5, 1)).toBe(500);
    });

    it('should calculate priority value correctly for 1/5', () => {
      expect(calculatePriorityValue(1, 5)).toBe(20);
    });

    it('should calculate priority value correctly for equal points', () => {
      expect(calculatePriorityValue(3, 3)).toBe(100);
      expect(calculatePriorityValue(1, 1)).toBe(100);
      expect(calculatePriorityValue(5, 5)).toBe(100);
    });

    it('should round to nearest integer', () => {
      // 4/3 = 133.33... -> 133
      expect(calculatePriorityValue(4, 3)).toBe(133);
      // 2/3 = 66.66... -> 67
      expect(calculatePriorityValue(2, 3)).toBe(67);
    });

    it('should return 0 when businessPoints is 0 or null', () => {
      expect(calculatePriorityValue(0, 3)).toBe(0);
      expect(calculatePriorityValue(null, 3)).toBe(0);
      expect(calculatePriorityValue(undefined, 3)).toBe(0);
    });

    it('should return 0 when devPoints is 0 or null', () => {
      expect(calculatePriorityValue(3, 0)).toBe(0);
      expect(calculatePriorityValue(3, null)).toBe(0);
      expect(calculatePriorityValue(3, undefined)).toBe(0);
    });
  });

  describe('calculatePriorityRank', () => {
    it('should return rank 1 for 5/1 (highest priority)', () => {
      expect(calculatePriorityRank(5, 1)).toBe(1);
    });

    it('should return rank 25 for 1/5 (lowest priority in 1-5)', () => {
      expect(calculatePriorityRank(1, 5)).toBe(25);
    });

    it('should return null for invalid inputs', () => {
      expect(calculatePriorityRank(0, 3)).toBeNull();
      expect(calculatePriorityRank(null, 3)).toBeNull();
      expect(calculatePriorityRank(3, 0)).toBeNull();
    });

    it('should support fibonacci scoring', () => {
      const rank = calculatePriorityRank(13, 1, 'fibonacci');
      expect(rank).toBe(1);
      const rankLow = calculatePriorityRank(1, 13, 'fibonacci');
      expect(rankLow).toBe(36);
    });
  });

  describe('findClosestRank', () => {
    it('should return exact rank for known ratio values', () => {
      expect(findClosestRank(500)).toBe(1);   // 5/1
      expect(findClosestRank(400)).toBe(2);   // 4/1
      expect(findClosestRank(100)).toBe(11);  // x/x
      expect(findClosestRank(20)).toBe(25);   // 1/5
    });

    it('should return null for 0 or invalid values', () => {
      expect(findClosestRank(0)).toBeNull();
      expect(findClosestRank(null)).toBeNull();
      expect(findClosestRank(undefined)).toBeNull();
    });

    it('should find rank for values between known ratios', () => {
      // 450 is >= 400 (rank 2), so rank 1 (first entry whose ratio <= 450 is rank 1 at 500? No, 450 < 500)
      // Walk: 500 > 450? No → 400 <= 450? Yes → rank 2
      expect(findClosestRank(450)).toBe(2);

      // 420 is >= 400 (rank 2), so rank 2
      expect(findClosestRank(420)).toBe(2);

      // 95 is < 100 but >= 80, so matches rank 16 (4/5 ratio=80)
      expect(findClosestRank(95)).toBe(16);
    });
  });

  describe('getPriorityDisplay', () => {
    it('should return correct display for highest priority (5/1)', () => {
      const result = getPriorityDisplay(5, 1);
      expect(result.label).toBe('Prioridad 1');
      expect(result.shortLabel).toBe('P1');
      expect(result.rank).toBe(1);
      expect(result.badge).toBe('500');
      expect(result.value).toBe(500);
      expect(result.hasPriority).toBe(true);
      expect(result.color).toBe('white');
      expect(result.backgroundColor).toContain('rgba(230, 0, 206,');
    });

    it('should return correct display for lowest priority (1/5)', () => {
      const result = getPriorityDisplay(1, 5);
      expect(result.label).toBe('Prioridad 25');
      expect(result.shortLabel).toBe('P25');
      expect(result.rank).toBe(25);
      expect(result.badge).toBe('20');
      expect(result.value).toBe(20);
      expect(result.hasPriority).toBe(true);
    });

    it('should return correct display for equal points (3/3)', () => {
      const result = getPriorityDisplay(3, 3);
      // 3/3 = ratio 100, all x/x combinations share rank 11
      expect(result.rank).toBe(11);
      expect(result.badge).toBe('100');
      expect(result.value).toBe(100);
      expect(result.hasPriority).toBe(true);
    });

    it('should return no priority when points are missing', () => {
      const result = getPriorityDisplay(0, 0);
      expect(result.label).toBe('Sin prioridad');
      expect(result.shortLabel).toBe('—');
      expect(result.rank).toBeNull();
      expect(result.badge).toBeNull();
      expect(result.value).toBe(0);
      expect(result.hasPriority).toBe(false);
    });

    it('should return no priority when businessPoints is missing', () => {
      const result = getPriorityDisplay(null, 3);
      expect(result.hasPriority).toBe(false);
      expect(result.label).toBe('Sin prioridad');
    });

    it('should return no priority when devPoints is missing', () => {
      const result = getPriorityDisplay(3, null);
      expect(result.hasPriority).toBe(false);
      expect(result.label).toBe('Sin prioridad');
    });

    // Test all 25 priority combinations for 1-5 system.
    // Combinations with the same ratio share the same rank
    // (the rank of the first occurrence in the sorted map).
    const priorityCombinations = [
      { b: 5, d: 1, expectedRank: 1 },   // ratio=500
      { b: 4, d: 1, expectedRank: 2 },   // ratio=400
      { b: 3, d: 1, expectedRank: 3 },   // ratio=300
      { b: 5, d: 2, expectedRank: 4 },   // ratio=250
      { b: 2, d: 1, expectedRank: 5 },   // ratio=200
      { b: 4, d: 2, expectedRank: 5 },   // ratio=200 (same as 2/1)
      { b: 5, d: 3, expectedRank: 7 },   // ratio=166.67
      { b: 3, d: 2, expectedRank: 8 },   // ratio=150
      { b: 4, d: 3, expectedRank: 9 },   // ratio=133.33
      { b: 5, d: 4, expectedRank: 10 },  // ratio=125
      { b: 1, d: 1, expectedRank: 11 },  // ratio=100
      { b: 2, d: 2, expectedRank: 11 },  // ratio=100 (same)
      { b: 3, d: 3, expectedRank: 11 },  // ratio=100 (same)
      { b: 4, d: 4, expectedRank: 11 },  // ratio=100 (same)
      { b: 5, d: 5, expectedRank: 11 },  // ratio=100 (same)
      { b: 4, d: 5, expectedRank: 16 },  // ratio=80
      { b: 3, d: 4, expectedRank: 17 },  // ratio=75
      { b: 2, d: 3, expectedRank: 18 },  // ratio=66.67
      { b: 3, d: 5, expectedRank: 19 },  // ratio=60
      { b: 1, d: 2, expectedRank: 20 },  // ratio=50
      { b: 2, d: 4, expectedRank: 20 },  // ratio=50 (same as 1/2)
      { b: 2, d: 5, expectedRank: 22 },  // ratio=40
      { b: 1, d: 3, expectedRank: 23 },  // ratio=33.33
      { b: 1, d: 4, expectedRank: 24 },  // ratio=25
      { b: 1, d: 5, expectedRank: 25 }   // ratio=20
    ];

    priorityCombinations.forEach(({ b, d, expectedRank }) => {
      it(`should return rank ${expectedRank} for ${b}/${d}`, () => {
        const result = getPriorityDisplay(b, d);
        const expectedValue = Math.round((b * 100) / d);
        expect(result.rank).toBe(expectedRank);
        expect(result.label).toBe(`Prioridad ${expectedRank}`);
        expect(result.shortLabel).toBe(`P${expectedRank}`);
        expect(result.badge).toBe(`${expectedValue}`);
      });
    });
  });

  describe('getPriorityColor', () => {
    it('should return most intense color for rank 1', () => {
      const result = getPriorityColor(1);
      expect(result.color).toBe('white');
      expect(result.backgroundColor).toBe('rgba(230, 0, 206, 1.00)');
    });

    it('should return most faded color for max rank (25)', () => {
      const result = getPriorityColor(25);
      expect(result.color).toBe('white');
      expect(result.backgroundColor).toBe('rgba(230, 0, 206, 0.35)');
    });

    it('should return intermediate color for middle rank', () => {
      const result = getPriorityColor(13);
      expect(result.color).toBe('white');
      expect(result.backgroundColor).toContain('rgba(230, 0, 206,');
    });

    it('should return fallback colors for invalid ranks', () => {
      expect(getPriorityColor(null).backgroundColor).toBe('var(--bg-muted)');
      expect(getPriorityColor(0).backgroundColor).toBe('var(--bg-muted)');
      expect(getPriorityColor(26).backgroundColor).toBe('var(--bg-muted)');
    });

    it('should have decreasing alpha as rank increases', () => {
      const color1 = getPriorityColor(1);
      const color13 = getPriorityColor(13);
      const color25 = getPriorityColor(25);

      const alpha1 = parseFloat(color1.backgroundColor.match(/[\d.]+\)$/)[0]);
      const alpha13 = parseFloat(color13.backgroundColor.match(/[\d.]+\)$/)[0]);
      const alpha25 = parseFloat(color25.backgroundColor.match(/[\d.]+\)$/)[0]);

      expect(alpha1).toBeGreaterThan(alpha13);
      expect(alpha13).toBeGreaterThan(alpha25);
    });

    it('should support fibonacci scoring (36 ranks)', () => {
      const result = getPriorityColor(36, 'fibonacci');
      expect(result.color).toBe('white');
      expect(result.backgroundColor).toBe('rgba(230, 0, 206, 0.35)');

      // Rank 37 should be invalid for fibonacci
      expect(getPriorityColor(37, 'fibonacci').backgroundColor).toBe('var(--bg-muted)');
    });
  });

  describe('getAllPriorityRanks', () => {
    it('should return 25 priority ranks for 1-5 system', () => {
      const ranks = getAllPriorityRanks();
      expect(ranks).toHaveLength(25);
    });

    it('should return 36 priority ranks for fibonacci system', () => {
      const ranks = getAllPriorityRanks('fibonacci');
      expect(ranks).toHaveLength(36);
    });

    it('should return ranks sorted from 1 to max', () => {
      const ranks = getAllPriorityRanks();
      expect(ranks[0].rank).toBe(1);
      expect(ranks[24].rank).toBe(25);

      for (let i = 0; i < ranks.length - 1; i++) {
        expect(ranks[i].rank).toBeLessThan(ranks[i + 1].rank);
      }
    });

    it('should have correct values for first and last ranks', () => {
      const ranks = getAllPriorityRanks();
      expect(ranks[0]).toEqual({ rank: 1, value: 500, biz: 5, dev: 1 });
      expect(ranks[24]).toEqual({ rank: 25, value: 20, biz: 1, dev: 5 });
    });
  });
});

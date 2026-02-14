import { describe, it, expect } from 'vitest';
import {
  calculatePriorityValue,
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

  describe('findClosestRank', () => {
    it('should return exact rank for known values', () => {
      expect(findClosestRank(500)).toBe(1);
      expect(findClosestRank(400)).toBe(2);
      expect(findClosestRank(100)).toBe(9);
      expect(findClosestRank(20)).toBe(18);
    });

    it('should return null for 0 or invalid values', () => {
      expect(findClosestRank(0)).toBeNull();
      expect(findClosestRank(null)).toBeNull();
      expect(findClosestRank(undefined)).toBeNull();
    });

    it('should find closest rank for non-standard values', () => {
      // 450 is equidistant from 500 and 400, algorithm returns first match (rank 1)
      expect(findClosestRank(450)).toBe(1);

      // 420 is closer to 400 (rank 2) than to 500 (rank 1)
      expect(findClosestRank(420)).toBe(2);

      // 95 is between 100 (rank 9) and 80 (rank 10)
      // 95 is closer to 100, so should return rank 9
      expect(findClosestRank(95)).toBe(9);
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
      expect(result.label).toBe('Prioridad 18');
      expect(result.shortLabel).toBe('P18');
      expect(result.rank).toBe(18);
      expect(result.badge).toBe('20');
      expect(result.value).toBe(20);
      expect(result.hasPriority).toBe(true);
    });

    it('should return correct display for equal points (3/3)', () => {
      const result = getPriorityDisplay(3, 3);
      expect(result.label).toBe('Prioridad 9');
      expect(result.shortLabel).toBe('P9');
      expect(result.rank).toBe(9);
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

    // Test all 18 priority combinations
    const priorityCombinations = [
      { b: 5, d: 1, expectedRank: 1 },
      { b: 4, d: 1, expectedRank: 2 },
      { b: 3, d: 1, expectedRank: 3 },
      { b: 5, d: 2, expectedRank: 4 },
      { b: 2, d: 1, expectedRank: 5 },
      { b: 3, d: 2, expectedRank: 6 },
      { b: 4, d: 3, expectedRank: 7 },
      { b: 5, d: 4, expectedRank: 8 },
      { b: 2, d: 2, expectedRank: 9 },  // any x/x
      { b: 4, d: 5, expectedRank: 10 },
      { b: 3, d: 4, expectedRank: 11 },
      { b: 2, d: 3, expectedRank: 12 },
      { b: 3, d: 5, expectedRank: 13 },
      { b: 1, d: 2, expectedRank: 14 },
      { b: 2, d: 5, expectedRank: 15 },
      { b: 1, d: 3, expectedRank: 16 },
      { b: 1, d: 4, expectedRank: 17 },
      { b: 1, d: 5, expectedRank: 18 }
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

    it('should return most faded color for rank 18', () => {
      const result = getPriorityColor(18);
      expect(result.color).toBe('white');
      expect(result.backgroundColor).toBe('rgba(230, 0, 206, 0.35)');
    });

    it('should return intermediate color for rank 9', () => {
      const result = getPriorityColor(9);
      expect(result.color).toBe('white');
      // Rank 9 is middle, alpha should be around 0.65-0.70
      expect(result.backgroundColor).toContain('rgba(230, 0, 206,');
    });

    it('should return fallback colors for invalid ranks', () => {
      expect(getPriorityColor(null).backgroundColor).toBe('var(--bg-muted)');
      expect(getPriorityColor(0).backgroundColor).toBe('var(--bg-muted)');
      expect(getPriorityColor(19).backgroundColor).toBe('var(--bg-muted)');
    });

    it('should have decreasing alpha as rank increases', () => {
      const color1 = getPriorityColor(1);
      const color10 = getPriorityColor(10);
      const color18 = getPriorityColor(18);

      // Extract alpha values
      const alpha1 = parseFloat(color1.backgroundColor.match(/[\d.]+\)$/)[0]);
      const alpha10 = parseFloat(color10.backgroundColor.match(/[\d.]+\)$/)[0]);
      const alpha18 = parseFloat(color18.backgroundColor.match(/[\d.]+\)$/)[0]);

      expect(alpha1).toBeGreaterThan(alpha10);
      expect(alpha10).toBeGreaterThan(alpha18);
    });
  });

  describe('getAllPriorityRanks', () => {
    it('should return 18 priority ranks', () => {
      const ranks = getAllPriorityRanks();
      expect(ranks).toHaveLength(18);
    });

    it('should return ranks sorted from 1 to 18', () => {
      const ranks = getAllPriorityRanks();
      expect(ranks[0].rank).toBe(1);
      expect(ranks[17].rank).toBe(18);

      for (let i = 0; i < ranks.length - 1; i++) {
        expect(ranks[i].rank).toBeLessThan(ranks[i + 1].rank);
      }
    });

    it('should have correct values for first and last ranks', () => {
      const ranks = getAllPriorityRanks();
      expect(ranks[0]).toEqual({ rank: 1, value: 500 });
      expect(ranks[17]).toEqual({ rank: 18, value: 20 });
    });
  });
});

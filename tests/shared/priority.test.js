/**
 * Tests for shared/priority.js
 */
import { describe, it, expect } from 'vitest';

const {
  generatePriorityMap,
  calculatePriority,
  PRIORITY_MAP_1_5,
  PRIORITY_MAP_FIBONACCI
} = await import('../../shared/priority.js');

describe('generatePriorityMap', () => {
  it('should generate 25 combinations for 1-5 system', () => {
    const map = generatePriorityMap('1-5');
    expect(map).toHaveLength(25);
  });

  it('should generate 36 combinations for fibonacci system', () => {
    const map = generatePriorityMap('fibonacci');
    expect(map).toHaveLength(36);
  });

  it('should assign priorities from 1 (highest ratio) to N', () => {
    const map = generatePriorityMap('1-5');
    expect(map[0].priority).toBe(1);
    expect(map[24].priority).toBe(25);
    // First entry should have highest ratio (5/1 = 500)
    expect(map[0].ratio).toBe(500);
  });

  it('should sort by ratio descending', () => {
    const map = generatePriorityMap('1-5');
    for (let i = 1; i < map.length; i++) {
      expect(map[i - 1].ratio).toBeGreaterThanOrEqual(map[i].ratio);
    }
  });
});

describe('PRIORITY_MAP_1_5', () => {
  it('should be pre-calculated with 25 entries', () => {
    expect(PRIORITY_MAP_1_5).toHaveLength(25);
  });
});

describe('PRIORITY_MAP_FIBONACCI', () => {
  it('should be pre-calculated with 36 entries', () => {
    expect(PRIORITY_MAP_FIBONACCI).toHaveLength(36);
  });
});

describe('calculatePriority', () => {
  it('should return 1 for highest priority (5 biz / 1 dev)', () => {
    expect(calculatePriority(5, 1, '1-5')).toBe(1);
  });

  it('should return 25 for lowest priority (1 biz / 5 dev)', () => {
    expect(calculatePriority(1, 5, '1-5')).toBe(25);
  });

  it('should return null when businessPoints is 0', () => {
    expect(calculatePriority(0, 3)).toBeNull();
  });

  it('should return null when devPoints is 0', () => {
    expect(calculatePriority(3, 0)).toBeNull();
  });

  it('should return null when params are missing', () => {
    expect(calculatePriority(null, 3)).toBeNull();
    expect(calculatePriority(3, null)).toBeNull();
  });

  it('should work with fibonacci system', () => {
    const p = calculatePriority(13, 1, 'fibonacci');
    expect(p).toBe(1); // 13/1 = 1300 — highest ratio
  });

  it('should default to 1-5 system', () => {
    const p = calculatePriority(3, 3);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(25);
  });
});

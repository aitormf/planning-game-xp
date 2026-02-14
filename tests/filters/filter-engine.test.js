import { describe, it, expect, beforeEach } from 'vitest';
import { FilterEngine, getFilterEngine, resetFilterEngine } from '@/filters/core/filter-engine.js';

describe('FilterEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new FilterEngine();
  });

  describe('registerMatcher', () => {
    it('should register a matcher function', () => {
      const matcher = (card, values) => values.includes(card.status);
      engine.registerMatcher('status', matcher);

      expect(engine.hasMatcher('status')).toBe(true);
    });

    it('should throw error if matcher is not a function', () => {
      expect(() => engine.registerMatcher('status', 'not a function')).toThrow();
    });
  });

  describe('applyFilters', () => {
    beforeEach(() => {
      engine.registerMatcher('status', (card, values) => values.includes(card.status));
      engine.registerMatcher('developer', (card, values) => values.includes(card.developer));
    });

    it('should return all cards when no filters are active', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev1' },
        card2: { status: 'Done', developer: 'dev2' }
      };

      const result = engine.applyFilters(cards, {});
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should return all cards when filters is null', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev1' }
      };

      const result = engine.applyFilters(cards, null);
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should filter cards by single filter', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev1' },
        card2: { status: 'Done', developer: 'dev2' },
        card3: { status: 'To Do', developer: 'dev3' }
      };

      const result = engine.applyFilters(cards, { status: ['To Do'] });
      expect(Object.keys(result)).toHaveLength(2);
      expect(result.card1).toBeDefined();
      expect(result.card3).toBeDefined();
    });

    it('should filter cards by multiple filters (AND logic)', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev1' },
        card2: { status: 'To Do', developer: 'dev2' },
        card3: { status: 'Done', developer: 'dev1' }
      };

      const result = engine.applyFilters(cards, {
        status: ['To Do'],
        developer: ['dev1']
      });
      expect(Object.keys(result)).toHaveLength(1);
      expect(result.card1).toBeDefined();
    });

    it('should support OR logic within a filter (multiple values)', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev1' },
        card2: { status: 'Done', developer: 'dev2' },
        card3: { status: 'In Progress', developer: 'dev3' }
      };

      const result = engine.applyFilters(cards, {
        status: ['To Do', 'In Progress']
      });
      expect(Object.keys(result)).toHaveLength(2);
      expect(result.card1).toBeDefined();
      expect(result.card3).toBeDefined();
    });

    it('should work with array input', () => {
      const cards = [
        { status: 'To Do', developer: 'dev1' },
        { status: 'Done', developer: 'dev2' }
      ];

      const result = engine.applyFilters(cards, { status: ['To Do'] });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('To Do');
    });

    it('should ignore null filter values', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev1' }
      };

      const result = engine.applyFilters(cards, { status: null });
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should ignore empty filter arrays', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev1' }
      };

      const result = engine.applyFilters(cards, { status: [] });
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should warn about unregistered filter types but not fail', () => {
      const cards = {
        card1: { status: 'To Do' }
      };

      const result = engine.applyFilters(cards, { unknownFilter: ['value'] });
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('matchesSingleFilter', () => {
    beforeEach(() => {
      engine.registerMatcher('status', (card, values) => values.includes(card.status));
    });

    it('should match card against single filter', () => {
      const card = { status: 'To Do' };

      expect(engine.matchesSingleFilter(card, 'status', ['To Do'])).toBe(true);
      expect(engine.matchesSingleFilter(card, 'status', ['Done'])).toBe(false);
    });

    it('should return true for empty filter values', () => {
      const card = { status: 'To Do' };

      expect(engine.matchesSingleFilter(card, 'status', [])).toBe(true);
      expect(engine.matchesSingleFilter(card, 'status', null)).toBe(true);
    });
  });

  describe('createFilterFunction', () => {
    beforeEach(() => {
      engine.registerMatcher('status', (card, values) => values.includes(card.status));
    });

    it('should create a reusable filter function', () => {
      const filterFn = engine.createFilterFunction({ status: ['To Do'] });

      expect(filterFn({ status: 'To Do' })).toBe(true);
      expect(filterFn({ status: 'Done' })).toBe(false);
    });
  });

  describe('context passing', () => {
    it('should pass context to matchers', () => {
      const context = { globalDeveloperList: { dev_001: { name: 'John' } } };
      let receivedContext;

      engine.registerMatcher('developer', (card, values, ctx) => {
        receivedContext = ctx;
        return true;
      });

      engine.applyFilters({ card1: { developer: 'dev_001' } }, { developer: ['John'] }, context);

      expect(receivedContext).toBe(context);
    });
  });
});

describe('FilterEngine Singleton', () => {
  beforeEach(() => {
    resetFilterEngine();
  });

  it('should return the same instance', () => {
    const instance1 = getFilterEngine();
    const instance2 = getFilterEngine();

    expect(instance1).toBe(instance2);
  });

  it('should reset the instance', () => {
    const instance1 = getFilterEngine();
    instance1.registerMatcher('test', () => true);

    resetFilterEngine();

    const instance2 = getFilterEngine();
    expect(instance2.hasMatcher('test')).toBe(false);
  });
});

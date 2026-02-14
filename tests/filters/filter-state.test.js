import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FilterState, getFilterState, resetFilterState } from '@/filters/core/filter-state.js';

describe('FilterState', () => {
  let filterState;
  let localStorageMock;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      store: {},
      getItem: vi.fn((key) => localStorageMock.store[key] || null),
      setItem: vi.fn((key, value) => { localStorageMock.store[key] = value; }),
      removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
      clear: vi.fn(() => { localStorageMock.store = {}; }),
      key: vi.fn((i) => Object.keys(localStorageMock.store)[i]),
      get length() { return Object.keys(localStorageMock.store).length; }
    };
    vi.stubGlobal('localStorage', localStorageMock);

    filterState = new FilterState();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getFilters / setFilter', () => {
    it('should return empty object when no filters set', () => {
      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters).toEqual({});
    });

    it('should set and get a filter', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters.status).toEqual(['To Do']);
    });

    it('should normalize single value to array', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', 'To Do');

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters.status).toEqual(['To Do']);
    });

    it('should remove filter when set with empty array', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT1', 'task', 'status', []);

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters.status).toBeUndefined();
    });

    it('should support multiple filters for same cardType', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT1', 'task', 'developer', ['dev_001']);

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters.status).toEqual(['To Do']);
      expect(filters.developer).toEqual(['dev_001']);
    });

    it('should isolate filters by project', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT2', 'task', 'status', ['Done']);

      expect(filterState.getFilters('PROJECT1', 'task').status).toEqual(['To Do']);
      expect(filterState.getFilters('PROJECT2', 'task').status).toEqual(['Done']);
    });

    it('should isolate filters by cardType', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT1', 'bug', 'status', ['Created']);

      expect(filterState.getFilters('PROJECT1', 'task').status).toEqual(['To Do']);
      expect(filterState.getFilters('PROJECT1', 'bug').status).toEqual(['Created']);
    });
  });

  describe('getFilter', () => {
    it('should return empty array when filter not set', () => {
      const values = filterState.getFilter('PROJECT1', 'task', 'status');
      expect(values).toEqual([]);
    });

    it('should return filter values', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do', 'In Progress']);

      const values = filterState.getFilter('PROJECT1', 'task', 'status');
      expect(values).toEqual(['To Do', 'In Progress']);
    });
  });

  describe('setFilters', () => {
    it('should set multiple filters at once', () => {
      filterState.setFilters('PROJECT1', 'task', {
        status: ['To Do'],
        developer: ['dev_001']
      });

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters.status).toEqual(['To Do']);
      expect(filters.developer).toEqual(['dev_001']);
    });

    it('should clear existing filters when setting new ones', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilters('PROJECT1', 'task', {
        developer: ['dev_001']
      });

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters.status).toBeUndefined();
      expect(filters.developer).toEqual(['dev_001']);
    });
  });

  describe('clearFilter', () => {
    it('should clear specific filter', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT1', 'task', 'developer', ['dev_001']);

      filterState.clearFilter('PROJECT1', 'task', 'status');

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters.status).toBeUndefined();
      expect(filters.developer).toEqual(['dev_001']);
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filters for project/cardType', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT1', 'task', 'developer', ['dev_001']);

      filterState.clearAllFilters('PROJECT1', 'task');

      const filters = filterState.getFilters('PROJECT1', 'task');
      expect(filters).toEqual({});
    });

    it('should not affect other projects/cardTypes', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT2', 'task', 'status', ['Done']);

      filterState.clearAllFilters('PROJECT1', 'task');

      expect(filterState.getFilters('PROJECT1', 'task')).toEqual({});
      expect(filterState.getFilters('PROJECT2', 'task').status).toEqual(['Done']);
    });
  });

  describe('clearFilterTypeGlobally', () => {
    it('should clear specific filter type across all projects/cardTypes', () => {
      filterState.setFilter('PROJECT1', 'task', 'sprint', ['sprint_001']);
      filterState.setFilter('PROJECT2', 'task', 'sprint', ['sprint_002']);
      filterState.setFilter('PROJECT1', 'bug', 'sprint', ['sprint_001']);

      filterState.clearFilterTypeGlobally('sprint');

      expect(filterState.getFilter('PROJECT1', 'task', 'sprint')).toEqual([]);
      expect(filterState.getFilter('PROJECT2', 'task', 'sprint')).toEqual([]);
      expect(filterState.getFilter('PROJECT1', 'bug', 'sprint')).toEqual([]);
    });

    it('should not affect other filter types', () => {
      filterState.setFilter('PROJECT1', 'task', 'sprint', ['sprint_001']);
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      filterState.clearFilterTypeGlobally('sprint');

      expect(filterState.getFilter('PROJECT1', 'task', 'sprint')).toEqual([]);
      expect(filterState.getFilter('PROJECT1', 'task', 'status')).toEqual(['To Do']);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters', () => {
      expect(filterState.hasActiveFilters('PROJECT1', 'task')).toBe(false);
    });

    it('should return true when filters are set', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      expect(filterState.hasActiveFilters('PROJECT1', 'task')).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when filter changes', () => {
      const callback = vi.fn();
      filterState.subscribe('PROJECT1', 'task', callback);

      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      expect(callback).toHaveBeenCalledWith({ status: ['To Do'] });
    });

    it('should not notify subscribers of other projects/cardTypes', () => {
      const callback = vi.fn();
      filterState.subscribe('PROJECT1', 'task', callback);

      filterState.setFilter('PROJECT2', 'task', 'status', ['To Do']);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = filterState.subscribe('PROJECT1', 'task', callback);

      unsubscribe();
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('localStorage persistence', () => {
    it('should persist filters to localStorage', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pgxp_filters_PROJECT1_task',
        JSON.stringify({ status: ['To Do'] })
      );
    });

    it('should remove from localStorage when filters cleared', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.clearAllFilters('PROJECT1', 'task');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pgxp_filters_PROJECT1_task');
    });

    it('should restore from localStorage on construction', () => {
      localStorageMock.store['pgxp_filters_PROJECT1_task'] = JSON.stringify({ status: ['To Do'] });

      const newFilterState = new FilterState();

      expect(newFilterState.getFilters('PROJECT1', 'task').status).toEqual(['To Do']);
    });
  });

  describe('exportState', () => {
    it('should export current state', () => {
      filterState.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      filterState.setFilter('PROJECT2', 'bug', 'developer', ['dev_001']);

      const exported = filterState.exportState();

      expect(exported).toEqual({
        PROJECT1: { task: { status: ['To Do'] } },
        PROJECT2: { bug: { developer: ['dev_001'] } }
      });
    });
  });
});

describe('FilterState Singleton', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      store: {},
      getItem: vi.fn((key) => localStorageMock.store[key] || null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn((i) => Object.keys(localStorageMock.store)[i]),
      get length() { return Object.keys(localStorageMock.store).length; }
    };
    vi.stubGlobal('localStorage', localStorageMock);
    resetFilterState();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return the same instance', () => {
    const instance1 = getFilterState();
    const instance2 = getFilterState();

    expect(instance1).toBe(instance2);
  });

  it('should reset the instance', () => {
    const instance1 = getFilterState();
    instance1.setFilter('PROJECT1', 'task', 'status', ['To Do']);

    resetFilterState();

    const instance2 = getFilterState();
    expect(instance2.getFilters('PROJECT1', 'task')).toEqual({});
  });
});

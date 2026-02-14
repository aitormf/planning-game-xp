import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  UnifiedFilterService,
  getUnifiedFilterService,
  resetUnifiedFilterService
} from '@/services/unified-filter-service.js';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = value; }),
  removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; }),
  key: vi.fn((i) => Object.keys(localStorageMock.store)[i]),
  get length() { return Object.keys(localStorageMock.store).length; }
};

describe('UnifiedFilterService', () => {
  let service;

  beforeEach(() => {
    localStorageMock.store = {};
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('globalDeveloperList', {
      dev_001: { displayName: 'John Doe' },
      dev_002: { displayName: 'Jane Smith' }
    });
    vi.stubGlobal('globalSprintList', {
      sprint_001: { name: 'Sprint 1', year: 2025 },
      sprint_002: { name: 'Sprint 2', year: 2025 }
    });
    vi.stubGlobal('globalEpicList', {
      epic_001: { title: 'Epic 1' },
      epic_002: { title: 'Epic 2' }
    });

    resetUnifiedFilterService();
    service = getUnifiedFilterService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetUnifiedFilterService();
  });

  describe('initialization', () => {
    it('should initialize with matchers registered', () => {
      expect(service.engine.hasMatcher('status')).toBe(true);
      expect(service.engine.hasMatcher('developer')).toBe(true);
      expect(service.engine.hasMatcher('sprint')).toBe(true);
      expect(service.engine.hasMatcher('epic')).toBe(true);
    });
  });

  describe('applyFilters', () => {
    it('should apply filters from state', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev_001' },
        card2: { status: 'Done', developer: 'dev_002' },
        card3: { status: 'To Do', developer: 'dev_002' }
      };

      service.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      const result = service.applyFilters(cards, 'PROJECT1', 'task');
      expect(Object.keys(result)).toHaveLength(2);
      expect(result.card1).toBeDefined();
      expect(result.card3).toBeDefined();
    });

    it('should apply multiple filters (AND logic)', () => {
      const cards = {
        card1: { status: 'To Do', developer: 'dev_001' },
        card2: { status: 'To Do', developer: 'dev_002' },
        card3: { status: 'Done', developer: 'dev_001' }
      };

      service.setFilters('PROJECT1', 'task', {
        status: ['To Do'],
        developer: ['dev_001']
      });

      const result = service.applyFilters(cards, 'PROJECT1', 'task');
      expect(Object.keys(result)).toHaveLength(1);
      expect(result.card1).toBeDefined();
    });
  });

  describe('applyCustomFilters', () => {
    it('should apply custom filters not from state', () => {
      const cards = {
        card1: { status: 'To Do' },
        card2: { status: 'Done' }
      };

      const result = service.applyCustomFilters(cards, { status: ['Done'] });
      expect(Object.keys(result)).toHaveLength(1);
      expect(result.card2).toBeDefined();
    });
  });

  describe('setFilter / getActiveFilters', () => {
    it('should set and get filters', () => {
      service.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      const filters = service.getActiveFilters('PROJECT1', 'task');
      expect(filters.status).toEqual(['To Do']);
    });

    it('should isolate filters by project', () => {
      service.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      service.setFilter('PROJECT2', 'task', 'status', ['Done']);

      expect(service.getActiveFilters('PROJECT1', 'task').status).toEqual(['To Do']);
      expect(service.getActiveFilters('PROJECT2', 'task').status).toEqual(['Done']);
    });
  });

  describe('clearFilter', () => {
    it('should clear specific filter', () => {
      service.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      service.setFilter('PROJECT1', 'task', 'developer', ['dev_001']);

      service.clearFilter('PROJECT1', 'task', 'status');

      const filters = service.getActiveFilters('PROJECT1', 'task');
      expect(filters.status).toBeUndefined();
      expect(filters.developer).toEqual(['dev_001']);
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filters for project/cardType', () => {
      service.setFilter('PROJECT1', 'task', 'status', ['To Do']);
      service.setFilter('PROJECT1', 'task', 'developer', ['dev_001']);

      service.clearAllFilters('PROJECT1', 'task');

      expect(service.hasActiveFilters('PROJECT1', 'task')).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on filter change', () => {
      const callback = vi.fn();
      service.subscribe('PROJECT1', 'task', callback);

      service.setFilter('PROJECT1', 'task', 'status', ['To Do']);

      expect(callback).toHaveBeenCalledWith({ status: ['To Do'] });
    });
  });

  describe('getConfig', () => {
    it('should return task config', () => {
      const config = service.getConfig('task');
      expect(config).toBeDefined();
      expect(config.cardType).toBe('task');
      expect(config.filters.status).toBeDefined();
    });

    it('should return bug config', () => {
      const config = service.getConfig('bug');
      expect(config).toBeDefined();
      expect(config.cardType).toBe('bug');
      expect(config.filters.priority).toBeDefined();
    });
  });

  describe('getDisplayOrder', () => {
    it('should return display order for task', () => {
      const order = service.getDisplayOrder('task');
      expect(order).toContain('status');
      expect(order).toContain('sprint');
    });
  });

  describe('isYearDependent', () => {
    it('should identify year-dependent filters', () => {
      expect(service.isYearDependent('task', 'sprint')).toBe(true);
      expect(service.isYearDependent('task', 'status')).toBe(false);
    });
  });
});

describe('UnifiedFilterService Singleton', () => {
  beforeEach(() => {
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
    resetUnifiedFilterService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return the same instance', () => {
    const instance1 = getUnifiedFilterService();
    const instance2 = getUnifiedFilterService();

    expect(instance1).toBe(instance2);
  });

  it('should reset the instance', () => {
    const instance1 = getUnifiedFilterService();
    instance1.setFilter('PROJECT1', 'task', 'status', ['To Do']);

    resetUnifiedFilterService();

    const instance2 = getUnifiedFilterService();
    expect(instance2.hasActiveFilters('PROJECT1', 'task')).toBe(false);
  });
});

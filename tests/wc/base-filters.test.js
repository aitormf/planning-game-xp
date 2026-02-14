/**
 * Tests for BaseFilters component
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock LitElement and html
vi.mock('lit', () => ({
  LitElement: class LitElement {
    static get properties() { return {}; }
    connectedCallback() {}
    disconnectedCallback() {}
    requestUpdate() {}
    render() { return ''; }
  },
  html: () => ''
}));

// Mock the multi-select import
vi.mock('@manufosela/multi-select', () => ({}));

// Mock unsafeHTML
vi.mock('https://unpkg.com/lit@2.8.0/directives/unsafe-html.js?module', () => ({
  unsafeHTML: () => ''
}));

// Mock entity directory service
vi.mock('@/services/entity-directory-service.js', () => ({
  entityDirectoryService: {
    waitForInit: vi.fn().mockResolvedValue(),
    getDeveloperDisplayName: vi.fn(id => id),
    getStakeholderDisplayName: vi.fn(id => id)
  }
}));

// Mock app constants
vi.mock('@/constants/app-constants.js', () => ({
  APP_CONSTANTS: {
    DEVELOPER_UNASSIGNED: {
      STORAGE_VALUE: 'unassigned',
      DISPLAY_ES: 'Sin asignar',
      ALIASES: ['unassigned', 'sin asignar']
    }
  }
}));

// Mock URLStateManager
const mockUpdateState = vi.fn();
const mockGetState = vi.fn().mockReturnValue({ filters: {} });
vi.mock('@/utils/url-utils.js', () => ({
  URLStateManager: {
    updateState: (...args) => mockUpdateState(...args),
    getState: () => mockGetState()
  }
}));

describe('BaseFilters', () => {
  let BaseFilters;

  beforeEach(async () => {
    // Reset modules to get fresh import
    vi.resetModules();
    mockUpdateState.mockClear();
    mockGetState.mockReturnValue({ filters: {} });

    // Import the module after mocks are set up
    const module = await import('@/wc/BaseFilters.js');
    BaseFilters = module.BaseFilters;
  });

  describe('updateVisibleCount', () => {
    it('should update resultsCount with visible and total', () => {
      const filters = new BaseFilters();
      filters.requestUpdate = vi.fn();

      filters.updateVisibleCount(5, 10);

      expect(filters.resultsCount).toEqual({ visible: 5, total: 10 });
      expect(filters.requestUpdate).toHaveBeenCalled();
    });

    it('should use visible as total if total is not provided', () => {
      const filters = new BaseFilters();
      filters.requestUpdate = vi.fn();

      filters.updateVisibleCount(7);

      expect(filters.resultsCount).toEqual({ visible: 7, total: 7 });
    });

    it('should handle zero values correctly', () => {
      const filters = new BaseFilters();
      filters.requestUpdate = vi.fn();

      filters.updateVisibleCount(0, 0);

      expect(filters.resultsCount).toEqual({ visible: 0, total: 0 });
    });

    it('should allow total to be explicitly zero', () => {
      const filters = new BaseFilters();
      filters.requestUpdate = vi.fn();

      filters.updateVisibleCount(0, 0);

      expect(filters.resultsCount.total).toBe(0);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return true when there are active filters', () => {
      const filters = new BaseFilters();
      filters.currentFilters = { status: ['In Progress'] };

      expect(filters.hasActiveFilters).toBe(true);
    });

    it('should return false when all filters are empty', () => {
      const filters = new BaseFilters();
      filters.currentFilters = { status: [], developer: [] };

      expect(filters.hasActiveFilters).toBe(false);
    });

    it('should return false when currentFilters is empty object', () => {
      const filters = new BaseFilters();
      filters.currentFilters = {};

      expect(filters.hasActiveFilters).toBe(false);
    });
  });

  describe('_syncFiltersToUrl', () => {
    it('should update URL with active filters', () => {
      const filters = new BaseFilters();
      filters.currentFilters = { status: ['In Progress'], developer: ['dev_001'] };

      filters._syncFiltersToUrl();

      expect(mockUpdateState).toHaveBeenCalledWith(
        { filters: { status: ['In Progress'], developer: ['dev_001'] } },
        true
      );
    });

    it('should clear URL filters when no active filters', () => {
      const filters = new BaseFilters();
      filters.currentFilters = { status: [], developer: [] };

      filters._syncFiltersToUrl();

      expect(mockUpdateState).toHaveBeenCalledWith(
        { filters: null },
        true
      );
    });

    it('should use replaceState (true) to avoid history clutter', () => {
      const filters = new BaseFilters();
      filters.currentFilters = { status: ['To Do'] };

      filters._syncFiltersToUrl();

      expect(mockUpdateState).toHaveBeenCalledWith(
        expect.any(Object),
        true
      );
    });
  });

  describe('_handleFilterChange', () => {
    it('should sync filters to URL when filter changes', () => {
      const filters = new BaseFilters();
      filters.currentFilters = {};
      filters.filterConfigs = [{ id: 'status' }];
      filters.applyFilters = vi.fn();
      filters.dispatchEvent = vi.fn();

      filters._handleFilterChange('status', ['In Progress']);

      expect(mockUpdateState).toHaveBeenCalled();
    });
  });

  describe('clearAllFilters', () => {
    it('should clear filters from URL when clearing all filters', () => {
      const filters = new BaseFilters();
      filters.currentFilters = { status: ['In Progress'] };
      filters.filterConfigs = [{ id: 'status' }];
      filters.shadowRoot = {
        querySelectorAll: vi.fn().mockReturnValue([])
      };
      filters.applyFilters = vi.fn();
      filters.dispatchEvent = vi.fn();

      filters.clearAllFilters();

      expect(mockUpdateState).toHaveBeenCalledWith(
        { filters: null },
        true
      );
    });
  });

  describe('_hasUrlFilters', () => {
    it('should return true when URL has filters', () => {
      mockGetState.mockReturnValue({ filters: { status: ['In Progress'] } });
      const filters = new BaseFilters();

      expect(filters._hasUrlFilters()).toBe(true);
    });

    it('should return false when URL has empty filters', () => {
      mockGetState.mockReturnValue({ filters: {} });
      const filters = new BaseFilters();

      expect(filters._hasUrlFilters()).toBe(false);
    });

    it('should return false when URL has no filters property', () => {
      mockGetState.mockReturnValue({});
      const filters = new BaseFilters();

      expect(filters._hasUrlFilters()).toBe(false);
    });

    it('should return false when URL filters is null', () => {
      mockGetState.mockReturnValue({ filters: null });
      const filters = new BaseFilters();

      expect(filters._hasUrlFilters()).toBe(false);
    });
  });
});

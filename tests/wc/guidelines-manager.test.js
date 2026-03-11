// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock Lit
vi.mock('https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm', () => ({
  LitElement: class MockLitElement {
    static get properties() { return {}; }
    static get styles() { return []; }
    constructor() {
      this.shadowRoot = null;
      this._properties = {};
    }
    connectedCallback() {}
    disconnectedCallback() {}
    updated() {}
    requestUpdate() {}
    dispatchEvent() { return true; }
    addEventListener() {}
    removeEventListener() {}
  },
  html: (strings, ...values) => ({ strings, values }),
  css: (strings, ...values) => ({ strings, values }),
  nothing: ''
}));

// Mock date-fns
vi.mock('https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm', () => ({
  format: (date, fmt) => date.toISOString(),
  parseISO: (str) => new Date(str),
  isValid: (date) => !isNaN(date.getTime())
}));

// Mock styles
vi.mock('../../public/js/wc/guidelines-manager-styles.js', () => ({
  GuidelinesManagerStyles: {}
}));

// Mock services
vi.mock('../../public/js/services/global-config-service.js', () => ({
  globalConfigService: {
    getAllGuidelines: vi.fn().mockResolvedValue([]),
    getAllConfigs: vi.fn().mockResolvedValue([]),
    saveConfig: vi.fn().mockResolvedValue({ id: 'test', name: 'Test' }),
    deleteConfig: vi.fn().mockResolvedValue(true),
    getConfigHistory: vi.fn().mockResolvedValue([]),
    restoreConfigVersion: vi.fn().mockResolvedValue({ id: 'test', name: 'Test' }),
    _incrementVersion: vi.fn((v) => {
      const parts = v.split('.').map(Number);
      parts[2] += 1;
      return parts.join('.');
    })
  },
  CONFIG_TYPES: ['agents', 'prompts', 'instructions', 'guidelines'],
  CONFIG_CATEGORIES: ['development', 'planning', 'qa', 'documentation', 'architecture']
}));

vi.mock('../../public/js/services/demo-mode-service.js', () => ({
  demoModeService: {
    isDemo: vi.fn().mockReturnValue(false),
    showFeatureDisabled: vi.fn()
  }
}));

// Now import the component
const { GuidelinesManager } = await import('../../public/js/wc/GuidelinesManager.js');

describe('GuidelinesManager', () => {
  it('should export GuidelinesManager class', () => {
    expect(GuidelinesManager).toBeDefined();
  });

  it('should be registered as custom element', () => {
    expect(customElements.get('guidelines-manager')).toBeDefined();
  });

  describe('properties', () => {
    it('should define guidelines property as Array', () => {
      const props = GuidelinesManager.properties;
      expect(props.guidelines).toBeDefined();
      expect(props.guidelines.type).toBe(Array);
    });

    it('should define selectedGuideline property as Object', () => {
      const props = GuidelinesManager.properties;
      expect(props.selectedGuideline).toBeDefined();
      expect(props.selectedGuideline.type).toBe(Object);
    });

    it('should define loading property as Boolean', () => {
      const props = GuidelinesManager.properties;
      expect(props.loading).toBeDefined();
      expect(props.loading.type).toBe(Boolean);
    });

    it('should define showCreateForm property as Boolean', () => {
      const props = GuidelinesManager.properties;
      expect(props.showCreateForm).toBeDefined();
      expect(props.showCreateForm.type).toBe(Boolean);
    });

    it('should define showHistory property as Boolean', () => {
      const props = GuidelinesManager.properties;
      expect(props.showHistory).toBeDefined();
      expect(props.showHistory.type).toBe(Boolean);
    });

    it('should define editing property as Boolean', () => {
      const props = GuidelinesManager.properties;
      expect(props.editing).toBeDefined();
      expect(props.editing.type).toBe(Boolean);
    });

    it('should define categoryFilter property as String', () => {
      const props = GuidelinesManager.properties;
      expect(props.categoryFilter).toBeDefined();
      expect(props.categoryFilter.type).toBe(String);
    });
  });

  describe('constructor', () => {
    it('should initialize with empty guidelines array', () => {
      const manager = new GuidelinesManager();
      expect(manager.guidelines).toEqual([]);
    });

    it('should initialize with null selectedGuideline', () => {
      const manager = new GuidelinesManager();
      expect(manager.selectedGuideline).toBeNull();
    });

    it('should initialize with loading false', () => {
      const manager = new GuidelinesManager();
      expect(manager.loading).toBe(false);
    });

    it('should initialize with showCreateForm false', () => {
      const manager = new GuidelinesManager();
      expect(manager.showCreateForm).toBe(false);
    });

    it('should initialize with editing false', () => {
      const manager = new GuidelinesManager();
      expect(manager.editing).toBe(false);
    });

    it('should initialize with empty categoryFilter', () => {
      const manager = new GuidelinesManager();
      expect(manager.categoryFilter).toBe('');
    });
  });

  describe('_formatDate', () => {
    it('should return empty string for null input', () => {
      const manager = new GuidelinesManager();
      expect(manager._formatDate(null)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      const manager = new GuidelinesManager();
      expect(manager._formatDate('')).toBe('');
    });

    it('should format valid ISO date', () => {
      const manager = new GuidelinesManager();
      const result = manager._formatDate('2026-03-11T10:00:00Z');
      expect(result).toBeTruthy();
    });
  });

  describe('_formatAuthor', () => {
    it('should return dash for null input', () => {
      const manager = new GuidelinesManager();
      expect(manager._formatAuthor(null)).toBe('-');
    });

    it('should return name part of email', () => {
      const manager = new GuidelinesManager();
      expect(manager._formatAuthor('admin@example.com')).toBe('admin');
    });

    it('should handle email without @', () => {
      const manager = new GuidelinesManager();
      expect(manager._formatAuthor('admin')).toBe('admin');
    });
  });

  describe('filteredGuidelines', () => {
    it('should return all guidelines when no filter', () => {
      const manager = new GuidelinesManager();
      manager.guidelines = [
        { id: '1', category: 'development' },
        { id: '2', category: 'qa' }
      ];
      manager.categoryFilter = '';
      expect(manager.filteredGuidelines).toHaveLength(2);
    });

    it('should filter by category', () => {
      const manager = new GuidelinesManager();
      manager.guidelines = [
        { id: '1', category: 'development' },
        { id: '2', category: 'qa' },
        { id: '3', category: 'development' }
      ];
      manager.categoryFilter = 'development';
      expect(manager.filteredGuidelines).toHaveLength(2);
    });

    it('should return empty for non-matching category', () => {
      const manager = new GuidelinesManager();
      manager.guidelines = [
        { id: '1', category: 'development' }
      ];
      manager.categoryFilter = 'qa';
      expect(manager.filteredGuidelines).toHaveLength(0);
    });
  });

  describe('_selectGuideline', () => {
    it('should set selectedGuideline', () => {
      const manager = new GuidelinesManager();
      const guideline = { id: '1', name: 'Test', category: 'development' };
      manager._selectGuideline(guideline);
      expect(manager.selectedGuideline).toBe(guideline);
    });

    it('should reset editing state', () => {
      const manager = new GuidelinesManager();
      manager.editing = true;
      manager._selectGuideline({ id: '1', name: 'Test' });
      expect(manager.editing).toBe(false);
    });

    it('should hide create form', () => {
      const manager = new GuidelinesManager();
      manager.showCreateForm = true;
      manager._selectGuideline({ id: '1', name: 'Test' });
      expect(manager.showCreateForm).toBe(false);
    });

    it('should reset history', () => {
      const manager = new GuidelinesManager();
      manager.showHistory = true;
      manager.history = [{ id: 'h1' }];
      manager._selectGuideline({ id: '1', name: 'Test' });
      expect(manager.showHistory).toBe(false);
      expect(manager.history).toEqual([]);
    });
  });

  describe('_toggleCreateForm', () => {
    it('should toggle showCreateForm', () => {
      const manager = new GuidelinesManager();
      expect(manager.showCreateForm).toBe(false);
      manager._toggleCreateForm();
      expect(manager.showCreateForm).toBe(true);
    });

    it('should clear selectedGuideline when opening form', () => {
      const manager = new GuidelinesManager();
      manager.selectedGuideline = { id: '1' };
      manager._toggleCreateForm();
      expect(manager.selectedGuideline).toBeNull();
    });
  });

  describe('_populateEditFields', () => {
    it('should populate edit fields from guideline', () => {
      const manager = new GuidelinesManager();
      const guideline = {
        name: 'Test Guide',
        description: 'A description',
        targetFile: 'CLAUDE.md',
        category: 'qa',
        content: '# Content'
      };
      manager._populateEditFields(guideline);
      expect(manager._editName).toBe('Test Guide');
      expect(manager._editDescription).toBe('A description');
      expect(manager._editTargetFile).toBe('CLAUDE.md');
      expect(manager._editCategory).toBe('qa');
      expect(manager._editContent).toBe('# Content');
    });

    it('should handle missing fields with defaults', () => {
      const manager = new GuidelinesManager();
      manager._populateEditFields({});
      expect(manager._editName).toBe('');
      expect(manager._editTargetFile).toBe('');
      expect(manager._editCategory).toBe('development');
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock lit before importing component
vi.mock('lit', () => ({
  LitElement: class {
    static get properties() { return {}; }
    static get styles() { return ''; }
    constructor() {}
    connectedCallback() {}
    disconnectedCallback() {}
    requestUpdate() {}
    render() { return ''; }
  },
  html: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] || ''), ''),
  css: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '')
}));

describe('CardSearch', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.customElements = {
      define: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CardSearch class', () => {
    it('should export CardSearch class', async () => {
      const module = await import('@/wc/CardSearch.js');
      expect(module.CardSearch).toBeDefined();
    });

    it('should define custom element', async () => {
      const module = await import('@/wc/CardSearch.js');
      expect(module.CardSearch).toBeDefined();
    });

    it('should have required properties', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const properties = CardSearch.properties;

      expect(properties).toHaveProperty('section');
      expect(properties).toHaveProperty('placeholder');
      expect(properties).toHaveProperty('searchQuery');
      expect(properties).toHaveProperty('resultsCount');
    });

    it('should initialize with default values', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const instance = new CardSearch();

      expect(instance.section).toBe('');
      expect(instance.searchQuery).toBe('');
      expect(instance.resultsCount).toEqual({ visible: 0, total: 0 });
    });

    it('should have clearSearch method', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const instance = new CardSearch();

      expect(typeof instance.clearSearch).toBe('function');
    });

    it('should have isSearchActive method', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const instance = new CardSearch();

      expect(typeof instance.isSearchActive).toBe('function');
      expect(instance.isSearchActive()).toBe(false);

      instance.searchQuery = 'test';
      expect(instance.isSearchActive()).toBe(true);
    });
  });

  describe('Event emission', () => {
    it('should emit search-query-changed event', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const instance = new CardSearch();
      instance.section = 'tasks';
      instance.searchQuery = 'test query';

      const eventSpy = vi.fn();
      document.addEventListener('search-query-changed', eventSpy);

      instance._emitSearchQuery();

      expect(eventSpy).toHaveBeenCalled();
      const eventDetail = eventSpy.mock.calls[0][0].detail;
      expect(eventDetail.query).toBe('test query');
      expect(eventDetail.section).toBe('tasks');

      document.removeEventListener('search-query-changed', eventSpy);
    });

    it('should emit empty query when cleared', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const instance = new CardSearch();
      instance.section = 'bugs';
      instance.searchQuery = '';

      const eventSpy = vi.fn();
      document.addEventListener('search-query-changed', eventSpy);

      instance._emitSearchQuery();

      expect(eventSpy).toHaveBeenCalled();
      const eventDetail = eventSpy.mock.calls[0][0].detail;
      expect(eventDetail.query).toBe('');
      expect(eventDetail.section).toBe('bugs');

      document.removeEventListener('search-query-changed', eventSpy);
    });
  });

  describe('Search results handling', () => {
    it('should update resultsCount when receiving search-results-updated event', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const instance = new CardSearch();
      instance.section = 'tasks';
      instance.requestUpdate = vi.fn();

      instance._handleSearchResults({
        detail: {
          section: 'tasks',
          visible: 5,
          total: 100
        }
      });

      expect(instance.resultsCount).toEqual({ visible: 5, total: 100 });
      expect(instance.requestUpdate).toHaveBeenCalled();
    });

    it('should ignore events from other sections', async () => {
      const { CardSearch } = await import('@/wc/CardSearch.js');
      const instance = new CardSearch();
      instance.section = 'tasks';
      instance.resultsCount = { visible: 0, total: 0 };
      instance.requestUpdate = vi.fn();

      instance._handleSearchResults({
        detail: {
          section: 'bugs',
          visible: 10,
          total: 50
        }
      });

      expect(instance.resultsCount).toEqual({ visible: 0, total: 0 });
      expect(instance.requestUpdate).not.toHaveBeenCalled();
    });
  });
});

// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock Lit
vi.mock('https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm', () => ({
  LitElement: class MockLitElement {
    static get properties() { return {}; }
    static get styles() { return []; }
    constructor() {
      this._requestedUpdates = [];
    }
    requestUpdate() {
      this._requestedUpdates.push(Date.now());
    }
    connectedCallback() {}
    disconnectedCallback() {}
    dispatchEvent() { return true; }
    getAttribute() { return null; }
    setAttribute() {}
  },
  html: (strings, ...values) => ({ strings, values }),
  css: (strings, ...values) => ({ strings, values })
}));

// Mock unsafeHTML
vi.mock('https://cdn.jsdelivr.net/npm/lit-html@3.0.2/directives/unsafe-html.js', () => ({
  unsafeHTML: (value) => value
}));

// Mock marked
vi.mock('https://cdn.jsdelivr.net/npm/marked@15/+esm', () => ({
  marked: {
    parse: (text) => `<p>${text}</p>`
  }
}));

// Mock project-form-styles
vi.mock('@/wc/project-form-styles.js', () => ({
  ProjectFormStyles: []
}));

// Mock ia-availability-service
vi.mock('@/services/ia-availability-service.js', () => ({
  iaAvailabilityService: {
    isAvailable: vi.fn(() => false),
    ensureInitialized: vi.fn(async () => false)
  }
}));

// Mock entity-directory-service
vi.mock('@/services/entity-directory-service.js', () => ({
  entityDirectoryService: {
    waitForInit: vi.fn(async () => {}),
    getActiveDevelopers: vi.fn(() => []),
    getActiveStakeholders: vi.fn(() => []),
    getDeveloper: vi.fn(),
    getStakeholder: vi.fn(),
    resolveDeveloperId: vi.fn(),
    resolveStakeholderId: vi.fn(),
    addChangeListener: vi.fn(() => () => {})
  }
}));

// Mock global-config-service
vi.mock('@/services/global-config-service.js', () => ({
  globalConfigService: {
    getAllConfigs: vi.fn(async () => [])
  }
}));

// Mock firebase-config
vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn(),
  get: vi.fn(),
  set: vi.fn()
}));

// Mock firebase-key-utils
vi.mock('@/utils/firebase-key-utils.js', () => ({
  toFirebaseKey: vi.fn((key) => key)
}));

// Mock email-sanitizer
vi.mock('@/utils/email-sanitizer.js', () => ({
  encodeEmailForFirebase: vi.fn((email) => email.replace(/\./g, ','))
}));

// Mock ColorTabs
vi.mock('@/wc/ColorTabs.js', () => ({}));

// Prevent customElements.define from failing
if (!globalThis.customElements) {
  globalThis.customElements = {
    define: vi.fn(),
    get: vi.fn()
  };
} else if (!globalThis.customElements.define) {
  globalThis.customElements.define = vi.fn();
}

const { ProjectForm } = await import('@/wc/ProjectForm.js');

describe('ProjectForm', () => {
  let form;

  beforeEach(() => {
    form = new ProjectForm();
  });

  describe('businessContext property', () => {
    it('should have businessContext as empty string by default', () => {
      expect(form.businessContext).toBe('');
    });

    it('should have _showBusinessContextPreview as false by default', () => {
      expect(form._showBusinessContextPreview).toBe(false);
    });

    it('should accept businessContext value', () => {
      form.businessContext = '# My Project\nDescription here';
      expect(form.businessContext).toBe('# My Project\nDescription here');
    });
  });

  describe('getFormData()', () => {
    it('should include businessContext in form data', () => {
      form.projectName = 'Test Project';
      form.abbreviation = 'TST';
      form.businessContext = '# Test Context\nSome markdown content';

      const data = form.getFormData();

      expect(data.businessContext).toBe('# Test Context\nSome markdown content');
    });

    it('should trim businessContext whitespace', () => {
      form.projectName = 'Test Project';
      form.abbreviation = 'TST';
      form.businessContext = '  content with spaces  ';

      const data = form.getFormData();

      expect(data.businessContext).toBe('content with spaces');
    });

    it('should return empty string when businessContext is null/undefined', () => {
      form.projectName = 'Test Project';
      form.abbreviation = 'TST';
      form.businessContext = null;

      const data = form.getFormData();

      expect(data.businessContext).toBe('');
    });

    it('should return empty string when businessContext is not set', () => {
      form.projectName = 'Test Project';
      form.abbreviation = 'TST';

      const data = form.getFormData();

      expect(data.businessContext).toBe('');
    });

    it('should include all expected fields', () => {
      form.projectName = 'Test';
      form.abbreviation = 'TST';

      const data = form.getFormData();

      expect(data).toHaveProperty('projectName');
      expect(data).toHaveProperty('abbreviation');
      expect(data).toHaveProperty('businessContext');
      expect(data).toHaveProperty('selectedAgents');
      expect(data).toHaveProperty('selectedPrompts');
      expect(data).toHaveProperty('selectedInstructions');
      expect(data).toHaveProperty('useIa');
    });
  });

  describe('_renderMarkdown()', () => {
    it('should return empty string for empty input', () => {
      expect(form._renderMarkdown('')).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(form._renderMarkdown(null)).toBe('');
    });

    it('should return HTML from marked.parse', () => {
      const result = form._renderMarkdown('some text');
      expect(result).toBe('<p>some text</p>');
    });
  });

  describe('_handleBusinessContextChange()', () => {
    it('should update businessContext from event target value', () => {
      const mockEvent = { target: { value: 'new context value' } };
      form._handleBusinessContextChange(mockEvent);
      expect(form.businessContext).toBe('new context value');
    });
  });
});

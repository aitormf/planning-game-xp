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

// Mock styles
vi.mock('../../public/js/wc/dev-plans-section-styles.js', () => ({
  DevPlansSectionStyles: {}
}));

// Mock child components
vi.mock('../../public/js/wc/PlanProposalsList.js', () => ({}));
vi.mock('../../public/js/wc/DevPlansList.js', () => ({}));

// Now import the component
const { DevPlansSection } = await import('../../public/js/wc/DevPlansSection.js');

describe('DevPlansSection', () => {
  it('should export DevPlansSection class', () => {
    expect(DevPlansSection).toBeDefined();
  });

  it('should define properties with projectId', () => {
    const props = DevPlansSection.properties;
    expect(props).toBeDefined();
    expect(props.projectId).toBeDefined();
    expect(props.projectId.type).toBe(String);
    expect(props.projectId.attribute).toBe('project-id');
  });

  it('should be registered as custom element', () => {
    expect(customElements.get('dev-plans-section')).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with empty projectId', () => {
      const section = new DevPlansSection();
      expect(section.projectId).toBe('');
    });
  });

  describe('_handleGenerateFromProposal', () => {
    it('should exist as a method', () => {
      const section = new DevPlansSection();
      expect(typeof section._handleGenerateFromProposal).toBe('function');
    });
  });

  describe('render', () => {
    it('should return a template', () => {
      const section = new DevPlansSection();
      section.projectId = 'PLN';
      const result = section.render();
      expect(result).toBeDefined();
      expect(result.strings).toBeDefined();
    });
  });
});

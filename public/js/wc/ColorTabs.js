import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

/**
 * ColorTabs - A reusable tabbed interface component with colored borders
 *
 * @element color-tabs
 * @fires tab-changed - Fired when active tab changes, detail: { name, index }
 *
 * @method setActiveTab(tabName) - Programmatically set the active tab
 * @method setTabInvalid(tabName, isInvalid) - Mark a tab as invalid for validation
 * @method clearAllInvalid() - Clear all invalid states
 *
 * @example
 * <color-tabs active-tab="description">
 *   <color-tab name="description" label="Description" color="var(--description-color)">
 *     <div>Content here...</div>
 *   </color-tab>
 *   <color-tab name="notes" label="Notes" color="var(--notes-color)">
 *     <div>Notes content...</div>
 *   </color-tab>
 * </color-tabs>
 */
export class ColorTabs extends LitElement {
  static properties = {
    activeTab: { type: String, attribute: 'active-tab', reflect: true },
    _tabs: { type: Array, state: true },
    _invalidTabs: { type: Set, state: true }
  };

  static styles = css`
    :host {
      display: block;
    }

    .tabs-header {
      display: flex;
      gap: var(--spacing-sm, 0.5rem);
      padding: 0 var(--spacing-md, 1rem) 0 2rem;
      background: var(--tabs-header-bg, transparent);
      position: relative;
      top: 3px;
    }

    .tab-button {
      padding: 0.75rem var(--spacing-lg, 1.5rem);
      border: 1px solid transparent;
      border-bottom: none;
      border-radius: var(--radius-lg, 8px) var(--radius-lg, 8px) 0 0;
      background: none;
      color: var(--text-secondary, #666);
      cursor: pointer;
      font-size: var(--font-size-base, 1rem);
      font-weight: 500;
      margin-bottom: -1px;
      transition: all 0.15s ease;
    }

    .tab-button:hover {
      background: var(--hover-overlay, rgba(0,0,0,0.05));
    }

    .tab-button:focus-visible {
      outline: 2px solid var(--focus-color, #4a9eff);
      outline-offset: 2px;
    }

    .tab-button.active {
      background: var(--bg-primary, #fff);
      border-width: 3px;
      border-bottom: none;
      color: var(--text-primary, #333);
      font-weight: 700;
    }

    .tab-button.invalid {
      color: var(--color-error, #dc3545);
      position: relative;
    }

    .tab-button.invalid::after {
      content: '!';
      position: absolute;
      top: 2px;
      right: 4px;
      width: 14px;
      height: 14px;
      background: var(--color-error, #dc3545);
      color: white;
      border-radius: 50%;
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tab-content-wrapper {
      background: var(--tabs-content-bg, var(--bg-primary, #fff));
      color: var(--text-primary, #333);
      border-radius: var(--radius-lg, 8px);
      margin: 0 1rem;
      padding: var(--spacing-md, 1rem);
      min-height: 80px;
      overflow: auto;
    }

      `;

  constructor() {
    super();
    this.activeTab = '';
    this._tabs = [];
    this._invalidTabs = new Set();
  }

  connectedCallback() {
    super.connectedCallback();
    // Use MutationObserver to detect when color-tab children are added (not attributes to avoid loops)
    this._observer = new MutationObserver(() => this._collectTabs());
    this._observer.observe(this, { childList: true });

    // Initial collection after a tick to allow children to be parsed
    requestAnimationFrame(() => this._collectTabs());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  _collectTabs() {
    const tabElements = Array.from(this.querySelectorAll('color-tab'));
    this._tabs = tabElements.map((tab, index) => ({
      name: tab.getAttribute('name') || `tab-${index}`,
      label: tab.getAttribute('label') || `Tab ${index + 1}`,
      color: tab.getAttribute('color') || 'var(--bg-dark, #333)',
      element: tab
    }));

    // Set default active tab if not set
    if (!this.activeTab && this._tabs.length > 0) {
      this.activeTab = this._tabs[0].name;
    }

    this._updateActiveStates();
    this.requestUpdate();
  }

  _updateActiveStates() {
    // Update active attribute on color-tab elements
    this._tabs.forEach(tab => {
      if (tab.name === this.activeTab) {
        tab.element.setAttribute('active', '');
      } else {
        tab.element.removeAttribute('active');
      }
    });
  }

  /**
   * Public method to set the active tab programmatically
   * @param {string} tabName - The name of the tab to activate
   */
  setActiveTab(tabName) {
    if (this._tabs.some(t => t.name === tabName)) {
      this.activeTab = tabName;
      this._updateActiveStates();
      this.requestUpdate();
    }
  }

  /**
   * Public method to mark a tab as invalid (for validation errors)
   * @param {string} tabName - The name of the tab
   * @param {boolean} isInvalid - Whether the tab should be marked as invalid
   */
  setTabInvalid(tabName, isInvalid) {
    if (isInvalid) {
      this._invalidTabs.add(tabName);
    } else {
      this._invalidTabs.delete(tabName);
    }
    this.requestUpdate();
  }

  /**
   * Public method to clear all invalid states
   */
  clearAllInvalid() {
    this._invalidTabs.clear();
    this.requestUpdate();
  }

  _handleTabClick(tabName) {
    if (this.activeTab !== tabName) {
      this.activeTab = tabName;
      this._updateActiveStates();
      this.dispatchEvent(new CustomEvent('tab-changed', {
        detail: {
          name: tabName,
          index: this._tabs.findIndex(t => t.name === tabName)
        },
        bubbles: true,
        composed: true
      }));
    }
  }

  _handleKeyDown(e, tabName, index) {
    const tabCount = this._tabs.length;
    let newIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = index === 0 ? tabCount - 1 : index - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = index === tabCount - 1 ? 0 : index + 1;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabCount - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._handleTabClick(tabName);
        return;
      default:
        return;
    }

    // Focus and activate the new tab
    const newTab = this._tabs[newIndex];
    if (newTab) {
      this._handleTabClick(newTab.name);
      // Focus the new tab button after render
      this.updateComplete.then(() => {
        const buttons = this.shadowRoot.querySelectorAll('.tab-button');
        buttons[newIndex]?.focus();
      });
    }
  }

  _getActiveTab() {
    return this._tabs.find(t => t.name === this.activeTab) || this._tabs[0];
  }

  render() {
    const activeTab = this._getActiveTab();
    const activeColor = activeTab?.color || 'var(--bg-dark)';

    return html`
      <div class="tabs-header" role="tablist" aria-label="Tabs">
        ${this._tabs.map((tab, index) => html`
          <button
            class="tab-button ${tab.name === this.activeTab ? 'active' : ''} ${this._invalidTabs.has(tab.name) ? 'invalid' : ''}"
            style="${tab.name === this.activeTab ? `border-color: ${tab.color}` : ''}"
            role="tab"
            aria-selected="${tab.name === this.activeTab}"
            aria-controls="panel-${tab.name}"
            id="tab-${tab.name}"
            tabindex="${tab.name === this.activeTab ? '0' : '-1'}"
            @click=${() => this._handleTabClick(tab.name)}
            @keydown=${(e) => this._handleKeyDown(e, tab.name, index)}
          >
            ${tab.label}
          </button>
        `)}
      </div>
      <div
        class="tab-content-wrapper"
        style="border: 4px solid ${activeColor};"
        role="tabpanel"
        id="panel-${activeTab?.name}"
        aria-labelledby="tab-${activeTab?.name}"
      >
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('color-tabs', ColorTabs);

/**
 * ColorTab - Individual tab definition for ColorTabs
 *
 * @element color-tab
 * @attr {String} name - Unique identifier for the tab
 * @attr {String} label - Display label for the tab button
 * @attr {String} color - CSS color for the active state border
 * @attr {Boolean} active - Whether this tab is currently active
 */
export class ColorTab extends LitElement {
  static properties = {
    name: { type: String, reflect: true },
    label: { type: String, reflect: true },
    color: { type: String, reflect: true },
    active: { type: Boolean, reflect: true }
  };

  static styles = css`
    :host {
      display: none;
    }

    :host([active]) {
      display: block;
    }
  `;

  constructor() {
    super();
    this.name = '';
    this.label = '';
    this.color = '';
    this.active = false;
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('color-tab', ColorTab);

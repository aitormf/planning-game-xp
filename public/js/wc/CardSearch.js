import { LitElement, html, css } from 'lit';

/**
 * Card Search Component
 * Searches cards by cardId or title, independent of filters.
 * When a search is active, it overrides filters and shows only matching cards.
 *
 * Works by emitting events that the table-view-manager listens to,
 * so the search operates on DATA level, not DOM level.
 */
export class CardSearch extends LitElement {
  static get properties() {
    return {
      // Section identifier (e.g., "tasks", "bugs") for targeting the right view
      section: { type: String },
      placeholder: { type: String },
      searchQuery: { type: String, state: true },
      resultsCount: { type: Object, state: true }
    };
  }

  static get styles() {
    return css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .search-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0.25rem 0.5rem;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .search-container:focus-within {
        border-color: var(--geniova-color, #ec3e95);
        box-shadow: 0 0 0 2px rgba(236, 62, 149, 0.15);
      }

      .search-container.has-results {
        border-color: #10b981;
      }

      .search-container.no-results {
        border-color: #ef4444;
      }

      .search-icon {
        color: #9ca3af;
        font-size: 0.9rem;
        flex-shrink: 0;
      }

      .search-input {
        border: none;
        outline: none;
        font-size: 0.85rem;
        width: 180px;
        padding: 0.25rem 0;
        background: transparent;
      }

      .search-input::placeholder {
        color: #9ca3af;
      }

      .clear-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        font-size: 0.9rem;
        padding: 0.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .clear-btn.visible {
        opacity: 1;
      }

      .clear-btn:hover {
        color: #6b7280;
      }

      .results-badge {
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        border-radius: 10px;
        font-weight: 600;
        white-space: nowrap;
      }

      .results-badge.has-results {
        background: #d1fae5;
        color: #065f46;
      }

      .results-badge.no-results {
        background: #fee2e2;
        color: #991b1b;
      }
    `;
  }

  constructor() {
    super();
    this.section = '';
    this.placeholder = 'Buscar por ID o titulo...';
    this.searchQuery = '';
    this.resultsCount = { visible: 0, total: 0 };
    this._debounceTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // Listen for search results update from table-view-manager
    this._searchResultsHandler = (e) => this._handleSearchResults(e);
    document.addEventListener('search-results-updated', this._searchResultsHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._searchResultsHandler) {
      document.removeEventListener('search-results-updated', this._searchResultsHandler);
    }
  }

  _handleSearchResults(event) {
    const { section, visible, total } = event.detail || {};
    if (section === this.section) {
      this.resultsCount = { visible, total };
      this.requestUpdate();
    }
  }

  _handleInput(e) {
    const value = e.target.value;
    this.searchQuery = value;

    // Debounce search
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._emitSearchQuery();
    }, 150);
  }

  _handleClear() {
    this.searchQuery = '';
    this.resultsCount = { visible: 0, total: 0 };
    this.requestUpdate();

    // Focus back on input
    const input = this.shadowRoot?.querySelector('.search-input');
    if (input) input.focus();

    // Emit empty query to clear search
    this._emitSearchQuery();
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this._handleClear();
    }
  }

  _emitSearchQuery() {
    const query = this.searchQuery.trim();

    // Emit event for table-view-manager to handle
    document.dispatchEvent(new CustomEvent('search-query-changed', {
      detail: {
        query,
        section: this.section
      }
    }));
  }

  /**
   * Public method to clear search from outside
   */
  clearSearch() {
    this._handleClear();
  }

  /**
   * Public method to check if search is active
   */
  isSearchActive() {
    return this.searchQuery.trim().length > 0;
  }

  render() {
    const hasQuery = this.searchQuery.trim().length > 0;
    const hasResults = this.resultsCount.visible > 0;
    const containerClass = hasQuery
      ? (hasResults ? 'has-results' : 'no-results')
      : '';

    return html`
      <div class="search-container ${containerClass}">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="search-input"
          .value=${this.searchQuery}
          placeholder=${this.placeholder}
          @input=${this._handleInput}
          @keydown=${this._handleKeydown}
        />
        <button
          class="clear-btn ${hasQuery ? 'visible' : ''}"
          @click=${this._handleClear}
          title="Limpiar búsqueda"
        >✕</button>
      </div>
      ${hasQuery ? html`
        <span class="results-badge ${hasResults ? 'has-results' : 'no-results'}">
          ${this.resultsCount.visible}/${this.resultsCount.total}
        </span>
      ` : ''}
    `;
  }
}

customElements.define('card-search', CardSearch);

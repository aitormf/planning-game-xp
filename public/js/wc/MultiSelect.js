import { LitElement, html } from 'https://unpkg.com/lit@2.8.0/index.js?module';
import { multiSelectStyles } from './multi-select-styles.js';

export class MultiSelect extends LitElement {
  static get properties() {
    return {
      label: { type: String },
      options: { type: Array },
      selectedValues: { type: Array },
      placeholder: { type: String },
      isOpen: { type: Boolean }
    };
  }

  static get styles() {
    return multiSelectStyles;
  }

  constructor() {
    super();
    this.label = '';
    this.options = [];
    this.selectedValues = [];
    this.placeholder = 'Seleccionar...';
    this.isOpen = false;

    this._handleClickOutside = this._handleClickOutside.bind(this);
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        this._addGlobalClickListener();
      } else {
        this._removeGlobalClickListener();
      }
    }
  }

  render() {
    const selectedLabels = this.selectedValues.map(value => {
      const option = this.options.find(opt => opt.value === value);
      return option ? option.label : value;
    });

    return html`
      <div class="multi-select ${this.isOpen ? 'open' : ''}">
        <div class="select-header" @click=${this.toggleDropdown}>
          <div class="selected-values">
            ${selectedLabels.length > 0
        ? selectedLabels.join(', ')
        : this.placeholder}
          </div>
          <div class="select-arrow">▼</div>
        </div>
        
        <div class="options-container">
          ${this.options.map(option => html`
            <div class="option ${this.selectedValues.includes(option.value) ? 'selected' : ''}"
                 @click=${() => this.toggleOption(option.value)}>
              <input type="checkbox"
                     ?checked=${this.selectedValues.includes(option.value)}
                     @click=${(e) => { e.stopPropagation(); this.toggleOption(option.value); }}>
              <span>${option.label}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  toggleOption(value) {
    const newSelectedValues = this.selectedValues.includes(value)
      ? this.selectedValues.filter(v => v !== value)
      : [...this.selectedValues, value];

    this.selectedValues = newSelectedValues;

    // Emitir evento de cambio
    this.dispatchEvent(new CustomEvent('change', {
      detail: { selectedValues: newSelectedValues },
      bubbles: true,
      composed: true
    }));
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeGlobalClickListener();
  }
  
  firstUpdated() {
    // Ya no es necesario escuchar en shadowRoot
  }

  _handleClickOutside(event) {
    if (this.isOpen && !event.composedPath().includes(this)) {
      this.isOpen = false;
    }
  }

  _addGlobalClickListener() {
    if (!this._globalClickListener) {
      this._globalClickListener = (event) => {
        if (!event.composedPath().includes(this)) {
          this.isOpen = false;
        }
      };
      document.addEventListener('mousedown', this._globalClickListener, true);
    }
  }

  _removeGlobalClickListener() {
    if (this._globalClickListener) {
      document.removeEventListener('mousedown', this._globalClickListener, true);
      this._globalClickListener = null;
    }
  }
}

customElements.define('multi-select', MultiSelect);
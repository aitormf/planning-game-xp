import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

/**
 * YearSelector - Componente para seleccionar el año de trabajo
 * Permite filtrar sprints, épicas y métricas por año
 */
export class YearSelector extends LitElement {
  static get properties() {
    return {
      selectedYear: { type: Number, reflect: true },
      availableYears: { type: Array },
      isPastYear: { type: Boolean, reflect: true, attribute: 'is-past-year' },
    };
  }

  static get styles() {
    return css`
      :host {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .year-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary, #333);
      }

      select {
        padding: 6px 12px;
        border: 1px solid var(--border-default, #ccc);
        border-radius: 4px;
        background: var(--bg-primary, #fff);
        color: var(--text-primary, #333);
        font-size: 0.9rem;
        cursor: pointer;
        min-width: 80px;
      }

      select:focus {
        outline: none;
        border-color: var(--brand-primary, #007bff);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      select:hover {
        border-color: var(--brand-primary, #007bff);
      }

      :host([is-past-year]) select {
        background: var(--status-warning-bg, #fff3cd);
        border-color: var(--color-warning, #ffc107);
      }

      .past-year-indicator {
        display: none;
        font-size: 0.8rem;
        color: var(--status-warning-text, #856404);
        background: var(--status-warning-bg, #fff3cd);
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 4px;
      }

      :host([is-past-year]) .past-year-indicator {
        display: inline-block;
      }
    `;
  }

  constructor() {
    super();
    this.currentYear = new Date().getFullYear();
    this.selectedYear = this.currentYear;
    this.isPastYear = false;
    // Por defecto mostrar año actual y siguiente (para planificación)
    this.availableYears = [this.currentYear - 1, this.currentYear, this.currentYear + 1];

    // Cargar año guardado en localStorage
    const savedYear = localStorage.getItem('selectedYear');
    if (savedYear) {
      this.selectedYear = Number(savedYear);
      this._updatePastYearStatus();
    }
  }

  _updatePastYearStatus() {
    this.isPastYear = this.selectedYear < this.currentYear;
  }

  connectedCallback() {
    super.connectedCallback();
    // Emitir evento inicial para que otros componentes sepan el año seleccionado
    this._emitYearChange();
  }

  render() {
    return html`
      <div class="year-row">
        <label for="yearSelect">Año:</label>
        <select
          id="yearSelect"
          .value=${String(this.selectedYear)}
          @change=${this._handleYearChange}
        >
          ${this.availableYears.map(year => html`
            <option value=${year} ?selected=${year === this.selectedYear}>
              ${year}
            </option>
          `)}
        </select>
      </div>
      <span class="past-year-indicator">Solo lectura</span>
    `;
  }

  _handleYearChange(e) {
    this.selectedYear = Number(e.target.value);
    localStorage.setItem('selectedYear', String(this.selectedYear));
    this._updatePastYearStatus();
    this._emitYearChange();
  }

  _emitYearChange() {
    const eventDetail = {
      year: this.selectedYear,
      isPastYear: this.isPastYear,
      currentYear: this.currentYear
    };

    this.dispatchEvent(new CustomEvent('year-changed', {
      detail: eventDetail,
      bubbles: true,
      composed: true
    }));

    // También disparar evento en document para que lo escuchen otros componentes
    document.dispatchEvent(new CustomEvent('year-changed', {
      detail: eventDetail
    }));
  }

  /**
   * Método público para obtener el año seleccionado
   */
  getSelectedYear() {
    return this.selectedYear;
  }

  /**
   * Método público para establecer el año
   */
  setSelectedYear(year) {
    this.selectedYear = year;
    localStorage.setItem('selectedYear', String(year));
    this._emitYearChange();
  }

  /**
   * Método para añadir años disponibles dinámicamente
   */
  addAvailableYear(year) {
    if (!this.availableYears.includes(year)) {
      this.availableYears = [...this.availableYears, year].sort((a, b) => a - b);
    }
  }
}

customElements.define('year-selector', YearSelector);

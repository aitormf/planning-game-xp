import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { HoursReportTabStyles } from './hours-report-tab-styles.js';
import { reportHoursService } from '../services/report-hours-service.js';

class HoursReportTab extends LitElement {
  static get properties() {
    return {
      _selectedMonth: { type: Number, state: true },
      _selectedYear: { type: Number, state: true },
      _loading: { type: Boolean, state: true },
      _report: { type: Object, state: true },
    };
  }

  static get styles() {
    return [HoursReportTabStyles];
  }

  constructor() {
    super();
    const now = new Date();
    this._selectedMonth = now.getMonth() + 1;
    this._selectedYear = now.getFullYear();
    this._loading = false;
    this._report = null;
  }

  render() {
    return html`
      <div class="hours-report-container">
        ${this._renderFilters()}
        ${this._loading ? this._renderLoading() : nothing}
        ${this._report && !this._loading ? this._renderTable() : nothing}
        ${!this._report && !this._loading ? this._renderEmpty() : nothing}
      </div>
    `;
  }

  _renderFilters() {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return html`
      <div class="filters-row">
        <div class="filter-group">
          <label>Mes</label>
          <select class="filter-input" .value=${String(this._selectedMonth)} @change=${this._onMonthChange}>
            ${months.map((name, i) => html`
              <option value=${i + 1} ?selected=${i + 1 === this._selectedMonth}>${name}</option>
            `)}
          </select>
        </div>
        <div class="filter-group">
          <label>Año</label>
          <select class="filter-input" .value=${String(this._selectedYear)} @change=${this._onYearChange}>
            ${years.map(y => html`
              <option value=${y} ?selected=${y === this._selectedYear}>${y}</option>
            `)}
          </select>
        </div>
        <button class="btn-generate" @click=${this._generateReport} ?disabled=${this._loading}>
          Generar Informe
        </button>
      </div>
    `;
  }

  _renderLoading() {
    return html`
      <div class="loading-container">
        <div class="spinner"></div>
        <span>Generando informe...</span>
      </div>
    `;
  }

  _renderEmpty() {
    return html`
      <div class="empty-state">
        <p>Selecciona un mes y pulsa "Generar Informe" para ver el desglose de horas.</p>
      </div>
    `;
  }

  _renderTable() {
    const { weeks, groups, grandTotals } = this._report;

    return html`
      <div style="overflow-x: auto;">
        <table class="report-table">
          <thead>
            <tr>
              <th>Developer</th>
              <th>Tipo</th>
              ${weeks.map(w => html`<th>${w}</th>`)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${this._renderGroups(groups, weeks)}
            ${this._renderGrandTotals(grandTotals, weeks)}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderGroups(groups, weeks) {
    const groupOrder = ['internal', 'external', 'manager', 'unclassified'];
    const rendered = [];

    for (const groupKey of groupOrder) {
      const group = groups[groupKey];
      if (!group) continue;

      const devEntries = Object.entries(group.developers);
      if (devEntries.length === 0 && groupKey !== 'unclassified') {
        // Show group even if empty (except unclassified)
      }

      // Group header
      rendered.push(html`
        <tr class="group-header">
          <td colspan=${weeks.length + 3}>${group.label}</td>
        </tr>
      `);

      // Developer rows
      for (const [, dev] of devEntries) {
        rendered.push(this._renderDevRow(dev, weeks, 'development', 'Desarrollo SW'));
        rendered.push(this._renderDevRow(dev, weeks, 'maintenance', 'Mantenimiento'));
      }

      if (devEntries.length === 0) {
        rendered.push(html`
          <tr>
            <td colspan=${weeks.length + 3} style="text-align:center; color: var(--text-muted, #999); font-style: italic;">
              Sin datos
            </td>
          </tr>
        `);
      }

      // Subtotals
      rendered.push(this._renderSubtotalRow(group, weeks, 'Subtotal'));
    }

    return rendered;
  }

  _renderDevRow(dev, weeks, category, categoryLabel) {
    const isFirst = category === 'development';
    const rowClass = category === 'development' ? 'row-development' : 'row-maintenance';

    return html`
      <tr class=${rowClass}>
        <td>${isFirst ? dev.name : ''}</td>
        <td>${categoryLabel}</td>
        ${weeks.map(w => {
          const val = dev.weeks[w]?.[category] || 0;
          return html`<td class=${val === 0 ? 'zero-value' : ''}>${this._formatHours(val)}</td>`;
        })}
        <td class=${dev.totals[category] === 0 ? 'zero-value' : ''}>${this._formatHours(dev.totals[category])}</td>
      </tr>
    `;
  }

  _renderSubtotalRow(group, weeks, label) {
    // Calculate weekly subtotals for this group
    const weeklySubtotals = {};
    for (const w of weeks) {
      weeklySubtotals[w] = 0;
    }
    for (const dev of Object.values(group.developers)) {
      for (const w of weeks) {
        weeklySubtotals[w] += (dev.weeks[w]?.development || 0) + (dev.weeks[w]?.maintenance || 0);
      }
    }
    const totalSubtotal = group.subtotals.development + group.subtotals.maintenance;

    return html`
      <tr class="subtotal-row">
        <td>${label}</td>
        <td></td>
        ${weeks.map(w => html`<td>${this._formatHours(weeklySubtotals[w])}</td>`)}
        <td>${this._formatHours(totalSubtotal)}</td>
      </tr>
    `;
  }

  _renderGrandTotals(grandTotals, weeks) {
    return html`
      <tr class="grand-total-row">
        <td>TOTAL HORAS DESARROLLO</td>
        <td></td>
        ${weeks.map(() => html`<td></td>`)}
        <td>${this._formatHours(grandTotals.development)}</td>
      </tr>
      <tr class="grand-total-row">
        <td>TOTAL HORAS MANTENIMIENTO</td>
        <td></td>
        ${weeks.map(() => html`<td></td>`)}
        <td>${this._formatHours(grandTotals.maintenance)}</td>
      </tr>
      <tr class="grand-total-row">
        <td>TOTAL HORAS</td>
        <td></td>
        ${weeks.map(() => html`<td></td>`)}
        <td>${this._formatHours(grandTotals.development + grandTotals.maintenance)}</td>
      </tr>
    `;
  }

  _formatHours(val) {
    if (val === 0) return '0';
    return Number.isInteger(val) ? String(val) : val.toFixed(1);
  }

  _onMonthChange(e) {
    this._selectedMonth = Number(e.target.value);
  }

  _onYearChange(e) {
    this._selectedYear = Number(e.target.value);
  }

  async _generateReport() {
    this._loading = true;
    this._report = null;
    try {
      this._report = await reportHoursService.calculateMonthlyReport(this._selectedYear, this._selectedMonth);
    } catch (err) {
      console.error('Error generating hours report:', err);
      this._report = null;
    } finally {
      this._loading = false;
    }
  }
}

customElements.define('hours-report-tab', HoursReportTab);

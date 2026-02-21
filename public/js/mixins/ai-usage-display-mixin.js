/**
 * Mixin for displaying AI usage data in card components
 * Provides shared functionality for TaskCard and BugCard
 */
import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { format, parseISO, isValid } from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';

/**
 * Mixin that adds AI usage display functionality to a LitElement class
 * @param {typeof LitElement} superClass - The class to extend
 * @returns {typeof LitElement} - Extended class with AI usage functionality
 */
export const AiUsageDisplayMixin = (superClass) => class extends superClass {
  static get properties() {
    return {
      ...super.properties,
      aiUsage: { type: Array }
    };
  }

  constructor() {
    super();
    this.aiUsage = [];
  }

  /**
   * Get the aiUsage array safely
   * @returns {Array} Array of AI usage entry objects
   */
  _getAiUsageArray() {
    return Array.isArray(this.aiUsage) ? this.aiUsage : [];
  }

  /**
   * Get AI usage tab label with count badge
   * @returns {string} Label for the AI usage tab
   */
  _getAiUsageTabLabel() {
    const count = this._getAiUsageArray().length;
    if (count > 0) {
      return `AI Usage (${count})`;
    }
    return 'AI Usage';
  }

  /**
   * Format a timestamp for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  _formatAiDate(dateString) {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy HH:mm');
      }
    } catch {
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
    }
    return dateString;
  }

  /**
   * Format token count with thousands separator
   * @param {number} count - Token count
   * @returns {string} Formatted token count
   */
  _formatTokenCount(count) {
    if (count === undefined || count === null) return '0';
    return Number(count).toLocaleString('es-ES');
  }

  /**
   * Format cost in USD
   * @param {number} cost - Cost in USD
   * @returns {string} Formatted cost
   */
  _formatCost(cost) {
    if (cost === undefined || cost === null) return '$0.00';
    return `$${Number(cost).toFixed(2)}`;
  }

  /**
   * Format duration in minutes
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration
   */
  _formatDuration(minutes) {
    if (!minutes && minutes !== 0) return '-';
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Render the AI usage panel content
   * @returns {TemplateResult} Lit HTML template
   */
  renderAiUsagePanel() {
    const entries = this._getAiUsageArray();

    if (entries.length === 0) {
      return html`
        <div class="ai-usage-panel">
          <div class="no-ai-usage">
            No hay datos de uso de IA para esta tarjeta.
          </div>
        </div>
      `;
    }

    // Sort entries by timestamp (most recent first)
    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });

    // Calculate totals
    const totals = entries.reduce((acc, entry) => {
      acc.inputTokens += Number(entry.inputTokens) || 0;
      acc.outputTokens += Number(entry.outputTokens) || 0;
      acc.totalTokens += Number(entry.totalTokens) || 0;
      acc.estimatedCostUSD += Number(entry.estimatedCostUSD) || 0;
      acc.durationMinutes += Number(entry.durationMinutes) || 0;
      return acc;
    }, { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUSD: 0, durationMinutes: 0 });

    return html`
      <div class="ai-usage-panel">
        <table class="ai-usage-table">
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Tokens In</th>
              <th>Tokens Out</th>
              <th>Total</th>
              <th>Coste</th>
              <th>Duración</th>
              <th>Acción</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${sortedEntries.map(entry => html`
              <tr class="ai-usage-row">
                <td><span class="ai-model-badge">${entry.model}</span></td>
                <td class="ai-token-count">${this._formatTokenCount(entry.inputTokens)}</td>
                <td class="ai-token-count">${this._formatTokenCount(entry.outputTokens)}</td>
                <td class="ai-token-count">${this._formatTokenCount(entry.totalTokens)}</td>
                <td class="ai-cost">${this._formatCost(entry.estimatedCostUSD)}</td>
                <td class="ai-duration">${this._formatDuration(entry.durationMinutes)}</td>
                <td>${entry.action ? html`<span class="ai-action-badge">${entry.action}</span>` : '-'}</td>
                <td class="ai-date">${this._formatAiDate(entry.timestamp)}</td>
              </tr>
            `)}
            ${entries.length > 1 ? html`
              <tr class="ai-usage-totals">
                <td>Total</td>
                <td class="ai-token-count">${this._formatTokenCount(totals.inputTokens)}</td>
                <td class="ai-token-count">${this._formatTokenCount(totals.outputTokens)}</td>
                <td class="ai-token-count">${this._formatTokenCount(totals.totalTokens)}</td>
                <td class="ai-cost">${this._formatCost(totals.estimatedCostUSD)}</td>
                <td class="ai-duration">${this._formatDuration(totals.durationMinutes)}</td>
                <td colspan="2"></td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    `;
  }
};

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { historyService } from '../services/history-service.js';
import { entityDirectoryService } from '../services/entity-directory-service.js';

/**
 * Componente para visualizar el histórico de cambios de una tarjeta
 * Carga el histórico desde la estructura separada, no desde la tarjeta
 */
export class CardHistoryViewer extends LitElement {
  static properties = {
    projectId: { type: String },
    cardType: { type: String },
    cardId: { type: String },
    history: { type: Array },
    loading: { type: Boolean },
    expanded: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .history-container {
      background: var(--bg-secondary, #f8f9fa);
      border-radius: 8px;
      padding: 12px;
    }

    .history-list {
      max-height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    details.history-entry {
      background: var(--bg-primary, white);
      border-radius: 6px;
      border-left: 3px solid var(--brand-primary, #6366f1);
      overflow: hidden;
    }

    details.history-entry[open] {
      border-left-color: var(--color-success, #10b981);
    }

    summary.entry-summary {
      padding: 10px 12px;
      cursor: pointer;
      user-select: none;
      font-size: 0.9em;
      color: var(--text-primary, #333);
      display: flex;
      align-items: center;
      gap: 8px;
      list-style: none;
    }

    summary.entry-summary::-webkit-details-marker {
      display: none;
    }

    summary.entry-summary::before {
      content: '▶';
      font-size: 0.7em;
      color: var(--text-muted, #666);
      transition: transform 0.2s;
    }

    details.history-entry[open] summary.entry-summary::before {
      transform: rotate(90deg);
    }

    summary.entry-summary:hover {
      background: var(--bg-secondary, #f8f9fa);
    }

    .entry-date {
      font-weight: 500;
      color: var(--text-secondary, #495057);
    }

    .entry-separator {
      color: var(--text-disabled, #adb5bd);
    }

    .entry-user {
      color: var(--brand-primary, #6366f1);
      font-weight: 500;
    }

    .entry-changes {
      padding: 12px;
      padding-top: 8px;
      background: var(--bg-secondary, #f8f9fa);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .change-item {
      display: flex;
      align-items: start;
      gap: 8px;
      font-size: 0.85em;
      padding: 4px 8px;
      background: var(--bg-primary, white);
      border-radius: 4px;
    }

    .change-field {
      font-weight: 500;
      color: var(--text-secondary, #555);
      min-width: 100px;
    }

    .change-values {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      flex-wrap: wrap;
    }

    .value-from {
      background: var(--color-error-light, #fee);
      color: var(--color-error, #c00);
      padding: 2px 6px;
      border-radius: 3px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .value-to {
      background: var(--color-success-light, #efe);
      color: var(--color-success-dark, #060);
      padding: 2px 6px;
      border-radius: 3px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .value-arrow {
      color: var(--text-disabled, #999);
    }

    .loading {
      text-align: center;
      padding: 20px;
      color: var(--text-muted, #666);
    }

    .no-history {
      text-align: center;
      padding: 20px;
      color: var(--text-disabled, #999);
      font-style: italic;
    }
  `;

  constructor() {
    super();
    this.history = [];
    this.loading = false;
    this.expanded = false;
    this.unsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.projectId && this.cardType && this.cardId) {
      this.loadHistory();
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('projectId') || changedProperties.has('cardType') || changedProperties.has('cardId')) {
      if (this.projectId && this.cardType && this.cardId) {
        this.loadHistory();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  async loadHistory() {
    this.loading = true;
    try {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      // Suscribirse a cambios en tiempo real
      this.unsubscribe = historyService.subscribeToHistory(
        this.projectId,
        this.cardType,
        this.cardId,
        (history) => {
          this.history = history;
          this.loading = false;
        }
      );
    } catch (error) {
      this.loading = false;
    }
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Resuelve el nombre del usuario a partir del email
   * Busca primero en developers, luego en stakeholders
   */
  resolveUserName(email) {
    if (!email) return 'Sistema';

    // Intentar resolver como developer
    const devId = entityDirectoryService.resolveDeveloperId(email);
    if (devId) {
      const devName = entityDirectoryService.getDeveloperDisplayName(devId);
      if (devName && devName !== devId) return devName;
    }

    // Intentar resolver como stakeholder
    const stkId = entityDirectoryService.resolveStakeholderId(email);
    if (stkId) {
      const stkName = entityDirectoryService.getStakeholderDisplayName(stkId);
      if (stkName && stkName !== stkId) return stkName;
    }

    // Fallback: mostrar parte antes del @ del email
    if (email.includes('@')) {
      return email.split('@')[0];
    }

    return email;
  }

  formatFieldName(field) {
    const fieldNames = {
      title: 'Título',
      description: 'Descripción',
      status: 'Estado',
      priority: 'Prioridad',
      developer: 'Desarrollador',
      assignee: 'Asignado a',
      sprint: 'Sprint',
      sprintId: 'Sprint',
      startDate: 'Fecha inicio',
      endDate: 'Fecha fin',
      devPoints: 'Puntos desarrollo',
      businessPoints: 'Puntos negocio',
      blocked: 'Bloqueado',
      bugType: 'Tipo de bug',
      epicType: 'Tipo de épica'
    };
    return fieldNames[field] || field;
  }

  formatValue(value) {
    if (value === null || value === undefined) return '(vacío)';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).substring(0, 50);
  }

  renderChange(field, change) {
    return html`
      <div class="change-item">
        <div class="change-field">${this.formatFieldName(field)}:</div>
        <div class="change-values">
          <span class="value-from" title="${this.formatValue(change.from)}">
            ${this.formatValue(change.from)}
          </span>
          <span class="value-arrow">→</span>
          <span class="value-to" title="${this.formatValue(change.to)}">
            ${this.formatValue(change.to)}
          </span>
        </div>
      </div>
    `;
  }

  renderHistoryEntry(entry) {
    const changes = Object.entries(entry.changes || {});
    const userName = this.resolveUserName(entry.changedBy);
    const formattedDate = this.formatTimestamp(entry.timestamp);

    return html`
      <details class="history-entry">
        <summary class="entry-summary">
          <span class="entry-date">${formattedDate}</span>
          <span class="entry-separator">-</span>
          <span class="entry-user">${userName}</span>
        </summary>
        <div class="entry-changes">
          ${changes.map(([field, change]) => this.renderChange(field, change))}
        </div>
      </details>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="history-container">
          <div class="loading">Cargando histórico...</div>
        </div>
      `;
    }

    const historyCount = this.history.length;

    return html`
      <div class="history-container">
        ${historyCount === 0 ? html`
          <div class="no-history">No hay cambios registrados</div>
        ` : html`
          <div class="history-list">
            ${this.history.map(entry => this.renderHistoryEntry(entry))}
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('card-history-viewer', CardHistoryViewer);

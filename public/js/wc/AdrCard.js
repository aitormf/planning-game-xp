/**
 * ADR Card Component
 * Displays and allows editing of Architecture Decision Records
 */
import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { AdrCardStyles } from './adr-card-styles.js';
import { format, parseISO, isValid } from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';

export class AdrCard extends LitElement {
  static get properties() {
    return {
      adrId: { type: String, attribute: 'adr-id' },
      projectId: { type: String, attribute: 'project-id' },
      title: { type: String },
      context: { type: String },
      decision: { type: String },
      consequences: { type: String },
      status: { type: String },
      supersededBy: { type: String, attribute: 'superseded-by' },
      createdAt: { type: String, attribute: 'created-at' },
      createdBy: { type: String, attribute: 'created-by' },
      updatedAt: { type: String, attribute: 'updated-at' },
      updatedBy: { type: String, attribute: 'updated-by' },
      expanded: { type: Boolean, reflect: true },
      editing: { type: Boolean },
      canEdit: { type: Boolean, attribute: 'can-edit' }
    };
  }

  static get styles() {
    return [AdrCardStyles];
  }

  constructor() {
    super();
    this.adrId = '';
    this.projectId = '';
    this.title = '';
    this.context = '';
    this.decision = '';
    this.consequences = '';
    this.status = 'proposed';
    this.supersededBy = null;
    this.createdAt = '';
    this.createdBy = '';
    this.updatedAt = '';
    this.updatedBy = '';
    this.expanded = false;
    this.editing = false;
    this.canEdit = true;

    // Track original values for cancel
    this._originalValues = {};
  }

  /**
   * Format date for display
   */
  _formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy HH:mm');
      }
    } catch {
      // Return as-is if parsing fails
    }
    return dateString;
  }

  /**
   * Toggle expanded state
   */
  _toggleExpanded() {
    if (!this.editing) {
      this.expanded = !this.expanded;
    }
  }

  /**
   * Enter edit mode
   */
  _startEditing(e) {
    e?.stopPropagation();
    // Save original values
    this._originalValues = {
      title: this.title,
      context: this.context,
      decision: this.decision,
      consequences: this.consequences,
      status: this.status
    };
    this.editing = true;
    this.expanded = true;
  }

  /**
   * Cancel editing
   */
  _cancelEditing() {
    // Restore original values
    this.title = this._originalValues.title;
    this.context = this._originalValues.context;
    this.decision = this._originalValues.decision;
    this.consequences = this._originalValues.consequences;
    this.status = this._originalValues.status;
    this.editing = false;
  }

  /**
   * Save changes
   */
  async _save() {
    this.dispatchEvent(new CustomEvent('adr-save', {
      detail: {
        adrId: this.adrId,
        projectId: this.projectId,
        title: this.title,
        context: this.context,
        decision: this.decision,
        consequences: this.consequences,
        status: this.status
      },
      bubbles: true,
      composed: true
    }));
    this.editing = false;
  }

  /**
   * Delete ADR
   */
  _delete(e) {
    e?.stopPropagation();
    this.dispatchEvent(new CustomEvent('adr-delete', {
      detail: {
        adrId: this.adrId,
        projectId: this.projectId,
        title: this.title
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle input changes
   */
  _handleInput(field, e) {
    this[field] = e.target.value;
  }

  render() {
    return html`
      <div class="adr-card ${this.expanded ? 'expanded' : ''}">
        <div class="adr-header" @click=${this._toggleExpanded}>
          <div>
            ${this.editing ? html`
              <input
                type="text"
                class="adr-title-input"
                .value=${this.title}
                @input=${(e) => this._handleInput('title', e)}
                @click=${(e) => e.stopPropagation()}
                placeholder="ADR Title"
              />
            ` : html`
              <h3 class="adr-title">${this.title}</h3>
            `}
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${this.editing ? html`
              <select
                class="adr-status-select"
                .value=${this.status}
                @change=${(e) => this._handleInput('status', e)}
                @click=${(e) => e.stopPropagation()}
              >
                <option value="proposed">Proposed</option>
                <option value="accepted">Accepted</option>
                <option value="deprecated">Deprecated</option>
                <option value="superseded">Superseded</option>
              </select>
            ` : html`
              <span class="adr-status ${this.status}">${this.status}</span>
            `}
          </div>
        </div>

        ${!this.expanded ? html`
          <div class="adr-collapsed-preview">${this.decision || this.context || 'No decision recorded'}</div>
        ` : html`
          <div class="adr-meta">
            <span>Created: ${this._formatDate(this.createdAt)} by ${this.createdBy}</span>
            ${this.updatedAt !== this.createdAt ? html`
              <span>Updated: ${this._formatDate(this.updatedAt)} by ${this.updatedBy}</span>
            ` : ''}
          </div>

          ${this.supersededBy ? html`
            <div class="adr-section">
              <span style="color: #666;">Superseded by: </span>
              <a href="#" class="superseded-link" @click=${(e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('adr-navigate', {
                  detail: { adrId: this.supersededBy },
                  bubbles: true,
                  composed: true
                }));
              }}>${this.supersededBy}</a>
            </div>
          ` : ''}

          <div class="adr-section">
            <div class="adr-section-title">Context</div>
            ${this.editing ? html`
              <textarea
                class="adr-input"
                .value=${this.context}
                @input=${(e) => this._handleInput('context', e)}
                placeholder="What is the issue that we're seeing that is motivating this decision or change?"
              ></textarea>
            ` : html`
              <div class="adr-section-content">${this.context || 'No context provided'}</div>
            `}
          </div>

          <div class="adr-section">
            <div class="adr-section-title">Decision</div>
            ${this.editing ? html`
              <textarea
                class="adr-input"
                .value=${this.decision}
                @input=${(e) => this._handleInput('decision', e)}
                placeholder="What is the decision that was made?"
              ></textarea>
            ` : html`
              <div class="adr-section-content">${this.decision || 'No decision recorded'}</div>
            `}
          </div>

          <div class="adr-section">
            <div class="adr-section-title">Consequences</div>
            ${this.editing ? html`
              <textarea
                class="adr-input"
                .value=${this.consequences}
                @input=${(e) => this._handleInput('consequences', e)}
                placeholder="What becomes easier or more difficult to do because of this change?"
              ></textarea>
            ` : html`
              <div class="adr-section-content">${this.consequences || 'No consequences documented'}</div>
            `}
          </div>

          <div class="adr-actions">
            ${this.editing ? html`
              <button class="adr-btn adr-btn-secondary" @click=${this._cancelEditing}>Cancel</button>
              <button class="adr-btn adr-btn-primary" @click=${this._save}>Save</button>
            ` : html`
              ${this.canEdit ? html`
                <button class="adr-btn adr-btn-danger" @click=${this._delete}>Delete</button>
                <button class="adr-btn adr-btn-primary" @click=${this._startEditing}>Edit</button>
              ` : ''}
            `}
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('adr-card', AdrCard);

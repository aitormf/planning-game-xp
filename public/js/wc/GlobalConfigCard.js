/**
 * Global Config Card Component
 * Displays and allows editing of a global config (agent, prompt, or instruction)
 */
import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { GlobalConfigCardStyles } from './global-config-card-styles.js';
import { CONFIG_CATEGORIES } from '../services/global-config-service.js';
import { format, parseISO, isValid } from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';

export class GlobalConfigCard extends LitElement {
  static get properties() {
    return {
      configId: { type: String, attribute: 'config-id' },
      configType: { type: String, attribute: 'config-type' },
      name: { type: String },
      description: { type: String },
      content: { type: String },
      category: { type: String },
      createdAt: { type: String, attribute: 'created-at' },
      createdBy: { type: String, attribute: 'created-by' },
      updatedAt: { type: String, attribute: 'updated-at' },
      updatedBy: { type: String, attribute: 'updated-by' },
      expanded: { type: Boolean, reflect: true },
      editing: { type: Boolean },
      canEdit: { type: Boolean, attribute: 'can-edit' },
      selected: { type: Boolean, reflect: true }
    };
  }

  static get styles() {
    return [GlobalConfigCardStyles];
  }

  constructor() {
    super();
    this.configId = '';
    this.configType = 'agents';
    this.name = '';
    this.description = '';
    this.content = '';
    this.category = 'development';
    this.createdAt = '';
    this.createdBy = '';
    this.updatedAt = '';
    this.updatedBy = '';
    this.expanded = false;
    this.editing = false;
    this.canEdit = true;
    this.selected = false;

    // Track original values for cancel
    this._originalValues = {};
  }

  /**
   * Get type icon
   */
  _getTypeIcon() {
    switch (this.configType) {
      case 'agents': return '🤖';
      case 'prompts': return '💬';
      case 'instructions': return '📋';
      default: return '📄';
    }
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
    this._originalValues = {
      name: this.name,
      description: this.description,
      content: this.content,
      category: this.category
    };
    this.editing = true;
    this.expanded = true;
  }

  /**
   * Cancel editing
   */
  _cancelEditing() {
    this.name = this._originalValues.name;
    this.description = this._originalValues.description;
    this.content = this._originalValues.content;
    this.category = this._originalValues.category;
    this.editing = false;
  }

  /**
   * Save changes
   */
  async _save() {
    this.dispatchEvent(new CustomEvent('config-save', {
      detail: {
        configId: this.configId,
        configType: this.configType,
        name: this.name,
        description: this.description,
        content: this.content,
        category: this.category
      },
      bubbles: true,
      composed: true
    }));
    this.editing = false;
  }

  /**
   * Delete config
   */
  _delete(e) {
    e?.stopPropagation();
    this.dispatchEvent(new CustomEvent('config-delete', {
      detail: {
        configId: this.configId,
        configType: this.configType,
        name: this.name
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
      <div class="config-card ${this.expanded ? 'expanded' : ''} ${this.selected ? 'selected' : ''}">
        <div class="config-header" @click=${this._toggleExpanded}>
          <div style="flex: 1;">
            ${this.editing ? html`
              <input
                type="text"
                class="config-title-input"
                .value=${this.name}
                @input=${(e) => this._handleInput('name', e)}
                @click=${(e) => e.stopPropagation()}
                placeholder="Config name"
              />
              <input
                type="text"
                class="config-desc-input"
                .value=${this.description}
                @input=${(e) => this._handleInput('description', e)}
                @click=${(e) => e.stopPropagation()}
                placeholder="Description"
              />
            ` : html`
              <h3 class="config-title">${this._getTypeIcon()} ${this.name}</h3>
              <p class="config-description">${this.description || 'No description'}</p>
            `}
          </div>
          <div class="config-badges">
            ${this.editing ? html`
              <select
                class="config-category-select"
                .value=${this.category}
                @change=${(e) => this._handleInput('category', e)}
                @click=${(e) => e.stopPropagation()}
              >
                ${CONFIG_CATEGORIES.map(cat => html`
                  <option value=${cat}>${cat}</option>
                `)}
              </select>
            ` : html`
              <span class="config-category ${this.category}">${this.category}</span>
            `}
          </div>
        </div>

        ${this.expanded ? html`
          <div class="config-content">
            <div class="config-content-label">Content</div>
            ${this.editing ? html`
              <textarea
                class="config-input"
                .value=${this.content}
                @input=${(e) => this._handleInput('content', e)}
                placeholder="Enter content here..."
              ></textarea>
            ` : html`
              <pre class="config-content-text">${this.content || 'No content'}</pre>
            `}
          </div>

          <div class="config-meta">
            Created: ${this._formatDate(this.createdAt)} by ${this.createdBy}
            ${this.updatedAt !== this.createdAt ? html`
              | Updated: ${this._formatDate(this.updatedAt)} by ${this.updatedBy}
            ` : ''}
          </div>

          <div class="config-actions">
            ${this.editing ? html`
              <button class="config-btn config-btn-secondary" @click=${this._cancelEditing}>Cancel</button>
              <button class="config-btn config-btn-primary" @click=${this._save}>Save</button>
            ` : html`
              ${this.canEdit ? html`
                <button class="config-btn config-btn-danger" @click=${this._delete}>Delete</button>
                <button class="config-btn config-btn-primary" @click=${this._startEditing}>Edit</button>
              ` : ''}
            `}
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('global-config-card', GlobalConfigCard);

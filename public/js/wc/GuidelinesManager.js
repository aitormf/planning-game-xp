/**
 * Guidelines Manager Component
 * Admin UI for managing global guidelines (CRUD + version history + restore)
 */
import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { GuidelinesManagerStyles } from './guidelines-manager-styles.js';
import { globalConfigService, CONFIG_CATEGORIES } from '../services/global-config-service.js';
import { demoModeService } from '../services/demo-mode-service.js';
import { format, parseISO, isValid } from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';

export class GuidelinesManager extends LitElement {
  static get properties() {
    return {
      guidelines: { type: Array },
      selectedGuideline: { type: Object },
      loading: { type: Boolean },
      showCreateForm: { type: Boolean },
      showHistory: { type: Boolean },
      history: { type: Array },
      historyLoading: { type: Boolean },
      editing: { type: Boolean },
      categoryFilter: { type: String },
      // Create form fields
      _newName: { type: String, state: true },
      _newDescription: { type: String, state: true },
      _newTargetFile: { type: String, state: true },
      _newCategory: { type: String, state: true },
      _newContent: { type: String, state: true },
      // Edit fields
      _editName: { type: String, state: true },
      _editDescription: { type: String, state: true },
      _editTargetFile: { type: String, state: true },
      _editCategory: { type: String, state: true },
      _editContent: { type: String, state: true }
    };
  }

  static get styles() {
    return [GuidelinesManagerStyles];
  }

  constructor() {
    super();
    this.guidelines = [];
    this.selectedGuideline = null;
    this.loading = false;
    this.showCreateForm = false;
    this.showHistory = false;
    this.history = [];
    this.historyLoading = false;
    this.editing = false;
    this.categoryFilter = '';
    this._resetCreateForm();
    this._resetEditFields();
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadGuidelines();
  }

  _resetCreateForm() {
    this._newName = '';
    this._newDescription = '';
    this._newTargetFile = '';
    this._newCategory = 'development';
    this._newContent = '';
  }

  _resetEditFields() {
    this._editName = '';
    this._editDescription = '';
    this._editTargetFile = '';
    this._editCategory = 'development';
    this._editContent = '';
  }

  _populateEditFields(guideline) {
    this._editName = guideline.name || '';
    this._editDescription = guideline.description || '';
    this._editTargetFile = guideline.targetFile || '';
    this._editCategory = guideline.category || 'development';
    this._editContent = guideline.content || '';
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
   * Format email for display (show name part only)
   */
  _formatAuthor(email) {
    if (!email) return '-';
    return email.split('@')[0];
  }

  get filteredGuidelines() {
    if (!this.categoryFilter) return this.guidelines;
    return this.guidelines.filter(g => g.category === this.categoryFilter);
  }

  async loadGuidelines() {
    this.loading = true;
    try {
      this.guidelines = await globalConfigService.getAllGuidelines();
    } catch (error) {
      console.error('Error loading guidelines:', error);
      this.guidelines = [];
    } finally {
      this.loading = false;
    }
  }

  _selectGuideline(guideline) {
    this.selectedGuideline = guideline;
    this.editing = false;
    this.showHistory = false;
    this.history = [];
    this.showCreateForm = false;
    this._populateEditFields(guideline);
  }

  _startEditing() {
    if (demoModeService.isDemo()) {
      demoModeService.showFeatureDisabled('guideline editing');
      return;
    }
    this._populateEditFields(this.selectedGuideline);
    this.editing = true;
  }

  _cancelEditing() {
    this.editing = false;
    this._populateEditFields(this.selectedGuideline);
  }

  async _saveGuideline() {
    if (demoModeService.isDemo()) {
      demoModeService.showFeatureDisabled('guideline editing');
      return;
    }

    try {
      const currentVersion = this.selectedGuideline.version || '1.0.0';
      const saved = await globalConfigService.saveConfig('guidelines', {
        id: this.selectedGuideline.id,
        name: this._editName,
        description: this._editDescription,
        content: this._editContent,
        category: this._editCategory,
        targetFile: this._editTargetFile,
        version: globalConfigService._incrementVersion(currentVersion)
      });

      this.editing = false;
      this.selectedGuideline = saved;
      await this.loadGuidelines();

      this._dispatchNotification(`Guideline "${saved.name}" saved`, 'success');
    } catch (error) {
      console.error('Error saving guideline:', error);
      this._dispatchNotification('Error saving guideline', 'error');
    }
  }

  async _deleteGuideline() {
    if (demoModeService.isDemo()) {
      demoModeService.showFeatureDisabled('guideline deletion');
      return;
    }

    const name = this.selectedGuideline.name;

    // Use app-modal for confirmation
    const confirmed = await this._confirmAction(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    try {
      await globalConfigService.deleteConfig('guidelines', this.selectedGuideline.id);
      this.selectedGuideline = null;
      this.editing = false;
      await this.loadGuidelines();
      this._dispatchNotification(`Guideline "${name}" deleted`, 'info');
    } catch (error) {
      console.error('Error deleting guideline:', error);
      this._dispatchNotification('Error deleting guideline', 'error');
    }
  }

  /**
   * Confirm action using app-modal if available, fallback to window.confirm
   */
  async _confirmAction(message) {
    const modal = document.querySelector('app-modal');
    if (modal && typeof modal.confirm === 'function') {
      return modal.confirm({ message });
    }
    return window.confirm(message);
  }

  _toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.selectedGuideline = null;
      this.editing = false;
      this._resetCreateForm();
    }
  }

  async _createGuideline() {
    if (demoModeService.isDemo()) {
      demoModeService.showFeatureDisabled('guideline creation');
      return;
    }

    if (!this._newName.trim()) {
      this._dispatchNotification('Name is required', 'warning');
      return;
    }

    try {
      const created = await globalConfigService.saveConfig('guidelines', {
        name: this._newName,
        description: this._newDescription,
        content: this._newContent,
        category: this._newCategory,
        targetFile: this._newTargetFile,
        version: '1.0.0'
      });

      this.showCreateForm = false;
      this._resetCreateForm();
      await this.loadGuidelines();
      this._selectGuideline(created);
      this._dispatchNotification(`Guideline "${created.name}" created`, 'success');
    } catch (error) {
      console.error('Error creating guideline:', error);
      this._dispatchNotification('Error creating guideline', 'error');
    }
  }

  async _toggleHistory() {
    this.showHistory = !this.showHistory;
    if (this.showHistory && this.history.length === 0) {
      await this._loadHistory();
    }
  }

  async _loadHistory() {
    if (!this.selectedGuideline) return;
    this.historyLoading = true;
    try {
      this.history = await globalConfigService.getConfigHistory('guidelines', this.selectedGuideline.id);
    } catch (error) {
      console.error('Error loading history:', error);
      this.history = [];
    } finally {
      this.historyLoading = false;
    }
  }

  async _restoreVersion(historyId) {
    if (demoModeService.isDemo()) {
      demoModeService.showFeatureDisabled('version restore');
      return;
    }

    const confirmed = await this._confirmAction('Restore this version? A new version will be created.');
    if (!confirmed) return;

    try {
      const restored = await globalConfigService.restoreConfigVersion(
        'guidelines',
        this.selectedGuideline.id,
        historyId
      );

      this.selectedGuideline = restored;
      this._populateEditFields(restored);
      await this.loadGuidelines();
      await this._loadHistory();
      this._dispatchNotification('Version restored successfully', 'success');
    } catch (error) {
      console.error('Error restoring version:', error);
      this._dispatchNotification('Error restoring version', 'error');
    }
  }

  _dispatchNotification(message, type) {
    document.dispatchEvent(new CustomEvent('show-slide-notification', {
      detail: { options: { message, type } }
    }));
  }

  _handleCategoryFilter(e) {
    this.categoryFilter = e.target.value;
  }

  render() {
    return html`
      <div class="guidelines-container">
        ${this._renderHeader()}
        ${this.loading ? html`<div class="loading">Loading guidelines...</div>` : nothing}
        ${!this.loading && this.guidelines.length === 0 && !this.showCreateForm
          ? this._renderEmptyState()
          : nothing}
        ${!this.loading && this.filteredGuidelines.length > 0
          ? this._renderTable()
          : nothing}
        ${this.showCreateForm ? this._renderCreateForm() : nothing}
        ${this.selectedGuideline ? this._renderEditor() : nothing}
      </div>
    `;
  }

  _renderHeader() {
    return html`
      <div class="header">
        <h2>Guidelines</h2>
        <div class="header-actions">
          <select class="filter-select" @change=${this._handleCategoryFilter}>
            <option value="">All categories</option>
            ${CONFIG_CATEGORIES.map(cat => html`
              <option value=${cat} ?selected=${this.categoryFilter === cat}>${cat}</option>
            `)}
          </select>
          <button class="btn-primary" @click=${this._toggleCreateForm}>
            ${this.showCreateForm ? 'Cancel' : '+ New Guideline'}
          </button>
        </div>
      </div>
    `;
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <p>No guidelines configured yet.</p>
        <button class="btn-primary" @click=${this._toggleCreateForm}>
          Create your first guideline
        </button>
      </div>
    `;
  }

  _renderTable() {
    return html`
      <table class="guidelines-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Target File</th>
            <th>Category</th>
            <th>Version</th>
            <th>Updated</th>
            <th>Author</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredGuidelines.map(g => html`
            <tr
              class=${this.selectedGuideline?.id === g.id ? 'active' : ''}
              @click=${() => this._selectGuideline(g)}
            >
              <td>${g.name}</td>
              <td><code>${g.targetFile || '-'}</code></td>
              <td><span class="badge badge-category">${g.category}</span></td>
              <td><span class="badge badge-version">${g.version || '1.0.0'}</span></td>
              <td>${this._formatDate(g.updatedAt)}</td>
              <td>${this._formatAuthor(g.updatedBy || g.createdBy)}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  _renderEditor() {
    const g = this.selectedGuideline;
    return html`
      <div class="editor-panel">
        <div class="editor-header">
          <h3>${this.editing ? 'Editing: ' : ''}${g.name}</h3>
          <div class="editor-actions">
            ${this.editing ? html`
              <button class="btn-secondary btn-sm" @click=${this._cancelEditing}>Cancel</button>
              <button class="btn-primary btn-sm" @click=${this._saveGuideline}>Save</button>
            ` : html`
              <button class="btn-danger btn-sm" @click=${this._deleteGuideline}>Delete</button>
              <button class="btn-primary btn-sm" @click=${this._startEditing}>Edit</button>
            `}
          </div>
        </div>
        <div class="editor-body">
          ${this.editing ? this._renderEditForm() : this._renderReadOnly()}
        </div>
        <div class="editor-meta">
          Created: ${this._formatDate(g.createdAt)} by ${g.createdBy || '-'}
          ${g.updatedAt !== g.createdAt ? html`
            | Updated: ${this._formatDate(g.updatedAt)} by ${g.updatedBy || '-'}
          ` : nothing}
          | Version: ${g.version || '1.0.0'}
        </div>
      </div>

      ${this._renderHistoryPanel()}
    `;
  }

  _renderReadOnly() {
    const g = this.selectedGuideline;
    return html`
      <div class="form-row-3">
        <div class="form-group">
          <label>Target File</label>
          <div>${g.targetFile || '-'}</div>
        </div>
        <div class="form-group">
          <label>Category</label>
          <div><span class="badge badge-category">${g.category}</span></div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <div>${g.description || '-'}</div>
        </div>
      </div>
      <div class="form-group">
        <label>Content</label>
        <pre class="form-textarea" style="border: none; background: var(--bg-secondary, #f8f9fa); cursor: default;">${g.content || 'No content'}</pre>
      </div>
    `;
  }

  _renderEditForm() {
    return html`
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input class="form-input" type="text" .value=${this._editName}
            @input=${(e) => { this._editName = e.target.value; }} />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input class="form-input" type="text" .value=${this._editDescription}
            @input=${(e) => { this._editDescription = e.target.value; }} />
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Target File</label>
          <input class="form-input" type="text" .value=${this._editTargetFile}
            @input=${(e) => { this._editTargetFile = e.target.value; }}
            placeholder="e.g. CLAUDE.md, .cursor/rules" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select class="form-select" .value=${this._editCategory}
            @change=${(e) => { this._editCategory = e.target.value; }}>
            ${CONFIG_CATEGORIES.map(cat => html`
              <option value=${cat} ?selected=${this._editCategory === cat}>${cat}</option>
            `)}
          </select>
        </div>
        <div class="form-group">
          <label>Version</label>
          <input class="form-input" type="text" .value=${this.selectedGuideline?.version || '1.0.0'} disabled
            title="Version auto-increments on save" />
        </div>
      </div>
      <div class="form-group">
        <label>Content (Markdown)</label>
        <textarea class="form-textarea" .value=${this._editContent}
          @input=${(e) => { this._editContent = e.target.value; }}
          placeholder="Write guideline content in markdown..."></textarea>
      </div>
    `;
  }

  _renderCreateForm() {
    return html`
      <div class="create-form">
        <h3>New Guideline</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input class="form-input" type="text" .value=${this._newName}
              @input=${(e) => { this._newName = e.target.value; }}
              placeholder="Guideline name" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input class="form-input" type="text" .value=${this._newDescription}
              @input=${(e) => { this._newDescription = e.target.value; }}
              placeholder="Brief description" />
          </div>
        </div>
        <div class="form-row-3">
          <div class="form-group">
            <label>Target File</label>
            <input class="form-input" type="text" .value=${this._newTargetFile}
              @input=${(e) => { this._newTargetFile = e.target.value; }}
              placeholder="e.g. CLAUDE.md, .cursor/rules" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select class="form-select" .value=${this._newCategory}
              @change=${(e) => { this._newCategory = e.target.value; }}>
              ${CONFIG_CATEGORIES.map(cat => html`
                <option value=${cat}>${cat}</option>
              `)}
            </select>
          </div>
          <div class="form-group">
            <label>Version</label>
            <input class="form-input" type="text" value="1.0.0" disabled />
          </div>
        </div>
        <div class="form-group">
          <label>Content (Markdown)</label>
          <textarea class="form-textarea" .value=${this._newContent}
            @input=${(e) => { this._newContent = e.target.value; }}
            placeholder="Write guideline content in markdown..."></textarea>
        </div>
        <div class="create-form-actions">
          <button class="btn-secondary" @click=${this._toggleCreateForm}>Cancel</button>
          <button class="btn-primary" @click=${this._createGuideline}>Create Guideline</button>
        </div>
      </div>
    `;
  }

  _renderHistoryPanel() {
    if (!this.selectedGuideline) return nothing;

    return html`
      <div class="history-panel">
        <div class="history-header" @click=${this._toggleHistory}>
          <h4>Version History</h4>
          <span class="history-toggle">${this.showHistory ? 'Hide' : 'Show'}</span>
        </div>
        ${this.showHistory ? html`
          <div class="history-list">
            ${this.historyLoading ? html`
              <div class="loading">Loading history...</div>
            ` : this.history.length === 0 ? html`
              <div class="history-entry">
                <span class="history-meta">No history entries</span>
              </div>
            ` : this.history.map(entry => html`
              <div class="history-entry">
                <div class="history-info">
                  <span class="history-action">${entry.action}</span>
                  <span class="history-meta">
                    ${this._formatDate(entry.timestamp)} by ${this._formatAuthor(entry.changedBy)}
                  </span>
                  ${entry.version ? html`
                    <span class="history-version">v${entry.version}</span>
                  ` : nothing}
                </div>
                ${entry.action !== 'delete' ? html`
                  <button class="btn-secondary btn-sm" @click=${() => this._restoreVersion(entry.id)}>
                    Restore
                  </button>
                ` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }
}

customElements.define('guidelines-manager', GuidelinesManager);

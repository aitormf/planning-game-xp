/**
 * UserAdminPanel
 *
 * Admin UI component for managing application users.
 * Calls Firebase Cloud Functions (listUsers, createOrUpdateUser, removeUserFromProject)
 * to manage users stored at /users/{encodedEmail} in Realtime Database.
 * Only visible to users with isAppAdmin custom claim.
 */
import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { UserAdminPanelStyles } from './user-admin-panel-styles.js';
import { functions, database, ref, get, httpsCallable } from '/firebase-config.js';

class UserAdminPanel extends LitElement {
  static get properties() {
    return {
      users: { type: Array, state: true },
      projects: { type: Array, state: true },
      loading: { type: Boolean, state: true },
      _showForm: { type: Boolean, state: true },
      _editingEmail: { type: String, state: true },
      _formName: { type: String, state: true },
      _formEmail: { type: String, state: true },
      _formProjectId: { type: String, state: true },
      _formDeveloper: { type: Boolean, state: true },
      _formStakeholder: { type: Boolean, state: true },
      _searchQuery: { type: String, state: true },
    };
  }

  static get styles() {
    return [UserAdminPanelStyles];
  }

  constructor() {
    super();
    this.users = [];
    this.projects = [];
    this.loading = false;
    this._showForm = false;
    this._editingEmail = null;
    this._searchQuery = '';
    this._resetForm();
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
  }

  // ==================== DATA LOADING ====================

  async _loadData() {
    this.loading = true;
    try {
      await Promise.all([
        this._loadUsers(),
        this._loadProjects(),
      ]);
    } catch (error) {
      console.error('Error loading user admin data:', error);
      this._notify('Error loading data', 'error');
    } finally {
      this.loading = false;
    }
  }

  async _loadUsers() {
    const listUsersFn = httpsCallable(functions, 'listUsers');
    const result = await listUsersFn();
    this.users = result.data?.users || [];
  }

  async _loadProjects() {
    const projectsRef = ref(database, '/projects');
    const snapshot = await get(projectsRef);
    if (snapshot.exists()) {
      const projectsData = snapshot.val();
      this.projects = Object.keys(projectsData).sort();
    } else {
      this.projects = [];
    }
  }

  // ==================== FORM MANAGEMENT ====================

  _resetForm() {
    this._formName = '';
    this._formEmail = '';
    this._formProjectId = '';
    this._formDeveloper = true;
    this._formStakeholder = false;
    this._editingEmail = null;
  }

  _openNewForm() {
    this._resetForm();
    this._showForm = true;
  }

  _openEditForm(user) {
    this._editingEmail = user.email;
    this._formName = user.name || '';
    this._formEmail = user.email || '';
    this._formProjectId = '';
    this._formDeveloper = true;
    this._formStakeholder = false;
    this._showForm = true;
  }

  _cancelForm() {
    this._showForm = false;
    this._resetForm();
  }

  // ==================== CRUD OPERATIONS ====================

  async _saveUser() {
    const name = this._formName.trim();
    const email = this._formEmail.trim();
    const projectId = this._formProjectId;

    if (!name || !email) return;
    if (!projectId) {
      this._notify('Please select a project', 'warning');
      return;
    }

    try {
      const createOrUpdateUserFn = httpsCallable(functions, 'createOrUpdateUser');
      await createOrUpdateUserFn({
        email,
        name,
        projectId,
        developer: this._formDeveloper,
        stakeholder: this._formStakeholder,
      });

      this._showForm = false;
      this._resetForm();
      await this._loadUsers();
      this._notify(
        this._editingEmail ? 'User updated successfully' : 'User created successfully',
        'success'
      );
    } catch (error) {
      console.error('Error saving user:', error);
      this._notify(`Error saving user: ${error.message}`, 'error');
    }
  }

  async _removeProject(user, projectId) {
    const confirmed = await window.modalService.confirm(
      'Remove project assignment',
      `Remove "${projectId}" from user "${user.name}" (${user.email})?`
    );
    if (!confirmed) return;

    try {
      const removeUserFromProjectFn = httpsCallable(functions, 'removeUserFromProject');
      await removeUserFromProjectFn({
        email: user.email,
        projectId,
      });

      await this._loadUsers();
      this._notify(`Project "${projectId}" removed from user`, 'success');
    } catch (error) {
      console.error('Error removing project from user:', error);
      this._notify(`Error removing project: ${error.message}`, 'error');
    }
  }

  // ==================== HELPERS ====================

  _notify(message, type = 'info') {
    this.dispatchEvent(new CustomEvent('show-slide-notification', {
      bubbles: true,
      composed: true,
      detail: { options: { message, type } },
    }));
  }

  get _filteredUsers() {
    if (!this._searchQuery.trim()) return this.users;

    const query = this._searchQuery.toLowerCase().trim();
    return this.users.filter((user) => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }

  _getAuthStatusBadgeClass(status) {
    switch (status) {
      case 'active': return 'badge-active';
      case 'not_registered': return 'badge-not-registered';
      case 'disabled': return 'badge-disabled';
      default: return 'badge-inactive';
    }
  }

  _getAuthStatusLabel(status) {
    switch (status) {
      case 'active': return 'Active';
      case 'not_registered': return 'Not Registered';
      case 'disabled': return 'Disabled';
      default: return status || 'Unknown';
    }
  }

  // ==================== RENDER ====================

  render() {
    if (this.loading) {
      return html`<div class="loading-message">Loading users</div>`;
    }

    const filteredUsers = this._filteredUsers;

    return html`
      <div class="user-admin-container">
        ${this._renderHeader(filteredUsers)}
        ${this._showForm ? this._renderForm() : nothing}
        ${this._renderTable(filteredUsers)}
      </div>
    `;
  }

  _renderHeader(filteredUsers) {
    return html`
      <div class="user-admin-header">
        <div class="header-left">
          <span class="user-count">
            ${filteredUsers.length === this.users.length
              ? `${this.users.length} users`
              : `${filteredUsers.length} of ${this.users.length} users`}
          </span>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <input
              type="text"
              placeholder="Search by name or email..."
              .value=${this._searchQuery}
              @input=${(e) => { this._searchQuery = e.target.value; }}
            />
          </div>
          <button class="btn btn-primary btn-sm" @click=${this._openNewForm}>+ Add User</button>
        </div>
      </div>
    `;
  }

  _renderForm() {
    const isEditing = Boolean(this._editingEmail);
    return html`
      <div class="entity-form">
        <h4 class="form-title">${isEditing ? `Add project to: ${this._editingEmail}` : 'New User'}</h4>
        <div class="form-grid">
          <div class="form-group">
            <label for="userName">Name *</label>
            <input
              type="text"
              id="userName"
              .value=${this._formName}
              @input=${(e) => { this._formName = e.target.value; }}
              placeholder="Full name"
              ?disabled=${isEditing}
              required
            />
          </div>
          <div class="form-group">
            <label for="userEmail">Email *</label>
            <input
              type="email"
              id="userEmail"
              .value=${this._formEmail}
              @input=${(e) => { this._formEmail = e.target.value; }}
              placeholder="email@example.com"
              ?disabled=${isEditing}
              required
            />
          </div>
          <div class="form-group">
            <label for="userProject">Project *</label>
            <select
              id="userProject"
              .value=${this._formProjectId}
              @change=${(e) => { this._formProjectId = e.target.value; }}
            >
              <option value="">-- Select project --</option>
              ${this.projects.map((p) => html`
                <option value=${p} ?selected=${this._formProjectId === p}>${p}</option>
              `)}
            </select>
          </div>
          <div class="form-row-checkboxes">
            <div class="form-checkbox">
              <input
                type="checkbox"
                id="userDeveloper"
                .checked=${this._formDeveloper}
                @change=${(e) => { this._formDeveloper = e.target.checked; }}
              />
              <label for="userDeveloper">Developer</label>
            </div>
            <div class="form-checkbox">
              <input
                type="checkbox"
                id="userStakeholder"
                .checked=${this._formStakeholder}
                @change=${(e) => { this._formStakeholder = e.target.checked; }}
              />
              <label for="userStakeholder">Stakeholder</label>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click=${this._cancelForm}>Cancel</button>
          <button
            class="btn btn-primary"
            @click=${this._saveUser}
            ?disabled=${!this._formName.trim() || !this._formEmail.trim() || !this._formProjectId}
          >
            ${isEditing ? 'Add Project' : 'Create User'}
          </button>
        </div>
      </div>
    `;
  }

  _renderTable(filteredUsers) {
    if (filteredUsers.length === 0) {
      return html`<div class="empty-message">
        ${this._searchQuery.trim() ? 'No users match the search' : 'No users found'}
      </div>`;
    }

    return html`
      <div class="table-container">
        <table class="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th class="col-id">Dev ID</th>
              <th class="col-id">Stk ID</th>
              <th class="col-projects">Projects</th>
              <th>Auth Status</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map((user) => this._renderUserRow(user))}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderUserRow(user) {
    const projectIds = user.projects ? Object.keys(user.projects) : [];
    const authStatus = user.authStatus || 'not_registered';

    return html`
      <tr>
        <td>${user.name || ''}</td>
        <td>${user.email || ''}</td>
        <td class="col-id">${user.developerId || '\u2014'}</td>
        <td class="col-id">${user.stakeholderId || '\u2014'}</td>
        <td class="col-projects">
          ${projectIds.length > 0
            ? html`
              <div class="project-badges">
                ${projectIds.map((pid) => html`
                  <span class="project-badge">
                    ${pid}
                    <button
                      class="remove-project"
                      title="Remove ${pid}"
                      @click=${() => this._removeProject(user, pid)}
                    >&times;</button>
                  </span>
                `)}
              </div>
            `
            : html`<span class="no-projects">No projects</span>`}
        </td>
        <td>
          <span class="badge ${this._getAuthStatusBadgeClass(authStatus)}">
            ${this._getAuthStatusLabel(authStatus)}
          </span>
        </td>
        <td class="col-actions">
          <div class="actions-cell">
            <button
              class="btn btn-secondary btn-sm"
              @click=${() => this._openEditForm(user)}
              title="Add project assignment"
            >+</button>
          </div>
        </td>
      </tr>
    `;
  }
}

customElements.define('user-admin-panel', UserAdminPanel);

import { LitElement, html } from 'https://unpkg.com/lit@2.8.0/index.js?module';
import './NotificationBell.js';
import { projectSelectorStyles } from './project-selector-styles.js';

export class ProjectSelector extends LitElement {
  static properties = {
    projects: { type: Object },
    selectedProject: { type: String },
    isOpen: { type: Boolean }
  };

  static styles = projectSelectorStyles;

  constructor() {
    super();
    this.projects = {};
    // Inicializar con el projectId de la URL si existe (establecido en adminproject.astro)
    this.selectedProject = window.currentProjectId || '';
    this.isOpen = false;
  }

  /**
   * Get active (non-archived) projects for the selector, sorted by order
   * @returns {Array} Array of [id, project] pairs
   */
  get activeProjects() {
    return Object.entries(this.projects)
      .filter(([_, project]) => !project.archived)
      .sort((a, b) => {
        const aOrder = a[1]?.order ?? 999999;
        const bOrder = b[1]?.order ?? 999999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        // Fallback to alphabetical by name
        const aName = a[1]?.name || a[0];
        const bName = b[1]?.name || b[0];
        return aName.localeCompare(bName);
      });
  }

  render() {
    const selectedName = this.projects[this.selectedProject]?.name || this.selectedProject;
    return html`
      <div class="selector-container">
        <div class="selector"
             role="combobox"
             tabindex="0"
             aria-expanded="${this.isOpen}"
             aria-haspopup="listbox"
             aria-label="Select project"
             @click=${this.toggleOptions}
             @keydown=${this._handleSelectorKeydown}>
          <span class="selected-value">
            ${selectedName ? selectedName : 'Selecciona proyecto'}
          </span>
          <span class="arrow ${this.isOpen ? 'open' : ''}" aria-hidden="true">▼</span>
        </div>
      </div>
      ${this.isOpen ? html`
        <div class="options" role="listbox">
          ${this.activeProjects.map(([id, project]) => html`
            <div class="option ${id === this.selectedProject ? 'selected' : ''}"
                 role="option"
                 tabindex="-1"
                 aria-selected="${id === this.selectedProject}"
                 @click=${() => this.selectProject(id)}
                 @keydown=${(e) => this._handleOptionKeydown(e, id)}>
              ${project.name || id}
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }

  toggleOptions() {
    const wasOpen = this.isOpen;
    this.isOpen = !this.isOpen;
    if (!wasOpen) {
      this._focusFirstOption();
    } else {
      this._focusTrigger();
    }
  }

  _focusFirstOption() {
    this.updateComplete.then(() => {
      const firstOption = this.shadowRoot.querySelector('.option');
      if (firstOption) {
        firstOption.focus();
      }
    });
  }

  _focusTrigger() {
    this.updateComplete.then(() => {
      const trigger = this.shadowRoot.querySelector('.selector');
      if (trigger) {
        trigger.focus();
      }
    });
  }

  _handleSelectorKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggleOptions();
    } else if (e.key === 'Escape' && this.isOpen) {
      e.preventDefault();
      this.isOpen = false;
      this._focusTrigger();
    }
  }

  _handleOptionKeydown(e, id) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectProject(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.isOpen = false;
      this._focusTrigger();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = e.target.nextElementSibling;
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = e.target.previousElementSibling;
      if (prev) prev.focus();
    }
  }

  selectProject(projectId) {
    this.selectedProject = projectId;
    this.isOpen = false;
    this._focusTrigger();
    this.dispatchEvent(new CustomEvent('project-changed', {
      detail: { projectId },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('project-selector', ProjectSelector); 
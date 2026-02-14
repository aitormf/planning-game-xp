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
        <div class="selector" @click=${this.toggleOptions}>
          <h2 class="selected-value">
            ${selectedName ? selectedName : 'Selecciona proyecto'}
          </h2>
          <span class="arrow ${this.isOpen ? 'open' : ''}">▼</span>
        </div>
      </div>
      ${this.isOpen ? html`
        <div class="options">
          ${this.activeProjects.map(([id, project]) => html`
            <div class="option ${id === this.selectedProject ? 'selected' : ''}"
                 @click=${() => this.selectProject(id)}>
              ${project.name || id}
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }

  toggleOptions() {
    this.isOpen = !this.isOpen;
  }

  selectProject(projectId) {
    this.selectedProject = projectId;
    this.isOpen = false;
    this.dispatchEvent(new CustomEvent('project-changed', {
      detail: { projectId },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('project-selector', ProjectSelector); 
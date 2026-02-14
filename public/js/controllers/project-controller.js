export class ProjectController {
  constructor(firebaseService) {
    this.firebaseService = firebaseService;
  }

  init() {
    // Listen for project changes if you have a project selector
    document.addEventListener('project-changed', (e) => {
      this.handleProjectChange(e.detail.projectId);
    });
  }

  async handleProjectChange(newProjectId) {
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('projectId', newProjectId);
    window.history.pushState({}, '', url);

    // Instead of full page reload, emit event for partial update
    document.dispatchEvent(new CustomEvent('project-change-reload', {
      detail: { newProjectId },
      bubbles: true,
      composed: true
    }));
  }

  
}
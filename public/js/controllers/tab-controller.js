import { URLUtils } from '../utils/url-utils.js';
export class TabController {
  constructor() {
    this.currentTab = null;
    this.tabClickHandler = this.handleTabClick.bind(this);
    this.setupTabListeners();
  }

  setupTabListeners() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleTabChange();
    });

    // Setup tab buttons on every page load (View Transitions compatible)
    document.addEventListener('astro:page-load', () => {
      this.setupTabButtons();
    });
    this.setupTabButtons();
  }

  setupTabButtons() {
    const tabButtons = document.querySelectorAll('.tablinks');

    if (tabButtons.length > 0) {
tabButtons.forEach(button => {
// Remove any existing listeners to avoid duplicates
        button.removeEventListener('click', this.tabClickHandler);

        // Add new listener
        button.addEventListener('click', this.tabClickHandler);
      });
    } else {
// If buttons not found, try again later
      setTimeout(() => this.setupTabButtons(), 500);
    }
  }

  handleTabClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const section = button.getAttribute('data-section');
if (section) {
      // Actualizar inmediatamente las clases de los botones
      this.updateTabButtonStates(section);

      // Cambiar el contenido del tab
      this.switchToTab(section);

      // Update URL hash
      window.history.pushState(null, null, `#${section}`);
    }
  }

  openInitialTab() {
    // First, let's see what sections exist
    this.logAvailableSections();

    const section = URLUtils.getSectionFromUrl();
    const targetSection = section || 'tasks';
// Intentar actualizar los botones con un pequeño delay para asegurar que el DOM esté listo
    this.ensureTabButtonUpdate(targetSection, 0);

    // Cambiar el contenido del tab
    this.switchToTab(targetSection);
  }

  ensureTabButtonUpdate(sectionName, attempt = 0) {
    const maxAttempts = 10;
    const delay = 100;

    if (attempt >= maxAttempts) {
return;
    }

    const tabButtons = document.querySelectorAll('.tablinks');
    const targetButton = document.querySelector(`[data-section="${sectionName}"]`);

    if (tabButtons.length > 0 && targetButton) {
      this.updateTabButtonStates(sectionName);
} else {
      setTimeout(() => {
        this.ensureTabButtonUpdate(sectionName, attempt + 1);
      }, delay);
    }
  }

  logAvailableSections() {
    // Log all elements that could be sections
    const possibleSections = document.querySelectorAll('[id]');
possibleSections.forEach(el => {
      if (el.id.includes('section') || el.id.includes('Section') || el.classList.contains('section')) {
}
    });

    // Also check for .section class
    const sectionElements = document.querySelectorAll('.section');
sectionElements.forEach(el => {
});

    // Check for tab buttons
    const tabButtons = document.querySelectorAll('.tablinks');
tabButtons.forEach(button => {
});
  }

  handleTabChange() {
    const section = URLUtils.getSectionFromUrl();
    if (section) {
      this.switchToTab(section);
    }
  }

  switchToTab(sectionName) {
    if (this.currentTab === sectionName) return;
// Try different possible section selectors based on your actual HTML structure
    const possibleSelectors = [
      `#${sectionName}TabContent`,      // taskTabContent, bugsTabContent, etc.
      `#${sectionName}Content`,         // tasksContent, bugsContent, etc.
      `#${sectionName}`,                // tasks, bugs, etc.
      `#${sectionName}Section`,         // tasksSection, bugsSection, etc.
      `#${sectionName}-section`,        // tasks-section, bugs-section, etc.
      `[data-section="${sectionName}"]`, // [data-section="tasks"]
      `.${sectionName}-section`,        // .tasks-section
      `.section.${sectionName}`,        // .section.tasks
      `[id*="${sectionName}"]`          // anything containing the section name
    ];

    let targetSection = null;

    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      // Look for the section element, not the button
      for (const el of elements) {
        if (!el.classList.contains('tablinks') && !el.classList.contains('tabs')) {
          targetSection = el;
          break;
        }
      }
      if (targetSection) break;
    }

    if (!targetSection) {
      this.logAvailableSections();
      return;
    }
// Hide all possible tab content containers (but be more specific to avoid hiding internal elements)
    const mainContainersToHide = [
      'div[id$="TabContent"]',    // *TabContent (main containers only)
      'div[id$="Content"]',       // *Content (main containers only)
    ];

    mainContainersToHide.forEach(selector => {
      document.querySelectorAll(selector).forEach(container => {
        if (!container.classList.contains('tablinks') && !container.classList.contains('tabs')) {
          container.style.display = 'none';
        }
      });
    });

    // Show target section
    targetSection.style.display = 'block';

    this.currentTab = sectionName;
// Update tab button states
    this.updateTabButtonStates(sectionName);

    // Dispatch tab change event
    document.dispatchEvent(new CustomEvent('tab-changed', {
      detail: { section: sectionName }
    }));
}

  updateTabButtonStates(sectionName) {
    // Remove active class from all tab buttons
    document.querySelectorAll('.tablinks').forEach(button => {
      button.classList.remove('active');
    });

    // Add active class to the current tab button
    const activeButton = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeButton?.classList.contains('tablinks')) {
      activeButton.classList.add('active');
    }
  }

  getCurrentTab() {
    return this.currentTab;
  }
}

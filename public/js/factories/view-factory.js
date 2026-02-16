import { KanbanRenderer } from '../renderers/kanban-renderer.js';
import { SprintRenderer } from '../renderers/sprint-renderer.js';
import { GanttRenderer } from '../renderers/gantt-renderer.js';
import { ListRenderer } from '../renderers/list-renderer.js';
import { KanbanViewManager } from '../views/kanban-view-manager.js';
import { SprintViewManager } from '../views/sprint-view-manager.js';
import { EpicViewManager } from '../views/epic-view-manager.js';
import { TableViewManager } from '../views/table-view-manager.js';
import { TableRenderer } from '../renderers/table-renderer.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
import { AppEventBus, AppEvents } from '../services/app-event-bus.js';

export class ViewFactory {
  constructor(cardService, firebaseService, cardRenderer) {
    this.cardService = cardService;
    this.firebaseService = firebaseService;
    this.cardRenderer = cardRenderer;

    // Initialize renderers
    this.kanbanRenderer = new KanbanRenderer();
    this.sprintRenderer = new SprintRenderer();
    this.ganttRenderer = new GanttRenderer();
    this.listRenderer = new ListRenderer();
    this.tableRenderer = new TableRenderer();

    // View managers (initialized on demand)
    this.viewManagers = {};
    this.tableViewManager = new TableViewManager(firebaseService);
    this.currentView = null;

    // Estado global de filtros de tareas
    this.taskFilters = {};
    this._tableCardsCache = null;
    this._listCardsCache = null;
    this._activeTaskView = 'table';

    // Estado global de filtros de bugs
    this.bugFilters = {};
    this._bugsTableCardsCache = null;
    this._bugsListCardsCache = null;
    this._activeBugView = 'table';

    // Semaphore flags to prevent concurrent filter creation
    this._creatingTaskFilters = false;
    this._creatingBugFilters = false;

    // Escuchar cambios de año para refrescar las vistas activas
    this._handleYearChanged = this._handleYearChanged.bind(this);
    document.addEventListener('year-changed', this._handleYearChanged);

    // Listener global de filtros
    document.addEventListener('list-filters-changed', (e) => {
      this.taskFilters = e.detail.filters;
      if (this._activeTaskView === 'list' && this._listCardsCache) {
        this.listRenderer.filters = this.taskFilters;
        this.listRenderer.renderListView(document.getElementById('tasksCardsList'), this._listCardsCache, this._lastConfig);
      } else if (this._activeTaskView === 'table') {
        this.tableViewManager.setFilters(this.taskFilters);
      }
    });

    // Listener para filtros del componente TaskFilters
    document.addEventListener('filters-changed', (e) => {
      if (e.target.tagName.toLowerCase() === 'task-filters') {
        // Always update taskFilters to preserve them when switching views
        this.taskFilters = e.detail.allFilters;

        const isTableView = e.target.getAttribute('data-view') === 'table';
        if (isTableView && this._activeTaskView === 'table') {
          // Para Table View, usar la conversión de filtros
          const tableFilters = this._convertFiltersForTable(e.detail.allFilters);
          this.tableViewManager.setFilters(tableFilters);
        } else if (!isTableView && this._activeTaskView === 'list' && this._listCardsCache) {
          // Para List View, usar los filtros directamente
          this.listRenderer.filters = e.detail.allFilters;
          this.listRenderer.renderListView(document.getElementById('tasksCardsList'), this._listCardsCache, this._lastConfig);
        }
      } else if (e.target.tagName.toLowerCase() === 'bug-filters') {
        // Always update bugFilters to preserve them when switching views
        this.bugFilters = e.detail.allFilters;

        const isTableView = e.target.getAttribute('data-view') === 'table';
        if (isTableView && this._activeBugView === 'table') {
          const tableFilters = this._convertFiltersForBugsTable(e.detail.allFilters);
          this.tableViewManager.setFilters(tableFilters);
        }
        // For Card View of bugs, BugFilters.applyFilters() already handles DOM filtering
        // No need to re-render all cards here
      }
    });

    document.addEventListener('filters-cleared', (e) => {
      if (e.target.tagName.toLowerCase() === 'task-filters') {
        // Always clear taskFilters to preserve state when switching views
        this.taskFilters = {};

        const isTableView = e.target.getAttribute('data-view') === 'table';

        if (isTableView && this._activeTaskView === 'table') {
          // Limpiar filtros de Table View
          this.tableViewManager.clearFilters();
        } else if (!isTableView && this._activeTaskView === 'list' && this._listCardsCache) {
          // Limpiar filtros de List View
          this.listRenderer.filters = {};
          this.listRenderer.renderListView(document.getElementById('tasksCardsList'), this._listCardsCache, this._lastConfig);
        }
      } else if (e.target.tagName.toLowerCase() === 'bug-filters') {
        // Always clear bugFilters
        this.bugFilters = {};

        const isTableView = e.target.getAttribute('data-view') === 'table';
        if (isTableView && this._activeBugView === 'table') {
          this.tableViewManager.clearFilters();
        }
        // For Card View of bugs, BugFilters.clearAllFilters() already handles showing all cards
        // No need to re-render here
      }
    });
  }

  async switchView(viewType, section, config) {
    // OPTIMIZACIÓN: Actualizar botones INMEDIATAMENTE, antes de cargar datos
    this.updateViewButtons(section, viewType);

    // Clean up current view
    if (this.currentView) {
      this.currentView.cleanup();
    }

    // Hide all view containers for this section
    this.hideAllViews(section);

    // Switch to the requested view
    switch (section) {
      case 'tasks':
        await this.switchTaskView(viewType, config);
        break;
      case 'bugs':
        await this.switchBugsView(viewType, config);
        break;
      case 'epics':
        await this.switchEpicView(viewType, config);
        break;
      case 'proposals':
        await this.switchProposalsView(viewType, config);
        break;
      default:
}
  }

  async switchTaskView(viewType, config) {
    this._activeTaskView = viewType;
    this._lastConfig = config;
    switch (viewType) {
      case 'list':
        await this.showListView('tasks', config);
        break;
      case 'kanban':
        this.showKanbanView('tasks', config);
        break;
      case 'sprint':
        this.showSprintView(config);
        break;
      case 'table':
        await this.showTableView(config);
        break;
      default:
}
  }

  async switchBugsView(viewType, config) {
    this._activeBugView = viewType;
    this._lastConfig = config;
    switch (viewType) {
      case 'list':
        await this.showListView('bugs', config);
        break;
      case 'status':
        this.showBugsKanbanView('status', config);
        break;
      case 'priority':
        this.showBugsKanbanView('priority', config);
        break;
      case 'table':
        await this.showBugsTableView(config);
        break;
      default:
}
  }

  async switchEpicView(viewType, config) {
    switch (viewType) {
      case 'list':
        await this.showListView('epics', config);
        break;
      case 'gantt':
        this.showGanttView(config);
        break;
      default:
}
  }

  async switchProposalsView(viewType, config) {
    this._activeProposalsView = viewType;
    this._lastConfig = config;
    switch (viewType) {
      case 'list':
        await this.showListView('proposals', config);
        break;
      case 'table':
        await this.showProposalsTableView(config);
        break;
      default:
}
  }

  /**
   * Muestra la vista de tabla para proposals
   * @param {Object} config
   */
  async showProposalsTableView(config) {
    const container = document.getElementById('proposalsTableView');
    if (container) {
      // Restablecer todos los estilos de ocultación
      container.style.removeProperty('display');
      container.style.removeProperty('visibility');
      container.style.removeProperty('opacity');
      container.style.removeProperty('position');
      container.style.removeProperty('left');
      container.style.display = 'block';
      container.className = 'table-view';

      // Usar TableViewManager con reactividad en tiempo real
      this.tableViewManager.renderProposalsTableView(container, config);

      this.currentView = {
        cleanup: () => {
          this.tableViewManager.cleanup();
        }
      };
    }
  }

  /**
   * Reset all visibility and layout styles on a container for List view
   */
  _resetContainerStylesForListView(container) {
    // Remove visibility styles
    container.style.removeProperty('display');
    container.style.removeProperty('visibility');
    container.style.removeProperty('opacity');
    container.style.removeProperty('position');
    container.style.removeProperty('left');
    container.style.display = 'block';

    // Reset layout styles
    container.style.flexDirection = '';
    container.style.flexWrap = '';
    container.style.gap = '';
    container.style.justifyContent = '';
    container.style.alignContent = '';
    container.style.height = '';
    container.style.overflowX = '';
    container.style.overflowY = '';
    container.style.padding = '';

    container.className = 'cards-container list-view';
  }

  /**
   * Set up filters for the section in list renderer
   */
  _setupListFiltersForSection(section, cards) {
    if (section === 'tasks') {
      this._listCardsCache = cards;
      const existingTaskFilters = document.querySelector('task-filters');
      this.listRenderer.filters = existingTaskFilters?.getCurrentFilters?.() || this.taskFilters || {};
    } else {
      this._bugsListCardsCache = cards;
      this.listRenderer.filters = {};
    }
  }

  /**
   * Apply bug filters after cards are rendered (with delay for DOM rendering)
   */
  _applyBugFiltersAfterRender(section) {
    setTimeout(() => {
      const bugFilters = document.querySelector('bug-filters');
      if (!bugFilters?.applyFilters) return;

      const cardCount = document.querySelectorAll('#bugsCardsList bug-card').length;
      if (cardCount > 0) {
        bugFilters.applyFilters();
      }
    }, 200);
  }

  async showListView(section, config) {
    const cardsContainer = document.getElementById(`${section}CardsList`);
    if (!cardsContainer) return;

    this._resetContainerStylesForListView(cardsContainer);

    // Show filters for filterable sections
    const filterableSections = ['tasks', 'bugs'];
    if (filterableSections.includes(section)) {
      this.showFilters(section);
    }

    try {
      let cards = await this.firebaseService.getCards(config.projectId, section);
      cards = this._filterCardsByYear(cards, section);

      this._setupListFiltersForSection(section, cards);
      this.listRenderer.renderListView(cardsContainer, cards, config);

      if (section === 'bugs') {
        this._applyBugFiltersAfterRender(section);
      }
    } catch (error) {
      this.listRenderer.renderListView(cardsContainer, {}, config);
    }

    this.currentView = { cleanup: () => {} };
  }

  showKanbanView(section, config) {
    let container, statusList;

    if (section === 'tasks') {
      container = document.getElementById('tasksKanbanView');
      statusList = Array.isArray(config.statusTasksList) ? config.statusTasksList : Object.keys(config.statusTasksList || {});
    } else if (section === 'bugs') {
      container = document.getElementById('bugsStatusKanbanView');
      statusList = Array.isArray(config.statusBugList) ? config.statusBugList : Object.keys(config.statusBugList || {});
    }

    if (container && statusList) {
      // Restablecer todos los estilos de ocultación
      container.style.removeProperty('display');
      container.style.removeProperty('visibility');
      container.style.removeProperty('opacity');
      container.style.removeProperty('position');
      container.style.removeProperty('left');
      container.style.display = 'flex';

      // Asegurar que la clase kanban-view está aplicada
      container.className = 'kanban-view';

      // Add kanban-active class to body to prevent main scroll
      document.body.classList.add('kanban-active');

      // Ocultar filtros en vista Kanban
      this.hideFilters(section);

      if (!this.viewManagers.kanban) {
        this.viewManagers.kanban = new KanbanViewManager(this.cardService, this.firebaseService);
      }

      // Asegurar que config tiene la sección correcta  
      const sectionConfig = { ...config, section };

      this.viewManagers.kanban.renderKanbanView(config.projectId, statusList, sectionConfig, 'status');
      this.currentView = this.viewManagers.kanban;
    }
  }

  showBugsKanbanView(kanbanType, config) {
    let container;

    if (kanbanType === 'status') {
      container = document.getElementById('bugsStatusKanbanView');
    } else if (kanbanType === 'priority') {
      container = document.getElementById('bugsPriorityKanbanView');
    }

    if (container) {
      // Restablecer todos los estilos de ocultación
      container.style.removeProperty('display');
      container.style.removeProperty('visibility');
      container.style.removeProperty('opacity');
      container.style.removeProperty('position');
      container.style.removeProperty('left');
      container.style.display = 'flex';

      // Asegurar que la clase kanban-view está aplicada
      container.className = 'kanban-view';

      // Add kanban-active class to body to prevent main scroll
      document.body.classList.add('kanban-active');

      // Ocultar filtros en vista Kanban de bugs
      this.hideFilters('bugs');

      let statusList;
      if (kanbanType === 'status') {
        // Si statusBugList es un objeto, extraer las claves en el orden lógico definido
        if (config.statusBugList && typeof config.statusBugList === 'object' && !Array.isArray(config.statusBugList)) {
          const availableStatuses = Object.keys(config.statusBugList);
          // Ordenar según el orden lógico definido en constantes
          statusList = APP_CONSTANTS.BUG_STATUS_ORDER.filter(status => availableStatuses.includes(status));
          // Agregar cualquier estado que no esté en el orden predefinido al final
          const remainingStatuses = availableStatuses.filter(status => !APP_CONSTANTS.BUG_STATUS_ORDER.includes(status));
          statusList = [...statusList, ...remainingStatuses];
        } else {
          statusList = config.statusBugList;
        }
      } else if (kanbanType === 'priority') {
        // Si bugpriorityList es un objeto, extraer las claves en el orden lógico definido
        if (config.bugpriorityList && typeof config.bugpriorityList === 'object' && !Array.isArray(config.bugpriorityList)) {
          const availablePriorities = Object.keys(config.bugpriorityList);
          // Ordenar según el orden lógico definido en constantes
          statusList = APP_CONSTANTS.BUG_PRIORITY_ORDER.filter(priority => availablePriorities.includes(priority));
          // Agregar cualquier prioridad que no esté en el orden predefinido al final
          const remainingPriorities = availablePriorities.filter(priority => !APP_CONSTANTS.BUG_PRIORITY_ORDER.includes(priority));
          statusList = [...statusList, ...remainingPriorities];
        } else {
          statusList = config.bugpriorityList;
        }
      }

      // Validar que statusList sea un array válido
      if (!Array.isArray(statusList) || statusList.length === 0) {
        console.error('Error: statusList is not a valid array:', statusList);
        console.error('Config object:', config);
        console.error('kanbanType:', kanbanType);
        
        // Usar valores por defecto solo como último recurso
        if (kanbanType === 'status') {
          statusList = APP_CONSTANTS.BUG_STATUS_ORDER;
        } else if (kanbanType === 'priority') {
          statusList = APP_CONSTANTS.BUG_PRIORITY_ORDER;
        }
        
        console.warn('Using default statusList:', statusList);
      }

      if (!this.viewManagers.bugsKanban) {
        this.viewManagers.bugsKanban = new KanbanViewManager(this.cardService, this.firebaseService);
      }

      // Asegurar que config tiene la sección correcta
      const bugsConfig = { ...config, section: 'bugs' };

      this.viewManagers.bugsKanban.renderKanbanView(config.projectId, statusList, bugsConfig, kanbanType);
      this.currentView = this.viewManagers.bugsKanban;
    }
  }

  showSprintView(config) {
    const container = document.getElementById('tasksSprintView');

    if (container) {
      // Restablecer todos los estilos de ocultación
      container.style.removeProperty('display');
      container.style.removeProperty('visibility');
      container.style.removeProperty('opacity');
      container.style.removeProperty('position');
      container.style.removeProperty('left');
      container.style.display = 'block';

      // Asegurar que la clase sprint-view está aplicada
      container.className = 'sprint-view';

      // Ocultar filtros en vista Sprint
      this.hideFilters('tasks');

      if (!this.viewManagers.sprint) {
        this.viewManagers.sprint = new SprintViewManager(this.cardService, this.firebaseService);
      }

      this.viewManagers.sprint.renderSprintView(config.projectId, config);
      this.currentView = this.viewManagers.sprint;
    }
  }

  showGanttView(config) {
    const container = document.getElementById('epicsGanttView');

    if (container) {
      // Restablecer todos los estilos de ocultación
      container.style.removeProperty('display');
      container.style.removeProperty('visibility');
      container.style.removeProperty('opacity');
      container.style.removeProperty('position');
      container.style.removeProperty('left');
      container.style.display = 'block';

      if (!this.viewManagers.epic) {
        this.viewManagers.epic = new EpicViewManager(this.cardService, this.firebaseService);
      }

      this.viewManagers.epic.renderGanttView(config.projectId, config);
      this.currentView = this.viewManagers.epic;
    }
  }

  hideAllViews(section) {
    // Remove kanban-active class from body when hiding views
    document.body.classList.remove('kanban-active');

    const viewContainers = {
      tasks: ['tasksCardsList', 'tasksKanbanView', 'tasksSprintView', 'tasksTableView'],
      bugs: ['bugsCardsList', 'bugsStatusKanbanView', 'bugsPriorityKanbanView', 'bugsTableView'],
      epics: ['epicsCardsList', 'epicsGanttView'],
      proposals: ['proposalsCardsList', 'proposalsTableView']
    };

    const containers = viewContainers[section] || [];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        // Forzar la ocultación con !important
        container.style.setProperty('display', 'none', 'important');
        container.style.setProperty('visibility', 'hidden', 'important');
        container.style.setProperty('opacity', '0', 'important');
        container.style.setProperty('position', 'absolute', 'important');
        container.style.setProperty('left', '-9999px', 'important');

        // Limpiar cualquier clase específica de vista para evitar conflictos
        container.className = container.className.replace(/\b(list-view|kanban-view|sprint-view)\b/g, '').trim();

        // Si no tiene clase, mantener la clase base
        if (!container.className) {
          if (containerId.includes('CardsList')) {
            container.className = 'cards-container';
          } else if (containerId.includes('KanbanView')) {
            container.className = 'kanban-view';
          } else if (containerId.includes('SprintView')) {
            container.className = 'sprint-view';
          }
        }
      }
    });
  }

  updateViewButtons(section, activeView) {
    const buttonMappings = {
      tasks: {
        list: 'listViewBtn',
        kanban: 'kanbanViewBtn',
        sprint: 'sprintViewBtn',
        table: 'tableViewBtn'
      },
      bugs: {
        list: 'bugsListViewBtn',
        status: 'bugsStatusKanbanBtn',
        priority: 'bugsPriorityKanbanBtn',
        table: 'bugsTableViewBtn'
      },
      epics: {
        list: 'epicsListBtn',
        gantt: 'epicsGanttBtn'
      },
      proposals: {
        list: 'proposalsListViewBtn',
        table: 'proposalsTableViewBtn'
      }
    };

    const buttons = buttonMappings[section];
    if (buttons) {
      // Remove active class from all buttons
      Object.values(buttons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
          button.classList.remove('active');
        }
      });

      // Add active class to current button
      const activeButtonId = buttons[activeView];
      if (activeButtonId) {
        const activeButton = document.getElementById(activeButtonId);
        if (activeButton) {
          activeButton.classList.add('active');
        }
      }
    }
  }

  /**
   * Renderiza los filtros de tareas en el contenedor dado, usando el estado global de filtros.
   * @param {HTMLElement} container - Contenedor donde renderizar los filtros
   * @param {Object} config - Configuración de la vista
   * @param {Object} filters - Estado actual de los filtros
   * @param {Function} onChange - Callback al cambiar un filtro
   */
  renderTaskFilters(container, config, filters, onChange) {
    container.innerHTML = '';
    // Contador de resultados
    const resultsCounter = document.createElement('div');
    resultsCounter.className = 'filters-results-counter';
    resultsCounter.style = 'margin-bottom: 0.5rem; font-size: 0.95em; color: #555;';
    container.appendChild(resultsCounter);

    // Botón de limpiar filtros
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Limpiar';
    clearBtn.className = 'clear-button';
    clearBtn.addEventListener('click', () => {
      Object.keys(filters).forEach(key => onChange(key, null));
    });
    container.appendChild(clearBtn);

    // Contenedor principal de filtros y controles
    const filtersWrapper = document.createElement('div');
    filtersWrapper.style = 'display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem;';

    // Contenedor de selects de filtros
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'list-filters';
    filtersContainer.style = 'display: flex; gap: 0.5rem; flex-wrap: wrap;';

    // Helper para crear un filtro select
    const createSelect = (field, label, options) => {
      const group = document.createElement('div');
      group.style.display = 'flex';
      group.style.flexDirection = 'column';
      group.style.gap = '0.25rem';
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.style.fontSize = '0.9rem';
      labelEl.style.fontWeight = 'bold';
      const select = document.createElement('select');
      select.style.padding = '0.5rem';
      select.style.border = '1px solid #ddd';
      select.style.borderRadius = '4px';
      select.style.fontSize = '0.9rem';
      options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      });
      // Sincronizar valor
      select.value = filters[field] ?? 'All';
      select.addEventListener('change', (e) => {
        let val = e.target.value;
        if (val === 'All') val = null;
        onChange(field, val);
      });
      group.appendChild(labelEl);
      group.appendChild(select);
      return group;
    };

    // Status
    filtersContainer.appendChild(createSelect('status', 'Status', ['All', ...config.statusTasksList]));
    // Developer
    if (config.developerList) {
      const rawDevelopers = Array.isArray(config.developerList)
        ? config.developerList
        : Object.values(config.developerList || {});
      const developerOptions = rawDevelopers
        .map(entry => {
          if (!entry) return '';
          if (typeof entry === 'string') {
            return entry;
          }
          if (typeof entry === 'object') {
            return entry.name || entry.email || entry.id || '';
          }
          return String(entry);
        })
        .filter(Boolean);
      filtersContainer.appendChild(createSelect('developer', 'Developer', ['All', ...developerOptions]));
    }
    // Sprint
    if (config.sprintList) {
      const sprintOptions = ['All', 'No Sprint', ...Object.values(config.sprintList).map(s => s.title)];
      filtersContainer.appendChild(createSelect('sprint', 'Sprint', sprintOptions));
    }
    // Priority
    filtersContainer.appendChild(createSelect('priority', 'Priority', ['All', 'High', 'Medium', 'Low', 'Not evaluated']));
    // Epic
    if (config.epicList && Array.isArray(config.epicList)) {
      const epicOptions = ['All', 'Sin épica', ...config.epicList.map(epic => epic.name)];
      filtersContainer.appendChild(createSelect('epic', 'Épica', epicOptions));
    }

    // Contenedor de controles (contador y botón)
    const controlsContainer = document.createElement('div');
    controlsContainer.style = 'display: flex; align-items: center; gap: 0.5rem;';
    controlsContainer.appendChild(resultsCounter);
    controlsContainer.appendChild(clearBtn);

    // Añadir los contenedores al wrapper
    filtersWrapper.appendChild(filtersContainer);
    filtersWrapper.appendChild(controlsContainer);

    // Añadir el wrapper al contenedor principal
    container.appendChild(filtersWrapper);

    // Al final, función para actualizar el contador
    this.updateResultsCounter = (visible, total) => {
      resultsCounter.textContent = `${visible} of ${total} tasks`;
    };
  }

  showFilters(section = null) {
    if (section === 'tasks') {
      const filtersSection = document.querySelector('#tasksTabContent .filters-section');
      if (filtersSection) {
        filtersSection.style.display = 'block';

        // Usar el componente task-filters para ambas vistas
        if (this._activeTaskView === 'table') {
          this.createTaskFiltersComponentForTable();
        } else {
          // Para List View, usar el componente task-filters
          this.createTaskFiltersComponent();
        }
      }
    } else if (section === 'bugs') {
      const filtersSection = document.querySelector('#bugsTabContent .filters-section');
      if (filtersSection) {
        filtersSection.style.display = 'block';

        // Usar el componente bug-filters para ambas vistas
        if (this._activeBugView === 'table') {
          this.createBugFiltersComponentForTable();
        } else {
          // Para List View, usar el componente bug-filters
          this.createBugFiltersComponent();
        }
      }
    } else if (section) {
      // Comportamiento anterior para otros tipos
      const filtersSection = document.querySelector(`#${section}TabContent .filters-section`);
      if (filtersSection) {
        filtersSection.style.display = 'block';
      }
    } else {
      const filtersSection = document.querySelector('.filters-section');
      if (filtersSection) {
        filtersSection.style.display = 'block';
      }
    }
  }

  hideFilters(section = null) {
    if (section) {
      // Si se especifica una sección, ocultar solo sus filtros
      const filtersSection = document.querySelector(`#${section}TabContent .filters-section`);
      if (filtersSection) {
        filtersSection.style.display = 'none';
      }
    } else {
      // Ocultar todas las secciones de filtros
      const filtersSections = document.querySelectorAll('.filters-section');
      filtersSections.forEach(filtersSection => {
        filtersSection.style.display = 'none';
      });
    }
  }

  cleanup() {
    if (this.currentView) {
      this.currentView.cleanup();
    }

    Object.values(this.viewManagers).forEach(manager => {
      if (manager.cleanup) {
        manager.cleanup();
      }
    });

    this.viewManagers = {};
    this.currentView = null;
  }

  /**
   * Muestra la vista de tabla para tareas
   * @param {Object} config
   */
  async showTableView(config) {
    this._activeTaskView = 'table';
    const container = document.getElementById('tasksTableView');
    if (container) {
      // Restablecer todos los estilos de ocultación
      container.style.removeProperty('display');
      container.style.removeProperty('visibility');
      container.style.removeProperty('opacity');
      container.style.removeProperty('position');
      container.style.removeProperty('left');
      container.style.display = 'block';
      container.className = 'table-view';

      // Listen for TABLE_RENDERED event before starting render
      // This ensures we catch the event even if render is synchronous
      AppEventBus.once(AppEvents.TABLE_RENDERED, (detail) => {
        if (detail.section === 'tasks') {
          this.showFilters('tasks');
        }
      });

      // Usar TableViewManager con reactividad en tiempo real
      this.tableViewManager.setFilters(this.taskFilters);
      this.tableViewManager.renderTasksTableView(container, config);

      this.currentView = {
        cleanup: () => {
          this.tableViewManager.cleanup();
        }
      };
    }
  }

  /**
   * Muestra la vista de tabla para bugs
   * @param {Object} config
   */
  async showBugsTableView(config) {
    const container = document.getElementById('bugsTableView');
    if (container) {
      // Restablecer todos los estilos de ocultación
      container.style.removeProperty('display');
      container.style.removeProperty('visibility');
      container.style.removeProperty('opacity');
      container.style.removeProperty('position');
      container.style.removeProperty('left');
      container.style.display = 'block';
      container.className = 'table-view';

      // Listen for TABLE_RENDERED event before starting render
      AppEventBus.once(AppEvents.TABLE_RENDERED, (detail) => {
        if (detail.section === 'bugs') {
          this.showFilters('bugs');
        }
      });

      // Usar TableViewManager con reactividad en tiempo real
      this.tableViewManager.setFilters(this.bugFilters);
      this.tableViewManager.renderBugsTableView(container, config);

      this.currentView = {
        cleanup: () => {
          this.tableViewManager.cleanup();
        }
      };
    }
  }

  createTaskFiltersComponent() {
    // Solo crear el componente si estamos en List View
    if (this._activeTaskView !== 'list') {
      return;
    }

    const filtersContainer = document.getElementById('tasksFilters');
    if (!filtersContainer) {
return;
    }

    // Verificar si ya existe un componente task-filters
    let taskFilters = filtersContainer.querySelector('task-filters');
    let preservedFilters = null;

    if (taskFilters) {
      // Si existe pero es para Table View, guardar filtros y eliminarlo
      if (taskFilters.getAttribute('data-view') === 'table') {
        // Preservar los filtros actuales antes de eliminar
        if (taskFilters.getCurrentFilters) {
          preservedFilters = taskFilters.getCurrentFilters();
        }
        taskFilters.remove();
        taskFilters = null;
      } else {
        // Si ya existe para List View, solo forzar actualización
        if (taskFilters.requestUpdate) {
          taskFilters.requestUpdate();
        }
        return;
      }
    }

    // Limpiar contenido existente
    filtersContainer.innerHTML = '';

    // Crear el componente task-filters
    taskFilters = document.createElement('task-filters');
    taskFilters.setAttribute('target-selector', '#tasksCardsList');
    taskFilters.setAttribute('card-selector', 'task-card');

    // Añadir el componente al DOM
    filtersContainer.appendChild(taskFilters);

    // Esperar a que el componente esté listo
    setTimeout(async () => {
      try {
        // Verificar que las variables globales estén disponibles
        await this.ensureGlobalVariables();

        // Aplicar filtros preservados si existen
        if (preservedFilters && Object.keys(preservedFilters).length > 0) {
          // Aplicar cada filtro al componente
          taskFilters.currentFilters = { ...preservedFilters };

          // Actualizar los selectores visuales
          await taskFilters.updateComplete;
          Object.entries(preservedFilters).forEach(([filterId, values]) => {
            if (values && values.length > 0) {
              const multiSelect = taskFilters.shadowRoot?.querySelector(`#filter-${filterId}`);
              if (multiSelect) {
                multiSelect.selectedValues = values;
              }
            }
          });

          // Forzar aplicación de filtros
          if (taskFilters.applyFilters) {
            taskFilters.applyFilters();
          }
        }

        // Forzar que el componente se actualice
        if (taskFilters.requestUpdate) {
          taskFilters.requestUpdate();
        }

        // Contar las tarjetas iniciales
        const cards = document.querySelectorAll('#tasksCardsList task-card');
        if (taskFilters.resultsCount) {
          taskFilters.resultsCount = { visible: cards.length, total: cards.length };
        }
      } catch (error) {
        // Silently ignore filter initialization errors
      }
    }, 100);
  }

  async ensureGlobalVariables() {
    // Asegurar que tenemos las listas de status
    if (!window.statusTasksList && this._lastConfig?.statusTasksList) {
      window.statusTasksList = this._lastConfig.statusTasksList;
    }

    // Asegurar que tenemos la lista de desarrolladores
    if (!window.globalDeveloperList && this._lastConfig?.developerList) {
      window.globalDeveloperList = this._lastConfig.developerList;
    }

    // Asegurar que tenemos la lista de stakeholders
    if (!window.globalStakeholders && this._lastConfig?.stakeholders) {
      window.globalStakeholders = this._lastConfig.stakeholders;
    }

    // Asegurar que tenemos la lista de sprints
    if (!window.globalSprintList && this._lastConfig?.sprintList) {
      window.globalSprintList = this._lastConfig.sprintList;
    }
  }

  createTaskFiltersComponentForTable() {
    // Solo crear el componente si estamos en Table View
    if (this._activeTaskView !== 'table') {
      return;
    }

    // Prevent concurrent filter creation (race condition protection)
    if (this._creatingTaskFilters) {
      return;
    }

    const filtersContainer = document.getElementById('tasksFilters');
    if (!filtersContainer) {
      return;
    }

    // Check if a task-filters component already exists for table view
    const existingFilters = filtersContainer.querySelector('task-filters[data-view="table"]');
    if (existingFilters) {
      // Component already exists, no need to recreate
      return;
    }

    // Set semaphore to prevent concurrent creation
    this._creatingTaskFilters = true;

    // Preservar filtros del componente existente (si viene de Card View)
    let preservedFilters = null;
    const oldFilters = filtersContainer.querySelector('task-filters');
    if (oldFilters?.getCurrentFilters) {
      preservedFilters = oldFilters.getCurrentFilters();
    }

    // Limpiar contenido existente
    filtersContainer.innerHTML = '';

    // Crear el componente task-filters para Table View
    const taskFilters = document.createElement('task-filters');
    taskFilters.setAttribute('target-selector', '#tasksTableView');
    taskFilters.setAttribute('card-selector', 'tr[data-task-id]');
    taskFilters.setAttribute('data-view', 'table');

    // Añadir el componente al DOM
    filtersContainer.appendChild(taskFilters);

    // Release semaphore now that component is in DOM
    this._creatingTaskFilters = false;

    // Esperar a que el componente esté listo y la tabla esté renderizada
    setTimeout(async () => {
      try {
        // Verificar que las variables globales estén disponibles
        await this.ensureGlobalVariables();

        // Aplicar filtros preservados si existen
        if (preservedFilters && Object.keys(preservedFilters).length > 0) {
          taskFilters.currentFilters = { ...preservedFilters };

          await taskFilters.updateComplete;
          Object.entries(preservedFilters).forEach(([filterId, values]) => {
            if (values && values.length > 0) {
              const multiSelect = taskFilters.shadowRoot?.querySelector(`#filter-${filterId}`);
              if (multiSelect) {
                multiSelect.selectedValues = values;
              }
            }
          });
        }

        // Forzar que el componente se actualice
        if (taskFilters.requestUpdate) {
          taskFilters.requestUpdate();
        }

        // Esperar un poco más para asegurar que la tabla esté completamente renderizada
        setTimeout(() => {
          // Forzar aplicación de filtros después de que la tabla esté lista
          if (taskFilters.forceApplyFilters) {
            taskFilters.forceApplyFilters();
          }
        }, 200);

      } catch (error) {
        // Silently ignore filter initialization errors
      }
    }, 100);
  }

  /**
   * Convierte los filtros del componente TaskFilters al formato que espera TableRenderer
   */
  _convertFiltersForTable(componentFilters) {
const tableFilters = {};

    Object.entries(componentFilters).forEach(([filterId, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        // Pasar todos los valores seleccionados para soporte de filtros múltiples
        switch (filterId) {
          case 'status':
            tableFilters.status = selectedValues;
            break;
          case 'developer':
            tableFilters.developer = selectedValues;
            break;
          case 'sprint':
            tableFilters.sprint = selectedValues;
            break;
          case 'epic':
            tableFilters.epic = selectedValues;
            break;
          default:
            tableFilters[filterId] = selectedValues;
        }
}
    });
return tableFilters;
  }

  /**
   * Convierte los filtros del componente BugFilters al formato que espera TableRenderer
   */
  _convertFiltersForBugsTable(componentFilters) {
    const tableFilters = {};

    Object.entries(componentFilters).forEach(([filterId, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        // Pass all selected values for multi-select support
        tableFilters[filterId] = selectedValues;
      }
    });

    return tableFilters;
  }

  createBugFiltersComponent() {
    // Solo crear el componente si estamos en List View de bugs
    if (this._activeBugView !== 'list') {
      return;
    }

    const filtersContainer = document.getElementById('bugsFilters');
    if (!filtersContainer) {
      return;
    }

    // Verificar si ya existe un componente bug-filters
    let bugFilters = filtersContainer.querySelector('bug-filters');
    let preservedFilters = null;

    if (bugFilters) {
      // Si existe pero es para Table View, guardar filtros y eliminarlo
      if (bugFilters.getAttribute('data-view') === 'table') {
        // Preservar los filtros actuales antes de eliminar
        if (bugFilters.getCurrentFilters) {
          preservedFilters = bugFilters.getCurrentFilters();
        }
        bugFilters.remove();
        bugFilters = null;
      } else {
        // Si ya existe para Card View, solo forzar actualización
        if (bugFilters.requestUpdate) {
          bugFilters.requestUpdate();
        }
        return;
      }
    }

    // Limpiar contenido existente
    filtersContainer.innerHTML = '';

    // Crear el componente bug-filters
    bugFilters = document.createElement('bug-filters');
    bugFilters.setAttribute('target-selector', '#bugsCardsList');
    bugFilters.setAttribute('card-selector', 'bug-card');

    // Añadir el componente al DOM
    filtersContainer.appendChild(bugFilters);

    // Esperar a que el componente esté listo
    setTimeout(async () => {
      try {
        // Verificar que las variables globales estén disponibles
        await this.ensureGlobalVariables();

        // Aplicar filtros preservados si existen
        if (preservedFilters && Object.keys(preservedFilters).length > 0) {
          bugFilters.currentFilters = { ...preservedFilters };

          await bugFilters.updateComplete;
          Object.entries(preservedFilters).forEach(([filterId, values]) => {
            if (values && values.length > 0) {
              const multiSelect = bugFilters.shadowRoot?.querySelector(`#filter-${filterId}`);
              if (multiSelect) {
                multiSelect.selectedValues = values;
              }
            }
          });

          // Forzar aplicación de filtros
          if (bugFilters.applyFilters) {
            bugFilters.applyFilters();
          }
        }

        // Forzar que el componente se actualice
        if (bugFilters.requestUpdate) {
          bugFilters.requestUpdate();
        }

        // Contar las tarjetas iniciales y aplicar filtros por defecto de status
        const cards = document.querySelectorAll('#bugsCardsList bug-card');
        if (bugFilters.resultsCount) {
          bugFilters.resultsCount = { visible: cards.length, total: cards.length };
        }

        // Aplicar filtros por defecto (status) después de que las cards estén listas
        setTimeout(() => {
          if (bugFilters.applyFilters) {
            bugFilters.applyFilters();
          }
        }, 100);
      } catch (error) {
        // Silently ignore filter initialization errors
      }
    }, 100);
  }

  createBugFiltersComponentForTable() {
    // Solo crear el componente si estamos en Table View de bugs
    if (this._activeBugView !== 'table') {
      return;
    }

    // Prevent concurrent filter creation (race condition protection)
    if (this._creatingBugFilters) {
      return;
    }

    const filtersContainer = document.getElementById('bugsFilters');
    if (!filtersContainer) {
      return;
    }

    // Check if a bug-filters component already exists for table view
    const existingFilters = filtersContainer.querySelector('bug-filters[data-view="table"]');
    if (existingFilters) {
      // Component already exists, no need to recreate
      return;
    }

    // Set semaphore to prevent concurrent creation
    this._creatingBugFilters = true;

    // Preservar filtros del componente existente (si viene de Card View)
    let preservedFilters = null;
    const oldFilters = filtersContainer.querySelector('bug-filters');
    if (oldFilters?.getCurrentFilters) {
      preservedFilters = oldFilters.getCurrentFilters();
    }

    // Limpiar contenido existente
    filtersContainer.innerHTML = '';

    // Crear el componente bug-filters para Table View
    const bugFilters = document.createElement('bug-filters');
    bugFilters.setAttribute('target-selector', '#bugsTableView');
    bugFilters.setAttribute('card-selector', 'tr[data-bug-id]');
    bugFilters.setAttribute('data-view', 'table');

    // Añadir el componente al DOM
    filtersContainer.appendChild(bugFilters);

    // Release semaphore now that component is in DOM
    this._creatingBugFilters = false;

    // Esperar a que el componente esté listo y la tabla esté renderizada
    setTimeout(async () => {
      try {
        // Verificar que las variables globales estén disponibles
        if (this.ensureGlobalVariables) await this.ensureGlobalVariables();

        // Aplicar filtros preservados si existen
        if (preservedFilters && Object.keys(preservedFilters).length > 0) {
          bugFilters.currentFilters = { ...preservedFilters };

          await bugFilters.updateComplete;
          Object.entries(preservedFilters).forEach(([filterId, values]) => {
            if (values && values.length > 0) {
              const multiSelect = bugFilters.shadowRoot?.querySelector(`#filter-${filterId}`);
              if (multiSelect) {
                multiSelect.selectedValues = values;
              }
            }
          });
        }

        // Forzar que el componente se actualice
        if (bugFilters.requestUpdate) {
          bugFilters.requestUpdate();
        }

        // Esperar un poco más para asegurar que la tabla esté completamente renderizada
        setTimeout(() => {
          // Forzar aplicación de filtros después de que la tabla esté lista
          if (bugFilters.forceApplyFilters) {
            bugFilters.forceApplyFilters();
          }
        }, 200);

      } catch (error) {
        // Silently ignore filter initialization errors
      }
    }, 100);
  }

  // === YEAR FILTERING METHODS ===

  /**
   * Get the selected year from localStorage
   * @returns {number} The selected year or current year as default
   */
  _getSelectedYear() {
    const savedYear = localStorage.getItem('selectedYear');
    return savedYear ? Number(savedYear) : new Date().getFullYear();
  }

  /**
   * Filter cards by year
   * @param {Object} cards - The cards object from Firebase
   * @param {string} section - The section type
   * @returns {Object} Filtered cards object
   */
  _filterCardsByYear(cards, section) {
    // Only filter sections that support year filtering
    const yearFilteredSections = ['sprints', 'epics', 'tasks', 'bugs'];
    if (!yearFilteredSections.includes(section)) {
      return cards;
    }

    if (!cards || Object.keys(cards).length === 0) {
      return cards;
    }

    const filteredCards = {};
    const selectedYear = this._getSelectedYear();

    Object.entries(cards).forEach(([id, cardData]) => {
      const cardYear = cardData.year;

      // Si no tiene year, mostrar la card (compatibilidad temporal pre-migración)
      // Comparar como números para evitar problemas de tipos (string vs number)
      if (!cardYear || Number(cardYear) === selectedYear) {
        filteredCards[id] = cardData;
      }
    });
return filteredCards;
  }

  /**
   * Handle year change event - refresh active views
   */
  _handleYearChanged() {
// Refrescar las vistas activas que necesitan filtrado por año
    if (this._lastConfig) {
      // Si estamos en vista de tareas
      if (this._activeTaskView) {
        const activeSection = this._lastConfig.section || 'tasks';
        if (['tasks', 'bugs'].includes(activeSection)) {
          // Las vistas de tabla y lista se refrescan automáticamente desde app-controller
          // Pero kanban y sprint view necesitan refrescarse aquí
          if (this._activeTaskView === 'kanban' && this.viewManagers.kanban) {
            this.viewManagers.kanban.cleanup();
            this.showKanbanView('tasks', this._lastConfig);
          } else if (this._activeTaskView === 'sprint' && this.viewManagers.sprint) {
            this.viewManagers.sprint.cleanup();
            this.showSprintView(this._lastConfig);
          }
        }
      }

      // Si estamos en vista de bugs
      if (this._activeBugView) {
        if (this._activeBugView === 'status' || this._activeBugView === 'priority') {
          if (this.viewManagers.bugsKanban) {
            this.viewManagers.bugsKanban.cleanup();
            this.showBugsKanbanView(this._activeBugView, this._lastConfig);
          }
        }
      }
    }
  }
}

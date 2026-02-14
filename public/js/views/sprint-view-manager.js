import { SprintRenderer } from '../renderers/sprint-renderer.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';

export class SprintViewManager {
  constructor(cardService, firebaseService) {
    this.cardService = cardService;
    this.firebaseService = firebaseService;
    this.sprintRenderer = new SprintRenderer();
    this.unsubscriptions = [];
    this.previousYearBacklogTasks = [];
    this.currentProjectId = null;
  }

  /**
   * Get the selected year from localStorage
   * @returns {number} The selected year or current year as default
   */
  _getSelectedYear() {
    const savedYear = localStorage.getItem('selectedYear');
    return savedYear ? Number(savedYear) : new Date().getFullYear();
  }

  /**
   * Filter cards/sprints by year
   * @param {Array} items - Array of cards or sprints
   * @returns {Array} Filtered items
   */
  _filterByYear(items) {
    if (!items || items.length === 0) return items;

    const selectedYear = this._getSelectedYear();
    const filtered = items.filter(item => {
      // Si no tiene year, mostrar (compatibilidad temporal)
      if (!item.year) return true;
      // Comparar como números para evitar problemas de tipos (string vs number)
      return Number(item.year) === selectedYear;
    });
return filtered;
  }

  /**
   * Filter sprints object by year
   * @param {Object} sprints - Sprints object from Firebase
   * @returns {Object} Filtered sprints object
   */
  _filterSprintsByYear(sprints) {
    if (!sprints || Object.keys(sprints).length === 0) return sprints;

    const selectedYear = this._getSelectedYear();
    const filtered = {};

    Object.entries(sprints).forEach(([id, sprint]) => {
      // Si no tiene year, mostrar (compatibilidad temporal)
      // Comparar como números para evitar problemas de tipos (string vs number)
      if (!sprint.year || Number(sprint.year) === selectedYear) {
        filtered[id] = sprint;
      }
    });
return filtered;
  }

  renderSprintView(projectId, config) {
    const sprintColumns = document.getElementById('sprintColumns');
    const backlogCards = document.getElementById('backlog-cards');

    this.currentProjectId = projectId;
    this.clearView(sprintColumns, backlogCards);
    this.subscribeToSprints(projectId);
    this.subscribeToTasks(projectId, config);
    this.setupImportBacklogButton();
  }

  /**
   * Setup the import backlog button event listener
   */
  setupImportBacklogButton() {
    const importBtn = document.getElementById('importBacklogBtn');
    if (importBtn && !importBtn.dataset.listenerAdded) {
      importBtn.dataset.listenerAdded = 'true';
      importBtn.addEventListener('click', () => this.importPreviousYearBacklog());
    }
  }

  /**
   * Check for backlog tasks from previous year and offer to import them to current year
   * Shows the button when viewing the previous year OR current year
   * Always migrates from (currentCalendarYear - 1) to currentCalendarYear
   * @param {Array} allTasks - All tasks from Firebase (unfiltered by year)
   */
  checkPreviousYearBacklog(allTasks) {
    const selectedYear = this._getSelectedYear();
    const currentCalendarYear = new Date().getFullYear();
    const previousCalendarYear = currentCalendarYear - 1;

    // Only show import option when viewing current year or previous year
    // This allows migrating backlog from (currentYear - 1) to currentYear
    const canShowMigration = selectedYear === currentCalendarYear || selectedYear === previousCalendarYear;

    if (!canShowMigration) {
      const importBtn = document.getElementById('importBacklogBtn');
      if (importBtn) importBtn.style.display = 'none';
      this.previousYearBacklogTasks = [];
      return;
    }

    // Find backlog tasks (no sprint) from PREVIOUS CALENDAR YEAR to import into current year
    // Filter only tasks with valid Firebase ID (starts with '-'), not completed, and deduplicate by cardId
    const seenCardIds = new Set();
    const completedStatuses = APP_CONSTANTS.TASK_COMPLETED_STATUSES || ['done', 'done&validated'];
    this.previousYearBacklogTasks = allTasks.filter(task => {
      const isBacklog = !task.sprint || task.sprint === 'backlog' || task.sprint === '';
      const isPreviousYear = task.year && Number(task.year) === previousCalendarYear;
      // Validate Firebase ID format (should start with '-')
      const hasValidFirebaseId = task.id && task.id.startsWith('-');
      // Exclude completed tasks
      const statusLower = (task.status || '').toLowerCase();
      const isNotCompleted = !completedStatuses.includes(statusLower);
      // Avoid duplicates by cardId
      const isUnique = task.cardId && !seenCardIds.has(task.cardId);
      if (isUnique) seenCardIds.add(task.cardId);
      return isBacklog && isPreviousYear && hasValidFirebaseId && isNotCompleted && isUnique;
    });

    // Update button visibility
    const importBtn = document.getElementById('importBacklogBtn');
    const yearSpan = document.getElementById('importBacklogYear');
    const countSpan = document.getElementById('importBacklogCount');

    if (importBtn && this.previousYearBacklogTasks.length > 0) {
      importBtn.style.display = 'block';
      if (yearSpan) yearSpan.textContent = previousCalendarYear;
      if (countSpan) countSpan.textContent = this.previousYearBacklogTasks.length;
    } else if (importBtn) {
      importBtn.style.display = 'none';
    }
  }

  /**
   * Import backlog tasks from previous year to current year
   */
  importPreviousYearBacklog() {
    if (!this.previousYearBacklogTasks.length || !this.currentProjectId) {
      return;
    }

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const count = this.previousYearBacklogTasks.length;

    // Show confirmation modal
    document.dispatchEvent(new CustomEvent('show-modal', {
      detail: {
        options: {
          title: 'Importar backlog',
          message: `¿Importar <b>${count} tarea${count > 1 ? 's' : ''}</b> del backlog de ${previousYear} al año ${currentYear}?`,
          button1Text: 'Importar',
          button2Text: 'Cancelar',
          button1css: 'background-color: var(--brand-secondary);',
          button2css: 'background-color: #999;',
          button1Action: () => this._executeBacklogMove(currentYear, count),
          button2Action: () => { },
          maxWidth: '450px'
        }
      }
    }));
  }

  /**
   * Execute the backlog move after confirmation
   */
  async _executeBacklogMove(nextYear, count) {
    try {
      const importBtn = document.getElementById('importBacklogBtn');
      if (importBtn) {
        importBtn.disabled = true;
        importBtn.textContent = 'Moviendo...';
      }

      console.log(`🚀 Importando ${this.previousYearBacklogTasks.length} tareas al año ${nextYear}`);
      console.log(`📁 Proyecto: ${this.currentProjectId}`);

      // Update each task's year
      let movedCount = 0;
      for (const task of this.previousYearBacklogTasks) {
        const firebaseId = task.id; // ID de Firebase (ej: -OItlSyfbpRNRnoW6LpN)
        const cardId = task.cardId; // ID legible (ej: C4D-TSK-0002)
        console.log(`  → Moviendo ${cardId} (${firebaseId})...`);
        try {
          await this.firebaseService.updateCard(
            this.currentProjectId,
            'tasks',
            firebaseId,
            { year: nextYear }
          );
          movedCount++;
          console.log(`  ✅ ${cardId} movida`);
        } catch (taskError) {
          console.error(`  ❌ Error moviendo ${cardId}:`, taskError);
        }
      }

      console.log(`✅ Movidas ${movedCount}/${count} tareas`);

      this._showNotification(
        `${movedCount} tarea${movedCount > 1 ? 's' : ''} movida${movedCount > 1 ? 's' : ''} al ${nextYear}`,
        'success'
      );

      // Hide button after success
      if (importBtn) {
        importBtn.style.display = 'none';
      }
      this.previousYearBacklogTasks = [];
    } catch (error) {
      console.error('Error moving backlog:', error);
      this._showNotification('Error al mover backlog', 'error');

      const importBtn = document.getElementById('importBacklogBtn');
      if (importBtn) {
        importBtn.disabled = false;
        importBtn.textContent = `Mover backlog a ${nextYear} (${count})`;
      }
    }
  }

  clearView(sprintColumns, backlogCards) {
    if (sprintColumns) sprintColumns.innerHTML = '';
    if (backlogCards) backlogCards.innerHTML = '';
  }

  subscribeToSprints(projectId) {
    const sprintRef = `/cards/${projectId}/SPRINTS_${projectId}`;

    const unsubscribe = this.firebaseService.subscribeToPath(sprintRef, (snapshot) => {
      const sprintData = snapshot.val() || {};

      // Actualizar lista global con TODOS los sprints (otros componentes la necesitan completa)
      this.updateGlobalSprintList(sprintData);

      // Filtrar sprints por año solo para renderizar en esta vista
      const filteredSprintData = this._filterSprintsByYear(sprintData);

      // Crear lista local filtrada para el renderizado
      const filteredSprintList = {};
      Object.values(filteredSprintData).forEach(sprint => {
        if (sprint.cardId && !sprint.deletedAt) {
          filteredSprintList[sprint.cardId] = sprint;
        }
      });

      this.sprintRenderer.renderSprintColumns(
        document.getElementById('sprintColumns'),
        filteredSprintList
      );
    });

    this.unsubscriptions.push(unsubscribe);
  }

  subscribeToTasks(projectId, config) {
    const pathTaskCards = `/cards/${projectId}/TASKS_${projectId}`;

    const unsubscribe = this.firebaseService.subscribeToPath(pathTaskCards, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let allCards = Object.entries(data).map(([id, card]) => ({
          id,
          ...card,
          cardType: 'task-card',
          group: 'tasks',
          section: 'tasks'
        }));

        // Check for backlog tasks from previous year BEFORE filtering
        this.checkPreviousYearBacklog(allCards);

        // Filtrar tareas por año seleccionado
        let cards = this._filterByYear(allCards);

        // Calcular puntos de los sprints antes de renderizar
        this.calculateSprintPoints(projectId, cards);

        this.sprintRenderer.renderTasksInSprints(cards, config);
        this.sprintRenderer.setupDragAndDrop((taskId, sprintId) => {
          this.handleTaskDrop(taskId, sprintId, projectId);
        });
      }
    });

    this.unsubscriptions.push(unsubscribe);
  }

  /**
   * Calcula los puntos de negocio y desarrollo para cada sprint basado en las tareas DONE
   * @param {string} projectId - ID del proyecto
   * @param {Array} tasks - Lista de tareas
   */
  async calculateSprintPoints(projectId, tasks) {
    try {
      // Obtener la lista actual de sprints
      const sprintList = window.globalSprintList || {};

      // Inicializar contadores de puntos para cada sprint
      const sprintPoints = {};
      Object.keys(sprintList).forEach(sprintId => {
        sprintPoints[sprintId] = {
          businessPoints: 0,
          devPoints: 0
        };
      });

      // Calcular puntos solo para tareas DONE&VALIDATED
      tasks.forEach(task => {
        if (task.sprint && task.status?.toLowerCase() === 'done&validated') {
          const sprintId = task.sprint;
          if (sprintPoints[sprintId]) {
            sprintPoints[sprintId].businessPoints += parseInt(task.businessPoints || 0, 10);
            sprintPoints[sprintId].devPoints += parseInt(task.devPoints || 0, 10);
          }
        }
      });

      // Actualizar los puntos en Firebase
      for (const [sprintId, points] of Object.entries(sprintPoints)) {
        const sprint = sprintList[sprintId];
        if (sprint) {
          const updatedSprint = {
            ...sprint,
            businessPoints: points.businessPoints,
            devPoints: points.devPoints
          };
          if (typeof this.firebaseService.saveCard === 'function') {
            await this.firebaseService.saveCard(updatedSprint);
          }
        }
      }
    } catch (error) {
      console.error('Error calculating sprint points:', error);
    }
  }

  updateGlobalSprintList(sprintData) {
    window.globalSprintList = {};
    Object.values(sprintData).forEach(sprint => {
      if (sprint.cardId && !sprint.deletedAt) {
        window.globalSprintList[sprint.cardId] = sprint;
      }
    });
  }

  async handleTaskDrop(taskId, sprintId, projectId) {
    try {
      const result = await this.cardService.moveCardToSprint(projectId, taskId, sprintId);
      if (!result.success) {
        this._showNotification(result.error || 'Error moving task to sprint', 'error');
      }
    } catch (error) {
      console.error('Error handling task drop:', error);
      this._showNotification('Error moving task to sprint', 'error');
    }
  }

  cleanup() {
    this.unsubscriptions.forEach(unsubscribe => unsubscribe());
    this.unsubscriptions = [];
  }

  /**
   * Muestra una notificación al usuario
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación ('success', 'error', 'info')
   */
  _showNotification(message, type = 'info') {
    const notification = document.createElement('slide-notification');
    notification.message = message;
    notification.type = type;
    document.body.appendChild(notification);
  }
}

import { entityDirectoryService } from '../services/entity-directory-service.js';

export class GanttRenderer {
  constructor() {
    this.ganttChart = null;
  }

  renderGanttView(container, epics, year) {
    container.innerHTML = '';

    // Create gantt chart element if it doesn't exist
    if (!this.ganttChart) {
      this.ganttChart = document.createElement('gantt-chart');
      this.ganttChart.id = 'epicsGantt';
    }

    // Set the year to fix the time scale range
    if (year) {
      this.ganttChart.year = year;
    }

    // Append to container first
    container.appendChild(this.ganttChart);

    // Wait for the element to be fully connected and rendered
    setTimeout(async () => {
      // Prepare task data for gantt chart
      const taskData = await this.prepareGanttData(epics, year);
      this.ganttChart.setTaskData(taskData);
    }, 100);
  }

  async prepareGanttData(epics, year) {
    const tasks = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const yearStart = year ? `${year}-01-01` : todayStr;
    const yearEnd = year ? `${year}-12-31` : todayStr;

    // Obtener las tareas del proyecto para relacionarlas con épicas
    let projectTasks = {};
    try {
      const projectId = window.appController && window.appController.getCurrentProjectId
        ? window.appController.getCurrentProjectId()
        : null;
      if (projectId && window.appController && window.appController.getFirebaseService) {
        const firebaseService = window.appController.getFirebaseService();
        projectTasks = await firebaseService.getCards(projectId, 'tasks') || {};
      }
    } catch (error) {
      // Silently handle error
    }

    Object.entries(epics).forEach(([id, epic]) => {
      if (epic.deletedAt) return;

      // Use only startDate, endDate and year
      // If no endDate, use end of selected year
      // If no startDate, use start of selected year
      const epicTask = {
        sprint: epic.sprintId || '',
        name: epic.title || 'Untitled Epic',
        plannedStart: epic.startDate || yearStart,
        plannedEnd: epic.endDate || yearEnd,
        realStart: epic.startDate,
        realEnd: epic.endDate,
        dev: epic.assignedTo || 'Unassigned',
        subtasks: []
      };

      // Buscar tareas relacionadas con esta épica
      Object.entries(projectTasks).forEach(([taskId, task]) => {
        if (task.deletedAt) return;

        // Verificar si la tarea pertenece a esta épica (por ID de épica)
        const taskEpicId = task.epic || task.epicId;
        if (taskEpicId === epic.cardId || taskEpicId === id) {
          const subtask = {
            name: task.title || 'Untitled Task',
            plannedStart: task.startDate || yearStart,
            plannedEnd: task.endDate || todayStr,
            realStart: task.startDate,
            realEnd: task.endDate,
            status: task.status,
            dev: this._resolveDeveloperDisplay(task.developer) || 'Unassigned'
          };

          // Solo añadir si tiene fecha de inicio
          if (task.startDate) {
            epicTask.subtasks.push(subtask);
          }
        }
      });

      // Add epic (always has dates now with fallbacks)
      tasks.push(epicTask);
    });

    return tasks;
  }

  cleanup() {
    if (this.ganttChart) {
      this.ganttChart.remove();
      this.ganttChart = null;
    }
  }

  /**
   * Resuelve un ID de developer (dev_XXX) a nombre legible
   * @param {string} value - ID o email del developer
   * @returns {string} Nombre legible
   */
  _resolveDeveloperDisplay(value) {
    if (!value) return '';

    // Intentar resolver como entity ID (dev_XXX)
    if (typeof value === 'string' && value.startsWith('dev_')) {
      const name = entityDirectoryService.getDeveloperDisplayName(value);
      if (name) return name;
    }

    // Si es un email, extraer nombre
    if (typeof value === 'string' && value.includes('@')) {
      return value.split('@')[0];
    }

    return value;
  }
}
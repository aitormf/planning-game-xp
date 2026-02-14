import { BaseFilter } from '../base-filter-system.js';
import '@manufosela/multi-select';

/**
 * Clase para manejar los filtros de QA/Test
 * Hereda de BaseFilter para aprovechar la funcionalidad común
 */
export class QAFilters extends BaseFilter {
  constructor() {
    super('qa');
  }

  /**
   * Configuración específica de filtros para QA
   * @returns {Object} Configuración de filtros
   */
  getFilterConfig() {
    return {
      status: {
        label: 'Estado',
        isMultiSelect: true,
        optionsMethod: () => this.getStatusOptions()
      },
      priority: {
        label: 'Prioridad',
        isMultiSelect: true,
        optionsMethod: () => this.getPriorityOptions()
      },
      defectType: {
        label: 'Tipo de Defecto',
        isMultiSelect: true,
        optionsMethod: () => this.getDefectTypeOptions()
      },
      associatedTask: {
        label: 'Tarea Asociada',
        isMultiSelect: true,
        optionsMethod: () => this.getAssociatedTaskOptions(),
        cardValueGetter: (card) => card.associatedTaskId
      },
      testResult: {
        label: 'Resultado',
        isMultiSelect: true,
        optionsMethod: () => this.getTestResultOptions(),
        cardValueGetter: (card) => this.getTestResult(card)
      },
      createdBy: {
        label: 'Creado por',
        isMultiSelect: true,
        optionsMethod: () => this.getCreatedByOptions()
      }
    };
  }

  /**
   * Determina el resultado de un test basado en sus campos
   * @param {HTMLElement} card - Tarjeta de QA
   * @returns {string} Resultado del test
   */
  getTestResult(card) {
    const actualResult = card.actualResult || '';
    const expectedResult = card.expectedResult || '';
    const status = card.status || '';

    // Si está marcado como pasado/fallido en el estado
    if (status.toLowerCase().includes('pass') || status.toLowerCase().includes('aprobado')) {
      return 'passed';
    }
    if (status.toLowerCase().includes('fail') || status.toLowerCase().includes('fallido')) {
      return 'failed';
    }
    if (status.toLowerCase().includes('block') || status.toLowerCase().includes('bloqueado')) {
      return 'blocked';
    }

    // Si tiene resultados pero no coinciden
    if (actualResult && expectedResult) {
      if (actualResult.toLowerCase() === expectedResult.toLowerCase()) {
        return 'passed';
      } else {
        return 'failed';
      }
    }

    // Si tiene defecto asociado
    if (card.defectType && card.defectType.trim() !== '') {
      return 'failed';
    }

    // Estados por defecto
    if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('pendiente')) {
      return 'pending';
    }
    if (status.toLowerCase().includes('progress') || status.toLowerCase().includes('progreso')) {
      return 'in-progress';
    }

    return 'not-executed';
  }

  /**
   * Aplicación personalizada de filtro multi-select para tareas asociadas
   */
  applyMultiSelectFilter(card, filterType, filterValues, config) {
    if (filterType === 'associatedTask') {
      return this.applyAssociatedTaskFilter(card, filterValues);
    } else {
      return super.applyMultiSelectFilter(card, filterType, filterValues, config);
    }
  }

  /**
   * Aplica filtro específico para tareas asociadas
   * @param {HTMLElement} card - Tarjeta a filtrar
   * @param {Array} filterValues - Valores del filtro
   * @returns {boolean} true si la tarjeta pasa el filtro
   */
  applyAssociatedTaskFilter(card, filterValues) {
    const cardTaskId = card.associatedTaskId;
    
    if (filterValues.includes('sin-tarea')) {
      const hasTask = cardTaskId && cardTaskId.trim() !== '';
      const hasOtherTasksSelected = filterValues.some(t => t !== 'sin-tarea');
      
      if (hasTask && hasOtherTasksSelected) {
        return filterValues.includes(cardTaskId);
      } else if (hasTask && !hasOtherTasksSelected) {
        return false;
      }
      return true;
    } else {
      return filterValues.includes(cardTaskId);
    }
  }

  /**
   * Obtiene las opciones de estado
   * @returns {Promise<Array>} Opciones de estado
   */
  async getStatusOptions() {
    // Estados típicos de QA/Testing
    const defaultStatuses = [
      'Pendiente',
      'En Progreso',
      'Ejecutado',
      'Pasado',
      'Fallido',
      'Bloqueado',
      'Retesteo',
      'Cerrado'
    ];

    // Intentar obtener desde una lista global si existe
    const globalStatuses = window.statusQAList || window.globalQAStatusList || defaultStatuses;
    
    return globalStatuses.map(status => ({
      value: status,
      label: status
    }));
  }

  /**
   * Obtiene las opciones de prioridad
   * @returns {Promise<Array>} Opciones de prioridad
   */
  async getPriorityOptions() {
    const defaultPriorities = [
      'Crítica',
      'Alta',
      'Media',
      'Baja'
    ];

    const globalPriorities = window.globalQAPriorityList || window.globalPriorityList || defaultPriorities;
    
    return globalPriorities.map(priority => ({
      value: priority,
      label: priority
    }));
  }

  /**
   * Obtiene las opciones de tipo de defecto
   * @returns {Promise<Array>} Opciones de tipo de defecto
   */
  async getDefectTypeOptions() {
    try {
      // Obtener tipos de defecto desde todas las QA existentes
      const qaList = document.getElementById('qaCardsList');
      if (!qaList) return [];

      const cards = Array.from(qaList.querySelectorAll('qa-card'));
      const defectTypesSet = new Set();

      cards.forEach(card => {
        if (card.defectType && card.defectType.trim()) {
          defectTypesSet.add(card.defectType.trim());
        }
      });

      const options = Array.from(defectTypesSet).map(defectType => ({
        value: defectType,
        label: defectType
      }));

      // Añadir tipos comunes si no existen
      const commonDefectTypes = [
        'UI/UX',
        'Funcional',
        'Performance',
        'Seguridad',
        'Compatibilidad',
        'Datos',
        'Integración'
      ];

      commonDefectTypes.forEach(type => {
        if (!options.find(opt => opt.value === type)) {
          options.push({
            value: type,
            label: type
          });
        }
      });

      // Añadir opción para sin defecto
      options.unshift({
        value: 'sin-defecto',
        label: 'Sin Defecto'
      });

      return options;
    } catch (error) {
      console.error('Error getting defect type options:', error);
      return [
        {
          value: 'sin-defecto',
          label: 'Sin Defecto'
        }
      ];
    }
  }

  /**
   * Obtiene las opciones de tareas asociadas
   * @returns {Promise<Array>} Opciones de tareas asociadas
   */
  async getAssociatedTaskOptions() {
    try {
      let tasks = [];

      // OPTIMIZACIÓN: Usar GlobalDataManager primero para evitar llamadas redundantes a Firebase
      if (window.globalTasksList && window.globalTasksList.length > 0) {
        tasks = window.globalTasksList.map(task => ({
          id: task.id,
          title: task.title || task.name || task.id
        }));
      } else if (window.appController && window.appController.getFirebaseService) {
        // Solo hacer llamada a Firebase si no hay datos en cache
        try {
          const projectId = window.appController.getCurrentProjectId();
          const firebaseService = window.appController.getFirebaseService();
          const taskData = await firebaseService.getCards(projectId, 'tasks');
          tasks = Object.entries(taskData || {}).map(([id, task]) => ({
            id: task.cardId || id,
            title: task.title || task.name || id
          }));
        } catch (firebaseError) {
          console.warn('Error obteniendo tareas desde Firebase (cache miss):', firebaseError);
        }
      }

      // Si no hay tareas desde Firebase, obtener desde el DOM
      if (tasks.length === 0) {
        const taskCards = document.querySelectorAll('task-card');
        tasks = Array.from(taskCards).map(card => ({
          id: card.cardId || card.id || card.getAttribute('card-id'),
          title: card.title || card.textContent.trim()
        })).filter(task => task.id && task.title);
      }

      const options = tasks.map(task => ({
        value: task.id,
        label: task.title || task.id
      }));

      // Añadir opción para QA sin tarea asociada
      options.unshift({
        value: 'sin-tarea',
        label: 'Sin Tarea Asociada'
      });

      return options;
    } catch (error) {
      console.error('Error getting associated task options:', error);
      return [{
        value: 'sin-tarea',
        label: 'Sin Tarea Asociada'
      }];
    }
  }

  /**
   * Obtiene las opciones de resultado de test
   * @returns {Promise<Array>} Opciones de resultado
   */
  async getTestResultOptions() {
    return [
      {
        value: 'not-executed',
        label: 'No Ejecutado'
      },
      {
        value: 'pending',
        label: 'Pendiente'
      },
      {
        value: 'in-progress',
        label: 'En Progreso'
      },
      {
        value: 'passed',
        label: 'Pasado'
      },
      {
        value: 'failed',
        label: 'Fallido'
      },
      {
        value: 'blocked',
        label: 'Bloqueado'
      }
    ];
  }

  /**
   * Obtiene las opciones de "creado por"
   * @returns {Promise<Array>} Opciones de creado por
   */
  async getCreatedByOptions() {
    return this.getCreatedByOptionsFromDOM();
  }
}
import { BaseFilter } from '../base-filter-system.js';
import '@manufosela/multi-select';

/**
 * Clase para manejar los filtros de propuestas
 * Hereda de BaseFilter para aprovechar la funcionalidad común
 */
export class ProposalFilters extends BaseFilter {
  constructor() {
    super('proposals');
  }

  /**
   * Configuración específica de filtros para propuestas
   * @returns {Object} Configuración de filtros
   */
  getFilterConfig() {
    return {
      status: {
        label: 'Estado',
        isMultiSelect: true,
        optionsMethod: () => this.getStatusOptions()
      },
      epic: {
        label: 'Épica',
        isMultiSelect: true,
        optionsMethod: () => this.getEpicOptions(),
        cardValueGetter: (card) => card.epic
      },
      dateRange: {
        label: 'Antigüedad',
        isMultiSelect: true,
        optionsMethod: () => this.getDateRangeOptions(),
        cardValueGetter: (card) => this.getDateRangeFromCard(card)
      },
      completeness: {
        label: 'Completitud',
        isMultiSelect: true,
        optionsMethod: () => this.getCompletenessOptions(),
        cardValueGetter: (card) => this.getCompletenessLevel(card)
      },
      createdBy: {
        label: 'Creado por',
        isMultiSelect: true,
        optionsMethod: () => this.getCreatedByOptions()
      }
    };
  }

  /**
   * Determina la antigüedad de una propuesta
   * @param {HTMLElement} card - Tarjeta de propuesta
   * @returns {string} Rango de fechas
   */
  getDateRangeFromCard(card) {
    const registerDate = card.registerDate;
    if (!registerDate) {
      return 'sin-fecha';
    }

    const now = new Date();
    const createdDate = new Date(registerDate);
    const daysDiff = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      return 'reciente';
    } else if (daysDiff <= 30) {
      return 'este-mes';
    } else if (daysDiff <= 90) {
      return 'trimestre';
    } else if (daysDiff <= 365) {
      return 'este-año';
    } else {
      return 'antigua';
    }
  }

  /**
   * Determina el nivel de completitud de una propuesta
   * @param {HTMLElement} card - Tarjeta de propuesta
   * @returns {string} Nivel de completitud
   */
  getCompletenessLevel(card) {
    let completedFields = 0;
    let totalFields = 5; // title, description, notes, acceptanceCriteria, epic

    // Verificar campos principales
    if (card.title && card.title.trim() !== '') completedFields++;
    if (card.description && card.description.trim() !== '') completedFields++;
    if (card.notes && card.notes.trim() !== '') completedFields++;
    if (card.acceptanceCriteria && card.acceptanceCriteria.trim() !== '') completedFields++;
    if (card.epic && card.epic.trim() !== '') completedFields++;

    const completionRate = (completedFields / totalFields) * 100;

    if (completionRate === 0) {
      return 'vacia';
    } else if (completionRate < 40) {
      return 'basica';
    } else if (completionRate < 80) {
      return 'parcial';
    } else if (completionRate < 100) {
      return 'casi-completa';
    } else {
      return 'completa';
    }
  }

  /**
   * Aplicación personalizada de filtro multi-select para épicas
   */
  applyMultiSelectFilter(card, filterType, filterValues, config) {
    if (filterType === 'epic') {
      return this.applyEpicFilter(card, filterValues);
    } else {
      return super.applyMultiSelectFilter(card, filterType, filterValues, config);
    }
  }

  /**
   * Aplica filtro específico para épicas
   * @param {HTMLElement} card - Tarjeta a filtrar
   * @param {Array} filterValues - Valores del filtro
   * @returns {boolean} true si la tarjeta pasa el filtro
   */
  applyEpicFilter(card, filterValues) {
    const cardEpic = card.epic;
    
    if (filterValues.includes('sin-epica')) {
      const hasEpic = cardEpic && cardEpic.trim() !== '';
      const hasOtherEpicsSelected = filterValues.some(e => e !== 'sin-epica');
      
      if (hasEpic && hasOtherEpicsSelected) {
        return filterValues.includes(cardEpic);
      } else if (hasEpic && !hasOtherEpicsSelected) {
        return false;
      }
      return true;
    } else {
      return filterValues.includes(cardEpic);
    }
  }

  /**
   * Obtiene las opciones de estado
   * @returns {Promise<Array>} Opciones de estado
   */
  async getStatusOptions() {
    // Estados típicos de propuestas
    const defaultStatuses = [
      'Propuesta',
      'En Revisión',
      'Aprobada',
      'Rechazada',
      'En Desarrollo',
      'Implementada',
      'Descartada'
    ];

    // Intentar obtener desde una lista global si existe
    const globalStatuses = window.statusProposalsList || window.globalProposalStatusList || defaultStatuses;
    
    return globalStatuses.map(status => ({
      value: status,
      label: status
    }));
  }

  /**
   * Obtiene las opciones de épica
   * @returns {Promise<Array>} Opciones de épica
   */
  async getEpicOptions() {
    try {
      let epics = [];

      // OPTIMIZACIÓN: Usar GlobalDataManager primero para evitar llamadas redundantes a Firebase
      if (window.globalEpicList && window.globalEpicList.length > 0) {
        epics = window.globalEpicList.map(epic => ({
          id: epic.id,
          title: epic.name || epic.title || epic.id
        }));
      } else if (window.appController && window.appController.getFirebaseService) {
        // Solo hacer llamada a Firebase si no hay datos en cache
        try {
          const projectId = window.appController.getCurrentProjectId();
          const firebaseService = window.appController.getFirebaseService();
          const epicData = await firebaseService.getCards(projectId, 'epics');
          epics = Object.entries(epicData || {}).map(([id, epic]) => ({
            id: epic.cardId || id,
            title: epic.title || epic.name || id
          }));
        } catch (firebaseError) {
          console.warn('Error obteniendo épicas desde Firebase (cache miss):', firebaseError);
        }
      }

      // Si no hay épicas desde Firebase, obtener desde el DOM
      if (epics.length === 0) {
        const epicCards = document.querySelectorAll('epic-card');
        epics = Array.from(epicCards).map(card => ({
          id: card.cardId || card.id || card.getAttribute('card-id'),
          title: card.title || card.textContent.trim()
        })).filter(epic => epic.id && epic.title);
      }

      const options = epics.map(epic => ({
        value: epic.id,
        label: epic.title || epic.id
      }));

      // Añadir opción para propuestas sin épica
      options.unshift({
        value: 'sin-epica',
        label: 'Sin Épica'
      });

      return options;
    } catch (error) {
      console.error('Error getting epic options:', error);
      return [{
        value: 'sin-epica',
        label: 'Sin Épica'
      }];
    }
  }

  /**
   * Obtiene las opciones de rango de fechas
   * @returns {Promise<Array>} Opciones de rango de fechas
   */
  async getDateRangeOptions() {
    return [
      {
        value: 'reciente',
        label: 'Reciente (7 días)'
      },
      {
        value: 'este-mes',
        label: 'Este Mes'
      },
      {
        value: 'trimestre',
        label: 'Este Trimestre'
      },
      {
        value: 'este-año',
        label: 'Este Año'
      },
      {
        value: 'antigua',
        label: 'Antigua (1+ año)'
      },
      {
        value: 'sin-fecha',
        label: 'Sin Fecha'
      }
    ];
  }

  /**
   * Obtiene las opciones de completitud
   * @returns {Promise<Array>} Opciones de completitud
   */
  async getCompletenessOptions() {
    return [
      {
        value: 'vacia',
        label: 'Vacía (0%)'
      },
      {
        value: 'basica',
        label: 'Básica (1-39%)'
      },
      {
        value: 'parcial',
        label: 'Parcial (40-79%)'
      },
      {
        value: 'casi-completa',
        label: 'Casi Completa (80-99%)'
      },
      {
        value: 'completa',
        label: 'Completa (100%)'
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
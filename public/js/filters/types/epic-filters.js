import { BaseFilter } from '../base-filter-system.js';
import '@manufosela/multi-select';

/**
 * Clase para manejar los filtros de épicas
 * Hereda de BaseFilter para aprovechar la funcionalidad común
 */
export class EpicFilters extends BaseFilter {
  constructor() {
    super('epics');
  }

  /**
   * Configuración específica de filtros para épicas
   * @returns {Object} Configuración de filtros
   */
  getFilterConfig() {
    return {
      stakeholders: {
        label: 'Stakeholders',
        isMultiSelect: true,
        optionsMethod: () => this.getStakeholdersOptions(),
        cardValueGetter: (card) => this.getStakeholdersFromCard(card)
      },
      status: {
        label: 'Estado',
        isMultiSelect: true,
        optionsMethod: () => this.getStatusOptions()
      },
      dateRange: {
        label: 'Rango de fechas',
        isMultiSelect: true,
        optionsMethod: () => this.getDateRangeOptions(),
        cardValueGetter: (card) => this.getDateRangeFromCard(card)
      },
      createdBy: {
        label: 'Creado por',
        isMultiSelect: true,
        optionsMethod: () => this.getCreatedByOptions()
      }
    };
  }

  /**
   * Obtiene stakeholders de una tarjeta de épica
   * @param {HTMLElement} card - Tarjeta de épica
   * @returns {Array} Array de stakeholders
   */
  getStakeholdersFromCard(card) {
    // Los stakeholders pueden estar en diferentes propiedades
    let stakeholders = card.stakeholders || card.stakeholdersSelected || [];
    
    // Si es un string, intentar parsearlo como JSON
    if (typeof stakeholders === 'string') {
      try {
        stakeholders = JSON.parse(stakeholders);
      } catch (e) {
        // Si no es JSON válido, tratarlo como un solo stakeholder
        stakeholders = stakeholders ? [stakeholders] : [];
      }
    }
    
    // Asegurar que sea un array
    return Array.isArray(stakeholders) ? stakeholders : [];
  }

  /**
   * Obtiene el rango de fechas de una épica para filtrado
   * @param {HTMLElement} card - Tarjeta de épica
   * @returns {string} Clasificación de fecha
   */
  getDateRangeFromCard(card) {
    const now = new Date();
    const startDate = card.startDate ? new Date(card.startDate) : null;
    const actualEndDate = card.endDate ? new Date(card.endDate) : null;

    // Si no tiene fechas definidas
    if (!startDate && !actualEndDate) {
      return 'sin-fechas';
    }

    // Si ya terminó
    if (card.endDate && actualEndDate && actualEndDate < now) {
      return 'completada';
    }

    // Si está en progreso
    if (startDate && startDate <= now && (!actualEndDate || actualEndDate >= now)) {
      return 'en-progreso';
    }

    // Si está planificada para el futuro
    if (startDate && startDate > now) {
      return 'planificada';
    }

    // Si está retrasada (fecha de fin pasada pero no marcada como completada)
    if (actualEndDate && actualEndDate < now && !card.endDate) {
      return 'retrasada';
    }

    return 'sin-clasificar';
  }

  /**
   * Aplicación personalizada de filtro multi-select para stakeholders
   */
  applyMultiSelectFilter(card, filterType, filterValues, config) {
    if (filterType === 'stakeholders') {
      return this.applyStakeholdersFilter(card, filterValues);
    } else if (filterType === 'dateRange') {
      return this.applyDateRangeFilter(card, filterValues);
    } else {
      return super.applyMultiSelectFilter(card, filterType, filterValues, config);
    }
  }

  /**
   * Aplica filtro específico para stakeholders
   * @param {HTMLElement} card - Tarjeta a filtrar
   * @param {Array} filterValues - Valores del filtro
   * @returns {boolean} true si la tarjeta pasa el filtro
   */
  applyStakeholdersFilter(card, filterValues) {
    const cardStakeholders = this.getStakeholdersFromCard(card);
    
    // Si se incluye "sin-stakeholder" en el filtro
    if (filterValues.includes('sin-stakeholder')) {
      const hasStakeholders = cardStakeholders.length > 0;
      const hasOtherStakeholdersSelected = filterValues.some(s => s !== 'sin-stakeholder');
      
      if (hasStakeholders && hasOtherStakeholdersSelected) {
        // Verificar si algún stakeholder de la card coincide con los filtros
        return cardStakeholders.some(stakeholder => 
          filterValues.includes(stakeholder)
        );
      } else if (hasStakeholders && !hasOtherStakeholdersSelected) {
        // Solo está seleccionado "sin-stakeholder" pero la épica tiene stakeholders
        return false;
      }
      // No tiene stakeholders, pasa el filtro
      return true;
    } else {
      // Verificar si algún stakeholder de la card está en los valores del filtro
      return cardStakeholders.some(stakeholder => 
        filterValues.includes(stakeholder)
      );
    }
  }

  /**
   * Aplica filtro específico para rango de fechas
   * @param {HTMLElement} card - Tarjeta a filtrar
   * @param {Array} filterValues - Valores del filtro
   * @returns {boolean} true si la tarjeta pasa el filtro
   */
  applyDateRangeFilter(card, filterValues) {
    const cardDateRange = this.getDateRangeFromCard(card);
    return filterValues.includes(cardDateRange);
  }

  /**
   * Obtiene las opciones de stakeholders
   * @returns {Promise<Array>} Opciones de stakeholders
   */
  async getStakeholdersOptions() {
    try {
      // Obtener stakeholders desde todas las épicas existentes
      const epicsList = document.getElementById('epicsCardsList');
      if (!epicsList) return [];

      const cards = Array.from(epicsList.querySelectorAll('epic-card'));
      const stakeholdersSet = new Set();

      cards.forEach(card => {
        const stakeholders = this.getStakeholdersFromCard(card);
        stakeholders.forEach(stakeholder => {
          if (stakeholder && stakeholder.trim()) {
            stakeholdersSet.add(stakeholder.trim());
          }
        });
      });

      const options = Array.from(stakeholdersSet).map(stakeholder => ({
        value: stakeholder,
        label: stakeholder
      }));

      // Añadir opción para épicas sin stakeholders
      const hasEpicsWithoutStakeholders = cards.some(card => 
        this.getStakeholdersFromCard(card).length === 0
      );
      
      if (hasEpicsWithoutStakeholders) {
        options.unshift({
          value: 'sin-stakeholder',
          label: 'Sin Stakeholder'
        });
      }

      return options;
    } catch (error) {
      console.error('Error getting stakeholders options:', error);
      return [];
    }
  }

  /**
   * Obtiene las opciones de estado para épicas
   * @returns {Promise<Array>} Opciones de estado
   */
  async getStatusOptions() {
    // Estados típicos de épicas
    const defaultStatuses = [
      'Planificada',
      'En Progreso',
      'En Revisión',
      'Completada',
      'Cancelada',
      'En Pausa'
    ];

    // Intentar obtener desde una lista global si existe
    const globalStatuses = window.statusEpicsList || window.globalEpicStatusList || defaultStatuses;
    
    return globalStatuses.map(status => ({
      value: status,
      label: status
    }));
  }

  /**
   * Obtiene las opciones de rango de fechas
   * @returns {Promise<Array>} Opciones de rango de fechas
   */
  async getDateRangeOptions() {
    return [
      {
        value: 'planificada',
        label: 'Planificada (Futuro)'
      },
      {
        value: 'en-progreso',
        label: 'En Progreso'
      },
      {
        value: 'completada',
        label: 'Completada'
      },
      {
        value: 'retrasada',
        label: 'Retrasada'
      },
      {
        value: 'sin-fechas',
        label: 'Sin Fechas'
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
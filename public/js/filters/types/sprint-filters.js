import { BaseFilter } from '../base-filter-system.js';
import '@manufosela/multi-select';

/**
 * Clase para manejar los filtros de sprints
 * Hereda de BaseFilter para aprovechar la funcionalidad común
 */
export class SprintFilters extends BaseFilter {
  constructor() {
    super('sprints');
  }

  /**
   * Configuración específica de filtros para sprints
   * @returns {Object} Configuración de filtros
   */
  getFilterConfig() {
    return {
      status: {
        label: 'Estado',
        isMultiSelect: true,
        optionsMethod: () => this.getStatusOptions(),
        cardValueGetter: (card) => this.getSprintStatus(card)
      },
      pointsRange: {
        label: 'Rango de Puntos',
        isMultiSelect: true,
        optionsMethod: () => this.getPointsRangeOptions(),
        cardValueGetter: (card) => this.getPointsRange(card)
      },
      dateRange: {
        label: 'Período',
        isMultiSelect: true,
        optionsMethod: () => this.getDateRangeOptions(),
        cardValueGetter: (card) => this.getDateRangeFromCard(card)
      },
      completion: {
        label: 'Completitud',
        isMultiSelect: true,
        optionsMethod: () => this.getCompletionOptions(),
        cardValueGetter: (card) => this.getCompletionLevel(card)
      },
      createdBy: {
        label: 'Creado por',
        isMultiSelect: true,
        optionsMethod: () => this.getCreatedByOptions()
      }
    };
  }

  /**
   * Determina el estado de un sprint basado en sus fechas
   * @param {HTMLElement} card - Tarjeta de sprint
   * @returns {string} Estado del sprint
   */
  getSprintStatus(card) {
    const now = new Date();
    const startDate = card.startDate ? new Date(card.startDate) : null;
    const endDate = card.endDate ? new Date(card.endDate) : null;

    if (!startDate || !endDate) {
      return 'sin-fechas';
    }

    if (now < startDate) {
      return 'planificado';
    } else if (now >= startDate && now <= endDate) {
      return 'activo';
    } else {
      return 'finalizado';
    }
  }

  /**
   * Determina el rango de puntos de un sprint
   * @param {HTMLElement} card - Tarjeta de sprint
   * @returns {string} Rango de puntos
   */
  getPointsRange(card) {
    const totalPoints = (card.businessPoints || 0) + (card.devPoints || 0);
    
    if (totalPoints === 0) {
      return 'sin-puntos';
    } else if (totalPoints <= 20) {
      return 'bajo';
    } else if (totalPoints <= 50) {
      return 'medio';
    } else if (totalPoints <= 100) {
      return 'alto';
    } else {
      return 'muy-alto';
    }
  }

  /**
   * Obtiene el rango de fechas de un sprint
   * @param {HTMLElement} card - Tarjeta de sprint
   * @returns {string} Clasificación temporal
   */
  getDateRangeFromCard(card) {
    const now = new Date();
    const startDate = card.startDate ? new Date(card.startDate) : null;
    const endDate = card.endDate ? new Date(card.endDate) : null;

    if (!startDate || !endDate) {
      return 'sin-fechas';
    }

    const daysDiff = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    const daysSinceEnd = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));

    if (daysSinceEnd > 0) {
      if (daysSinceEnd <= 7) {
        return 'recien-finalizado';
      } else if (daysSinceEnd <= 30) {
        return 'finalizado-mes';
      } else {
        return 'finalizado-anterior';
      }
    } else if (daysDiff <= 0 && now <= endDate) {
      return 'actual';
    } else if (daysDiff <= 7) {
      return 'proximo';
    } else if (daysDiff <= 30) {
      return 'este-mes';
    } else {
      return 'futuro';
    }
  }

  /**
   * Calcula el nivel de completitud de un sprint
   * @param {HTMLElement} card - Tarjeta de sprint
   * @returns {string} Nivel de completitud
   */
  getCompletionLevel(card) {
    const plannedBusiness = card.businessPoints || 0;
    const plannedDev = card.devPoints || 0;
    const realBusiness = card.realBusinessPoints || 0;
    const realDev = card.realDevPoints || 0;

    const plannedTotal = plannedBusiness + plannedDev;
    const realTotal = realBusiness + realDev;

    if (plannedTotal === 0) {
      return 'sin-estimacion';
    }

    const completionRate = (realTotal / plannedTotal) * 100;

    if (completionRate === 0) {
      return 'sin-completar';
    } else if (completionRate < 50) {
      return 'bajo';
    } else if (completionRate < 80) {
      return 'medio';
    } else if (completionRate < 100) {
      return 'alto';
    } else if (completionRate === 100) {
      return 'completo';
    } else {
      return 'excedido';
    }
  }

  /**
   * Obtiene las opciones de estado
   * @returns {Promise<Array>} Opciones de estado
   */
  async getStatusOptions() {
    return [
      {
        value: 'planificado',
        label: 'Planificado'
      },
      {
        value: 'activo',
        label: 'Activo'
      },
      {
        value: 'finalizado',
        label: 'Finalizado'
      },
      {
        value: 'sin-fechas',
        label: 'Sin Fechas'
      }
    ];
  }

  /**
   * Obtiene las opciones de rango de puntos
   * @returns {Promise<Array>} Opciones de rango de puntos
   */
  async getPointsRangeOptions() {
    return [
      {
        value: 'sin-puntos',
        label: 'Sin Puntos (0)'
      },
      {
        value: 'bajo',
        label: 'Bajo (1-20)'
      },
      {
        value: 'medio',
        label: 'Medio (21-50)'
      },
      {
        value: 'alto',
        label: 'Alto (51-100)'
      },
      {
        value: 'muy-alto',
        label: 'Muy Alto (100+)'
      }
    ];
  }

  /**
   * Obtiene las opciones de rango de fechas
   * @returns {Promise<Array>} Opciones de rango de fechas
   */
  async getDateRangeOptions() {
    return [
      {
        value: 'actual',
        label: 'Sprint Actual'
      },
      {
        value: 'proximo',
        label: 'Próxima Semana'
      },
      {
        value: 'este-mes',
        label: 'Este Mes'
      },
      {
        value: 'futuro',
        label: 'Futuro'
      },
      {
        value: 'recien-finalizado',
        label: 'Recién Finalizado'
      },
      {
        value: 'finalizado-mes',
        label: 'Finalizado (Este Mes)'
      },
      {
        value: 'finalizado-anterior',
        label: 'Finalizado (Anterior)'
      },
      {
        value: 'sin-fechas',
        label: 'Sin Fechas'
      }
    ];
  }

  /**
   * Obtiene las opciones de completitud
   * @returns {Promise<Array>} Opciones de completitud
   */
  async getCompletionOptions() {
    return [
      {
        value: 'sin-completar',
        label: 'Sin Completar (0%)'
      },
      {
        value: 'bajo',
        label: 'Bajo (1-49%)'
      },
      {
        value: 'medio',
        label: 'Medio (50-79%)'
      },
      {
        value: 'alto',
        label: 'Alto (80-99%)'
      },
      {
        value: 'completo',
        label: 'Completo (100%)'
      },
      {
        value: 'excedido',
        label: 'Excedido (100%+)'
      },
      {
        value: 'sin-estimacion',
        label: 'Sin Estimación'
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
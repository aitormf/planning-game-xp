/**
 * Sistema de Filtros Genérico
 * Punto de entrada principal para el sistema de filtros escalable
 * 
 * Este módulo proporciona una interfaz unificada para trabajar con filtros
 * de todos los tipos de cards en la aplicación.
 */

import { FilterFactory } from './filter-factory.js';

/**
 * Clase principal para gestionar el sistema de filtros
 */
export class FilterSystem {
  static instance = null;

  constructor() {
    if (FilterSystem.instance) {
      return FilterSystem.instance;
    }
    
    this.activeFilters = new Map();
    FilterSystem.instance = this;
  }

  /**
   * Obtiene la instancia singleton del sistema de filtros
   * @returns {FilterSystem} Instancia del sistema de filtros
   */
  static getInstance() {
    if (!FilterSystem.instance) {
      FilterSystem.instance = new FilterSystem();
    }
    return FilterSystem.instance;
  }

  /**
   * Inicializa filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card (bugs, tasks, epics, etc.)
   * @returns {Promise<Object>} Instancia del filtro configurado
   */
  async initializeFilters(cardType) {
    try {
      if (!FilterFactory.isCardTypeSupported(cardType)) {
        throw new Error(`Card type '${cardType}' is not supported`);
      }

      const filter = await FilterFactory.setupFilters(cardType);
      this.activeFilters.set(cardType, filter);
return filter;
    } catch (error) {
      console.error(`❌ Error inicializando filtros para ${cardType}:`, error);
      throw error;
    }
  }

  /**
   * Aplica filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   */
  async applyFilters(cardType) {
    try {
      await FilterFactory.applyFilters(cardType);
    } catch (error) {
      console.error(`Error aplicando filtros para ${cardType}:`, error);
    }
  }

  /**
   * Limpia filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   */
  async clearFilters(cardType) {
    try {
      await FilterFactory.clearFilters(cardType);
    } catch (error) {
      console.error(`Error limpiando filtros para ${cardType}:`, error);
    }
  }

  /**
   * Resetea filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   */
  async resetFilters(cardType) {
    try {
      await FilterFactory.resetFilters(cardType);
    } catch (error) {
      console.error(`Error reseteando filtros para ${cardType}:`, error);
    }
  }

  /**
   * Obtiene la instancia del filtro para un tipo específico
   * @param {string} cardType - Tipo de card
   * @returns {Object|null} Instancia del filtro o null
   */
  getFilterInstance(cardType) {
    return this.activeFilters.get(cardType) || FilterFactory.getFilterInstance(cardType);
  }

  /**
   * Destruye filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   */
  destroyFilters(cardType) {
    this.activeFilters.delete(cardType);
    FilterFactory.destroyFilter(cardType);
  }

  /**
   * Destruye todos los filtros activos
   */
  destroyAllFilters() {
    this.activeFilters.clear();
    FilterFactory.destroyAllFilters();
  }

  /**
   * Obtiene la lista de tipos de card soportados
   * @returns {Array<string>} Lista de tipos soportados
   */
  getSupportedCardTypes() {
    return FilterFactory.getSupportedCardTypes();
  }

  /**
   * Inicializa filtros para múltiples tipos de card
   * @param {Array<string>} cardTypes - Array de tipos de card
   * @returns {Promise<Map>} Mapa con las instancias de filtros
   */
  async initializeMultipleFilters(cardTypes) {
    const results = new Map();
    
    for (const cardType of cardTypes) {
      try {
        const filter = await this.initializeFilters(cardType);
        results.set(cardType, filter);
      } catch (error) {
        console.error(`Error inicializando filtros para ${cardType}:`, error);
        results.set(cardType, null);
      }
    }
    
    return results;
  }

  /**
   * Método de conveniencia para inicializar todos los filtros soportados
   * @returns {Promise<Map>} Mapa con todas las instancias de filtros
   */
  async initializeAllFilters() {
    return this.initializeMultipleFilters(this.getSupportedCardTypes());
  }
}

/**
 * Funciones de conveniencia para uso directo
 */

/**
 * Inicializa filtros para un tipo de card
 * @param {string} cardType - Tipo de card
 * @returns {Promise<Object>} Instancia del filtro
 */
export async function initializeFilters(cardType) {
  const filterSystem = FilterSystem.getInstance();
  return filterSystem.initializeFilters(cardType);
}

/**
 * Aplica filtros para un tipo de card
 * @param {string} cardType - Tipo de card
 */
export async function applyFilters(cardType) {
  const filterSystem = FilterSystem.getInstance();
  return filterSystem.applyFilters(cardType);
}

/**
 * Limpia filtros para un tipo de card
 * @param {string} cardType - Tipo de card
 */
export async function clearFilters(cardType) {
  const filterSystem = FilterSystem.getInstance();
  return filterSystem.clearFilters(cardType);
}

/**
 * Resetea filtros para un tipo de card
 * @param {string} cardType - Tipo de card
 */
export async function resetFilters(cardType) {
  const filterSystem = FilterSystem.getInstance();
  return filterSystem.resetFilters(cardType);
}

/**
 * Configuración y compatibilidad con código existente
 */

/**
 * Función para mantener compatibilidad con BugFilters existente
 * @deprecated Usar initializeFilters('bugs') en su lugar
 */
export async function setupBugFilters() {
  console.warn('setupBugFilters() está deprecado. Usar initializeFilters("bugs") en su lugar.');
  return initializeFilters('bugs');
}

/**
 * Función para mantener compatibilidad con TaskFilters existente
 * @deprecated Usar initializeFilters('tasks') en su lugar
 */
export async function setupTaskFilters() {
  console.warn('setupTaskFilters() está deprecado. Usar initializeFilters("tasks") en su lugar.');
  return initializeFilters('tasks');
}

/**
 * Exportar clases principales para uso avanzado
 */
export { FilterFactory } from './filter-factory.js';
export { BaseFilter } from './base-filter-system.js';

// Exportar clases específicas de filtros
export { BugFilters } from './types/bug-filters.js';
export { TaskFilters } from './types/task-filters.js';
export { EpicFilters } from './types/epic-filters.js';
export { SprintFilters } from './types/sprint-filters.js';
export { QAFilters } from './types/qa-filters.js';
export { ProposalFilters } from './types/proposal-filters.js';
export { LogFilters } from './types/log-filters.js';

/**
 * Configuración global del sistema de filtros
 */
export const FilterConfig = {
  // Intervalos de actualización automática (en ms)
  AUTO_REFRESH_INTERVAL: 30000,
  
  // Configuración de rendimiento
  DEBOUNCE_DELAY: 300,
  
  // Configuración de UI
  // Note: JS object properties don't support var() — use cssText if applying to elements
  DEFAULT_CONTAINER_STYLES: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'flex-start',
    padding: '1rem',
    background: '#f8f9fa',
    borderRadius: '6px',
    marginBottom: '1rem'
  },
  
  // Tipos de card soportados
  SUPPORTED_CARD_TYPES: ['bugs', 'tasks', 'epics', 'sprints', 'qa', 'proposals', 'logs'],
  
};

// Hacer disponible globalmente para compatibilidad
if (typeof window !== 'undefined') {
  window.FilterSystem = FilterSystem;
  window.initializeFilters = initializeFilters;
  window.applyFilters = applyFilters;
  window.clearFilters = clearFilters;
  window.resetFilters = resetFilters;
}

/**
 * NEW UNIFIED FILTER SYSTEM EXPORTS
 *
 * The new unified filter system operates on DATA objects (never DOM)
 * to eliminate the dual-filtering problem and flash issues.
 *
 * Usage:
 *   import { getUnifiedFilterService } from './filters/index.js';
 *   const filterService = getUnifiedFilterService();
 *   const filteredCards = filterService.applyFilters(cards, projectId, cardType);
 */

// Core exports
export {
  FilterEngine,
  getFilterEngine,
  resetFilterEngine,
  FilterState,
  getFilterState,
  resetFilterState
} from './core/index.js';

// Matchers exports
export {
  statusMatcher,
  developerMatcher,
  validatorMatcher,
  sprintMatcher,
  completedInSprintMatcher,
  epicMatcher,
  priorityMatcher,
  createdByMatcher,
  repositoryLabelMatcher,
  normalizeFilterValues,
  hasSpecialValue,
  getRegularValues,
  isEmpty,
  createFieldWithEmptyMatcher
} from './matchers/index.js';

// Config exports
export {
  taskFilterConfig,
  bugFilterConfig,
  registerFilterConfig,
  getFilterConfig,
  getRegisteredCardTypes
} from './configs/index.js';

// Unified Filter Service (main facade)
export {
  UnifiedFilterService,
  getUnifiedFilterService,
  resetUnifiedFilterService
} from '../services/unified-filter-service.js';
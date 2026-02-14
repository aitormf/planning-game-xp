import { BaseFilter } from '../base-filter-system.js';
import '@manufosela/multi-select';

/**
 * Clase para manejar los filtros de logs
 * Hereda de BaseFilter para aprovechar la funcionalidad común
 */
export class LogFilters extends BaseFilter {
  constructor() {
    super('logs');
  }

  /**
   * Configuración específica de filtros para logs
   * @returns {Object} Configuración de filtros
   */
  getFilterConfig() {
    return {
      logLevel: {
        label: 'Nivel',
        isMultiSelect: true,
        optionsMethod: () => this.getLogLevelOptions(),
        cardValueGetter: (card) => this.getLogLevel(card)
      },
      category: {
        label: 'Categoría',
        isMultiSelect: true,
        optionsMethod: () => this.getCategoryOptions(),
        cardValueGetter: (card) => this.getLogCategory(card)
      },
      dateRange: {
        label: 'Período',
        isMultiSelect: true,
        optionsMethod: () => this.getDateRangeOptions(),
        cardValueGetter: (card) => this.getDateRangeFromCard(card)
      },
      source: {
        label: 'Origen',
        isMultiSelect: true,
        optionsMethod: () => this.getSourceOptions(),
        cardValueGetter: (card) => this.getLogSource(card)
      },
      createdBy: {
        label: 'Usuario',
        isMultiSelect: true,
        optionsMethod: () => this.getCreatedByOptions()
      }
    };
  }

  /**
   * Determina el nivel de log basado en el contenido y propiedades
   * @param {HTMLElement} card - Tarjeta de log
   * @returns {string} Nivel del log
   */
  getLogLevel(card) {
    // Si tiene una propiedad level definida
    if (card.level) {
      return card.level.toLowerCase();
    }

    // Inferir del título o contenido
    const content = (card.title || card.message || card.textContent || '').toLowerCase();
    
    if (content.includes('error') || content.includes('failed') || content.includes('exception')) {
      return 'error';
    } else if (content.includes('warning') || content.includes('warn') || content.includes('caution')) {
      return 'warning';
    } else if (content.includes('info') || content.includes('information')) {
      return 'info';
    } else if (content.includes('success') || content.includes('completed') || content.includes('ok')) {
      return 'success';
    }

    return 'info'; // Default
  }

  /**
   * Determina la categoría del log basado en el contenido
   * @param {HTMLElement} card - Tarjeta de log
   * @returns {string} Categoría del log
   */
  getLogCategory(card) {
    // Si tiene una propiedad category definida
    if (card.category) {
      return card.category;
    }

    // Inferir del contenido
    const content = (card.title || card.message || card.textContent || '').toLowerCase();
    
    if (content.includes('user') || content.includes('login') || content.includes('auth')) {
      return 'user-activity';
    } else if (content.includes('system') || content.includes('server') || content.includes('database')) {
      return 'system';
    } else if (content.includes('security') || content.includes('permission') || content.includes('access')) {
      return 'security';
    } else if (content.includes('performance') || content.includes('slow') || content.includes('timeout')) {
      return 'performance';
    } else if (content.includes('api') || content.includes('request') || content.includes('response')) {
      return 'api';
    } else if (content.includes('data') || content.includes('sync') || content.includes('backup')) {
      return 'data';
    }

    return 'general';
  }

  /**
   * Determina el origen del log
   * @param {HTMLElement} card - Tarjeta de log
   * @returns {string} Origen del log
   */
  getLogSource(card) {
    // Si tiene una propiedad source definida
    if (card.source) {
      return card.source;
    }

    // Inferir del contenido o contexto
    const content = (card.title || card.message || card.textContent || '').toLowerCase();
    
    if (content.includes('frontend') || content.includes('client') || content.includes('browser')) {
      return 'frontend';
    } else if (content.includes('backend') || content.includes('server') || content.includes('api')) {
      return 'backend';
    } else if (content.includes('database') || content.includes('db') || content.includes('sql')) {
      return 'database';
    } else if (content.includes('mobile') || content.includes('app')) {
      return 'mobile';
    } else if (content.includes('external') || content.includes('third-party')) {
      return 'external';
    }

    return 'system';
  }

  /**
   * Determina el rango de fechas de un log
   * @param {HTMLElement} card - Tarjeta de log
   * @returns {string} Clasificación temporal
   */
  getDateRangeFromCard(card) {
    // Buscar fecha en diferentes propiedades posibles
    let logDate = card.timestamp || card.createdAt || card.date || card.registerDate;
    
    if (!logDate) {
      return 'sin-fecha';
    }

    const now = new Date();
    const date = new Date(logDate);
    const diffHours = Math.abs(now - date) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      return 'ultima-hora';
    } else if (diffHours < 24) {
      return 'hoy';
    } else if (diffDays <= 1) {
      return 'ayer';
    } else if (diffDays <= 7) {
      return 'esta-semana';
    } else if (diffDays <= 30) {
      return 'este-mes';
    } else if (diffDays <= 90) {
      return 'trimestre';
    } else {
      return 'anterior';
    }
  }

  /**
   * Obtiene las opciones de nivel de log
   * @returns {Promise<Array>} Opciones de nivel
   */
  async getLogLevelOptions() {
    return [
      {
        value: 'error',
        label: 'Error'
      },
      {
        value: 'warning',
        label: 'Warning'
      },
      {
        value: 'info',
        label: 'Info'
      },
      {
        label: 'Debug'
      },
      {
        value: 'success',
        label: 'Success'
      }
    ];
  }

  /**
   * Obtiene las opciones de categoría
   * @returns {Promise<Array>} Opciones de categoría
   */
  async getCategoryOptions() {
    return [
      {
        value: 'user-activity',
        label: 'Actividad de Usuario'
      },
      {
        value: 'system',
        label: 'Sistema'
      },
      {
        value: 'security',
        label: 'Seguridad'
      },
      {
        value: 'performance',
        label: 'Performance'
      },
      {
        value: 'api',
        label: 'API'
      },
      {
        value: 'data',
        label: 'Datos'
      },
      {
        value: 'general',
        label: 'General'
      }
    ];
  }

  /**
   * Obtiene las opciones de rango de fechas
   * @returns {Promise<Array>} Opciones de período
   */
  async getDateRangeOptions() {
    return [
      {
        value: 'ultima-hora',
        label: 'Última Hora'
      },
      {
        value: 'hoy',
        label: 'Hoy'
      },
      {
        value: 'ayer',
        label: 'Ayer'
      },
      {
        value: 'esta-semana',
        label: 'Esta Semana'
      },
      {
        value: 'este-mes',
        label: 'Este Mes'
      },
      {
        value: 'trimestre',
        label: 'Último Trimestre'
      },
      {
        value: 'anterior',
        label: 'Anterior'
      },
      {
        value: 'sin-fecha',
        label: 'Sin Fecha'
      }
    ];
  }

  /**
   * Obtiene las opciones de origen
   * @returns {Promise<Array>} Opciones de origen
   */
  async getSourceOptions() {
    return [
      {
        value: 'frontend',
        label: 'Frontend'
      },
      {
        value: 'backend',
        label: 'Backend'
      },
      {
        value: 'database',
        label: 'Base de Datos'
      },
      {
        value: 'mobile',
        label: 'Mobile'
      },
      {
        value: 'external',
        label: 'Externo'
      },
      {
        value: 'system',
        label: 'Sistema'
      }
    ];
  }

  /**
   * Obtiene las opciones de "creado por"
   * @returns {Promise<Array>} Opciones de usuario
   */
  async getCreatedByOptions() {
    return this.getCreatedByOptionsFromDOM();
  }
}
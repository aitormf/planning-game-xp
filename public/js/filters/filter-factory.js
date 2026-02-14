/**
 * Factory para crear instancias de filtros específicos por tipo de card
 */
export class FilterFactory {
  static filterInstances = new Map();

  /**
   * Crea o retorna una instancia existente de filtro para el tipo especificado
   * @param {string} cardType - Tipo de card (bugs, tasks, epics, sprints, qa, proposals, logs)
   * @returns {Object} Instancia del filtro correspondiente
   */
  static async createFilter(cardType) {
    // Si ya existe una instancia, devolverla
    if (this.filterInstances.has(cardType)) {
      return this.filterInstances.get(cardType);
    }

    try {
      // Cargar dinámicamente la clase del filtro
      const filterClass = await this.loadFilterClass(cardType);
      
      // Crear instancia del filtro
      const filterInstance = new filterClass();
      
      // Guardar la instancia para reutilización
      this.filterInstances.set(cardType, filterInstance);
      
      return filterInstance;
    } catch (error) {
      console.error(`Error creating filter for ${cardType}:`, error);
      throw new Error(`Failed to create filter for card type: ${cardType}`);
    }
  }

  /**
   * Carga dinámicamente la clase de filtro correspondiente
   * @param {string} cardType - Tipo de card
   * @returns {Promise<Class>} Clase del filtro
   */
  static async loadFilterClass(cardType) {
    const filterClassMap = {
      'bugs': () => import('./types/bug-filters.js').then(module => module.BugFilters),
      'tasks': () => import('./types/task-filters.js').then(module => module.TaskFilters),
      'epics': () => import('./types/epic-filters.js').then(module => module.EpicFilters),
      'sprints': () => import('./types/sprint-filters.js').then(module => module.SprintFilters),
      'qa': () => import('./types/qa-filters.js').then(module => module.QAFilters),
      'proposals': () => import('./types/proposal-filters.js').then(module => module.ProposalFilters),
      'logs': () => import('./types/log-filters.js').then(module => module.LogFilters)
    };

    const loader = filterClassMap[cardType];
    if (!loader) {
      throw new Error(`No filter class found for card type: ${cardType}`);
    }

    return await loader();
  }

  /**
   * Configura los filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   * @returns {Promise<Object>} Instancia del filtro configurado
   */
  static async setupFilters(cardType) {
    const filter = await this.createFilter(cardType);
    filter.setupFilters();
    return filter;
  }

  /**
   * Limpia los filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   */
  static async clearFilters(cardType) {
    const filter = await this.createFilter(cardType);
    filter.clearAllFilters();
  }

  /**
   * Resetea los filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   */
  static async resetFilters(cardType) {
    const filter = await this.createFilter(cardType);
    filter.resetFilters();
  }

  /**
   * Aplica filtros para un tipo de card específico
   * @param {string} cardType - Tipo de card
   */
  static async applyFilters(cardType) {
    const filter = await this.createFilter(cardType);
    filter.applyFilters();
  }

  /**
   * Obtiene la instancia del filtro si existe
   * @param {string} cardType - Tipo de card
   * @returns {Object|null} Instancia del filtro o null si no existe
   */
  static getFilterInstance(cardType) {
    return this.filterInstances.get(cardType) || null;
  }

  /**
   * Elimina la instancia del filtro (útil para limpieza de memoria)
   * @param {string} cardType - Tipo de card
   */
  static destroyFilter(cardType) {
    this.filterInstances.delete(cardType);
  }

  /**
   * Limpia todas las instancias de filtros
   */
  static destroyAllFilters() {
    this.filterInstances.clear();
  }

  /**
   * Obtiene la lista de tipos de card soportados
   * @returns {Array<string>} Lista de tipos soportados
   */
  static getSupportedCardTypes() {
    return ['bugs', 'tasks', 'epics', 'sprints', 'qa', 'proposals', 'logs'];
  }

  /**
   * Verifica si un tipo de card es soportado
   * @param {string} cardType - Tipo de card a verificar
   * @returns {boolean} true si es soportado
   */
  static isCardTypeSupported(cardType) {
    return this.getSupportedCardTypes().includes(cardType);
  }
}
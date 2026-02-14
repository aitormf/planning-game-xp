/**
 * Sistema centralizado de gestión de eventos usando event delegation
 * Elimina la necesidad de múltiples event listeners y mejora la performance
 */
export class EventDelegationManager {
  constructor() {
    this.handlers = new Map();
    this.initialized = false;
  }

  /**
   * Inicializa el sistema de event delegation
   */
  init() {
    if (this.initialized) return;

    // Event delegation principal para clicks
    document.addEventListener('click', this.handleGlobalClick.bind(this), true);
    
    // Event delegation para cambios en formularios
    document.addEventListener('change', this.handleGlobalChange.bind(this), true);
    
    // Event delegation para inputs
    document.addEventListener('input', this.handleGlobalInput.bind(this), true);

    this.initialized = true;
}

  /**
   * Registra un handler para un selector específico
   * @param {string} selector - CSS selector
   * @param {string} eventType - Tipo de evento (click, change, input)
   * @param {Function} handler - Función handler
   * @param {Object} options - Opciones adicionales
   */
  register(selector, eventType, handler, options = {}) {
    const key = `${eventType}:${selector}`;
    
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    
    this.handlers.get(key).push({
      handler,
      options,
      priority: options.priority || 0
    });

    // Ordenar handlers por prioridad
    this.handlers.get(key).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Desregistra un handler
   * @param {string} selector - CSS selector
   * @param {string} eventType - Tipo de evento
   * @param {Function} handler - Función handler a remover
   */
  unregister(selector, eventType, handler) {
    const key = `${eventType}:${selector}`;
    const handlers = this.handlers.get(key);
    
    if (handlers) {
      const index = handlers.findIndex(h => h.handler === handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      // Limpiar si no hay más handlers
      if (handlers.length === 0) {
        this.handlers.delete(key);
      }
    }
  }

  /**
   * Maneja todos los clicks globalmente
   */
  handleGlobalClick(event) {
    this.handleEvent(event, 'click');
  }

  /**
   * Maneja todos los cambios globalmente
   */
  handleGlobalChange(event) {
    this.handleEvent(event, 'change');
  }

  /**
   * Maneja todos los inputs globalmente
   */
  handleGlobalInput(event) {
    this.handleEvent(event, 'input');
  }

  /**
   * Procesa un evento y ejecuta los handlers correspondientes
   * @param {Event} event - Evento DOM
   * @param {string} eventType - Tipo de evento
   */
  handleEvent(event, eventType) {
    // Buscar handlers que coincidan con el target o sus ancestros
    for (const [key, handlerList] of this.handlers) {
      const [type, selector] = key.split(':');
      
      if (type !== eventType) continue;

      // Buscar elemento que coincida con el selector
      const matchingElement = event.target.closest(selector);
      
      if (matchingElement) {
        // Ejecutar todos los handlers para este selector
        for (const { handler, options } of handlerList) {
          try {
            const shouldContinue = handler(event, matchingElement);
            
            // Si el handler retorna false, detener propagación
            if (shouldContinue === false) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            
            // Si el handler tiene stopPropagation, detener
            if (options.stopPropagation) {
              event.stopPropagation();
            }
            
            // Si el handler tiene preventDefault, prevenir
            if (options.preventDefault) {
              event.preventDefault();
            }
            
          } catch (error) {
            console.error(`Error in event handler for ${selector}:`, error);
          }
        }
      }
    }
  }

  /**
   * Limpia todos los handlers registrados
   */
  cleanup() {
    this.handlers.clear();
    
    if (this.initialized) {
      document.removeEventListener('click', this.handleGlobalClick.bind(this), true);
      document.removeEventListener('change', this.handleGlobalChange.bind(this), true);
      document.removeEventListener('input', this.handleGlobalInput.bind(this), true);
      this.initialized = false;
    }
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    const stats = {
      totalHandlers: 0,
      handlersByType: {},
      selectors: []
    };

    for (const [key, handlerList] of this.handlers) {
      const [type] = key.split(':');
      stats.totalHandlers += handlerList.length;
      stats.handlersByType[type] = (stats.handlersByType[type] || 0) + handlerList.length;
      stats.selectors.push(key);
    }

    return stats;
  }
}

// Instancia global del manager
export const eventDelegationManager = new EventDelegationManager();
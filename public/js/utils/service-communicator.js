import { generateSecureTestId } from './common-functions.js';

/**
 * ServiceCommunicator - Utility para comunicación con servicios via eventos
 * 
 * Proporciona una interfaz unificada para que los componentes comuniquen
 * con servicios sin tener que importarlos directamente, manteniendo
 * el desacoplamiento total del sistema.
 * 
 * Patrón Request/Response:
 * 1. Componente solicita: request-{serviceType}
 * 2. Servicio responde: provide-{serviceType}-result
 */
export class ServiceCommunicator {
  static DEFAULT_TIMEOUT = 10000; // 10 segundos
  static activeRequests = new Map(); // Tracking de requests activos

  /**
   * Realiza una solicitud a un servicio via eventos
   * @param {string} serviceType - Tipo de servicio (permissions, card-action, etc.)
   * @param {Object} data - Datos de la solicitud
   * @param {number} timeout - Timeout en ms (opcional)
   * @returns {Promise} - Promesa que resuelve con la respuesta del servicio
   */
  static async request(serviceType, data = {}, timeout = ServiceCommunicator.DEFAULT_TIMEOUT) {
    const requestId = generateSecureTestId(serviceType);

    console.log(`[ServiceCommunicator] Requesting ${serviceType}`, {
      requestId,
      action: data.action,
      cardId: data.cardData?.cardId || data.cardId
    });

    // Dispatch del evento de solicitud
    document.dispatchEvent(new CustomEvent(`request-${serviceType}`, {
      detail: {
        requestId,
        timestamp: Date.now(),
        ...data
      },
      bubbles: true,
      composed: true
    }));

    // Crear promesa para la respuesta
    const promise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        ServiceCommunicator.cleanup(requestId, serviceType);
        console.error(`[ServiceCommunicator] Timeout waiting for ${serviceType} response`, {
          requestId,
          timeout,
          action: data.action,
          cardId: data.cardData?.cardId || data.cardId
        });
        reject(new Error(`Service ${serviceType} request timeout (${timeout}ms)`));
      }, timeout);

      const handler = (e) => {
        if (e.detail.requestId === requestId) {
          ServiceCommunicator.cleanup(requestId, serviceType);
          clearTimeout(timeoutId);
          if (e.detail.success !== false) {
            console.log(`[ServiceCommunicator] ${serviceType} succeeded`, { requestId });
            // Consideramos éxito si success no está explícitamente en false
            resolve(e.detail.result || e.detail);
          } else {
            console.error(`[ServiceCommunicator] ${serviceType} failed:`, {
              requestId,
              error: e.detail.error,
              action: data.action
            });
            reject(new Error(e.detail.error || `Service ${serviceType} failed`));
          }
        }
      };
      
      // Registrar el listener y guardar referencia para cleanup
      document.addEventListener(`provide-${serviceType}-result`, handler);
      ServiceCommunicator.activeRequests.set(requestId, {
        serviceType,
        handler,
        timeoutId,
        timestamp: Date.now()
      });
    });

    return promise;
  }

  /**
   * Limpia los recursos asociados con una solicitud
   * @param {string} requestId - ID de la solicitud
   * @param {string} serviceType - Tipo de servicio
   */
  static cleanup(requestId, serviceType) {
    const request = ServiceCommunicator.activeRequests.get(requestId);
    if (request) {
      document.removeEventListener(`provide-${serviceType}-result`, request.handler);
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      ServiceCommunicator.activeRequests.delete(requestId);
    }
  }

  /**
   * Limpia requests que han expirado (housekeeping)
   * @param {number} maxAge - Edad máxima en ms (default: 30 segundos)
   */
  static cleanupExpiredRequests(maxAge = 30000) {
    const now = Date.now();
    const toDelete = [];

    for (const [requestId, request] of ServiceCommunicator.activeRequests) {
      if (now - request.timestamp > maxAge) {
        toDelete.push({ requestId, serviceType: request.serviceType });
      }
    }

    toDelete.forEach(({ requestId, serviceType }) => {
      ServiceCommunicator.cleanup(requestId, serviceType);
    });
  }

  /**
   * @returns {Object} - Estadísticas de requests
   */
  static getStats() {
    const stats = {
      activeRequests: ServiceCommunicator.activeRequests.size,
      requestsByService: {},
      oldestRequest: null
    };

    let oldestTimestamp = Date.now();
    for (const [requestId, request] of ServiceCommunicator.activeRequests) {
      const serviceType = request.serviceType;
      stats.requestsByService[serviceType] = (stats.requestsByService[serviceType] || 0) + 1;
      
      if (request.timestamp < oldestTimestamp) {
        oldestTimestamp = request.timestamp;
        stats.oldestRequest = {
          requestId,
          serviceType,
          age: Date.now() - request.timestamp
        };
      }
    }

    return stats;
  }

  /**
   * Helper específico para solicitudes de permisos
   * @param {string} permissionType - Tipo de permiso (task-permissions, bug-permissions, etc.)
   * @param {Object} data - Datos adicionales para la solicitud
   * @returns {Promise} - Promesa con los permisos
   */
  static async requestPermissions(permissionType, data = {}) {
    return ServiceCommunicator.request('permissions', {
      type: permissionType,
      ...data
    });
  }

  /**
   * Helper específico para acciones de tarjetas
   * @param {string} action - Acción a realizar (save, delete, get, etc.)
   * @param {Object} data - Datos de la tarjeta y opciones
   * @returns {Promise} - Promesa con el resultado
   */
  static async requestCardAction(action, data = {}) {
    return ServiceCommunicator.request('card-action', {
      action,
      ...data
    });
  }

  /**
   * Helper específico para datos globales (como los que maneja GlobalDataManager)
   * @param {string} dataType - Tipo de datos (taskcard-data, bugcard-data, etc.)
   * @param {Object} data - Datos de la solicitud
   * @returns {Promise} - Promesa con los datos solicitados
   */
  static async requestGlobalData(dataType, data = {}) {
    return ServiceCommunicator.request('global-data', {
      type: dataType,
      ...data
    });
  }

  /**
   * Helper específico para inicializar contadores de proyecto
   * @param {string} projectId - ID del proyecto (ej: "Cinema4D", "TestProject")
   * @param {Object} options - Opciones: { dryRun: boolean, force: boolean }
   * @returns {Promise} - Promesa con el resultado de la inicialización
   */
  static async initializeProjectCounters(projectId, options = {}) {
    return ServiceCommunicator.requestCardAction('initializeProjectCounters', {
      projectId,
      options
    });
  }

  /**
   * Inicializa el ServiceCommunicator (setup de housekeeping, etc.)
   */
  static init() {
    // Cleanup periódico cada 30 segundos
    setInterval(() => {
      ServiceCommunicator.cleanupExpiredRequests();
    }, 30000);

    // Log de inicialización
// Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      // Intentionally empty - cleanup happens automatically
    });
  }
}

// Auto-initialize on every page load (View Transitions compatible)
if (typeof window !== 'undefined') {
  document.addEventListener('astro:page-load', () => ServiceCommunicator.init());
}
/**
 * System Requirements Configuration
 *
 * Define los requisitos mínimos del sistema para ejecutar la aplicación.
 * Estos requisitos aseguran una experiencia óptima del usuario.
 */

export const SYSTEM_REQUIREMENTS = {
  // Browser requirements
  browser: {
    // Versiones mínimas de navegadores soportados
    chrome: 90,
    firefox: 88,
    safari: 14,
    edge: 90,
    opera: 76
  },

  // Memory requirements (in MB)
  memory: {
    minimum: 4096, // 4 GB RAM mínimo
    recommended: 8192 // 8 GB RAM recomendado
  },

  // Screen resolution
  screen: {
    minWidth: 1024,
    minHeight: 768,
    recommended: {
      width: 1920,
      height: 1080
    }
  },

  // Required browser features
  features: {
    // APIs requeridas por la aplicación
    required: [
      'indexedDB',
      'localStorage',
      'sessionStorage',
      'serviceWorker',
      'fetch',
      'Promise',
      'WebSocket',
      'customElements', // Para Web Components (Lit)
      'Notification' // Para notificaciones push
    ],
    // APIs opcionales pero recomendadas
    optional: [
      'IntersectionObserver',
      'ResizeObserver',
      'clipboard',
      'geolocation'
    ]
  },

  // Network requirements
  network: {
    minBandwidth: 1, // Mbps - mínimo para funcionalidad básica
    recommendedBandwidth: 5, // Mbps - recomendado para experiencia óptima
    maxLatency: 1000 // ms - latencia máxima aceptable
  },

  // JavaScript requirements
  javascript: {
    enabled: true,
    version: 'ES2018' // ES9 mínimo
  },

  // Hardware acceleration
  hardware: {
    webGL: false, // No requerido pero recomendado para gráficos
    canvas: true // Requerido para charts
  }
};

/**
 * Mensajes de error personalizados para cada tipo de requisito
 */
export const REQUIREMENT_MESSAGES = {
  browser: {
    unsupported: 'Tu navegador no está soportado. Por favor, actualiza a la última versión de Chrome, Firefox, Safari, Edge u Opera.',
    outdated: 'Tu navegador está desactualizado. Por favor, actualiza a la versión {minVersion} o superior.'
  },
  memory: {
    insufficient: 'Tu dispositivo no tiene suficiente memoria RAM. Se requieren al menos {minMemory} GB para una experiencia óptima.'
  },
  screen: {
    tooSmall: 'Tu pantalla es demasiado pequeña. Se requiere una resolución mínima de {minWidth}x{minHeight} píxeles.',
    warning: 'Tu pantalla es pequeña. Para una mejor experiencia, se recomienda una resolución de {recWidth}x{recHeight} píxeles.'
  },
  features: {
    missing: 'Tu navegador no soporta características necesarias: {features}. Por favor, actualiza tu navegador.',
    optional: 'Algunas características opcionales no están disponibles: {features}. La aplicación funcionará, pero con funcionalidad limitada.'
  },
  network: {
    slow: 'Tu conexión a internet es lenta. Se recomienda al menos {minBandwidth} Mbps para una experiencia óptima.',
    offline: 'No se detectó conexión a internet. Algunas funciones pueden no estar disponibles.'
  },
  javascript: {
    disabled: 'JavaScript está deshabilitado. Esta aplicación requiere JavaScript para funcionar.'
  },
  hardware: {
    noCanvas: 'Tu navegador no soporta Canvas. Los gráficos pueden no mostrarse correctamente.',
    noWebGL: 'WebGL no está disponible. Algunos gráficos avanzados pueden no funcionar correctamente.'
  }
};

/**
 * Niveles de severidad para requisitos no cumplidos
 */
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical', // Bloquea el uso de la aplicación
  WARNING: 'warning',   // Permite usar la app pero con advertencias
  INFO: 'info'          // Solo informativo, no afecta funcionalidad
};

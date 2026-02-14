# System Requirements Setup Guide

## Overview

Esta guía explica cómo se ha implementado el sistema de verificación de requisitos del sistema en Planning Game XP y cómo personalizarlo según las necesidades.

## Estructura de Archivos

```
/public/js/
├── config/
│   └── system-requirements-config.js    # Configuración de requisitos mínimos
├── services/
│   └── system-requirements-service.js   # Servicio de verificación
├── wc/
│   ├── SystemRequirementsChecker.js     # Componente UI (modal)
│   └── SystemRequirementsChecker.styles.js  # Estilos del componente
└── main.js                               # Integración en el bootstrap

/docs/
└── SYSTEM_REQUIREMENTS_SETUP.md         # Esta guía

SYSTEM_REQUIREMENTS.md                    # Documentación completa para usuarios
```

## Flujo de Verificación

```
1. Usuario carga la aplicación
   ↓
2. DOMContentLoaded dispara initializeApplication()
   ↓
3. Se llama a checkSystemRequirements()
   ↓
4. systemRequirementsService.checkAllRequirements()
   Verifica:
   - Navegador y versión
   - Memoria RAM disponible
   - Resolución de pantalla
   - APIs del navegador (IndexedDB, Service Worker, etc.)
   - Conectividad de red
   - Capacidades de hardware (Canvas, WebGL)
   ↓
5. ¿Hay problemas o advertencias?
   │
   ├─ NO → Continuar con la inicialización normal
   │       (no se muestra ningún modal)
   │
   └─ SÍ → Mostrar SystemRequirementsChecker modal
           ↓
           Usuario revisa los detalles
           ↓
           ¿Es un problema crítico?
           │
           ├─ SÍ → Bloquear inicio de app
           │       (botón "Cerrar" solamente)
           │
           └─ NO → Permitir continuar con advertencia
                   (botón "Continuar de Todas Formas")
```

## Personalización de Requisitos

### Modificar Versiones de Navegadores

Edita `/public/js/config/system-requirements-config.js`:

```javascript
export const SYSTEM_REQUIREMENTS = {
  browser: {
    chrome: 95,    // Incrementar versión mínima de Chrome
    firefox: 90,   // Incrementar versión mínima de Firefox
    safari: 15,    // Incrementar versión mínima de Safari
    edge: 95,      // Incrementar versión mínima de Edge
    opera: 80      // Incrementar versión mínima de Opera
  },
  // ... resto de configuración
};
```

### Modificar Requisitos de Memoria

```javascript
memory: {
  minimum: 8192,      // Cambiar a 8 GB mínimo
  recommended: 16384  // Cambiar a 16 GB recomendado
}
```

### Modificar Resolución de Pantalla

```javascript
screen: {
  minWidth: 1280,   // Cambiar resolución mínima
  minHeight: 720,
  recommended: {
    width: 2560,    // Cambiar resolución recomendada
    height: 1440
  }
}
```

### Añadir Nuevas Verificaciones de APIs

```javascript
features: {
  required: [
    'indexedDB',
    'localStorage',
    // ... APIs existentes ...
    'MediaDevices',  // NUEVA API REQUERIDA
    'RTCPeerConnection'  // NUEVA API REQUERIDA
  ],
  optional: [
    'IntersectionObserver',
    // ... APIs existentes ...
    'BarcodeDetector'  // NUEVA API OPCIONAL
  ]
}
```

Luego, añade la verificación en el servicio:

```javascript
// En /public/js/services/system-requirements-service.js

hasFeature(feature) {
  const featureChecks = {
    // ... checks existentes ...
    'MediaDevices': () => 'mediaDevices' in navigator,
    'RTCPeerConnection': () => 'RTCPeerConnection' in window,
    'BarcodeDetector': () => 'BarcodeDetector' in window
  };

  const check = featureChecks[feature];
  return check ? check() : false;
}
```

### Personalizar Mensajes de Error

Edita `REQUIREMENT_MESSAGES` en el archivo de configuración:

```javascript
export const REQUIREMENT_MESSAGES = {
  browser: {
    unsupported: 'Tu navegador no es compatible con nuestra aplicación.',
    outdated: 'Por favor actualiza tu navegador a la versión {minVersion}.'
  },
  memory: {
    insufficient: 'Se requieren {minMemory} GB de RAM para ejecutar la aplicación.'
  },
  // ... personalizar otros mensajes ...
};
```

## Niveles de Severidad

El sistema usa tres niveles de severidad:

### CRITICAL (Crítico)
- **Comportamiento**: Bloquea completamente el uso de la aplicación
- **UI**: Muestra botón "Cerrar" (no permite continuar)
- **Color**: Rojo
- **Uso**: Para requisitos absolutamente necesarios (ej: APIs críticas, navegador obsoleto)

```javascript
this.addResult({
  category: 'features',
  severity: SEVERITY_LEVELS.CRITICAL,
  passed: false,
  message: 'Tu navegador no soporta características críticas',
  details: { missing: ['indexedDB', 'serviceWorker'] }
});
```

### WARNING (Advertencia)
- **Comportamiento**: Permite usar la app pero muestra advertencia
- **UI**: Muestra botón "Continuar de Todas Formas"
- **Color**: Naranja
- **Uso**: Para requisitos recomendados pero no críticos (ej: poca RAM, pantalla pequeña)

```javascript
this.addResult({
  category: 'memory',
  severity: SEVERITY_LEVELS.WARNING,
  passed: false,
  message: 'Tu dispositivo tiene poca memoria RAM',
  details: { available: '4 GB', recommended: '8 GB' }
});
```

### INFO (Informativo)
- **Comportamiento**: Solo muestra información, no afecta funcionalidad
- **UI**: No bloquea ni advierte (solo visible en "Ver Detalles")
- **Color**: Azul
- **Uso**: Para información del sistema o características opcionales

```javascript
this.addResult({
  category: 'features',
  severity: SEVERITY_LEVELS.INFO,
  passed: true,
  message: 'WebGL disponible para gráficos avanzados',
  details: { webgl: true }
});
```

## Desactivar Verificación Temporalmente

### Para Desarrollo Local

Edita `/public/js/main.js` y comenta la verificación:

```javascript
async function initializeApplication() {
  try {
    // COMENTAR SOLO EN DESARROLLO
    // const canProceed = await checkSystemRequirements();
    // if (!canProceed) {
    //   sinsole.error('Cannot proceed with application initialization');
    //   return;
    // }

    FirebaseService.init();
    historyService.init();
    window.appController = await AppController.create();
  } catch (error) {
    // ...
  }
}
```

⚠️ **IMPORTANTE**: NUNCA desactives esto en producción. Solo para debugging local.

### Para Testing Automatizado

Puedes crear una variable de entorno o flag:

```javascript
async function initializeApplication() {
  try {
    // Solo verificar si no estamos en modo de testing
    if (!window.SKIP_SYSTEM_CHECK) {
      const canProceed = await checkSystemRequirements();
      if (!canProceed) return;
    }

    // ... resto de inicialización
  }
}
```

## Añadir Verificaciones Personalizadas

### Ejemplo: Verificar Cámara Web

1. **Añadir a la configuración**:

```javascript
// /public/js/config/system-requirements-config.js
features: {
  required: [
    // ... features existentes ...
    'MediaDevices'  // Añadir MediaDevices
  ]
}
```

2. **Añadir verificación al servicio**:

```javascript
// /public/js/services/system-requirements-service.js

async checkCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    this.addResult({
      category: 'hardware',
      severity: SEVERITY_LEVELS.CRITICAL,
      passed: false,
      message: 'Tu dispositivo no tiene cámara web o no está disponible',
      details: { hasCamera: false }
    });
    return;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');

    if (!hasCamera) {
      this.addResult({
        category: 'hardware',
        severity: SEVERITY_LEVELS.WARNING,
        passed: false,
        message: 'No se detectó ninguna cámara web',
        details: { hasCamera: false }
      });
    } else {
      this.addResult({
        category: 'hardware',
        severity: SEVERITY_LEVELS.INFO,
        passed: true,
        message: 'Cámara web detectada',
        details: { hasCamera: true }
      });
    }
  } catch (error) {
    this.addResult({
      category: 'hardware',
      severity: SEVERITY_LEVELS.WARNING,
      passed: false,
      message: 'No se pudo verificar la cámara web',
      details: { error: error.message }
    });
  }
}
```

3. **Llamar en checkAllRequirements**:

```javascript
async checkAllRequirements() {
  // ... verificaciones existentes ...

  await this.checkCamera();  // AÑADIR AQUÍ

  const summary = this.getCheckSummary();
  return summary;
}
```

## Testing

### Test Manual

1. Abrir la aplicación en un navegador moderno → No debería mostrar ningún modal
2. Abrir con User Agent de navegador antiguo → Debería mostrar error crítico
3. Simular pantalla pequeña (DevTools) → Debería mostrar advertencia

### Test con Navegadores Antiguos

Para probar con navegadores antiguos sin instalarlos:

```javascript
// En la consola del navegador (DevTools)

// Simular Chrome 80 (versión antigua)
Object.defineProperty(navigator, 'userAgent', {
  get: function() { return 'Chrome/80.0.0.0'; },
  configurable: true
});

// Recargar la página para que se ejecute la verificación
location.reload();
```

### Test de APIs Faltantes

```javascript
// Simular que IndexedDB no está disponible
delete window.indexedDB;
location.reload();
```

## Debugging

### Ver Resultados de Verificación en Consola

Los resultados se logean automáticamente:

```javascript
sinsole.log('System requirements check:', checkResults);
sinsole.log('System info:', systemInfo);
```

### Forzar Mostrar Modal

Para probar el modal incluso cuando todo es compatible:

```javascript
// En /public/js/main.js, línea 47
// Cambiar:
if (!checkResults.canRun || checkResults.hasWarnings) {

// Por:
if (true) {  // SIEMPRE MOSTRAR MODAL PARA TESTING
```

## Despliegue

### Pre-deploy Checklist

- [ ] Verificar que `checkSystemRequirements()` está activo en `main.js`
- [ ] Revisar configuración en `system-requirements-config.js`
- [ ] Probar en múltiples navegadores (Chrome, Firefox, Safari, Edge)
- [ ] Probar en diferentes resoluciones de pantalla
- [ ] Verificar mensajes de error son claros para usuarios finales
- [ ] Build exitoso: `npm run build`
- [ ] No hay errores en consola del navegador

### Versionado

Cuando modifiques requisitos, considera:

1. **Incrementar versión MAJOR** si añades requisitos críticos nuevos
2. **Incrementar versión MINOR** si incrementas versiones de navegadores
3. **Incrementar versión PATCH** si solo ajustas mensajes o estilos

## Soporte y Mantenimiento

### Actualizar Requisitos Regularmente

Revisa y actualiza los requisitos cada 6 meses:

- [ ] Verificar estadísticas de uso de navegadores
- [ ] Actualizar versiones mínimas según soporte del proveedor
- [ ] Revisar APIs obsoletas (deprecated)
- [ ] Añadir verificaciones para nuevas funcionalidades

### Monitoreo

Considera añadir analytics para rastrear:

- Cuántos usuarios ven el modal de requisitos
- Qué requisitos fallan más frecuentemente
- Navegadores y versiones más utilizados
- Usuarios que no pueden continuar (problemas críticos)

```javascript
// Ejemplo de tracking
if (!checkResults.canRun) {
  // Enviar evento a analytics
  analytics.track('system_requirements_failed', {
    critical: checkResults.critical.map(c => c.category),
    browser: systemInfo.browser,
    // ... otros datos relevantes
  });
}
```

## Referencias

- **Package**: [system-capabilities](https://www.npmjs.com/package/system-capabilities)
- **Browser Support**: [Can I Use](https://caniuse.com/)
- **ES2018 Features**: [MDN ES2018](https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/ECMAScript_2018)

## FAQ

### ¿Por qué no usar modernizr?

`system-capabilities` es más ligero y moderno. Modernizr es más completo pero también más pesado. Para nuestras necesidades, `system-capabilities` es suficiente.

### ¿Puedo desactivar la verificación para usuarios específicos?

Sí, puedes añadir una verificación basada en rol o email:

```javascript
async function checkSystemRequirements() {
  const userEmail = document.body.dataset.userEmail;
  const skipList = ['admin@example.com', 'test@example.com'];

  if (skipList.includes(userEmail)) {
    sinsole.log('Skipping system check for whitelisted user');
    return true;
  }

  // ... resto de verificación normal
}
```

### ¿Afecta el rendimiento?

No significativamente. La verificación toma ~100-300ms en promedio y solo se ejecuta una vez al cargar la página.

### ¿Funciona en modo offline?

Sí, la mayoría de verificaciones funcionan offline. Solo la verificación de red requiere conectividad, pero usa fallbacks si no está disponible.

---

**Última actualización**: 2025-11-11
**Versión**: 1.11.0

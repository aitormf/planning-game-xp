# System Requirements

Este documento describe los requisitos mínimos del sistema para ejecutar Planning Game XP.

## Requisitos del Navegador

### Navegadores Soportados

La aplicación verifica automáticamente la versión del navegador al iniciar. Los navegadores soportados incluyen:

- **Google Chrome**: versión 90 o superior
- **Mozilla Firefox**: versión 88 o superior
- **Safari**: versión 14 o superior
- **Microsoft Edge**: versión 90 o superior
- **Opera**: versión 76 o superior

### Actualización del Navegador

Si tu navegador no cumple con la versión mínima, recibirás una advertencia al iniciar la aplicación. Se recomienda encarecidamente actualizar a la última versión disponible para garantizar la mejor experiencia y seguridad.

## Requisitos de Hardware

### Memoria RAM

- **Mínimo**: 4 GB
- **Recomendado**: 8 GB o superior

La aplicación utiliza la API `navigator.deviceMemory` para detectar la memoria disponible. Si tu dispositivo tiene menos de 4 GB de RAM, recibirás una advertencia, pero aún podrás usar la aplicación.

### Resolución de Pantalla

- **Mínimo**: 1024 x 768 píxeles
- **Recomendado**: 1920 x 1080 píxeles (Full HD) o superior

La aplicación está optimizada para pantallas de escritorio. Pantallas más pequeñas pueden mostrar una advertencia pero seguirán siendo funcionales.

### Procesador

- **Núcleos recomendados**: 2 o más núcleos
- La aplicación detecta automáticamente el número de núcleos mediante `navigator.hardwareConcurrency`

## Requisitos de Red

### Conectividad

- **Conexión a Internet**: Requerida
- **Velocidad mínima**: 1 Mbps
- **Velocidad recomendada**: 5 Mbps o superior
- **Latencia máxima**: 1000 ms

La aplicación utiliza Firebase Realtime Database, por lo que una conexión estable es esencial para el funcionamiento correcto.

### Tipos de Conexión Soportados

- ✅ 4G/LTE
- ✅ WiFi
- ✅ Cable (Ethernet)
- ⚠️ 3G (funcional pero con rendimiento limitado)
- ❌ 2G/slow-2G (no recomendado)

## Características del Navegador Requeridas

La aplicación verifica automáticamente la disponibilidad de las siguientes APIs y características:

### Requeridas (Críticas)

Estas características son **obligatorias** para el funcionamiento de la aplicación:

- **IndexedDB**: Para almacenamiento local de datos
- **LocalStorage**: Para preferencias del usuario
- **SessionStorage**: Para datos de sesión temporal
- **Service Worker**: Para caché y funcionalidad offline
- **Fetch API**: Para comunicación con el servidor
- **Promises**: Para operaciones asíncronas
- **WebSocket**: Para comunicación en tiempo real
- **Custom Elements**: Para Web Components (Lit)
- **Notification API**: Para notificaciones push
- **Canvas**: Para renderizado de gráficos

Si alguna de estas características no está disponible, la aplicación mostrará un error crítico y no permitirá continuar.

### Opcionales (Recomendadas)

Estas características mejoran la experiencia pero no son obligatorias:

- **IntersectionObserver**: Para carga lazy de contenido
- **ResizeObserver**: Para detección de cambios de tamaño
- **Clipboard API**: Para copiar/pegar avanzado
- **Geolocation API**: Para características basadas en ubicación
- **WebGL**: Para gráficos avanzados (opcional)

Si estas características no están disponibles, recibirás una advertencia informativa pero podrás continuar usando la aplicación.

## Requisitos de JavaScript

- **JavaScript habilitado**: Obligatorio
- **Versión ECMAScript**: ES2018 (ES9) o superior

La aplicación utiliza características modernas de JavaScript como:
- Async/Await
- Generadores asíncronos
- Rest/Spread properties
- Módulos ES6
- Classes

## Verificación Automática

La aplicación incluye un sistema de verificación automática que se ejecuta al iniciar:

1. **Al cargar la página**: Se verifican todos los requisitos del sistema
2. **Resultados posibles**:
   - ✅ **Sistema Compatible**: No se muestra ninguna advertencia, la aplicación se inicia normalmente
   - ⚠️ **Advertencias**: Se muestra un modal con advertencias, pero puedes continuar
   - ❌ **Requisitos Críticos No Cumplidos**: Se muestra un error y no puedes continuar

### Modal de Verificación

Cuando hay problemas o advertencias, verás un modal con:

- **Resumen de verificaciones**: Cantidad de verificaciones realizadas, cumplidas, críticas y advertencias
- **Problemas críticos**: Lista de requisitos obligatorios no cumplidos
- **Advertencias**: Lista de requisitos recomendados no cumplidos
- **Información del sistema**: Detalles técnicos de tu dispositivo
- **Opciones**:
  - Ver detalles técnicos completos
  - Continuar (si no hay problemas críticos)
  - Cerrar (si hay problemas críticos)

## Configuración Personalizada

Los administradores pueden ajustar los requisitos mínimos editando el archivo:

```
/public/js/config/system-requirements-config.js
```

### Ejemplo de Configuración

```javascript
export const SYSTEM_REQUIREMENTS = {
  browser: {
    chrome: 90,    // Versión mínima de Chrome
    firefox: 88,   // Versión mínima de Firefox
    safari: 14,    // Versión mínima de Safari
    edge: 90,      // Versión mínima de Edge
    opera: 76      // Versión mínima de Opera
  },

  memory: {
    minimum: 4096,      // 4 GB mínimo
    recommended: 8192   // 8 GB recomendado
  },

  screen: {
    minWidth: 1024,
    minHeight: 768,
    recommended: {
      width: 1920,
      height: 1080
    }
  },

  network: {
    minBandwidth: 1,           // Mbps
    recommendedBandwidth: 5,   // Mbps
    maxLatency: 1000           // ms
  }
};
```

## Solución de Problemas

### "Tu navegador no está soportado"

**Solución**: Actualiza tu navegador a la última versión o utiliza uno de los navegadores soportados listados arriba.

### "Tu dispositivo no tiene suficiente memoria RAM"

**Solución**:
- Cierra otras aplicaciones para liberar memoria
- Considera utilizar un dispositivo con más RAM
- La aplicación seguirá funcionando pero con posible rendimiento reducido

### "Tu pantalla es demasiado pequeña"

**Solución**:
- Utiliza un monitor con mayor resolución
- Ajusta el zoom del navegador (Ctrl + Rueda del ratón)
- La aplicación seguirá siendo funcional en pantallas pequeñas

### "Tu navegador no soporta características necesarias"

**Solución**:
- Actualiza tu navegador a la última versión
- Verifica que JavaScript está habilitado
- Si usas extensiones, desactívalas temporalmente para probar
- Considera cambiar a un navegador moderno

### "Tu conexión a internet es lenta"

**Solución**:
- Verifica tu conexión a internet
- Cambia a una conexión más rápida si es posible
- Cierra otras aplicaciones que usen internet
- La aplicación funcionará pero puede ser más lenta

## Información Técnica

### Paquetes Utilizados

- **system-capabilities**: ^1.x.x - Para detección de capacidades del sistema

### Archivos Relacionados

- `/public/js/config/system-requirements-config.js` - Configuración de requisitos
- `/public/js/services/system-requirements-service.js` - Servicio de verificación
- `/public/js/wc/SystemRequirementsChecker.js` - Componente UI del modal
- `/public/js/wc/SystemRequirementsChecker.styles.js` - Estilos del componente

### Flujo de Verificación

```
1. DOMContentLoaded
   ↓
2. initializeApplication()
   ↓
3. checkSystemRequirements()
   ↓
4. systemRequirementsService.checkAllRequirements()
   ↓
5. Verificar: navegador, memoria, pantalla, características, red, hardware
   ↓
6. ¿Problemas críticos o advertencias?
   ├─ SÍ → Mostrar modal SystemRequirementsChecker
   │   ↓
   │   Usuario revisa y decide
   │   ↓
   │   ¿Puede continuar?
   │   ├─ SÍ → Continuar inicialización
   │   └─ NO → Detener, mostrar error
   │
   └─ NO → Continuar inicialización directamente
       ↓
7. FirebaseService.init()
   ↓
8. AppController.create()
   ↓
9. Aplicación lista
```

## Notas para Desarrolladores

### Desactivar Verificación en Desarrollo

Si necesitas desactivar temporalmente la verificación durante el desarrollo, puedes comentar la llamada en `/public/js/main.js`:

```javascript
async function initializeApplication() {
  try {
    // COMENTAR TEMPORALMENTE SOLO EN DESARROLLO
    // const canProceed = await checkSystemRequirements();
    // if (!canProceed) return;

    FirebaseService.init();
    historyService.init();
    window.appController = await AppController.create();
  } catch (error) {
    sinsole.error('Error initializing application:', error);
  }
}
```

**⚠️ IMPORTANTE**: No desactives la verificación en producción.

### Añadir Nuevas Verificaciones

Para añadir nuevas verificaciones, edita:

1. **Configuración**: `/public/js/config/system-requirements-config.js`
2. **Servicio**: Añade método en `/public/js/services/system-requirements-service.js`
3. **Mensajes**: Añade mensajes de error en `REQUIREMENT_MESSAGES`

Ejemplo:

```javascript
// En system-requirements-service.js
checkNewFeature() {
  const hasFeature = /* tu verificación */;

  if (!hasFeature) {
    this.addResult({
      category: 'myCategory',
      severity: SEVERITY_LEVELS.WARNING,
      passed: false,
      message: 'Tu mensaje de error aquí',
      details: { /* detalles técnicos */ }
    });
  }
}

// Llamar en checkAllRequirements()
async checkAllRequirements() {
  // ... verificaciones existentes ...
  this.checkNewFeature();
  // ...
}
```

## Soporte

Para problemas relacionados con requisitos del sistema:

1. Verifica que tu navegador esté actualizado
2. Revisa la consola del navegador (F12) para errores detallados
3. Contacta al equipo de soporte con:
   - Información del navegador y versión
   - Captura de pantalla del modal de verificación
   - Detalles técnicos del modal (expandir detalles)

## Changelog

### v1.11.0 (2025-11-11)
- ✨ Implementación inicial del sistema de verificación de requisitos
- ✨ Añadido paquete `system-capabilities`
- ✨ Componente visual SystemRequirementsChecker
- ✨ Servicio de verificación automática al inicio
- ✨ Configuración personalizable de requisitos mínimos

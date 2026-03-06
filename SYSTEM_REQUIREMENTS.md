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

- **system-capabilities**: ^2.0.0
- **@system-capabilities/lit**: ^1.1.1

### Archivos Relacionados

- `/public/js/config/system-requirements-config.js` - Configuración de requisitos minimos

> **Nota**: El servicio de verificacion automatica al inicio (`system-requirements-service.js`) y el componente UI (`SystemRequirementsChecker.js`) fueron eliminados. Actualmente la configuracion existe como referencia pero no se ejecuta verificacion runtime al cargar la app.

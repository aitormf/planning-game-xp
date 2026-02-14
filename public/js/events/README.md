# Sistema de Eventos Unificado

Este directorio contiene el nuevo sistema unificado de eventos que reemplaza el sistema duplicado anterior.

## Archivos del Sistema Unificado

### Archivos Principales
- **`unified-event-system.js`** - Sistema principal que combina EventBus + EventHandlers
- **`event-constants.js`** - Constantes centralizadas de todos los eventos
- **`dom-update-functions.js`** - Funciones complejas de actualización del DOM
- **`index.js`** - Punto de entrada del módulo

### Archivos Eliminados
Los siguientes archivos han sido eliminados al completar el refactoring:
- **`event-bus.js`** - ✅ ELIMINADO - Reemplazado por sistema unificado
- **`event-handlers.js`** - ✅ ELIMINADO - Reemplazado por sistema unificado
- **`../lib/eventHandlers.js`** - ✅ ELIMINADO - Funcionalidad migrada a sistema unificado
- **`../lib/data-cards.js`** - ✅ ELIMINADO - Datos hardcodeados obsoletos

## Uso del Sistema Unificado

### Importación
```javascript
// Método recomendado - importar desde index.js
import { eventBus, EVENT_BUS_EVENTS, DOM_EVENTS } from '/js/events/index.js';

// O importar componentes específicos
import { UnifiedEventSystem } from '/js/events/unified-event-system.js';
import { EVENT_BUS_EVENTS } from '/js/events/event-constants.js';
```

### EventBus (Pub/Sub)
```javascript
// Emitir evento
eventBus.emit(EVENT_BUS_EVENTS.KANBAN_CARD_CLICKED, { card: cardData });

// Escuchar evento
eventBus.on(EVENT_BUS_EVENTS.PROJECT_CHANGED, (data) => {
  console.log('Proyecto cambiado:', data);
});

// Escuchar evento una vez
eventBus.once(EVENT_BUS_EVENTS.TAB_CHANGED, (data) => {
  console.log('Tab cambió:', data);
});

// Desuscribirse
eventBus.off(EVENT_BUS_EVENTS.PROJECT_CHANGED, handler);
```

### Eventos del DOM
```javascript
// Los eventos del DOM se manejan automáticamente por el sistema unificado
document.dispatchEvent(new CustomEvent(DOM_EVENTS.SAVE_CARD, {
  detail: { cardData: myCard }
}));

document.dispatchEvent(new CustomEvent(DOM_EVENTS.RELOAD_ALL_CARDS));
```

### Acceso desde AppController
```javascript
// El AppController tiene métodos de conveniencia
const appController = window.appController;

// Emitir evento
appController.emitEvent(EVENT_BUS_EVENTS.PROJECT_CHANGED, projectData);

// Escuchar evento
appController.onEvent(EVENT_BUS_EVENTS.TAB_CHANGED, (data) => {
  // Manejar cambio de tab
});

// Acceso directo al EventBus
const eventBus = appController.getEventBus();
```

## Eventos Disponibles

### EventBus (Pub/Sub)
- `EVENT_BUS_EVENTS.KANBAN_CARD_CLICKED` - Click en card del kanban
- `EVENT_BUS_EVENTS.SPRINT_TASK_CLICKED` - Click en tarea del sprint
- `EVENT_BUS_EVENTS.TAB_CHANGED` - Cambio de tab
- `EVENT_BUS_EVENTS.PROJECT_CHANGED` - Cambio de proyecto

### DOM Events (CustomEvents)
- `DOM_EVENTS.SAVE_CARD` - Guardar card
- `DOM_EVENTS.DELETE_CARD` - Borrar card
- `DOM_EVENTS.CREATE_TASK` - Crear tarea
- `DOM_EVENTS.RELOAD_ALL_CARDS` - Recargar todas las cards
- `DOM_EVENTS.REFRESH_CARDS_VIEW` - Refrescar vista de cards
- `DOM_EVENTS.CARDS_RENDERED` - Cards renderizadas
- `DOM_EVENTS.CARD_SAVED` - Card guardada
- `DOM_EVENTS.USER_LOGGED_IN` - Usuario logueado
- `DOM_EVENTS.USER_LOGGED_OUT` - Usuario deslogueado
- Y muchos más...

## Funcionalidades Principales

### 1. EventBus Mejorado
- Manejo de errores integrado
- Modo debug opcional
- Métodos de introspección (getRegisteredEvents)
- Cleanup automático

### 2. Handlers Unificados
- Todos los handlers en un solo lugar
- Configuración automática al inicializar
- Compatibilidad con AppController

### 3. Actualización Eficiente del DOM
- Actualización específica sin recargar toda la vista
- Cache inteligente de tablas
- Actualización de componentes dependientes
- Repintado selectivo de elementos

### 4. Gestión Centralizada de Eventos
- Constantes centralizadas
- Documentación integrada
- Control de propagación automático

## Migración desde Sistema Anterior

### Archivos Eliminados en el Refactoring
Los siguientes archivos han sido completamente eliminados y su funcionalidad migrada:

#### event-bus.js → unified-event-system.js
```javascript
// ANTES (ELIMINADO)
import { eventBus } from '/js/events/event-bus.js';

// DESPUÉS (ACTUAL)
import { eventBus } from '/js/events/index.js';
```

#### event-handlers.js → unified-event-system.js
```javascript
// ANTES (ELIMINADO)
import { EventHandlers } from '/js/events/event-handlers.js';
const handlers = new EventHandlers(appController);

// DESPUÉS (ACTUAL)
// Los handlers se inicializan automáticamente en AppController
// No se necesita inicialización manual
```

#### lib/eventHandlers.js → unified-event-system.js + dom-update-functions.js
```javascript
// ANTES (ELIMINADO)
import '/js/lib/eventHandlers.js'; // Solo importar para side effects

// DESPUÉS (ACTUAL)
// Los handlers se inicializan automáticamente en AppController
// Las funciones están disponibles en dom-update-functions.js si se necesitan
```

#### lib/data-cards.js → Eliminado (datos hardcodeados obsoletos)
```javascript
// ANTES (ELIMINADO)
import { dataCards, columnsList } from '/js/lib/data-cards.js';

// DESPUÉS (ACTUAL)
// Los datos ahora se obtienen dinámicamente de Firebase
// No hay datos hardcodeados en el código
```

## Beneficios del Sistema Unificado

1. **Eliminación de Duplicación**: Un solo punto de verdad para eventos
2. **Mantenimiento Simplificado**: Todos los handlers en un lugar
3. **Mejor Performance**: Actualización eficiente del DOM
4. **Mejor Debug**: Logging integrado y modo debug
5. **Tipo Safety**: Constantes centralizadas evitan errores de strings
6. **Limpieza Automática**: Gestión automática de memory leaks

## Configuración de Debug

```javascript
// Habilitar modo debug para ver logs detallados
const eventSystem = new UnifiedEventSystem();
eventSystem.eventBus.setDebugMode(true);
```

## Notas de Compatibilidad

- Los archivos antiguos están marcados como `@deprecated` pero siguen funcionando
- El sistema unificado es compatible con toda la funcionalidad existente
- Se recomienda migrar gradualmente, archivo por archivo
- Los archivos deprecados se eliminarán en versiones futuras
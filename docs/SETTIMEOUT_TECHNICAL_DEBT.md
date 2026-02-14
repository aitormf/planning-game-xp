# Deuda Técnica: Uso de setTimeout para Sincronización

## Resumen Ejecutivo

El código actual usa `setTimeout` como mecanismo de sincronización en **103 lugares**, lo cual es una práctica incorrecta que:
- Crea condiciones de carrera impredecibles
- Hace el código frágil y difícil de depurar
- Introduce latencia artificial innecesaria
- Oculta problemas de arquitectura subyacentes

## Categorías de Uso

### 1. **CRÍTICO: Sincronización de Componentes (view-factory.js)**

**Problema:** Se usan `setTimeout` para "esperar" a que componentes estén listos.

```javascript
// view-factory.js:812-814
setTimeout(() => {
  this.showFilters('tasks');
}, 100);
```

**Por qué está mal:**
- 100ms es arbitrario - puede ser mucho o poco según la carga del sistema
- No hay garantía de que el componente esté realmente listo
- Causa la creación duplicada de filtros cuando dos timeouts coinciden

**Solución correcta:**
```javascript
// Usar eventos del ciclo de vida de Lit
this.tableViewManager.renderTasksTableView(container, config);

// Opción A: Esperar evento de render completo
container.addEventListener('table-rendered', () => {
  this.showFilters('tasks');
}, { once: true });

// Opción B: Usar promesa con updateComplete de Lit
await this.tableViewManager.renderTasksTableView(container, config);
this.showFilters('tasks');
```

### 2. **CRÍTICO: Inicialización de Filtros (BaseFilters.js)**

**Problema:**
```javascript
// BaseFilters.js:59-63
connectedCallback() {
  super.connectedCallback();
  setTimeout(async () => {
    this._loadFilterOptions();
  }, 0);
}
```

**Por qué está mal:**
- `setTimeout(fn, 0)` pone el código al final de la cola de eventos
- No garantiza que los datos globales estén disponibles
- Se llama múltiples veces cuando se crean componentes duplicados

**Solución correcta:**
```javascript
async connectedCallback() {
  super.connectedCallback();
  await this.updateComplete; // Esperar render de Lit
  await GlobalDataManager.ready(); // Esperar datos globales
  this._loadFilterOptions();
}
```

### 3. **CRÍTICO: Setup de Filtros (app-controller.js)**

**Problema:**
```javascript
// app-controller.js:647
if (view === 'list') {
  setTimeout(() => this.setupTaskFilters(), 100);
}
```

**Por qué está mal:**
- Cada `toggleTaskView` programa un nuevo timeout
- Si se llama varias veces rápidamente, se crean múltiples filtros
- 100ms es arbitrario

**Solución correcta:**
```javascript
// Usar un flag o cancelar timeouts anteriores
toggleTaskView(view) {
  // Cancelar setup anterior si existe
  if (this._filterSetupPending) {
    clearTimeout(this._filterSetupPending);
  }

  this.viewFactory.switchView(view, 'tasks', this.config);

  if (view === 'list') {
    // Mejor: usar evento
    document.addEventListener('view-ready', () => {
      this.setupTaskFilters();
    }, { once: true });
  }
}
```

### 4. **MEDIO: Restaurar Estado de URL (app-controller.js)**

**Problema:**
```javascript
// app-controller.js:138-145
if (urlState.filters && Object.keys(urlState.filters).length > 0) {
  setTimeout(() => {
    this._restoreFiltersFromUrl(urlState.filters);
  }, 500);
}
```

**Por qué está mal:**
- 500ms es arbitrario - puede fallar si los datos tardan más
- No hay forma de saber si los filtros se aplicaron correctamente

**Solución correcta:**
```javascript
// Esperar evento de cards cargadas
document.addEventListener('cards-rendered', () => {
  this._restoreFiltersFromUrl(urlState.filters);
}, { once: true });
```

### 5. **BAJO: Animaciones y UI (aceptable)**

Algunos usos de `setTimeout` son legítimos para animaciones:

```javascript
// SlideNotification.js:53 - OK para animaciones CSS
setTimeout(() => this.remove(), 600);

// Debounce para búsqueda - OK
this._debounceTimer = setTimeout(() => {
  this.performSearch();
}, 300);
```

## Inventario Completo de setTimeout Problemáticos

### view-factory.js (11 usos)
| Línea | Delay | Propósito | Severidad |
|-------|-------|-----------|-----------|
| 297 | 100ms | Mostrar filtros de proposals | CRÍTICO |
| 816 | 100ms | Mostrar filtros de tasks | CRÍTICO |
| 849 | 100ms | Mostrar filtros de bugs | CRÍTICO |
| 882 | 100ms | Mostrar filtros de tickets | CRÍTICO |
| 939 | 100ms | Crear filtros de proposals | CRÍTICO |
| 1053 | 100ms | Crear filtros de tasks | CRÍTICO |
| 1079 | 200ms | Forzar aplicar filtros | CRÍTICO |
| 1188 | 100ms | Crear filtros de epics | MEDIO |
| 1226 | 200ms | Forzar aplicar filtros epics | MEDIO |
| 1291 | 100ms | Crear filtros de bugs | CRÍTICO |
| 1317 | 200ms | Forzar aplicar filtros bugs | CRÍTICO |

### app-controller.js (12 usos)
| Línea | Delay | Propósito | Severidad |
|-------|-------|-----------|-----------|
| 138 | 500ms | Restaurar filtros de URL | MEDIO |
| 570 | ? | Render section | MEDIO |
| 647 | 100ms | Setup task filters | CRÍTICO |
| 662 | 100ms | Setup bug filters | CRÍTICO |
| 678 | 100ms | Setup ticket filters | CRÍTICO |
| 735 | 100ms | Create bug filters | CRÍTICO |
| 794 | 100ms | Create ticket filters | CRÍTICO |
| 853 | 100ms | Create task filters | CRÍTICO |
| 1015 | ? | ? | MEDIO |
| 1211 | 100ms | Setup bug filters | CRÍTICO |
| 1213 | 100ms | Setup ticket filters | CRÍTICO |
| 1215 | 100ms | Setup task filters | CRÍTICO |

### BaseFilters.js (1 uso)
| Línea | Delay | Propósito | Severidad |
|-------|-------|-----------|-----------|
| 59 | 0ms | Load filter options | CRÍTICO |

### table-view-manager.js (3 usos)
| Línea | Delay | Propósito | Severidad |
|-------|-------|-----------|-----------|
| 122 | ? | ? | MEDIO |
| 282 | ? | ? | MEDIO |
| 434 | ? | ? | MEDIO |

## Plan de Refactorización

### Fase 1: Infraestructura de Eventos (Prioridad ALTA)

1. **Crear sistema de eventos centralizado**
   ```javascript
   // services/app-event-bus.js
   export const AppEvents = {
     TABLE_RENDERED: 'app:table-rendered',
     CARDS_LOADED: 'app:cards-loaded',
     FILTERS_READY: 'app:filters-ready',
     VIEW_CHANGED: 'app:view-changed',
     GLOBAL_DATA_READY: 'app:global-data-ready'
   };

   export class AppEventBus {
     static emit(event, detail = {}) {
       document.dispatchEvent(new CustomEvent(event, { detail }));
     }

     static once(event, callback) {
       document.addEventListener(event, callback, { once: true });
     }

     static waitFor(event, timeout = 5000) {
       return new Promise((resolve, reject) => {
         const timer = setTimeout(() => {
           reject(new Error(`Timeout waiting for ${event}`));
         }, timeout);

         document.addEventListener(event, (e) => {
           clearTimeout(timer);
           resolve(e.detail);
         }, { once: true });
       });
     }
   }
   ```

2. **Modificar GlobalDataManager para emitir eventos**
   ```javascript
   // Cuando los datos globales estén listos
   AppEventBus.emit(AppEvents.GLOBAL_DATA_READY, {
     developers: globalDeveloperList,
     sprints: globalSprintList,
     epics: globalEpicList
   });
   ```

### Fase 2: Refactorizar ViewFactory (Prioridad ALTA)

1. **Modificar TableViewManager para emitir evento al completar render**
   ```javascript
   async renderTasksTableView(container, config) {
     // ... render logic ...
     AppEventBus.emit(AppEvents.TABLE_RENDERED, {
       section: 'tasks',
       container
     });
   }
   ```

2. **Modificar showTableView para escuchar eventos**
   ```javascript
   async showTableView(config) {
     // ...
     this.tableViewManager.renderTasksTableView(container, config);

     // Esperar evento en lugar de setTimeout
     await AppEventBus.waitFor(AppEvents.TABLE_RENDERED);
     this.showFilters('tasks');
   }
   ```

### Fase 3: Refactorizar BaseFilters (Prioridad ALTA)

1. **Esperar datos globales con promesa**
   ```javascript
   async connectedCallback() {
     super.connectedCallback();
     await this.updateComplete;

     // Esperar datos globales
     if (!GlobalDataManager.isReady()) {
       await AppEventBus.waitFor(AppEvents.GLOBAL_DATA_READY);
     }

     this._loadFilterOptions();
   }
   ```

### Fase 4: Refactorizar AppController (Prioridad MEDIA)

1. **Eliminar múltiples llamadas a toggleView**
   - Ya parcialmente resuelto con `initialViewApplied` flag
   - Completar usando eventos en lugar de setTimeout

### Fase 5: Audit de Componentes Lit (Prioridad BAJA)

1. **Revisar cada componente que usa setTimeout para permisos**
   ```javascript
   // Patrón actual (malo)
   setTimeout(() => this._requestOwnershipPermissions(), 10);

   // Patrón correcto
   async firstUpdated() {
     await this.updateComplete;
     this._requestOwnershipPermissions();
   }
   ```

## Métricas de Éxito

- **Antes:** 103 usos de setTimeout
- **Objetivo Fase 1-3:** Reducir a < 30 (eliminar los CRÍTICOS)
- **Objetivo Final:** < 15 (solo para animaciones y debounce legítimos)

## Riesgos

1. **Regresiones:** Cambiar el timing puede exponer bugs ocultos
2. **Compatibilidad:** Algunos navegadores pueden comportarse diferente
3. **Complejidad:** El sistema de eventos requiere documentación

## Mitigación

1. **Tests:** Crear tests de integración para el flujo de inicialización
2. **Feature flags:** Implementar cambios gradualmente con flags
3. **Logging:** Añadir logs temporales para debugging del nuevo flujo

## Estimación

| Fase | Esfuerzo | Archivos Afectados |
|------|----------|-------------------|
| Fase 1 | 4h | 1 nuevo archivo |
| Fase 2 | 8h | view-factory.js, table-view-manager.js |
| Fase 3 | 4h | BaseFilters.js, TaskFilters.js, BugFilters.js |
| Fase 4 | 6h | app-controller.js |
| Fase 5 | 8h | ~15 componentes Lit |
| **Total** | **30h** | |

## Conclusión

El uso de `setTimeout` para sincronización es deuda técnica significativa que causa:
- Bugs intermitentes difíciles de reproducir
- Código frágil que "funciona por casualidad"
- Latencia artificial innecesaria

La solución requiere un sistema de eventos robusto y refactorización gradual de los componentes afectados.

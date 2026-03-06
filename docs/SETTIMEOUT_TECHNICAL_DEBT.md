# Deuda Técnica: Uso de setTimeout para Sincronización

## Resumen Ejecutivo

El código actual usa `setTimeout` como mecanismo de sincronización en **~85 lugares** (reducido desde 103 originales), lo cual es una práctica incorrecta que:
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

### 2. **RESUELTO: Inicialización de Filtros (BaseFilters.js)**

> Este caso ya fue corregido. `BaseFilters.js` ya no usa `setTimeout` para inicialización.

### 3. **RESUELTO: Setup de Filtros (app-controller.js)**

> La mayoría de los `setTimeout` en `app-controller.js` han sido eliminados o reemplazados por eventos. Solo quedan usos marginales comentados como referencia.

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

## Inventario de setTimeout (estado actual)

> **Nota**: Las tablas detalladas originales de este documento tenian numeros de linea y conteos que ya no son precisos. Los archivos `app-controller.js` y `BaseFilters.js` ya fueron corregidos en su mayoria. El foco principal de deuda restante esta en `view-factory.js` (actualmente en `public/js/factories/view-factory.js`) y en varios componentes Lit.

## Plan de Refactorización

### Fase 1: Infraestructura de Eventos (COMPLETADA)

`AppEventBus` ya fue creado en `public/js/services/app-event-bus.js` con metodos `emit()`, `once()` y `waitFor()`. Se usa activamente en el proyecto.

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

- **Inicio:** 103 usos de setTimeout
- **Estado actual:** ~85 usos (app-controller y BaseFilters ya corregidos)
- **Objetivo Fase 2-3:** Reducir a < 30 (eliminar los CRITICOS restantes en view-factory)
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

# Sistema de Filtros Genérico

Un sistema escalable y reutilizable para filtrar todos los tipos de cards en la aplicación PlanningGameXP.

## Características

- **Arquitectura modular**: Clase base común con especialización por tipo de card
- **Factory Pattern**: Creación dinámica de filtros específicos
- **Escalabilidad**: Fácil adición de nuevos tipos de filtros
- **Compatibilidad**: Mantiene funcionalidad exacta de filtros existentes
- **Flexibilidad**: Soporte para filtros simples y multi-selección

## Estructura del Sistema

```
filters/
├── index.js                    # Punto de entrada principal
├── base-filter-system.js       # Clase base con lógica común
├── filter-factory.js           # Factory para crear filtros
├── types/                      # Filtros específicos por tipo de card
│   ├── bug-filters.js          # Filtros para bugs
│   ├── task-filters.js         # Filtros para tasks
│   ├── epic-filters.js         # Filtros para épicas
│   ├── sprint-filters.js       # Filtros para sprints
│   ├── qa-filters.js           # Filtros para QA/Test
│   ├── proposal-filters.js     # Filtros para propuestas
│   └── log-filters.js          # Filtros para logs
├── bug-filters.js             # LEGACY - Mantener por compatibilidad
└── task-filters.js            # LEGACY - Mantener por compatibilidad
```

## Uso Básico

### Inicializar filtros para un tipo específico

```javascript
import { initializeFilters } from './filters/index.js';

// Inicializar filtros para bugs
const bugFilter = await initializeFilters('bugs');

// Inicializar filtros para tasks
const taskFilter = await initializeFilters('tasks');

// Inicializar filtros para épicas
const epicFilter = await initializeFilters('epics');
```

### Usar el sistema de filtros completo

```javascript
import { FilterSystem } from './filters/index.js';

const filterSystem = FilterSystem.getInstance();

// Inicializar todos los filtros
await filterSystem.initializeAllFilters();

// Aplicar filtros específicos
await filterSystem.applyFilters('bugs');
await filterSystem.clearFilters('tasks');
```

### Uso directo de clases específicas

```javascript
import { BugFilters, TaskFilters, EpicFilters } from './filters/index.js';

// Crear instancia directa
const bugFilters = new BugFilters();
bugFilters.setupFilters();

const taskFilters = new TaskFilters();
taskFilters.setupFilters();
```

## Tipos de Card Soportados

| Tipo | Clase | Filtros Disponibles |
|------|-------|-------------------|
| `bugs` | BugFilters | Estado, Prioridad, Desarrollador, Creado por |
| `tasks` | TaskFilters | Estado, Sprint, Épica, Desarrollador, Creado por |
| `epics` | EpicFilters | Stakeholders, Estado, Rango de fechas, Creado por |
| `sprints` | SprintFilters | Estado, Rango de puntos, Período, Completitud, Creado por |
| `qa` | QAFilters | Estado, Prioridad, Tipo de defecto, Tarea asociada, Resultado, Creado por |
| `proposals` | ProposalFilters | Estado, Épica, Antigüedad, Completitud, Creado por |
| `logs` | LogFilters | Nivel, Categoría, Período, Origen, Usuario |

## Configuración de Filtros

Cada filtro se define mediante una configuración que especifica:

```javascript
getFilterConfig() {
  return {
    filterName: {
      label: 'Etiqueta visible',           // Texto mostrado al usuario
      isMultiSelect: false,                // true para multi-select, false para select simple
      optionsMethod: () => this.getOptions(), // Método que retorna opciones
      cardValueGetter: (card) => card.prop   // Opcional: función para obtener valor de la card
    }
  };
}
```

## Añadir Nuevo Tipo de Filtro

### 1. Crear clase específica

```javascript
// filters/types/mi-nuevo-filtro.js
import { BaseFilter } from '../base-filter-system.js';

export class MiNuevoFilters extends BaseFilter {
  constructor() {
    super('mi-tipo'); // Nombre del tipo de card
  }

  getFilterConfig() {
    return {
      miCampo: {
        label: 'Mi Campo',
        isMultiSelect: true,
        optionsMethod: () => this.getMiCampoOptions()
      }
    };
  }

  async getMiCampoOptions() {
    return [
      { value: 'valor1', label: 'Valor 1' },
      { value: 'valor2', label: 'Valor 2' }
    ];
  }
}
```

### 2. Registrar en FilterFactory

```javascript
// En filter-factory.js, añadir al filterClassMap:
'mi-tipo': () => import('./types/mi-nuevo-filtro.js').then(module => module.MiNuevoFilters)
```

### 3. Exportar en index.js

```javascript
// En index.js, añadir:
export { MiNuevoFilters } from './types/mi-nuevo-filtro.js';

// Y actualizar SUPPORTED_CARD_TYPES:
SUPPORTED_CARD_TYPES: ['bugs', 'tasks', ..., 'mi-tipo']
```

## Compatibilidad con Código Existente

El sistema mantiene **100% de compatibilidad** con el código existente:

```javascript
// Código legacy sigue funcionando
const bugFilters = new BugFilters();
bugFilters.setupBugFilters();
bugFilters.applyBugFilters();

const taskFilters = new TaskFilters();
taskFilters.setupTaskFilters();
taskFilters.applyTaskFilters();
```

## Convenciones de Naming

### HTML Elements
- Container de filtros: `{cardType}Filters` (ej: `bugsFilters`, `tasksFilters`)
- Lista de cards: `{cardType}CardsList` (ej: `bugsCardsList`, `tasksCardsList`)
- Cards individuales: `{cardType}-card` (ej: `bug-card`, `task-card`)
- Contador de resultados: `{cardType}FilterCounter`

### CSS Classes
- Select de filtro: `{cardType}-filter-select`
- Botón limpiar: `clear-filters-button`

## Filtros Especiales

### Filtros "Sin valor"
- `no-sprint`: Para tasks sin sprint asignado
- `no-epic`: Para cards sin épica asignada
- `sin-stakeholder`: Para épicas sin stakeholders
- `sin-tarea`: Para QA sin tarea asociada
- etc.

### Filtros de fecha
- Automáticamente calculados basados en fechas de las cards
- Rangos predefinidos (hoy, esta semana, este mes, etc.)

## Debugging

```javascript
import { FilterConfig } from './filters/index.js';

// Activar modo debug
FilterConfig.DEBUG_MODE = true;

// Ver instancias activas
const filterSystem = FilterSystem.getInstance();
console.log(filterSystem.activeFilters);
```

## Rendimiento

- **Lazy loading**: Los filtros se cargan solo cuando se necesitan
- **Singleton pattern**: Una instancia por tipo de filtro
- **Debounce**: Configurado para evitar aplicar filtros en cada keystroke
- **Cache**: Reutilización de instancias de filtros

## Migración desde Filtros Legacy

### Paso 1: Importar nuevo sistema
```javascript
// Antes
import { BugFilters } from './filters/bug-filters.js';

// Después
import { BugFilters } from './filters/index.js';
// O mejor aún:
import { initializeFilters } from './filters/index.js';
```

### Paso 2: Actualizar uso (opcional)
```javascript
// Estilo legacy (sigue funcionando)
const bugFilters = new BugFilters();
bugFilters.setupBugFilters();

// Estilo nuevo (recomendado)
const bugFilter = await initializeFilters('bugs');
```

### Paso 3: Aprovechar nuevas características
```javascript
// Inicializar múltiples filtros
const filterSystem = FilterSystem.getInstance();
await filterSystem.initializeMultipleFilters(['bugs', 'tasks', 'epics']);

// Gestión centralizada
await filterSystem.clearFilters('bugs');
await filterSystem.resetFilters('tasks');
```
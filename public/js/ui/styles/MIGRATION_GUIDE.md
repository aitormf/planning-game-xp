# Guía de Migración al Sistema DRY de Estilos

Este documento explica cómo migrar los archivos de estilos existentes al nuevo sistema DRY.

## Estructura del Sistema

```
ui/styles/
├── index.js              # Exportaciones principales
├── theme-variables.js    # Variables CSS globales
├── base-card-styles.js   # Estilos comunes de cards
├── base-tab-styles.js    # Estilos comunes de tabs
└── themes/
    ├── bug-theme.js      # Tema específico para bugs
    ├── sprint-theme.js   # Tema específico para sprints
    ├── story-theme.js    # Tema específico para stories
    └── task-theme.js     # Tema específico para tasks
```

## Ejemplo de Migración

### Antes (bug-card-styles.js):
```javascript
import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { TabStyles } from './tab-styles.js';

export const BugCardStyles = [
  TabStyles,
  css`
    :host {
      display: block;
      width: 300px;
      // ... muchos estilos repetidos
    }
    // ... más CSS repetido
  `
];
```

### Después:
```javascript
import { ThemeVariables, BaseCardStyles, BaseTabStyles, BugTheme } from '../ui/styles/index.js';

export const BugCardStyles = [
  ThemeVariables,
  BaseCardStyles,
  BaseTabStyles,
  BugTheme
];
```

## Beneficios del Sistema DRY

1. **Mantenimiento**: Cambios globales en un solo lugar
2. **Consistencia**: Variables CSS garantizan coherencia visual
3. **Flexibilidad**: Temas específicos permiten personalización
4. **Reutilización**: Estilos base compartidos entre componentes
5. **Escalabilidad**: Fácil agregar nuevos tipos de cards

## Variables Disponibles

### Colores Principales
- `--primary-color`: #4a9eff (azul principal)
- `--secondary-color`: #ec3e95 (rosa/magenta)
- `--accent-color`: #4caf50 (verde)
- `--warning-color`: #ff9800 (naranja)
- `--danger-color`: #d9534f (rojo)

### Espaciado
- `--spacing-xs`: 0.2rem
- `--spacing-sm`: 0.5rem
- `--spacing-md`: 1rem
- `--spacing-lg`: 1.5rem
- `--spacing-xl`: 2rem

### Border Radius
- `--radius-sm`: 4px
- `--radius-md`: 6px
- `--radius-lg`: 8px

### Sombras
- `--shadow-sm`: 0 2px 4px rgba(0,0,0,0.08)
- `--shadow-md`: 0 2px 4px rgba(0,0,0,0.1)
- `--shadow-lg`: 0 4px 8px rgba(0,0,0,0.15)
- `--shadow-hover`: 0 4px 8px rgba(74,158,255,0.15)

## Pasos de Migración

1. **Identificar estilos únicos**: Mover CSS específico del tipo al tema correspondiente
2. **Usar variables**: Reemplazar valores hardcodeados con variables CSS
3. **Importar estilos base**: Usar BaseCardStyles y BaseTabStyles
4. **Aplicar tema específico**: Importar y usar el tema del tipo de card
5. **Probar funcionalmente**: Verificar que la apariencia se mantiene exacta

## Archivos a Migrar

- [x] `wc/bug-card-styles.js` → Usa `BugTheme`
- [x] `wc/sprint-card-styles.js` → Usa `SprintTheme`
- [x] `wc/story-card-styles.js` → Usa `StoryTheme`
- [x] `wc/task-card-styles.js` → Usa `TaskTheme`
- [x] `wc/tab-styles.js` → Integrado en `BaseTabStyles`

## Notas Importantes

- La funcionalidad visual debe mantenerse exactamente igual
- Los estilos específicos de cada tipo se mantienen en sus temas
- Las variables CSS permiten fácil personalización futura
- El sistema es compatible con el código existente
# Dark Theme Implementation Status

## Resumen del Proyecto

Implementación del sistema de tema oscuro/claro para la aplicación Planning Game XP.

**Fecha última actualización:** 2026-02-10

## Progreso por Fases

| Fase | Descripción | Estado | Commits |
|------|-------------|--------|---------|
| Fase 1 | Componentes críticos | ✅ Completado | `3270c92f` |
| Fase 2 | Cards secundarios | ✅ Completado | `4d67c541` |
| Fase 3 | Componentes UI | ✅ Completado | `a5b70f0d` |
| Fase 4 | Páginas Astro | ⏳ Pendiente | - |
| Fase 5 | Testing y refinamientos | ⏳ Pendiente | - |

## Detalle de Fases Completadas

### Fase 1: Componentes Críticos
Archivos actualizados:
- `public/js/wc/bug-card-styles.js`
- `public/js/wc/app-manager-styles.js`
- `public/js/wc/menu-nav-styles.js`
- `public/js/wc/project-form-styles.js`

### Fase 2: Cards Secundarios
Archivos actualizados:
- `public/js/wc/epic-card-styles.js`
- `public/js/wc/proposal-card-styles.js`
- `public/js/wc/qa-card-styles.js`
- `public/js/wc/adr-card-styles.js`
- `public/js/wc/global-config-card-styles.js`

### Fase 3: Componentes UI
Archivos actualizados:
- `public/js/wc/multi-select-styles.js`
- `public/js/wc/task-filters-styles.js`
- `public/js/wc/bug-filters-styles.js`
- `public/js/wc/unified-filters-styles.js`
- `public/js/wc/project-selector-styles.js`
- `public/js/wc/notification-bell-styles.js`
- `public/js/wc/global-proposals-list-styles.js`
- `public/js/wc/state-history-viewer-styles.js`
- `public/js/wc/sprint-points-chart-styles.js`
- `public/js/wc/firebase-storage-uploader-styles.js`
- `public/js/wc/push-notification-styles.js`
- `public/js/wc/gantt-chart-styles.js`
- `public/js/wc/adr-list-styles.js`
- `public/js/wc/global-config-list-styles.js`

## Fases Pendientes

### Fase 4: Páginas Astro
Archivos a revisar:
- `src/pages/*.astro` - Todas las páginas principales
- `src/layouts/*.astro` - Layouts de página
- `src/components/*.astro` - Componentes Astro
- `public/css/*.css` - Archivos CSS globales

**Tareas:**
1. Revisar estilos inline en páginas Astro
2. Actualizar layouts para usar variables CSS
3. Verificar que los estilos globales usan el sistema de tokens

### Fase 5: Testing y Refinamientos
**Tareas:**
1. Probar visualmente todos los componentes en modo oscuro
2. Verificar contraste y accesibilidad
3. Ajustar colores específicos si es necesario
4. Probar transiciones entre temas
5. Documentar el sistema de theming

## Sistema de Variables CSS

### Variables Principales (definidas en ThemeManagerService)

```css
/* Backgrounds */
--bg-primary: white | #1a1a2e
--bg-secondary: #f8f9fa | #16213e
--bg-tertiary: #e9ecef | #0f3460

/* Text */
--text-primary: #333 | #e8e8e8
--text-muted: #666 | #a0a0a0
--text-disabled: #999 | #666

/* Borders */
--border-color: #e0e0e0 | #2a2a4a
--input-border: #dee2e6 | #3a3a5a
--input-bg: white | #1a1a2e

/* Cards */
--card-bg: white | #1e1e3f
--card-shadow: 0 2px 4px rgba(0,0,0,0.1) | 0 2px 4px rgba(0,0,0,0.3)

/* Brand Colors */
--color-blue-500: #4a9eff
--color-blue-600: #2563eb
--color-blue-50: #e7f5ff | #1a3a5f

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow-md: 0 2px 4px rgba(0,0,0,0.1)
--shadow-lg: 0 4px 12px rgba(0,0,0,0.15)

/* Tooltips */
--tooltip-bg: #333 | #1a1a2e
--tooltip-text: #fff | #e8e8e8
```

## Patrón de Actualización

Para actualizar un archivo de estilos:

1. **Identificar colores hardcodeados:**
   - `white`, `#fff`, `#ffffff` → `var(--bg-primary, white)`
   - `#f8f9fa`, `#f5f5f5` → `var(--bg-secondary, #f8f9fa)`
   - `#333`, `#343a40` → `var(--text-primary, #333)`
   - `#666`, `#6c757d` → `var(--text-muted, #666)`
   - `#e0e0e0`, `#dee2e6` → `var(--border-color, #e0e0e0)`

2. **Mantener fallbacks:**
   - Siempre incluir el valor original como fallback: `var(--variable, fallback)`

3. **No cambiar colores semánticos:**
   - Colores de estado (success, error, warning) mantener igual
   - Colores de marca específicos mantener igual

## Archivos que NO necesitan cambios

Estos archivos ya usan el sistema de estilos base:
- `public/js/wc/task-card-styles.js` - Usa ThemeVariables, BaseCardStyles, TaskTheme
- `public/js/wc/sprint-card-styles.js` - Usa ThemeVariables, BaseCardStyles, SprintTheme
- `public/js/wc/tab-styles.js` - Usa ThemeVariables, BaseTabStyles
- `public/js/wc/commits-list-styles.js` - Ya usa variables CSS

## Cómo Continuar

1. **Ejecutar tests antes de cambios:**
   ```bash
   npm test
   ```

2. **Revisar archivos de Fase 4:**
   ```bash
   ls src/pages/*.astro
   ls src/layouts/*.astro
   ls public/css/*.css
   ```

3. **Buscar colores hardcodeados:**
   ```bash
   grep -r "#fff\|#ffffff\|white\|#f8f9fa\|#333" src/
   grep -r "#fff\|#ffffff\|white\|#f8f9fa\|#333" public/css/
   ```

4. **Después de cambios, ejecutar tests:**
   ```bash
   npm test
   ```

5. **Commit con mensaje descriptivo:**
   ```bash
   git commit -m "feat(theme): add CSS variables to Astro pages"
   ```

## Tasks Relacionadas en Planning Game

- PLN-TSK-0136: Dark Theme - Infraestructura base
- PLN-TSK-0137: Dark Theme - Fase 1 & 2: Componentes críticos
- PLN-TSK-0139: Dark Theme - Fase 3: Componentes UI (completada en este trabajo)
- PLN-TSK-0140: Dark Theme - Fase 4: Páginas Astro
- PLN-TSK-0141: Dark Theme - Fase 5: Testing y refinamientos

# Design System - CSS Tokens

Sistema de diseño con tokens CSS para PlanningGameXP.

## Estructura de Tokens

```
public/js/ui/styles/tokens/
├── primitives.js   # Colores base, spacing, typography (valores raw)
├── semantic.js     # Tokens semánticos (brand, functional, status)
├── components.js   # Tokens de componentes (card, button, modal)
└── index.js        # Exporta todo
```

### Capas de Tokens

1. **Primitives**: Valores raw (`--color-blue-500`, `--space-3`, `--font-size-lg`)
2. **Semantic**: Tokens con significado (`--brand-primary`, `--text-primary`, `--status-done`)
3. **Components**: Tokens específicos (`--card-bg`, `--modal-header-bg`, `--btn-primary-bg`)

## Uso en Componentes Lit

```javascript
import { ThemeVariables } from './ui/styles/theme-variables.js';

class MyComponent extends LitElement {
  static styles = [
    ThemeVariables,
    css`
      .element {
        color: var(--text-primary);
        background: var(--bg-primary);
        border-radius: var(--radius-md);
      }
    `
  ];
}
```

## Personalización Externa (theme-config.json)

Para personalizar la apariencia sin modificar código:

### 1. Crear archivo de configuración

```bash
cp public/theme-config.example.json public/theme-config.json
```

### 2. Editar theme-config.json

```json
{
  "tokens": {
    "brand": {
      "primary": "#ff5722",
      "secondary": "#9c27b0"
    },
    "status": {
      "todo": "#2196f3",
      "inProgress": "#4caf50"
    }
  },
  "branding": {
    "appName": "Mi Planning Game",
    "logo": "/images/mi-logo.png",
    "primaryColor": "#ff5722"
  },
  "features": {
    "darkMode": true
  }
}
```

### 3. La aplicación carga automáticamente

El `ThemeLoaderService` carga `/theme-config.json` al iniciar y aplica los tokens.

## Dark Mode

### Activar/Desactivar programáticamente

```javascript
import { ThemeManagerService } from './services/theme-manager-service.js';

// Toggle dark mode
ThemeManagerService.toggleDarkMode();

// Aplicar tema específico
ThemeManagerService.applyTheme('dark');
ThemeManagerService.applyTheme('light');

// Verificar estado
if (ThemeManagerService.isDarkMode()) {
  // ...
}
```

### Escuchar cambios de tema

```javascript
document.addEventListener('theme-change', (e) => {
  console.log('Nuevo tema:', e.detail.theme);
  console.log('Es dark mode:', e.detail.isDark);
});
```

## Migración de Estilos Hardcodeados

Script para identificar valores hardcodeados:

```bash
# Ver qué cambiaría (dry run)
node scripts/migrate-css-tokens.js --dry-run

# Migrar un archivo específico
node scripts/migrate-css-tokens.js --file public/js/wc/my-component-styles.js

# Aplicar cambios
node scripts/migrate-css-tokens.js
```

## Tokens Disponibles

### Colores de Brand
- `--brand-primary` / `--brand-primary-hover`
- `--brand-secondary` / `--brand-secondary-hover`

### Colores Funcionales
- `--color-success`, `--color-warning`, `--color-error`, `--color-info`

### Backgrounds
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-muted`

### Texto
- `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`

### Status (Cards)
- `--status-todo`, `--status-in-progress`, `--status-to-validate`
- `--status-done`, `--status-blocked`, `--status-expedited`

### Spacing
- `--spacing-xs` (0.2rem), `--spacing-sm` (0.5rem), `--spacing-md` (1rem)
- `--spacing-lg` (1.5rem), `--spacing-xl` (2rem)

### Border Radius
- `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px)

### Shadows
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

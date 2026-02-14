# Actualización de @manufosela/slide-notification para Sistema de Diseño con Tokens

## Objetivo
Agregar CSS custom properties para permitir theming de notificaciones.

## Cambios Requeridos

### 1. Agregar variables CSS en :host

```css
:host {
  /* Base tokens */
  --notification-bg: var(--notification-info-bg, #17a2b8);
  --notification-text: var(--text-inverse, #ffffff);
  --notification-border-radius: var(--radius-md, 6px);
  --notification-shadow: var(--shadow-lg, 0 4px 8px rgba(0,0,0,0.15));
  --notification-padding: var(--spacing-md, 1rem);
  --notification-min-width: 300px;
  --notification-max-width: 400px;

  /* Title */
  --notification-title-size: var(--font-size-lg, 1.1rem);
  --notification-title-weight: 600;

  /* Message */
  --notification-message-size: var(--font-size-base, 1rem);

  /* Animation */
  --notification-animation-duration: 0.3s;
  --notification-slide-distance: 100%;
}

/* Variantes por tipo usando attribute selectors */
:host([type="success"]) {
  --notification-bg: var(--notification-success-bg, #28a745);
}

:host([type="error"]) {
  --notification-bg: var(--notification-error-bg, #dc3545);
}

:host([type="warning"]) {
  --notification-bg: var(--notification-warning-bg, #ffc107);
  --notification-text: var(--text-primary, #333333);
}

:host([type="info"]) {
  --notification-bg: var(--notification-info-bg, #17a2b8);
}
```

### 2. Usar las variables en los estilos

```css
.notification {
  background: var(--notification-bg);
  color: var(--notification-text);
  border-radius: var(--notification-border-radius);
  box-shadow: var(--notification-shadow);
  padding: var(--notification-padding);
  min-width: var(--notification-min-width);
  max-width: var(--notification-max-width);
}

.notification-title {
  font-size: var(--notification-title-size);
  font-weight: var(--notification-title-weight);
}

.notification-message {
  font-size: var(--notification-message-size);
}

/* Animation */
@keyframes slideIn {
  from {
    transform: translateX(var(--notification-slide-distance));
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 3. CSS Parts

```html
<div class="notification" part="notification">
  <div class="notification-title" part="title">...</div>
  <div class="notification-message" part="message">...</div>
  <button class="notification-close" part="close-button">...</button>
</div>
```

### 4. Remover colores hardcodeados del JavaScript

Si hay lógica JavaScript que setea colores directamente:

```javascript
// ANTES
this.style.backgroundColor = colors[this.type];

// DESPUÉS
// No hacer nada - los colores vienen de CSS custom properties
```

## Ejemplo de Uso

```css
:root {
  /* Personalizar colores de notificación */
  --notification-success-bg: #00c853;
  --notification-error-bg: #ff1744;
  --notification-warning-bg: #ffab00;
  --notification-info-bg: #2979ff;
}
```

## Versión Requerida
Publicar como versión `2.1.0` (minor bump)

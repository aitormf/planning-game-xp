# Actualización de @manufosela/app-modal para Sistema de Diseño con Tokens

## Objetivo
Agregar CSS custom properties al componente para permitir theming externo.

## Cambios Requeridos

### 1. En los estilos del componente, agregar variables CSS con fallbacks

En el bloque `:host`, agregar estas custom properties:

```css
:host {
  /* Tokens de modal - pueden ser sobrescritos externamente */
  --modal-bg: var(--bg-primary, #ffffff);
  --modal-text-color: var(--text-primary, #333333);
  --modal-header-bg: var(--brand-primary, #4a9eff);
  --modal-header-text: var(--text-inverse, #ffffff);
  --modal-footer-bg: var(--bg-secondary, #f8f9fa);
  --modal-border-color: var(--border-default, #e0e0e0);
  --modal-border-radius: var(--radius-lg, 8px);
  --modal-shadow: var(--shadow-xl, 0 8px 32px rgba(0,0,0,0.3));
  --modal-overlay-bg: rgba(0, 0, 0, 0.6);
  --modal-max-width: 80vw;
  --modal-max-height: 80vh;

  /* Botones */
  --modal-btn-primary-bg: var(--brand-primary, #4a9eff);
  --modal-btn-primary-text: var(--text-inverse, #ffffff);
  --modal-btn-secondary-bg: var(--bg-muted, #e9ecef);
  --modal-btn-secondary-text: var(--text-primary, #333333);

  /* Spacing */
  --modal-padding: var(--spacing-lg, 1.5rem);
  --modal-header-padding: var(--spacing-md, 1rem);
  --modal-footer-padding: var(--spacing-md, 1rem);
}
```

### 2. Usar las variables en los estilos internos

Reemplazar valores hardcodeados por las variables:

```css
.modal-container {
  background: var(--modal-bg);
  color: var(--modal-text-color);
  border-radius: var(--modal-border-radius);
  box-shadow: var(--modal-shadow);
  max-width: var(--modal-max-width);
  max-height: var(--modal-max-height);
}

.modal-overlay {
  background: var(--modal-overlay-bg);
}

.modal-header {
  background: var(--modal-header-bg);
  color: var(--modal-header-text);
  padding: var(--modal-header-padding);
  border-bottom: 1px solid var(--modal-border-color);
}

.modal-body {
  padding: var(--modal-padding);
}

.modal-footer {
  background: var(--modal-footer-bg);
  padding: var(--modal-footer-padding);
  border-top: 1px solid var(--modal-border-color);
}
```

### 3. CSS Parts (opcional pero recomendado)

Agregar `part` attributes para permitir styling externo más granular:

```html
<div class="modal-overlay" part="overlay">
  <div class="modal-container" part="container">
    <div class="modal-header" part="header">...</div>
    <div class="modal-body" part="body">...</div>
    <div class="modal-footer" part="footer">...</div>
  </div>
</div>
```

Esto permite a los consumidores usar:

```css
app-modal::part(header) {
  background: linear-gradient(...);
}
```

## Ejemplo de Uso con Tokens

```css
/* En la app que consume el componente */
:root {
  --bg-primary: #1a1a2e;  /* Dark mode */
  --text-primary: #eaeaea;
  --brand-primary: #ec3e95;
}

/* El modal automáticamente usará estos colores */
```

## Versión Requerida
Publicar como versión `2.2.0` (minor bump por nueva funcionalidad retrocompatible)

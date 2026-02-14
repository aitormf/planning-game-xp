# Propuesta: Modo fullHeight para @manufosela/app-modal

## Problema Actual

Cuando se establece `maxHeight` en el modal, el contenedor `.modal` respeta ese límite pero el contenido interno (`.modal-body`) no se expande para ocupar todo el espacio disponible. Esto obliga a los consumidores a manipular el shadowRoot directamente:

```javascript
// Workaround actual (no ideal)
requestAnimationFrame(() => {
  const shadowModal = modal.shadowRoot?.querySelector('.modal');
  const shadowBody = modal.shadowRoot?.querySelector('.modal-body');
  if (shadowModal) {
    shadowModal.style.height = '90dvh';
    shadowModal.style.display = 'flex';
    shadowModal.style.flexDirection = 'column';
  }
  if (shadowBody) {
    shadowBody.style.flex = '1';
    shadowBody.style.overflow = 'auto';
  }
});
```

## Propuesta de Solución

### Opción 1: Nueva propiedad `fullHeight`

Añadir una propiedad booleana `fullHeight` que cuando está activa hace que el modal y su contenido ocupen todo el `maxHeight` especificado.

**Uso:**
```javascript
const modal = document.createElement('app-modal');
modal.maxHeight = '90dvh';
modal.fullHeight = true; // El contenido se expande para ocupar 90dvh
```

**Implementación en app-modal.js:**
```javascript
static properties = {
  // ... propiedades existentes
  fullHeight: { type: Boolean, attribute: 'full-height', reflect: true }
};

constructor() {
  super();
  // ...
  this.fullHeight = false;
}
```

**Implementación en app-modal.styles.js:**
```css
:host([full-height]) .modal {
  height: var(--max-height, var(--modal-max-height));
  display: flex;
  flex-direction: column;
}

:host([full-height]) .modal-body {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

:host([full-height]) .modal-body > * {
  flex: 1;
}
```

### Opción 2: CSS Custom Property `--modal-content-stretch`

Añadir una CSS custom property que controle si el contenido se estira.

**Uso:**
```javascript
modal.style.setProperty('--modal-content-stretch', '1');
```

**Implementación en estilos:**
```css
.modal {
  display: flex;
  flex-direction: column;
  height: var(--modal-content-stretch, auto) == 1 ? var(--max-height) : auto;
}

/* O usando @container queries si hay soporte */
```

### Opción 3: Propiedad `height` además de `maxHeight`

Añadir propiedad `height` separada de `maxHeight`:

```javascript
modal.height = '90dvh';    // Altura fija
modal.maxHeight = '90dvh'; // Altura máxima (actual)
```

## Recomendación

**Opción 1 (`fullHeight`)** es la más clara y explícita:
- Semánticamente clara: "quiero que el modal ocupe toda la altura"
- Retrocompatible: comportamiento por defecto no cambia
- Fácil de usar: solo añadir `fullHeight={true}` o `full-height` attribute

## Ejemplo de Uso Final

```html
<!-- Declarativo -->
<app-modal max-height="90dvh" full-height>
  <my-card expanded></my-card>
</app-modal>
```

```javascript
// Programático
const modal = showModal({
  maxHeight: '90dvh',
  fullHeight: true,
  contentElement: expandedCard
});
```

## Cambios Necesarios en showModal()

```javascript
export function showModal(options = {}) {
  const modal = document.createElement('app-modal');
  // ... opciones existentes
  modal.fullHeight = options.fullHeight ?? false;
  // ...
}
```

## Versión

Publicar como `2.3.0` (minor bump - nueva funcionalidad retrocompatible)

# Excepciones de SonarQube

Este documento explica las reglas de SonarQube que han sido deshabilitadas intencionalmente para este proyecto y las razones detrás de cada decisión.

## Stack Tecnológico
- **Framework**: Astro
- **Web Components**: Lit Element
- **Backend**: Firebase (Realtime Database, Firestore, Auth, Cloud Functions)
- **JavaScript**: ES2018+ (Vanilla)
- **Testing**: Vitest + Playwright

## Excepciones Configuradas

### 1. Importaciones Absolutas (javascript:S6327)
**Regla**: "Do not import modules using an absolute path"

**Archivos afectados**: `public/js/**/*.js`, `main.js`, `app-controller.js`

**Razón**: Astro resuelve rutas absolutas desde `public/`. Es el patrón recomendado.

```javascript
// ✅ Correcto en Astro
import '/js/wc/TaskCard.js';
// ❌ Evitar
import '../../../wc/TaskCard.js';
```

### 2. Console API (javascript:S2228)
**Regla**: "Console logging should not be used"

**Archivos afectados**: Servicios y componentes que usan `console.error` / `console.warn`

**Razón**: Se usa `console.error` y `console.warn` para errores y advertencias que deben persistir. `console.log` solo se usa temporalmente para debugging y se elimina antes de commit.

### 3. "this" en Templates de Lit (javascript:S4328)
**Regla**: "Dependencies should be explicit"

**Archivos afectados**: `wc/**/*.js`

**Razón**: En Lit Element, `this` es necesario en templates para acceder a propiedades reactivas.

```javascript
// Patrón normal en Lit
render() {
  return html`<div>${this.title}</div>`;
}
```

### 4. Variables Globales (javascript:S3798)
**Regla**: "Global variables should not be used"

**Archivos afectados**: `services/firebase-*.js`

**Razón**: Firebase requiere inicialización global y acceso a `window` para auth, messaging, etc.

### 5. Event Listeners sin Cleanup (javascript:S1530)
**Regla**: "Event listeners should be removed"

**Archivos afectados**: `wc/**/*.js`

**Razón**: Los Web Components manejan su ciclo de vida. Lit limpia automáticamente los listeners en `disconnectedCallback`.

### 6. Complejidad Cognitiva Alta (javascript:S3776)
**Regla**: "Cognitive Complexity of functions should not be too high"

**Archivos afectados**: `TaskCard.js`, `BugCard.js`, `EpicCard.js`

**Razón**: Los Web Components complejos naturalmente tienen alta complejidad debido a:
- Múltiples estados de UI
- Validaciones
- Manejo de eventos
- Lógica de negocio integrada

### 7. Demasiados Parámetros (javascript:S107)
**Regla**: "Functions should not have too many parameters"

**Archivos afectados**: `firebase-service.js`

**Razón**: Las APIs de Firebase requieren múltiples parámetros. Preferimos mantener la firma explícita para claridad.

### 8. Archivos Muy Grandes (javascript:S104)
**Regla**: "Files should not have too many lines"

**Archivos afectados**: Web Components y `app-controller.js`

**Razón**: Los Web Components encapsulan:
- Template (HTML)
- Estilos (CSS)
- Lógica (JS)
- Estado
Es preferible mantenerlos juntos para cohesión.

### 9. Alert/Confirm Nativos (javascript:S2755)
**Regla**: "Alert should not be used"

**Archivos afectados**: Ningun archivo activo debe usar `alert()`, `confirm()` ni `prompt()`.

**Razón**: Siempre se usa el sistema de modales de la aplicacion (`ModalService`, `AppModal`) y notificaciones (`SlideNotification`). Ver CLAUDE.md para las normas de UI/UX.

### 10. Duplicación en Estilos (CPD)
**Archivos excluidos**: `*-styles.js`

**Razón**: Los estilos de Web Components comparten patrones de diseño comunes intencionalmente.

## Archivos Excluidos del Análisis

```
- node_modules/
- dist/
- .astro/
- coverage/
- test-results/
- public/firebase-*.js (generados automáticamente)
- public/css/kanban-status-colors.css (generado)
- scripts/ (utilidades de build)
- *.config.js/mjs (configuraciones)
```

## Configuración Adicional

- **Entornos JS**: browser, es2021, webcomponents
- **Cobertura**: Se lee de `coverage/lcov.info`
- **Tests**: En carpetas `tests/` y `playwright/`

## Mejores Prácticas del Proyecto

1. **Usar `console.error` / `console.warn`** para errores y advertencias persistentes
2. **Preferir importaciones absolutas** desde `/public`
3. **Mantener Web Components cohesivos** aunque sean grandes
4. **Documentar decisiones arquitecturales** que puedan parecer code smells

## Revisión

Estas excepciones deben revisarse:
- En cada actualización mayor de dependencias
- Cuando se añadan nuevas tecnologías al stack
- Trimestralmente para validar que siguen siendo necesarias

## Referencias

- [Astro - Public Directory](https://docs.astro.build/en/guides/imports/#public-directory)
- [Lit Element - Best Practices](https://lit.dev/docs/components/lifecycle/)
- [Firebase - Web Setup](https://firebase.google.com/docs/web/setup)
- [SonarQube - Configuring Rules](https://docs.sonarqube.org/latest/project-administration/narrowing-the-focus/)

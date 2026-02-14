# DEV NOTES

## Estado actual (2025-01-03)
- Rama activa: `feature/lit-decoupling-v2`
- Paquete npm creado: `npm-packages/ui-components/`

## Trabajo completado

### Paquete @manufosela/ui-components
Ubicación: `npm-packages/ui-components/`

**Componentes extraídos:**
- `AppModal` - Modal con inyección de logger, modalRegistry e idGenerator
- `SlideNotification` - Notificaciones con logger inyectable
- `MultiSelect` - Selector múltiple con logger inyectable

**Patrón de inyección de dependencias:**
```javascript
// Sin logging (default)
showModal({ title: 'Test' });

// Con logging
showModal({ title: 'Test', logger: console });
showModal({ title: 'Test', logger: sinsole });

// AppModal con registry
showModal({
  title: 'Test',
  logger: sinsole,
  modalRegistry: modalManager,
  idGenerator: generateSecureTestId
});
```

**Build system:**
- esbuild para bundling
- `npm run build` genera dist/
- Exports individuales: `@manufosela/ui-components/app-modal`, etc.

## Estrategia de integración

### Opción actual: Paquete externo
- Componentes en `public/js/wc/` siguen funcionando (usan CDN de Lit)
- Paquete npm para uso en otros proyectos
- Para publicar: `cd npm-packages/ui-components && npm publish`

### Futura integración en app (opcional)
Para usar el paquete dentro de la app:
1. Copiar dist/ a public/js/lib/@manufosela/
2. Crear wrappers que inyecten sinsole y modalManager
3. O usar import maps en el HTML

## Próximos pasos
1. Publicar paquete en npm: `npm publish --access public`
2. (Opcional) Integrar en la app principal
3. (Opcional) Extraer más componentes: GanttChart, SprintPointsChart

## Notas importantes
- Usar `AppModal` para confirmaciones (no `<dialog>`)
- Comunicación entre componentes por `CustomEvent`
- Evitar fallbacks/parches; resolver causa raíz
- Los componentes originales en `public/js/wc/` siguen teniendo dependencias de la app

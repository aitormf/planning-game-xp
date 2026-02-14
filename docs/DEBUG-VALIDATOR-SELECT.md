# Debug: Validator Select no se marca

## Estado actual (RESUELTO)

La migración de `/projects` y `/cards` a IDs (`dev_XXX`, `stk_XXX`) está completa.

### ✅ SOLUCIONADO: Validator select no marcaba el valor

**Causa**: Lit no actualiza correctamente el atributo `selected` en opciones de `<select>` después del render inicial cuando se usa `?selected=`.

**Solución**: Usar el binding `.value` en el `<select>` en lugar de `?selected` en cada `<option>`.

**Cambio en TaskCard.js:**
```javascript
// ANTES (no funcionaba):
<select @change=${this._handleValidatorChange}>
  ${this.getProcessedStakeholderList().map(stakeholder => html`
    <option value=${stakeholder.value} ?selected=${this.isValidatorSelected(stakeholder.value)}>...</option>
  `)}
</select>

// DESPUÉS (funciona):
<select .value=${this.validator || ''} @change=${this._handleValidatorChange}>
  ${this.getProcessedStakeholderList().map(stakeholder => html`
    <option value=${stakeholder.value}>...</option>
  `)}
</select>
```

El mismo cambio se aplicó al select de Developer.

## Archivos subidos a Firebase

| Archivo local | Path en Firebase |
|---------------|------------------|
| `data/projects-migrated.json` | `/projects` |
| `data/cards-migrated.json` | `/cards` |

El servicio `entity-directory-service.js` toma los IDs desde `/projects/{projectId}/developers` y `/projects/{projectId}/stakeholders`, y resuelve nombre/email desde `/data/developers` y `/data/stakeholders`.

## Problema pendiente: Developer muestra ID en tabla

### Causa probable

El ID del developer no tiene entrada equivalente en `/data/developers`.

### Solución

Completar el developer en `/data/developers/{devId}` (email/nombre).

## Error: firebaseService.getStakeholderList

```
TypeError: firebaseService.getStakeholderList is not a function
    at TaskFilters.getValidatorOptions (TaskFilters.js:901:63)
```

El método `getStakeholderList` no existe en `firebase-service.js`. Necesita ser implementado o cambiar el código que lo llama para usar `entity-directory-service` en su lugar.

## Archivos modificados

- `public/js/wc/TaskCard.js`:
  - **FIX**: Cambio de `?selected` a `.value` en selects de Developer y Validator
  - Fix en `_normalizeContactEntries` para preservar `id` en developers
  - Añadido log en resolución de entity IDs

- `public/js/utils/developer-normalizer.js`:
  - Revertido parches anteriores

## Scripts de migración creados

- `scripts/migrate-projects-to-entity-ids.js`
- `scripts/migrate-cards-to-entity-ids.js`
- `scripts/clean-cards.js`
- `scripts/list-card-fields.js`

## Próximos pasos

1. **Revisar developers del proyecto**:
   - Path: `/projects/{projectId}/developers`

2. **Implementar getStakeholderList en firebase-service.js** o actualizar TaskFilters.js para usar entity-directory-service

3. **Probar la solución del select**:
   - Abrir una task con validator asignado
   - Verificar que el select muestra el valor correcto
   - Guardar y verificar que no se machaca el validator

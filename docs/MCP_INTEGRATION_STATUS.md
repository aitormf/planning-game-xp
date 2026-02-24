# MCP Integration Status

## Estado actual

Las 3 fases del plan de integracion del MCP estan completadas y subidas en la rama `feat/mcp-integration-shared-module` (PR #26).

### Commits incluidos

1. `feat: add shared/ module` - constants, validation, priority, utils + 86 tests
2. `refactor: align bug statuses to 5` - unify imports from shared/, migration script
3. `fix(ui): remove eliminated bug status references` - palettes, CSS, filters, fallbacks
4. `feat: integrate MCP server as local module` - 16 files, firebase-adapter, register-tools

### Que se hizo

| Fase | Descripcion | Estado |
|------|-------------|--------|
| Phase 1 | `shared/` module (constants, validation, priority, utils) | Completado - 86 tests |
| Phase 2 | MCP tools integrados en `mcp/` (28 tools, ~780 lineas cards.js vs 2211 original) | Completado |
| Phase 3 | Entry point stdio (`mcp/index.js`) | Completado |
| Cleanup | Bug statuses de 10 a 5 en UI (palettes, CSS, filters, fallbacks) | Completado |

### Tests verificados

- `tests/shared/` - 86 tests pass
- `tests/utils/priority-utils.test.js` - 54 tests pass
- `tests/functions/` - todos pass
- `node --check` en todos los ficheros `mcp/` - sintaxis OK
- Suite completa: 999/1048 pass (49 fallan por falta de `firebase-config.js`, se genera con `npm run dev`)

---

## Siguientes pasos para verificar

### 1. Configurar entorno (instancias)

```bash
# Copiar .env.dev desde tu portatil personal o Google Drive (APP-CONFIG/Planning-GameXP)
# Generar firebase-config.js:
npm run dev  # o npm run emulator
```

### 2. Verificar tests completos

```bash
npm run dev &       # genera firebase-config.js
npm test            # deberia dar 1048/1048 pass
```

### 3. Probar el MCP integrado

Configurar en `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "planning-game": {
      "command": "node",
      "args": ["mcp/index.js"],
      "env": { "MCP_INSTANCE_DIR": "/path/to/tu-instancia" }
    }
  }
}
```

Probar: `list_projects`, `get_card`, `create_card`

### 4. Verificar UI con emulador

- Arrancar emulador + dev server
- Abrir vista kanban de bugs -> debe mostrar solo 5 columnas: **Created, Assigned, Fixed, Verified, Closed**
- Verificar filtros de bugs -> solo 5 opciones de status
- Verificar que colores de status se aplican correctamente en tablas y cards

### 5. Migracion de datos (si hay bugs con statuses viejos)

```bash
node scripts/migrate-bug-statuses.js  # contra emulador primero
```

El script convierte:
- Triaged -> Assigned
- In Progress -> Assigned
- In Testing -> Fixed
- Blocked -> Assigned (con nota)
- Rejected -> Closed

### 6. Pendientes menores

- `MCP_SERVER_PROMPT.md` esta untracked (documentacion temporal, no incluido en commits)
- Los 49 tests que fallan sin `firebase-config.js` son preexistentes, se resuelven generando el fichero con `npm run dev`
- Tras verificar todo, mergear PR #26 a main

---

## Estructura de ficheros nuevos

```
shared/                          # Single source of truth
  constants.js                   # Statuses, priorities, transition rules
  validation.js                  # Entity, bug, task, commits validation
  priority.js                    # generatePriorityMap, calculatePriority
  utils.js                       # SECTION_MAP, getAbbrId, buildSectionPath
  index.cjs                      # CJS wrapper para Cloud Functions

mcp/                             # MCP server local integrado
  index.js                       # Entry point stdio
  register-tools.js              # Registro de 28 tools
  firebase-adapter.js            # Firebase Admin init
  user.js                        # .mcp-user.json management
  version-check.js               # Version checking y update
  usage-rules.js                 # Usage rules resource
  package.json                   # ESM module, deps: mcp-sdk, firebase-admin, zod
  tools/
    cards.js                     # ~780 lineas (importa de shared/)
    projects.js
    sprints.js
    developers.js
    stakeholders.js
    adrs.js
    global-config.js
    setup-user.js

scripts/
  migrate-bug-statuses.js        # Migracion de bugs existentes

tests/shared/                    # 86 tests
  constants-alignment.test.js
  validation.test.js
  priority.test.js
  utils.test.js
```

# Flujo de Trabajo MCP para Tarjetas - BecarIA

Este documento define el flujo de trabajo obligatorio para BecarIA-MCP cuando trabaja con tarjetas (tareas/bugs) del sistema Planning Game.

## Por Qué Esto Importa

Saltarse pasos en este flujo de trabajo causa:
- Tarjetas atascadas en estados incorrectos (ej: "In Progress" para siempre)
- Notificaciones faltantes a validadores
- Sin trazabilidad del trabajo realizado
- Métricas e informes rotos

## Identificación del Usuario (OBLIGATORIO)

**Antes de trabajar en cualquier tarjeta**, el MCP debe saber qué developer lo está usando. Esto se almacena en `.mcp-user.json` (gitignored, cada developer tiene el suyo).

### Configuración Inicial

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 1: Verificar si existe configuración                              │
│ ────────────────────────────────────────────────────────────────────── │
│ Leer archivo: .mcp-user.json                                           │
│                                                                        │
│ Si EXISTE y es válido:                                                 │
│   → Usar developerId del archivo                                       │
│   → Saltar al Flujo de Trabajo de Tareas                               │
│                                                                        │
│ Si NO EXISTE:                                                          │
│   → Continuar al Paso 2                                                │
│                                                                        │
│ PASO 2: Preguntar al usuario su email                                  │
│ ────────────────────────────────────────────────────────────────────── │
│ Pregunta: "¿Cuál es tu email para el Planning Game?"                   │
│                                                                        │
│ PASO 3: Buscar developer en Firebase                                   │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: list_developers()                                         │
│                                                                        │
│ Buscar email coincidente en la respuesta                               │
│                                                                        │
│ Si NO SE ENCUENTRA:                                                    │
│   → Error: "Email no encontrado en la lista de developers"             │
│   → Pedir al usuario que verifique el email o contacte al admin        │
│                                                                        │
│ PASO 4: Guardar configuración                                          │
│ ────────────────────────────────────────────────────────────────────── │
│ Crear .mcp-user.json:                                                  │
│ {                                                                      │
│   "developerId": "dev_XXX",       // de list_developers (o del user)   │
│   "developerName": "Nombre",      // de list_developers/projects       │
│   "developerEmail": "email@..."   // input del usuario                 │
│ }                                                                      │
│                                                                        │
│ Confirmar: "Configuración guardada. Eres identificado como [Nombre]"   │
└────────────────────────────────────────────────────────────────────────┘
```

### Formato del Archivo de Configuración

Ubicación: `RAIZ_PROYECTO/.mcp-user.json`

```json
{
  "developerId": "dev_010",
  "developerName": "Mánu Fosela",
  "developerEmail": "admin@yourdomain.com"
}
```

**Importante**: Este archivo está gitignored. Cada developer que trabaje con MCP debe tener su propia configuración local.

### Usando el ID de Developer

Al actualizar tarjetas (Fase 2 del Flujo de Trabajo de Tareas), usa el `developerId` de `.mcp-user.json`:

```javascript
// Leer de la configuración
const config = JSON.parse(fs.readFileSync('.mcp-user.json'));

// Usar en llamada MCP
update_card(projectId, "task", firebaseId, {
  "status": "In Progress",
  "developer": config.developerId,  // ¡NO hardcodeado!
  "startDate": "2026-01-25"
});
```

## Flujo de Trabajo de Tareas

### Fase 1: Verificaciones Pre-Vuelo

**Antes de escribir CUALQUIER código**, verifica que la tarjeta está lista para desarrollo:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 1: Obtener detalles de la tarjeta                                 │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: get_card(projectId, cardId)                               │
│                                                                        │
│ PASO 2: Verificar que existen criterios de aceptación                  │
│ ────────────────────────────────────────────────────────────────────── │
│ Verificar: card.acceptanceCriteriaStructured es array con elementos    │
│                                                                        │
│ Si FALTA o está VACÍO:                                                 │
│   → PARAR inmediatamente                                               │
│   → Notificar: "La tarjeta necesita criterios de aceptación antes      │
│                 de comenzar el trabajo"                                │
│   → Opciones: generarlos O el usuario los añade manualmente en la app  │
│                                                                        │
│ PASO 3: Verificar que los puntos están estimados                       │
│ ────────────────────────────────────────────────────────────────────── │
│ Verificar: card.devPoints > 0 Y card.businessPoints > 0                │
│                                                                        │
│ Si FALTA o es CERO:                                                    │
│   → PARAR inmediatamente                                               │
│   → Notificar: "La tarjeta necesita estimación de devPoints y          │
│                 businessPoints"                                        │
│                                                                        │
│ PASO 4: Verificar que hay validador asignado                           │
│ ────────────────────────────────────────────────────────────────────── │
│ Verificar: card.validator está definido (formato stk_XXX)              │
│                                                                        │
│ Si FALTA o está VACÍO:                                                 │
│   → PREGUNTAR al usuario: "¿Quién es el validator/stakeholder de       │
│                            esta tarea?"                                │
│   → Actualizar tarjeta con validator ANTES de empezar a trabajar       │
│   → Requerido para transiciones de estado y notificaciones             │
└────────────────────────────────────────────────────────────────────────┘
```

### Fase 2: Iniciar Trabajo

**Actualizar estado de la tarjeta ANTES de comenzar la implementación:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 4: Actualizar tarjeta a "In Progress"                             │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: update_card(projectId, "task", firebaseId, {              │
│   "status": "In Progress",                                             │
│   "developer": "dev_010",        // o developer asignado               │
│   "startDate": "2026-01-25"      // fecha de hoy YYYY-MM-DD            │
│ })                                                                     │
│                                                                        │
│ Verificar: La respuesta muestra que el estado cambió correctamente     │
│                                                                        │
│ PASO 5: Crear rama desde main                                          │
│ ────────────────────────────────────────────────────────────────────── │
│ git checkout main && git pull origin main                              │
│ git checkout -b feat/{CARD-ID}-descripcion-corta                       │
│                                                                        │
│ Ejemplo: feat/PLN-TSK-0206-pipeline-instructions                       │
│ Para bugs: fix/{CARD-ID}-descripcion-corta                             │
│                                                                        │
│ ⚠️ NUNCA hacer commit directo a main                                   │
│ ⚠️ NUNCA hacer push directo a main                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Fase 3: Implementación

**Seguir desarrollo orientado a tests (test-first):**

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 5: Crear tests a partir de los criterios de aceptación            │
│ ────────────────────────────────────────────────────────────────────── │
│ Para cada criterio en acceptanceCriteriaStructured:                    │
│   Given → Setup/precondición del test                                  │
│   When  → Acción a testear                                             │
│   Then  → Aserción esperada                                            │
│                                                                        │
│ PASO 6: Implementar la funcionalidad/fix                               │
│ ────────────────────────────────────────────────────────────────────── │
│ Escribir código para que los tests pasen                               │
│                                                                        │
│ PASO 7: Ejecutar todos los tests                                       │
│ ────────────────────────────────────────────────────────────────────── │
│ Comando: npm test                                                      │
│                                                                        │
│ Si los tests FALLAN:                                                   │
│   → Arreglar problemas antes de continuar                              │
│   → NO proceder al siguiente paso con tests fallando                   │
│                                                                        │
│ PASO 8: Ejecutar análisis de calidad con SonarQube                     │
│ ────────────────────────────────────────────────────────────────────── │
│ Comando: npx sonar-scanner                                             │
│                                                                        │
│ Prerequisito: SonarQube debe estar corriendo (docker compose up -d)    │
│                                                                        │
│ Verificar en la salida:                                                │
│   ✅ "ANALYSIS SUCCESSFUL" → Continuar                                 │
│   ❌ Errores críticos (bugs, vulnerabilities) → Corregir antes         │
│                                                                        │
│ Si hay problemas de calidad:                                           │
│   → Revisar el reporte en http://localhost:9000                        │
│   → Corregir bugs y vulnerabilidades detectadas                        │
│   → Volver a ejecutar sonar-scanner                                    │
│   → NO proceder a la Fase 4 con issues críticos                        │
│                                                                        │
│ Nota: Code smells menores pueden documentarse para mejora futura       │
└────────────────────────────────────────────────────────────────────────┘
```

### Fase 4: Pipeline de Entrega (commit → PR → To Validate)

**⚠️ CRÍTICO: Esta fase es OBLIGATORIA. NO LA SALTES.**

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 9: Hacer commit con conventional commits                          │
│ ────────────────────────────────────────────────────────────────────── │
│ git add <ficheros> && git commit -m "feat: descripción"                │
│                                                                        │
│ Prefijos válidos: feat:, fix:, refactor:, docs:, test:, chore:         │
│ ⚠️ NUNCA referenciar Claude o IA en mensajes de commit                 │
│                                                                        │
│ PASO 10: Push de la rama y crear Pull Request                          │
│ ────────────────────────────────────────────────────────────────────── │
│ git push -u origin feat/{CARD-ID}-descripcion                          │
│ gh pr create --title "..." --body "..."                                │
│                                                                        │
│ Anotar: URL del PR y número del PR                                     │
│                                                                        │
│ PASO 11: Actualizar tarjeta a "To Validate" con pipeline              │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: update_card(projectId, "task", firebaseId, {              │
│   "status": "To Validate",                                             │
│   "endDate": "2026-02-22",                                             │
│   "commits": [{                                                        │
│     "hash": "abc1234",                                                 │
│     "message": "feat: descripción del commit",                         │
│     "date": "2026-02-22T10:00:00Z",                                    │
│     "author": "dev"                                                    │
│   }],                                                                  │
│   "pipelineStatus": {                                                  │
│     "prCreated": {                                                     │
│       "date": "2026-02-22T10:30:00Z",                                  │
│       "prUrl": "https://github.com/org/repo/pull/42",                  │
│       "prNumber": 42                                                   │
│     }                                                                  │
│   },                                                                   │
│   "aiUsage": [{ ... }]   // OBLIGATORIO si developer es BecarIA        │
│ })                                                                     │
│                                                                        │
│ ⚠️ pipelineStatus.prCreated es OBLIGATORIO (validado por el MCP)       │
│ ⚠️ aiUsage es OBLIGATORIO si developer = dev_016 (BecarIA)             │
│                                                                        │
│ PASO 12: Verificar que la actualización fue exitosa                    │
│ ────────────────────────────────────────────────────────────────────── │
│ Verificar: La respuesta muestra status = "To Validate"                 │
│                                                                        │
│ ⛔ ESTADOS PROHIBIDOS:                                                 │
│    - "Done"                                                            │
│    - "Done&Validated"                                                  │
│    Estos SOLO los establece el validador (stakeholder), nunca el MCP   │
│                                                                        │
│ ⛔ NUNCA hacer push directo a main - siempre ramas + PRs               │
└────────────────────────────────────────────────────────────────────────┘
```

### Pipeline de Entrega: Eventos Rastreados

| Evento | Cuándo | Campos Requeridos |
|--------|--------|-------------------|
| `committed` | Después del commit | `date`, `commitHash`, `branch` |
| `prCreated` | Después de crear PR | `date`, `prUrl`, `prNumber` |
| `merged` | Después de mergear PR | `date`, `mergedBy` |
| `deployed` | Después del despliegue | `date`, `environment` |

**Validaciones del MCP:**
- `pipelineStatus.prCreated` (con `prUrl` y `prNumber`) es **obligatorio** para "To Validate" (tasks) y "Fixed" (bugs)
- `aiUsage` es **obligatorio** cuando el developer es BecarIA (`dev_016`)

## Flujo de Trabajo de Bugs

Igual que el flujo de trabajo de Tareas con estas diferencias:

| Fase | Tarea | Bug |
|-------|------|-----|
| Fase 2 | status: "In Progress" | status: "Assigned" |
| Fase 4 | status: "To Validate" | status: "Fixed" |

## Crear Nuevas Tarjetas

### Crear Tareas

**⚠️ FORMATO OBLIGATORIO: User Story (Como/Quiero/Para)**

Las tareas DEBEN seguir el formato de User Story de eXtreme Programming:

```
┌────────────────────────────────────────────────────────────────────────┐
│ FORMATO DE DESCRIPCIÓN (OBLIGATORIO)                                   │
│ ────────────────────────────────────────────────────────────────────── │
│                                                                        │
│ **Como** [tipo de usuario/rol]                                         │
│ **Quiero** [acción o funcionalidad deseada]                            │
│ **Para** [beneficio o valor de negocio que aporta]                     │
│                                                                        │
│ EJEMPLOS:                                                              │
│ ────────────────────────────────────────────────────────────────────── │
│ ✅ CORRECTO:                                                           │
│   title: "Permitir a developers crear documentación"                   │
│   description: "**Como** developer del proyecto                        │
│                 **Quiero** poder crear y editar documentos en la       │
│                 sección DOCs                                           │
│                 **Para** mantener la documentación técnica actualizada │
│                 sin depender del administrador"                        │
│                                                                        │
│ ❌ INCORRECTO:                                                         │
│   title: "Permisos de documentación"                                   │
│   description: "Añadir permisos para developers"                       │
│                (demasiado corto, sin formato User Story)               │
│                                                                        │
│ REGLAS:                                                                │
│ ────────────────────────────────────────────────────────────────────── │
│ 1. El "Como" debe identificar claramente el ROL (developer,            │
│    stakeholder, admin, usuario, etc.)                                  │
│ 2. El "Quiero" debe describir la ACCIÓN concreta                       │
│ 3. El "Para" debe explicar el VALOR de negocio, no solo una frase      │
│    genérica. Responde: ¿Por qué esto es importante?                    │
│ 4. Si hay excepciones o reglas especiales, añadirlas después del       │
│    Para como notas adicionales                                         │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 1: Obtener contexto del proyecto                                  │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamadas MCP (paralelo):                                               │
│   - list_cards(projectId, type="epic", year=2026)                      │
│   - list_sprints(projectId, year=2026)                                 │
│                                                                        │
│ PASO 2: Crear tarea con campos requeridos                              │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: create_card(projectId, "task", {                          │
│   title: "Verbo + objeto (ej: Permitir crear docs)",                   │
│   description: "**Como** [rol]\n**Quiero** [acción]\n**Para** [valor]",│
│   sprint: "PLN-SPR-XXXX",       // del paso 1                          │
│   epic: "PLN-PCS-XXXX",         // del paso 1                          │
│   year: 2026,                                                          │
│   priority: "Medium",            // High/Medium/Low                    │
│   createdBy: "becarIA-MCP"                                             │
│ })                                                                     │
│                                                                        │
│ PASO 3: Añadir criterios de aceptación                                 │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: update_card(projectId, "task", firebaseId, {              │
│   acceptanceCriteriaStructured: [                                      │
│     {                                                                  │
│       "given": "contexto/precondición",                                │
│       "when": "acción realizada",                                      │
│       "then": "resultado esperado",                                    │
│       "raw": ""                                                        │
│     }                                                                  │
│   ]                                                                    │
│ })                                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Crear Bugs

**⚠️ IMPORTANTE**: Los bugs tienen campos requeridos DIFERENTES a las tareas.

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 1: Obtener contexto del proyecto                                  │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamadas MCP (paralelo):                                               │
│   - list_cards(projectId, type="epic", year=2026)                      │
│   - list_sprints(projectId, year=2026)                                 │
│                                                                        │
│ PASO 2: Crear bug con campos requeridos                                │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: create_card(projectId, "bug", {                           │
│   title: "...",                                                        │
│   description: "...",                                                  │
│   sprint: "PLN-SPR-XXXX",       // del paso 1                          │
│   epic: "PLN-PCS-XXXX",         // del paso 1                          │
│   year: 2026,                                                          │
│   registerDate: "YYYY-MM-DD",   // ⚠️ REQUERIDO - fecha de hoy         │
│   priority: "...",               // ⚠️ Ver LISTA DE PRIORIDAD DE BUGS  │
│   createdBy: "becarIA-MCP"                                             │
│ })                                                                     │
│                                                                        │
│ LISTA DE PRIORIDAD DE BUGS (usar SOLO uno de estos valores):           │
│ ────────────────────────────────────────────────────────────────────── │
│   • "APPLICATION BLOCKER"       - App inutilizable                     │
│   • "DEPARTMENT BLOCKER"        - Flujo de trabajo del dpto. bloqueado │
│   • "INDIVIDUAL BLOCKER"        - Un usuario bloqueado                 │
│   • "USER EXPERIENCE ISSUE"     - Problema de UX, no bloquea           │
│   • "WORKFLOW IMPROVEMENT"      - El proceso podría ser mejor          │
│   • "WORKAROUND AVAILABLE ISSUE"- Bug con workaround conocido          │
│                                                                        │
│ ⛔ NO USAR: "High", "Medium", "Low" - estos son SOLO para TAREAS       │
│                                                                        │
│ PASO 3: Añadir criterios de aceptación (opcional para bugs)            │
│ ────────────────────────────────────────────────────────────────────── │
│ Llamada MCP: update_card(projectId, "bug", firebaseId, {               │
│   acceptanceCriteriaStructured: [                                      │
│     {                                                                  │
│       "given": "contexto/precondición",                                │
│       "when": "acción realizada",                                      │
│       "then": "resultado esperado",                                    │
│       "raw": ""                                                        │
│     }                                                                  │
│   ]                                                                    │
│ })                                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Diferencias de Campos entre Bug y Tarea

| Campo | Tarea | Bug |
|-------|------|-----|
| priority | "High"/"Medium"/"Low" | Ver LISTA DE PRIORIDAD DE BUGS arriba |
| registerDate | No requerido | ⚠️ REQUERIDO (YYYY-MM-DD) |
| acceptanceCriteriaStructured | Requerido | Opcional |

## Referencia Rápida: Transiciones de Estado

### Tareas
```
To Do → In Progress → To Validate → Done/Done&Validated
        ^^^^^^^^^^^    ^^^^^^^^^^^
        (MCP asigna)   (MCP asigna)   (Validador asigna)
```

### Bugs
```
New → Assigned → Fixed → Verified/Closed
      ^^^^^^^^   ^^^^^
      (MCP asigna) (MCP asigna)  (Validador asigna)
```

## IDs de Developer

**NO hardcodear IDs de developer.** Siempre leer de `.mcp-user.json`.

Ver sección [Identificación del Usuario](#identificación-del-usuario-obligatorio) para instrucciones de configuración.

Cuentas especiales:
| Cuenta | Email | Notas |
|---------|-------|-------|
| BecarIA | becaria@ia.local | Agente IA, sin notificaciones |

## Errores Comunes a Evitar

1. **Olvidar la Fase 4**: La tarjeta queda "In Progress" para siempre
2. **Establecer "Done" directamente**: Salta el flujo de validación
3. **Saltarse verificaciones pre-vuelo**: Trabajar en tarjetas sin criterios/puntos
4. **Formato de fecha incorrecto**: Siempre usar `YYYY-MM-DD`
5. **No verificar respuesta del MCP**: La actualización puede haber fallado silenciosamente

## Notificaciones

Cuando una tarea pasa a "To Validate":
- El sistema notifica automáticamente al validador vía push notification
- El sistema envía email al validador
- No se requiere acción del MCP

**Excepción BecarIA**: BecarIA (becaria@ia.local) NUNCA debe recibir notificaciones ya que es un agente IA sin acceso a la app.

## Limitaciones Conocidas

### ~~PLN-TSK-0066: list_developers() no devuelve IDs~~ (RESUELTO)

**Estado**: ✅ Arreglado (2026-01-25)

El endpoint MCP `list_developers()` ahora lee de `/data/developers` y devuelve `{id, name, email}` para cada developer.

Ejemplo de respuesta:
```json
[
  { "id": "dev_010", "name": "Mánu Fosela", "email": "admin@yourdomain.com" }
]
```

### IDs de Developer en Proyecto vs Global

Los developers aparecen en dos lugares:
- **A nivel de proyecto**: `/cards/{project}/developers` - solo name/email
- **Global**: `/data/developers` - tiene IDs `dev_XXX`

El MCP ahora lee de la colección global `/data/developers` para obtener los IDs de developer.

---

# MCP Card Workflow - BecarIA (English Version)

This document defines the mandatory workflow for BecarIA-MCP when working with cards (tasks/bugs) from the Planning Game system.

## Why This Matters

Skipping steps in this workflow causes:
- Cards stuck in wrong states (e.g., "In Progress" forever)
- Missing notifications to validators
- No traceability of work done
- Broken metrics and reports

## User Identification (REQUIRED)

**Before working on any card**, the MCP must know which developer is using it. This is stored in `.mcp-user.json` (gitignored, each developer has their own).

### First Time Setup

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Check for existing config                                      │
│ ────────────────────────────────────────────────────────────────────── │
│ Read file: .mcp-user.json                                              │
│                                                                        │
│ If EXISTS and valid:                                                   │
│   → Use developerId from file                                          │
│   → Skip to Task Workflow                                              │
│                                                                        │
│ If NOT EXISTS:                                                         │
│   → Continue to Step 2                                                 │
│                                                                        │
│ STEP 2: Ask user for email                                             │
│ ────────────────────────────────────────────────────────────────────── │
│ Prompt: "What is your email address for the Planning Game?"            │
│                                                                        │
│ STEP 3: Find developer in Firebase                                     │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: list_developers()                                            │
│                                                                        │
│ Search for matching email in response                                  │
│                                                                        │
│ If NOT FOUND:                                                          │
│   → Error: "Email not found in developers list"                        │
│   → Ask user to verify email or contact admin                          │
│                                                                        │
│ STEP 4: Save configuration                                             │
│ ────────────────────────────────────────────────────────────────────── │
│ Create .mcp-user.json:                                                 │
│ {                                                                      │
│   "developerId": "dev_XXX",       // from list_developers (or user)    │
│   "developerName": "Name",        // from list_developers/projects     │
│   "developerEmail": "email@..."   // user input                        │
│ }                                                                      │
│                                                                        │
│ Confirm: "Configuration saved. You are identified as [Name]"           │
└────────────────────────────────────────────────────────────────────────┘
```

### Config File Format

Location: `PROJECT_ROOT/.mcp-user.json`

```json
{
  "developerId": "dev_010",
  "developerName": "Mánu Fosela",
  "developerEmail": "admin@yourdomain.com"
}
```

**Important**: This file is gitignored. Each developer working with MCP must have their own local config.

### Using Developer ID

When updating cards (Phase 2 of Task Workflow), use the `developerId` from `.mcp-user.json`:

```javascript
// Read from config
const config = JSON.parse(fs.readFileSync('.mcp-user.json'));

// Use in MCP call
update_card(projectId, "task", firebaseId, {
  "status": "In Progress",
  "developer": config.developerId,  // NOT hardcoded!
  "startDate": "2026-01-25"
});
```

## Task Workflow

### Phase 1: Pre-Flight Checks

**Before writing ANY code**, verify the card is ready for development:

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Get card details                                               │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: get_card(projectId, cardId)                                  │
│                                                                        │
│ STEP 2: Verify acceptance criteria exist                               │
│ ────────────────────────────────────────────────────────────────────── │
│ Check: card.acceptanceCriteriaStructured is array with items           │
│                                                                        │
│ If MISSING or EMPTY:                                                   │
│   → STOP immediately                                                   │
│   → Notify user: "Card needs acceptance criteria before work begins"   │
│   → Options: generate them OR user adds manually in app                │
│                                                                        │
│ STEP 3: Verify points are estimated                                    │
│ ────────────────────────────────────────────────────────────────────── │
│ Check: card.devPoints > 0 AND card.businessPoints > 0                  │
│                                                                        │
│ If MISSING or ZERO:                                                    │
│   → STOP immediately                                                   │
│   → Notify user: "Card needs devPoints and businessPoints estimation"  │
│                                                                        │
│ STEP 4: Verify validator is assigned                                   │
│ ────────────────────────────────────────────────────────────────────── │
│ Check: card.validator is set (stk_XXX format)                          │
│                                                                        │
│ If MISSING or EMPTY:                                                   │
│   → ASK user: "Who is the validator/stakeholder for this task?"        │
│   → Update card with validator BEFORE starting work                    │
│   → Required for status transitions and notifications                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Start Work

**Update card status BEFORE starting implementation:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Update card to "In Progress"                                   │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: update_card(projectId, "task", firebaseId, {                 │
│   "status": "In Progress",                                             │
│   "developer": "dev_010",        // or assigned developer              │
│   "startDate": "2026-01-25"      // today's date YYYY-MM-DD            │
│ })                                                                     │
│                                                                        │
│ Verify: Response shows status changed successfully                     │
│                                                                        │
│ STEP 5: Create branch from main                                        │
│ ────────────────────────────────────────────────────────────────────── │
│ git checkout main && git pull origin main                              │
│ git checkout -b feat/{CARD-ID}-short-description                       │
│                                                                        │
│ Example: feat/PLN-TSK-0206-pipeline-instructions                       │
│ For bugs: fix/{CARD-ID}-short-description                              │
│                                                                        │
│ ⚠️ NEVER commit directly to main                                      │
│ ⚠️ NEVER push directly to main                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Implementation

**Follow test-first development:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Create tests from acceptance criteria                          │
│ ────────────────────────────────────────────────────────────────────── │
│ For each criterion in acceptanceCriteriaStructured:                    │
│   Given → Test setup/precondition                                      │
│   When  → Action to test                                               │
│   Then  → Expected assertion                                           │
│                                                                        │
│ STEP 6: Implement the feature/fix                                      │
│ ────────────────────────────────────────────────────────────────────── │
│ Write code to make tests pass                                          │
│                                                                        │
│ STEP 7: Run all tests                                                  │
│ ────────────────────────────────────────────────────────────────────── │
│ Command: npm test                                                      │
│                                                                        │
│ If tests FAIL:                                                         │
│   → Fix issues before continuing                                       │
│   → DO NOT proceed to next step with failing tests                     │
│                                                                        │
│ STEP 8: Run code quality analysis with SonarQube                       │
│ ────────────────────────────────────────────────────────────────────── │
│ Command: npx sonar-scanner                                             │
│                                                                        │
│ Prerequisite: SonarQube must be running (docker compose up -d)         │
│                                                                        │
│ Check the output:                                                      │
│   ✅ "ANALYSIS SUCCESSFUL" → Continue                                  │
│   ❌ Critical issues (bugs, vulnerabilities) → Fix before continuing   │
│                                                                        │
│ If quality issues found:                                               │
│   → Review report at http://localhost:9000                             │
│   → Fix detected bugs and vulnerabilities                              │
│   → Re-run sonar-scanner                                               │
│   → DO NOT proceed to Phase 4 with critical issues                     │
│                                                                        │
│ Note: Minor code smells can be documented for future improvement       │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 4: Delivery Pipeline (commit → PR → To Validate)

**⚠️ CRITICAL: This phase is MANDATORY. DO NOT SKIP.**

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 9: Commit with conventional commits                               │
│ ────────────────────────────────────────────────────────────────────── │
│ git add <files> && git commit -m "feat: description"                   │
│                                                                        │
│ Valid prefixes: feat:, fix:, refactor:, docs:, test:, chore:           │
│ ⚠️ NEVER reference Claude or AI in commit messages                    │
│                                                                        │
│ STEP 10: Push branch and create Pull Request                           │
│ ────────────────────────────────────────────────────────────────────── │
│ git push -u origin feat/{CARD-ID}-description                          │
│ gh pr create --title "..." --body "..."                                │
│                                                                        │
│ Note: PR URL and PR number for the card update                         │
│                                                                        │
│ STEP 11: Update card to "To Validate" with pipeline info              │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: update_card(projectId, "task", firebaseId, {                 │
│   "status": "To Validate",                                             │
│   "endDate": "2026-02-22",                                             │
│   "commits": [{                                                        │
│     "hash": "abc1234",                                                 │
│     "message": "feat: commit description",                             │
│     "date": "2026-02-22T10:00:00Z",                                    │
│     "author": "dev"                                                    │
│   }],                                                                  │
│   "pipelineStatus": {                                                  │
│     "prCreated": {                                                     │
│       "date": "2026-02-22T10:30:00Z",                                  │
│       "prUrl": "https://github.com/org/repo/pull/42",                  │
│       "prNumber": 42                                                   │
│     }                                                                  │
│   },                                                                   │
│   "aiUsage": [{ ... }]   // REQUIRED if developer is BecarIA           │
│ })                                                                     │
│                                                                        │
│ ⚠️ pipelineStatus.prCreated is REQUIRED (enforced by MCP server)      │
│ ⚠️ aiUsage is REQUIRED if developer = dev_016 (BecarIA)               │
│                                                                        │
│ STEP 12: Verify update succeeded                                       │
│ ────────────────────────────────────────────────────────────────────── │
│ Check: Response shows status = "To Validate"                           │
│                                                                        │
│ ⛔ FORBIDDEN STATUSES:                                                 │
│    - "Done"                                                            │
│    - "Done&Validated"                                                  │
│    These are ONLY set by the validator (stakeholder), never by MCP     │
│                                                                        │
│ ⛔ NEVER push directly to main - always use branches + PRs            │
└────────────────────────────────────────────────────────────────────────┘
```

### Delivery Pipeline: Tracked Events

| Event | When | Required Fields |
|-------|------|-----------------|
| `committed` | After git commit | `date`, `commitHash`, `branch` |
| `prCreated` | After creating PR | `date`, `prUrl`, `prNumber` |
| `merged` | After PR is merged | `date`, `mergedBy` |
| `deployed` | After deployment | `date`, `environment` |

**MCP Validations:**
- `pipelineStatus.prCreated` (with `prUrl` and `prNumber`) is **required** for "To Validate" (tasks) and "Fixed" (bugs)
- `aiUsage` is **required** when developer is BecarIA (`dev_016`)

## Bug Workflow

Same as Task workflow with these differences:

| Phase | Task | Bug |
|-------|------|-----|
| Phase 2 | status: "In Progress" | status: "Assigned" |
| Phase 4 | status: "To Validate" | status: "Fixed" |

## Creating New Cards

### Creating Tasks

**⚠️ MANDATORY FORMAT: User Story (As/I want/So that)**

Tasks MUST follow the eXtreme Programming User Story format:

```
┌────────────────────────────────────────────────────────────────────────┐
│ DESCRIPTION FORMAT (MANDATORY)                                         │
│ ────────────────────────────────────────────────────────────────────── │
│                                                                        │
│ **As** [user type/role]                                                │
│ **I want** [desired action or functionality]                           │
│ **So that** [business benefit or value it provides]                    │
│                                                                        │
│ EXAMPLES:                                                              │
│ ────────────────────────────────────────────────────────────────────── │
│ ✅ CORRECT:                                                            │
│   title: "Allow developers to create documentation"                    │
│   description: "**As** a project developer                             │
│                 **I want** to be able to create and edit documents     │
│                 in the DOCs section                                    │
│                 **So that** I can keep technical documentation updated │
│                 without depending on the administrator"                │
│                                                                        │
│ ❌ INCORRECT:                                                          │
│   title: "Documentation permissions"                                   │
│   description: "Add permissions for developers"                        │
│                (too short, no User Story format)                       │
│                                                                        │
│ RULES:                                                                 │
│ ────────────────────────────────────────────────────────────────────── │
│ 1. The "As" must clearly identify the ROLE (developer, stakeholder,   │
│    admin, user, etc.)                                                  │
│ 2. The "I want" must describe the concrete ACTION                      │
│ 3. The "So that" must explain the BUSINESS VALUE, not just a generic  │
│    phrase. Answer: Why is this important?                              │
│ 4. If there are exceptions or special rules, add them after the       │
│    "So that" as additional notes                                       │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Get project context                                            │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Calls (parallel):                                                  │
│   - list_cards(projectId, type="epic", year=2026)                      │
│   - list_sprints(projectId, year=2026)                                 │
│                                                                        │
│ STEP 2: Create task with required fields                               │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: create_card(projectId, "task", {                             │
│   title: "Verb + object (e.g.: Allow creating docs)",                  │
│   description: "**As** [role]\n**I want** [action]\n**So that** [value]",│
│   sprint: "PLN-SPR-XXXX",       // from step 1                         │
│   epic: "PLN-PCS-XXXX",         // from step 1                         │
│   year: 2026,                                                          │
│   priority: "Medium",            // High/Medium/Low                    │
│   createdBy: "becarIA-MCP"                                             │
│ })                                                                     │
│                                                                        │
│ STEP 3: Add acceptance criteria                                        │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: update_card(projectId, "task", firebaseId, {                 │
│   acceptanceCriteriaStructured: [                                      │
│     {                                                                  │
│       "given": "context/precondition",                                 │
│       "when": "action performed",                                      │
│       "then": "expected result",                                       │
│       "raw": ""                                                        │
│     }                                                                  │
│   ]                                                                    │
│ })                                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Creating Bugs

**⚠️ IMPORTANT**: Bugs have DIFFERENT required fields than tasks.

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Get project context                                            │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Calls (parallel):                                                  │
│   - list_cards(projectId, type="epic", year=2026)                      │
│   - list_sprints(projectId, year=2026)                                 │
│                                                                        │
│ STEP 2: Create bug with required fields                                │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: create_card(projectId, "bug", {                              │
│   title: "...",                                                        │
│   description: "...",                                                  │
│   sprint: "PLN-SPR-XXXX",       // from step 1                         │
│   epic: "PLN-PCS-XXXX",         // from step 1                         │
│   year: 2026,                                                          │
│   registerDate: "YYYY-MM-DD",   // ⚠️ REQUIRED - today's date          │
│   priority: "...",               // ⚠️ See BUG PRIORITY LIST below     │
│   createdBy: "becarIA-MCP"                                             │
│ })                                                                     │
│                                                                        │
│ BUG PRIORITY LIST (use ONLY one of these values):                      │
│ ────────────────────────────────────────────────────────────────────── │
│   • "APPLICATION BLOCKER"       - App unusable                         │
│   • "DEPARTMENT BLOCKER"        - Dept. workflow blocked               │
│   • "INDIVIDUAL BLOCKER"        - One user blocked                     │
│   • "USER EXPERIENCE ISSUE"     - UX problem, not blocking             │
│   • "WORKFLOW IMPROVEMENT"      - Process could be better              │
│   • "WORKAROUND AVAILABLE ISSUE"- Bug with known workaround            │
│                                                                        │
│ ⛔ DO NOT USE: "High", "Medium", "Low" - these are for TASKS only      │
│                                                                        │
│ STEP 3: Add acceptance criteria (optional for bugs)                    │
│ ────────────────────────────────────────────────────────────────────── │
│ MCP Call: update_card(projectId, "bug", firebaseId, {                  │
│   acceptanceCriteriaStructured: [                                      │
│     {                                                                  │
│       "given": "context/precondition",                                 │
│       "when": "action performed",                                      │
│       "then": "expected result",                                       │
│       "raw": ""                                                        │
│     }                                                                  │
│   ]                                                                    │
│ })                                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Bug vs Task Field Differences

| Field | Task | Bug |
|-------|------|-----|
| priority | "High"/"Medium"/"Low" | See BUG PRIORITY LIST above |
| registerDate | Not required | ⚠️ REQUIRED (YYYY-MM-DD) |
| acceptanceCriteriaStructured | Required | Optional |

## Quick Reference: Status Transitions

### Tasks
```
To Do → In Progress → To Validate → Done/Done&Validated
        ^^^^^^^^^^^    ^^^^^^^^^^^
        (MCP sets)     (MCP sets)   (Validator sets)
```

### Bugs
```
New → Assigned → Fixed → Verified/Closed
      ^^^^^^^^   ^^^^^
      (MCP sets) (MCP sets)  (Validator sets)
```

## Developer IDs

**DO NOT hardcode developer IDs.** Always read from `.mcp-user.json`.

See [User Identification](#user-identification-required) section for setup instructions.

Special accounts:
| Account | Email | Notes |
|---------|-------|-------|
| BecarIA | becaria@ia.local | AI agent, no notifications |

## Common Mistakes to Avoid

1. **Forgetting Phase 4**: Card stays "In Progress" forever
2. **Setting "Done" directly**: Bypasses validation workflow
3. **Skipping pre-flight checks**: Working on cards without criteria/points
4. **Wrong date format**: Always use `YYYY-MM-DD`
5. **Not verifying MCP response**: Update might have failed silently

## Notifications

When a task moves to "To Validate":
- System automatically notifies the validator via push notification
- System sends email to validator
- No action needed from MCP

**BecarIA Exception**: BecarIA (becaria@ia.local) should NEVER receive notifications as it's an AI agent without app access.

## Known Limitations

### ~~PLN-TSK-0066: list_developers() doesn't return IDs~~ (RESOLVED)

**Status**: ✅ Fixed (2026-01-25)

The `list_developers()` MCP endpoint now reads from `/data/developers` and returns `{id, name, email}` for each developer.

Example response:
```json
[
  { "id": "dev_010", "name": "Mánu Fosela", "email": "admin@yourdomain.com" }
]
```

### Developer IDs in Project vs Global

Developers appear in two places:
- **Project-level**: `/cards/{project}/developers` - only name/email
- **Global**: `/data/developers` - has `dev_XXX` IDs

The MCP now reads from the global `/data/developers` collection to get developer IDs.

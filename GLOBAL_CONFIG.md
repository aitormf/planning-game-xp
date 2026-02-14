# Configuración Global y ADRs

Este documento describe el sistema de configuración global de IA y los Architecture Decision Records (ADRs) en Planning GameXP.

---

## Tabla de Contenidos

- [Configuración Global de IA](#configuración-global-de-ia)
  - [Estructura de Datos](#estructura-de-datos)
  - [Tipos de Configuración](#tipos-de-configuración)
  - [Asignación a Proyectos](#asignación-a-proyectos)
  - [Página de Gestión](#página-de-gestión)
- [ADRs (Architecture Decision Records)](#adrs-architecture-decision-records)
  - [Qué es un ADR](#qué-es-un-adr)
  - [Estructura de un ADR](#estructura-de-un-adr)
  - [Estados de un ADR](#estados-de-un-adr)
  - [Cuándo crear un ADR](#cuándo-crear-un-adr)
- [Scripts de Seed](#scripts-de-seed)
  - [seed-global-config.js](#seed-global-configjs)
  - [seed-adrs.js](#seed-adrsjs)
- [MCP Tools](#mcp-tools)

---

## Configuración Global de IA

El sistema permite definir configuraciones globales que pueden ser asignadas a múltiples proyectos. Esto reemplaza el antiguo campo `agentsGuidelines` que era un texto libre por proyecto.

### Estructura de Datos

```
/global/
├── agents/{agentId}/
│   ├── name: string
│   ├── description: string
│   ├── content: string (markdown)
│   ├── category: string
│   ├── createdAt, createdBy
│   └── updatedAt, updatedBy
├── prompts/{promptId}/
│   └── [misma estructura]
└── instructions/{instructionId}/
    └── [misma estructura]

/global-history/
├── agents/{agentId}/{historyId}/...
├── prompts/{promptId}/{historyId}/...
└── instructions/{instructionId}/{historyId}/...
```

### Tipos de Configuración

#### Instructions (Instrucciones)

Guías generales que aplican a todo el desarrollo:

| Categoría | Ejemplos |
|-----------|----------|
| `development` | Guías de Estilo de Código, Guías de Seguridad, Guías de UI/UX |
| `qa` | Estándares de Testing, Checklist de Code Review |
| `documentation` | Estándares de Documentación |
| `architecture` | Principios Arquitectónicos |

**Ejemplo - Guías de Estilo de Código:**
```markdown
# Guías de Estilo de Código

## Principios Generales
- SOLID, DRY, KISS, YAGNI

## JavaScript/TypeScript
- Usar `const` por defecto
- Preferir arrow functions para callbacks
- Evitar `any` en TypeScript

## Commits
- Conventional Commits: feat:, fix:, refactor:, docs:, test:, chore:
- NUNCA incluir referencias a Claude o IA
```

#### Agents (Agentes)

Definen el comportamiento de la IA según el rol:

| Agente | Rol |
|--------|-----|
| BecarIA Developer | Desarrollador que sigue TDD, hace commits pequeños |
| BecarIA Code Reviewer | Revisor con checklist de calidad |
| BecarIA Architect | Diseña soluciones siguiendo ADRs existentes |

**Ejemplo - BecarIA Developer:**
```markdown
# BecarIA Developer Agent

## Comportamiento
1. Lee y entiende el código existente ANTES de modificar
2. Sigue TDD: escribe tests primero
3. Hace commits pequeños y atómicos

## Al recibir una tarea:
1. Verificar acceptanceCriteriaStructured existe
2. Verificar devPoints y businessPoints
3. Actualizar status a "In Progress"
4. Implementar y testear
5. Actualizar status a "To Validate"
```

#### Prompts (Prompts)

Templates para tareas específicas:

| Prompt | Uso |
|--------|-----|
| Estimación de Tareas | Calcular devPoints (1-5) y businessPoints (1-5) |
| Generador de Criterios de Aceptación | Generar criterios Given-When-Then |
| Análisis de Bugs | Analizar reproducibilidad, localización, causa raíz |

**Ejemplo - Estimación de Tareas:**
```markdown
## Escala devPoints (1-5)
- 1: Trivial, < 1 hora
- 2: Simple, 1-4 horas
- 3: Medio, 1 día
- 4: Complejo, 2-3 días
- 5: Muy complejo, > 3 días

## Escala businessPoints (1-5)
- 1: Nice to have
- 2: Mejora menor
- 3: Importante
- 4: Crítico
- 5: Urgente

Priority = (businessPoints * 100) / devPoints
```

### Asignación a Proyectos

Los proyectos seleccionan qué configuraciones usar:

```javascript
// En /projects/{projectId}/
{
  "name": "Cinema4D",
  "selectedAgents": ["agent_developer", "agent_reviewer"],
  "selectedPrompts": ["prompt_estimation", "prompt_acceptance_criteria"],
  "selectedInstructions": ["instr_code_style", "instr_testing", "instr_security"]
}
```

Esto se configura desde la página de administración del proyecto (`/adminproject`).

### Página de Gestión

**URL:** `/global-config`

**Acceso:** Solo SuperAdmin

**Funcionalidades:**
- Listar agents, prompts e instructions existentes
- Crear nuevas configuraciones
- Editar contenido (markdown)
- Eliminar configuraciones no usadas
- Ver historial de cambios

---

## ADRs (Architecture Decision Records)

### Qué es un ADR

Un **ADR (Architecture Decision Record)** es un documento corto que captura una decisión arquitectónica importante junto con su contexto y consecuencias.

**Propósito:**
- **Memoria institucional**: Nuevos miembros entienden "por qué" se hicieron las cosas
- **Evitar repetir discusiones**: La decisión ya está documentada
- **Facilitar cambios**: Si el contexto cambia, se puede supersede el ADR
- **Responsabilidad**: Queda claro quién decidió qué y cuándo

### Estructura de un ADR

```
/adrs/{projectId}/{adrId}/
├── id: string (ej: "adr_001")
├── title: string
├── status: "proposed" | "accepted" | "deprecated" | "superseded"
├── context: string (markdown) - ¿Por qué necesitamos esta decisión?
├── decision: string (markdown) - ¿Qué decidimos y por qué?
├── consequences: string (markdown) - Trade-offs (positivos y negativos)
├── supersededBy: string | null - ID del ADR que lo reemplaza
├── createdAt, createdBy
└── updatedAt, updatedBy
```

**Ejemplo completo:**

```markdown
# ADR-001: Estrategia de Base de Datos Firebase: RTDB vs Firestore

## Status
accepted

## Contexto
La aplicación necesita una base de datos que:
- Sincronice datos en tiempo real entre clientes
- Funcione offline y sincronice al reconectar
- Escale con mínima configuración
- Integre bien con Firebase Auth

Opciones consideradas:
1. Firebase Realtime Database (RTDB)
2. Firebase Firestore
3. PostgreSQL con suscripciones real-time
4. MongoDB con Change Streams

## Decisión
Usamos AMBAS bases de datos, eligiendo según el tipo de dato:

**Usar RTDB cuando:**
- Datos JSON simples
- Baja latencia crítica (chat, WIP)
- Actualizaciones pequeñas frecuentes

**Usar Firestore cuando:**
- Queries complejos
- Datos relacionales
- Escalado automático

## Consecuencias
**Positivas:**
- Mejor herramienta para cada trabajo
- Costes optimizados
- Ambas soportan tiempo real

**Negativas:**
- Dos sistemas a mantener
- Desarrolladores necesitan conocer ambos
```

### Estados de un ADR

| Estado | Significado |
|--------|-------------|
| `proposed` | En discusión, pendiente de aprobación |
| `accepted` | Aprobado y vigente |
| `deprecated` | Ya no se recomienda seguir, pero aún existe código que lo usa |
| `superseded` | Reemplazado por otro ADR (ver campo `supersededBy`) |

### Cuándo crear un ADR

Crea un ADR cuando:

- **Eliges una tecnología** sobre otras alternativas (framework, base de datos, librería)
- **Defines un patrón arquitectónico** (service-oriented, event-driven, etc.)
- **Estableces una política** que afecta a todo el código (no fallbacks, TDD obligatorio)
- **Cambias algo fundamental** que otros desarrolladores necesitan entender

**NO necesitas ADR para:**
- Decisiones triviales o reversibles fácilmente
- Elecciones de estilo que van en las Instructions
- Bugs o features específicos

---

## Scripts de Seed

Scripts para poblar la base de datos con configuraciones iniciales.

### seed-global-config.js

**Ubicación:** `scripts/seed-global-config.js`

**Uso:**
```bash
node scripts/seed-global-config.js
```

**Qué crea:**

| Tipo | ID | Nombre | Categoría |
|------|----|--------|-----------|
| Instruction | `instr_code_style` | Guías de Estilo de Código | development |
| Instruction | `instr_testing` | Estándares de Testing | qa |
| Instruction | `instr_security` | Guías de Seguridad | development |
| Instruction | `instr_ui_ux` | Guías de UI/UX | development |
| Agent | `agent_developer` | BecarIA Developer | development |
| Agent | `agent_reviewer` | BecarIA Code Reviewer | qa |
| Prompt | `prompt_estimation` | Estimación de Tareas | planning |
| Prompt | `prompt_acceptance_criteria` | Generador de Criterios de Aceptación | planning |
| Prompt | `prompt_bug_analysis` | Análisis de Bugs | qa |

**Requisitos:**
- `serviceAccountKey.json` en `~/mcp-servers/planning-game/` o especificado en `GOOGLE_APPLICATION_CREDENTIALS`

### seed-adrs.js

**Ubicación:** `scripts/seed-adrs.js`

**Uso:**
```bash
# Para el proyecto por defecto (PlanningGame)
node scripts/seed-adrs.js

# Para un proyecto específico
node scripts/seed-adrs.js Cinema4D
```

**Qué crea:**

| ID | Título | Decisión resumida |
|----|--------|-------------------|
| `adr_001` | Estrategia de Base de Datos Firebase: RTDB vs Firestore | Usar ambas según tipo de dato y necesidad del proyecto |
| `adr_002` | Usar Lit Web Components para la UI | Lit por tamaño pequeño (~5KB), web standards |
| `adr_003` | Usar Astro para Generación de Sitio Estático | Astro por islands architecture, hidratación parcial |
| `adr_004` | Arquitectura Orientada a Servicios para Frontend | Servicios centralizados para separación de concerns |
| `adr_005` | Política de No Fallbacks | Sistema funciona o falla, nunca silenciosamente |
| `adr_006` | Usar Vistas de Base de Datos para Optimizar Tráfico | Crear vistas denormalizadas para reducir tráfico y costes |

**Nota:** Estos ADRs son ejemplos basados en las decisiones reales del proyecto PlanningGame. Para otros proyectos, deberías crear ADRs específicos que documenten sus propias decisiones arquitectónicas.

---

## MCP Tools

El servidor MCP incluye herramientas para gestionar configuraciones globales y ADRs:

### Global Config Tools

| Tool | Descripción |
|------|-------------|
| `list_global_config` | Lista agents, prompts o instructions |
| `get_global_config` | Detalle de una configuración |
| `create_global_config` | Crear nueva configuración |
| `update_global_config` | Actualizar configuración existente |
| `delete_global_config` | Eliminar configuración |

**Ejemplo de uso:**
```
"Lista todas las instructions globales"
→ list_global_config type="instructions"

"Crea un nuevo prompt para code review"
→ create_global_config type="prompts" name="Code Review" category="qa" content="..."
```

### ADR Tools

| Tool | Descripción |
|------|-------------|
| `list_adrs` | Lista ADRs de un proyecto |
| `get_adr` | Detalle de un ADR |
| `create_adr` | Crear nuevo ADR |
| `update_adr` | Actualizar ADR existente |

**Ejemplo de uso:**
```
"Lista los ADRs de Cinema4D"
→ list_adrs projectId="Cinema4D"

"Crea un ADR para documentar el uso de TypeScript"
→ create_adr projectId="Cinema4D" title="Use TypeScript for Type Safety" ...
```

---

## Migración desde agentsGuidelines

Si tu proyecto usaba el campo `agentsGuidelines` (texto libre), puedes migrar a las nuevas configuraciones:

1. **Leer el contenido actual** de `agentsGuidelines`
2. **Identificar qué tipo** de contenido es (instrucciones generales, comportamiento de agente, prompts)
3. **Crear las configuraciones globales** correspondientes usando el seed script o la UI
4. **Asignar al proyecto** desde `/adminproject`
5. **El campo `agentsGuidelines`** se ignora si hay `selectedAgents/Prompts/Instructions`

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `public/js/services/global-config-service.js` | Servicio CRUD para configs globales |
| `public/js/wc/GlobalConfigList.js` | Componente lista de configs |
| `public/js/wc/GlobalConfigCard.js` | Componente individual |
| `public/js/wc/GlobalConfigSelector.js` | Selector múltiple para proyectos |
| `src/pages/global-config.astro` | Página de gestión |
| `mcp-server/src/tools/global-config.js` | Tools MCP |
| `scripts/seed-global-config.js` | Script de seed |
| `scripts/seed-adrs.js` | Script de seed ADRs |

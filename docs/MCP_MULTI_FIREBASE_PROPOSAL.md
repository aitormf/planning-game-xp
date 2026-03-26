# Propuesta: MCP Multi-Firebase (instancia unica)

**Fecha:** 2026-02-26
**Estado:** Implementado (Opcion B) — Marzo 2026
**Contexto:** Se ejecutan N instancias MCP, una por cada proyecto Firebase. La Opcion B (multi-instancia con deteccion cruzada) es el modelo en uso actualmente. La Opcion A (instancia unica multi-Firebase) queda como posible mejora futura.

---

## Problema actual

- Hay multiples instancias MCP conectadas a distintas Firebase:
  - `planning-game-pro` → Firebase `planning-gamexp` (Geniova)
  - `planning-game-personal` → Firebase `planning-game-xp` (Personal)
- Claude CLI en diferentes terminales se confunde y cruza instancias:
  - Intenta crear tareas de un proyecto en la Firebase incorrecta
  - No sabe cual instancia usar sin hacer `get_mcp_status` en cada una
  - El CLAUDE.md global intenta mitigar esto con instrucciones, pero no es fiable
- El MCP no avisa cuando un proyecto no existe en su instancia (simplemente dice "not found")

## Opcion A: MCP Multi-Firebase (recomendada)

Una sola instancia MCP que gestiona multiples conexiones Firebase.

### Como funcionaria

```
planning-game-mcp (unica instancia)
  ├── Firebase: planning-gamexp (Geniova)
  │   ├── PlanningGame
  │   ├── Cinema4D
  │   ├── Intranet
  │   └── ...
  └── Firebase: planning-game-xp (Personal)
      ├── PlanningGame (personal)
      └── ...
```

### Configuracion propuesta

```json
{
  "instances": [
    {
      "name": "geniova",
      "firebaseProjectId": "planning-gamexp",
      "serviceAccountKey": "./instances/geniova/serviceAccountKey.json",
      "default": true
    },
    {
      "name": "personal",
      "firebaseProjectId": "planning-game-xp",
      "serviceAccountKey": "./instances/personal/serviceAccountKey.json"
    }
  ],
  "projectMapping": {
    "Cinema4D": "geniova",
    "Intranet": "geniova",
    "PlanningGame": "geniova",
    "PlanningGame-personal": "personal"
  }
}
```

### Flujo de resolucion de proyecto

1. Usuario llama a `get_card("PlanningGame", "PLN-TSK-0223")`
2. MCP busca en `projectMapping` → encuentra `geniova`
3. Usa la conexion Firebase de `geniova` para la operacion
4. Si el proyecto no esta en el mapping, busca en todas las instancias
5. Si no existe en ninguna, devuelve error claro

### Ventajas

- Elimina la confusion de raiz: Claude solo ve UN MCP
- No hay posibilidad de cruzar instancias
- El MCP es inteligente: sabe donde esta cada proyecto
- Configuracion centralizada
- El mapping se puede auto-generar al arrancar (listar proyectos de cada Firebase)

### Desventajas

- Mas complejidad en el codigo del MCP
- Gestionar multiples Firebase Admin SDK simultaneamente (multiples `initializeApp` con nombres)
- Si un proyecto existe con el mismo nombre en dos Firebase, necesita desambiguacion
- Un solo punto de fallo (si el MCP cae, se pierden todas las conexiones)

### Cambios tecnicos necesarios

1. **Firebase initialization**: Usar `initializeApp(config, instanceName)` para multiples apps
2. **Service layer**: Cada servicio recibe la instancia Firebase correcta segun el proyecto
3. **Configuracion**: Nuevo fichero `mcp-instances.json` o similar
4. **Auto-discovery**: Al arrancar, listar proyectos de cada Firebase y construir el mapping
5. **Herramienta nueva**: `list_instances` para que Claude vea las instancias disponibles
6. **Error handling**: Mensajes claros tipo "Proyecto X encontrado en instancia Y"

## Opcion B: MCP mono-Firebase con deteccion cruzada

Cada instancia sigue conectada a una sola Firebase, pero con mejoras.

### Cambios

- Cuando un proyecto no se encuentra, el MCP responde:
  ```
  "Proyecto 'PlanningGame' no encontrado en esta instancia (planning-gamexp).
   Otras instancias MCP disponibles: planning-game-personal (planning-game-xp).
   Intenta usar esa instancia."
  ```
- Cada instancia expone `list_instances` con info de las demas (configurado manualmente)

### Ventajas

- Cambio minimo en el codigo
- Guia a Claude hacia la instancia correcta

### Desventajas

- No elimina el problema, solo lo mitiga
- Claude sigue teniendo que elegir instancia
- Sigue habiendo riesgo de confusion
- Requiere configuracion manual de "instancias hermanas"

## Problema colateral: projectId duplicado

Si "PlanningGame" existe en ambas Firebase (geniova y personal), hay conflicto de nombres.

### Posibles soluciones

1. **Prefijo de instancia**: `geniova/PlanningGame` vs `personal/PlanningGame`
2. **Parametro opcional**: `get_card("PlanningGame", "PLN-TSK-0223", instance="personal")`
3. **Proyecto por defecto**: Usar la instancia `default` si no se especifica, preguntar si hay ambiguedad
4. **Nombres unicos**: Renombrar proyectos para que sean unicos globalmente (ej: `PlanningGame-Personal`)

## Estado de implementacion

Se implemento la **Opcion B** (multi-instancia independiente). Cada instancia MCP se conecta a una sola Firebase y se registra por separado en Claude Code con `claude mcp add`. La configuracion en `CLAUDE.md` global indica como elegir la instancia correcta mediante `get_mcp_status`.

Instancias activas:
- `planning-game-pro` → Firebase `planning-gamexp` (Geniova)
- `planning-game-personal` → Firebase `planning-game-xp` (Personal)

### Posible mejora futura

La **Opcion A** (instancia unica multi-Firebase) sigue siendo viable si la experiencia con multiples instancias resulta confusa a largo plazo.

### Tareas relacionadas

- **PLN-TSK-0212**: Installer - seed initial data model for new instances (completada)

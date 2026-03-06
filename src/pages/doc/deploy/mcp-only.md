---
layout: ../../../components/doc/DocLayout.astro
---
# Instalar solo el MCP Server (sin la app web)

Si ya tienes un Planning Game XP desplegado (propio o de tu equipo) y solo quieres que tu IA (Claude Code, Cursor) pueda leer y gestionar las tareas, **no necesitas clonar ni desplegar nada**. Solo instala el MCP server.

## Que es el MCP

MCP (Model Context Protocol) es un proceso local que conecta tu IA con la base de datos de Planning Game. No es una app web, no tiene UI, y no se despliega en ningun servidor.

```
┌─────────────────┐  stdin/stdout  ┌─────────────┐  Firebase Admin  ┌──────────┐
│ Claude Code /   │ ◄────────────► │ MCP Server  │ ◄──────────────► │ Firebase │
│ Cursor          │                │ (local)     │                  │  (prod)  │
└─────────────────┘                └─────────────┘                  └──────────┘
```

## Requisitos

- Node.js v18+
- Claude Code o Cursor instalado
- `serviceAccountKey.json` de tu proyecto Firebase

## Instalacion (3 pasos)

### 1. Obtener el Service Account Key

Pidele a tu administrador el `serviceAccountKey.json`, o generalo tu mismo:

1. Ve a [Firebase Console](https://console.firebase.google.com/) > tu proyecto
2. Configuracion del proyecto (engranaje) > Cuentas de servicio
3. Click "Generar nueva clave privada"
4. Guarda el archivo en un lugar seguro:

```bash
mkdir -p ~/.config/planning-game
mv ~/Downloads/serviceAccountKey.json ~/.config/planning-game/
```

### 2. Instalar y registrar el MCP

**Opcion A: Con npm (recomendado)**

```bash
npm install -g planning-game-mcp

claude mcp add planning-game -s user \
  -e GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/planning-game/serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://TU-PROYECTO-default-rtdb.europe-west1.firebasedatabase.app \
  -- planning-game-mcp
```

**Opcion B: Con npx (sin instalar globalmente)**

```bash
claude mcp add planning-game -s user \
  -e GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/planning-game/serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://TU-PROYECTO-default-rtdb.europe-west1.firebasedatabase.app \
  -- npx planning-game-mcp
```

> Reemplaza `TU-PROYECTO` con el ID de tu proyecto Firebase. Si no lo conoces, pregunta a tu administrador.

> Para **Cursor**: configura el MCP server en Settings > MCP Servers con los mismos datos.

### 3. Verificar

Reinicia Claude Code y ejecuta:

```bash
claude mcp list
```

Debe mostrar `planning-game: ... Connected`.

Dentro de Claude Code, prueba:

```
> Lista los proyectos de Planning Game
```

## Configurar tu identidad

La primera vez, dile a Claude:

```
> Usa setup_mcp_user para configurar mi identidad
```

Esto crea un `.mcp-user.json` local con tu ID de developer, usado para saber quien crea/actualiza cards.

## Que puedes hacer con el MCP

Una vez activo, puedes pedir cosas como:

- "Lista los proyectos"
- "Que tareas tiene MyProject en estado To Do?"
- "Lee la tarea PRJ-TSK-0001 y desarrollala"
- "Crea un bug en MyProject con titulo X"
- "Cambia la tarea a To Validate con estos commits: ..."
- "Que sprints hay para 2026?"

### Herramientas disponibles

| Categoria | Herramientas |
|-----------|-------------|
| Proyectos | `list_projects`, `get_project`, `update_project`, `create_project` |
| Cards | `list_cards`, `get_card`, `create_card`, `update_card`, `relate_cards`, `get_transition_rules` |
| Sprints | `list_sprints`, `get_sprint`, `create_sprint`, `update_sprint` |
| Equipo | `list_developers`, `list_stakeholders` |
| ADRs | `list_adrs`, `get_adr`, `create_adr`, `update_adr`, `delete_adr` |
| Planes | `list_plans`, `get_plan`, `create_plan`, `update_plan`, `delete_plan` |
| Config Global | `list_global_config`, `get_global_config`, `create_global_config`, `update_global_config`, `delete_global_config` |
| Sistema | `setup_mcp_user`, `get_mcp_status`, `update_mcp` |

## Multi-instancia

Si trabajas con varios proyectos Firebase, puedes conectar multiples instancias:

```bash
claude mcp add planning-game-teamA -s user \
  -e GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/planning-game/teamA-serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://team-a-default-rtdb.firebasedatabase.app \
  -e MCP_INSTANCE_DIR=$HOME/.config/planning-game/teamA \
  -- planning-game-mcp

claude mcp add planning-game-teamB -s user \
  -e GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/planning-game/teamB-serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://team-b-default-rtdb.firebasedatabase.app \
  -e MCP_INSTANCE_DIR=$HOME/.config/planning-game/teamB \
  -- planning-game-mcp
```

## Seguridad

- El MCP conecta a **produccion**: las operaciones de escritura son reales
- El `serviceAccountKey.json` NUNCA debe subirse a git
- La config `--scope user` (`-s user`) es local a tu maquina
- Las cards creadas via MCP se marcan con `createdBy` para trazabilidad

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| MCP no aparece en `claude mcp list` | Reiniciar Claude Code (Ctrl+C y volver a entrar) |
| Error "Can't determine Firebase Database URL" | Verifica que `FIREBASE_DATABASE_URL` esta bien configurada |
| Error de autenticacion | Regenerar `serviceAccountKey.json` desde Firebase Console |
| Timeout al conectar | Verificar conectividad a internet y que el proyecto Firebase existe |

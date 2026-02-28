# Alta de usuario en Planning Game

Guia paso a paso para dar acceso a un nuevo usuario al Planning Game y asignarlo a un proyecto.

## Resumen rapido

| Paso | Donde | Para que |
|------|-------|---------|
| 1. Database Rules | `database.rules.json` + deploy | Que Firebase le permita leer/escribir |
| 2. Developer global | `/data/developers/dev_XXX` | Que aparezca en dropdowns de developer en tareas |
| 3. Stakeholder global | `/data/stakeholders/stk_XXX` | Que aparezca en dropdowns de validator en tareas |
| 4. Asignar a proyecto | `/projects/{id}/developers` y `/stakeholders` | Que forme parte del equipo del proyecto |
| 5. Proyectos visibles | `/data/projectsByUser/{encodedEmail}` | Que vea el proyecto en la lista |
| 6. Admin emails | `/data/userAdminEmails` | Que vea TODAS las pestañas (tasks, bugs, QA, ADRs) |

---

## Paso 1: Database Rules - Acceso a Firebase

**Archivo:** `planning-game-instances/{instancia}/database.rules.json`

Añadir el email del usuario en las reglas `.read` y `.write` de la raiz:

```json
".read": "auth != null && (auth.token.email === 'existente@email.com' || auth.token.email === 'nuevo@email.com')",
".write": "auth != null && (auth.token.email === 'existente@email.com' || auth.token.email === 'nuevo@email.com')"
```

**Desplegar** tras el cambio:

```bash
cd planning-game-instances/{instancia}
firebase deploy --only database
```

> **Sin este paso:** El usuario puede logarse pero Firebase deniega la lectura de datos. Ve la app vacia.

---

## Paso 2: Developer global

Crear la entidad en `/data/developers/{dev_XXX}` en Firebase RTDB:

```json
{
  "name": "Nombre Completo",
  "email": "usuario@email.com",
  "active": true
}
```

- El ID debe ser secuencial con formato `dev_XXX` (ej: `dev_018`, `dev_019`)
- Consultar el ultimo ID existente antes de crear uno nuevo
- Se puede crear desde:
  - **UI:** Editar proyecto > seccion Developers > "Create New Developer"
  - **Firebase Console:** directamente en `/data/developers`
  - **MCP:** Al hacer `update_project` con developers nuevos, se crean automaticamente (fix aplicado en `mcp/tools/projects.js`)

> **Sin este paso:** El usuario no aparece en los dropdowns de developer de las tareas.

---

## Paso 3: Stakeholder global

Si el usuario va a validar tareas, crear la entidad en `/data/stakeholders/{stk_XXX}`:

```json
{
  "name": "Nombre Completo",
  "email": "usuario@email.com",
  "active": true
}
```

- Usar la misma numeracion que el developer (ej: `dev_018` → `stk_018`)
- Mismos metodos de creacion que el paso 2

> **Sin este paso:** El usuario no aparece en los dropdowns de validator de las tareas.

---

## Paso 4: Asignar al proyecto

Añadir al usuario en los arrays de developers y stakeholders del proyecto.

**Via MCP:**

```
update_project(projectId, {
  developers: [...existentes, { id: "dev_XXX", name: "Nombre", email: "email" }],
  stakeholders: [...existentes, { id: "stk_XXX", name: "Nombre", email: "email", active: true }]
})
```

> Nota: A partir del fix en `mcp/tools/projects.js`, este paso tambien ejecuta automaticamente los pasos 2 y 3 si las entidades no existen.

**Via UI:** Editar proyecto > seccion Developers/Stakeholders > seleccionar o crear.

---

## Paso 5: Proyectos visibles

Asignar los proyectos que el usuario puede ver en `/data/projectsByUser/{encodedEmail}`.

### Encoding del email (IMPORTANTE)

La app usa un encoding especifico para las claves de Firebase:

| Caracter | Se reemplaza por |
|----------|-----------------|
| `@` | `\|` (pipe) |
| `.` | `!` (exclamacion) |
| `#` | `-` (guion) |

**Ejemplos:**

| Email | Clave en Firebase |
|-------|-------------------|
| `juan@gmail.com` | `juan\|gmail!com` |
| `maria.lopez@empresa.com` | `maria!lopez\|empresa!com` |

> **ATENCION:** NO usar `_` como reemplazo universal. La funcion de encoding esta en `public/js/utils/email-sanitizer.js` → `encodeEmailForFirebase()`.

### Valor

El valor es un string con los nombres de proyectos separados por comas:

- `"Lean Construction"` — acceso a un proyecto
- `"Lean Construction, PlanningGame"` — acceso a varios
- `"All"` — acceso a todos los proyectos

### Comportamiento al primer login

Cuando un usuario se loga por primera vez, la app crea automaticamente una entrada con los **proyectos por defecto** (configurados en `/data/config/defaultProjects`). Si los proyectos por defecto no incluyen el proyecto deseado, hay que actualizar la entrada manualmente.

> **Sin este paso:** El usuario ve la app pero no le aparece el proyecto en la lista.

---

## Paso 6: Admin emails (modo Management)

La app tiene dos modos de vista:
- **Management**: ve todo (tasks, bugs, QA, ADRs, sprints, epics, proposals, devPlans, users, app, trash)
- **Consultation**: solo ve sprints, epics, proposals, devPlans, app

El superAdmin (configurado en `firebase-config.js` → `superAdminEmail`) siempre ve modo Management.

Para el resto de usuarios, añadir su email al array `/data/userAdminEmails` en Firebase RTDB:

```json
[
  "usuario1@email.com",
  "usuario2@email.com"
]
```

> **Sin este paso:** El usuario entra al proyecto pero solo ve epics, sprints, proposals y devPlans. NO ve tasks, bugs, QA ni ADRs.

### Como funciona internamente

1. `firebase-service.js` carga `/data/userAdminEmails`
2. `app-controller.js` → `setUserViewMode()` compara el email del usuario con esa lista
3. Si esta en la lista → `isResponsable = true` → modo Management
4. Si NO esta → modo Consultation (pestañas limitadas)

---

## Orden recomendado

1. **Database Rules + deploy** → sin esto no puede hacer nada
2. **`update_project` via MCP** con el nuevo developer/stakeholder → crea automaticamente en `/data/developers` y `/data/stakeholders` (pasos 2, 3 y 4 en uno)
3. **`projectsByUser`** → asignar proyectos visibles con el encoding correcto
4. **`userAdminEmails`** → añadir email para que vea todas las pestañas (tasks, bugs, etc.)

## Checklist

- [ ] Email añadido en `database.rules.json` (`.read` y `.write`)
- [ ] Rules desplegadas con `firebase deploy --only database`
- [ ] Developer creado en `/data/developers/dev_XXX`
- [ ] Stakeholder creado en `/data/stakeholders/stk_XXX` (si aplica)
- [ ] Developer añadido al array `/projects/{projectId}/developers`
- [ ] Stakeholder añadido al array `/projects/{projectId}/stakeholders` (si aplica)
- [ ] Entrada en `/data/projectsByUser/{encodedEmail}` con el proyecto (encoding: `@`→`|`, `.`→`!`)
- [ ] Email añadido en `/data/userAdminEmails` (para ver tasks, bugs, QA, ADRs)

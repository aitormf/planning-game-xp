# Prompt para Instalación Asistida por IA

Copia este prompt y dáselo a una IA (como Claude) para que te guíe en la instalación.

---

## Prompt

```
Necesito que me ayudes a instalar y configurar Planning Game XP, una aplicación de gestión de proyectos ágiles.

El repositorio está en: https://github.com/AgilePlanning-io/planning-game-xp

Por favor, guíame paso a paso a través del proceso de instalación. Necesito:

1. **Hacer fork del repositorio, clonar mi fork e instalar dependencias**

2. **Crear un proyecto en Firebase** con los siguientes servicios:
   - Authentication (con Microsoft provider)
   - Realtime Database (región europe-west1)
   - Storage
   - Cloud Functions (requiere plan Blaze)

3. **Configurar los archivos de entorno** (.env.dev, .env.prod, functions/.env)
   - Pregúntame los valores uno por uno
   - Explícame dónde encontrar cada valor en Firebase Console

4. **Configurar Microsoft Graph** (opcional, para emails):
   - Guíame para crear una App Registration en Azure
   - Configurar permisos Mail.Send
   - Crear client secret

5. **Desplegar la aplicación**:
   - Desplegar reglas de base de datos y storage
   - Desplegar Cloud Functions
   - Construir y desplegar la aplicación

6. **Configurar el primer App Admin**:
   - Ejecutar el script setup:app-admin

7. **Verificar que todo funciona**:
   - Ejecutar verify-setup
   - Probar el login
   - Verificar permisos

Información que puedo proporcionarte:
- Mi email para ser el Super Admin: [TU_EMAIL]
- Mi proyecto Firebase se llamará: [NOMBRE_PROYECTO]
- ¿Tengo acceso a Azure AD para configurar emails?: [SÍ/NO]

Por favor, empieza preguntándome la información que necesitas y luego guíame paso a paso.
```

---

## Información que Necesitarás

Antes de empezar, ten preparada esta información:

### Obligatoria

| Dato | Ejemplo | Dónde obtenerlo |
|------|---------|-----------------|
| Email del Super Admin | admin@empresa.com | Tu email corporativo |
| Nombre del proyecto | mi-planning-game | Lo eliges tú |
| Región preferida | europe-west1 | Ver [regiones de Firebase](https://firebase.google.com/docs/projects/locations) |

### Opcional (para emails)

| Dato | Ejemplo | Dónde obtenerlo |
|------|---------|-----------------|
| Azure Tenant ID | 73e4694f-... | Azure Portal → Azure AD |
| Azure Client ID | 922ad4eb-... | Azure Portal → App registrations |
| Email remitente | noreply@empresa.com | Debe existir en tu tenant |

---

## Comandos que Ejecutará la IA

Durante la instalación, la IA te pedirá que ejecutes comandos como:

```bash
# Hacer fork en GitHub y clonar tu fork
git clone https://github.com/TU-USUARIO/planning-game-xp.git
cd planning-game-xp

# (Opcional) Configurar upstream para recibir actualizaciones
git remote add upstream https://github.com/AgilePlanning-io/planning-game-xp.git

# Instalar dependencias
npm install
cd functions && npm install && cd ..

# Login en Firebase
firebase login

# Seleccionar proyecto
firebase use tu-proyecto

# Desplegar
npm run deploy:rules
npm run deploy:functions
npm run build:no-bump    # Sin version bump (recomendado para forks)
npm run deploy

# Setup de admin
gcloud auth application-default login
npm run setup:app-admin -- tu-email@empresa.com

# Verificar
npm run verify-setup
```

---

## Tiempo Estimado

| Fase | Tiempo |
|------|--------|
| Crear proyecto Firebase | 5-10 min |
| Configurar variables de entorno | 10-15 min |
| Configurar Microsoft Graph (opcional) | 15-20 min |
| Primer despliegue | 10-15 min |
| Verificación | 5 min |
| **Total** | **45-65 min** |

---

## Resultado Esperado

Al finalizar, tendrás:

1. ✅ Aplicación desplegada en `https://tu-proyecto.web.app`
2. ✅ Base de datos configurada con reglas de seguridad
3. ✅ Cloud Functions desplegadas
4. ✅ Tu usuario configurado como Super Admin y App Admin
5. ✅ (Opcional) Notificaciones por email funcionando

---

---

## Prompt para instalar solo el MCP (sin la app web)

Si ya tienes un Planning Game desplegado y solo necesitas conectar tu IA para gestionar tareas:

```
Necesito instalar el MCP server de Planning Game XP para que puedas
leer y gestionar mis tareas directamente. No necesito instalar la app web,
solo el conector MCP.

Guíame paso a paso para:
1. Instalar planning-game-mcp con npm
2. Registrarlo en Claude Code con "claude mcp add"
3. Configurar mi identidad con setup_mcp_user

Mi proyecto Firebase se llama: [TU_PROYECTO_FIREBASE]
Tengo el serviceAccountKey.json en: [RUTA_AL_ARCHIVO]
La URL de mi base de datos es: [URL_DATABASE o "no la sé"]

Si no sé la URL de la base de datos, ayúdame a encontrarla en Firebase Console.
```

---

## Troubleshooting con IA

Si algo falla, puedes decirle a la IA:

```
El comando [X] falló con este error:
[pegar error]

¿Cómo lo soluciono?
```

La IA te ayudará a diagnosticar y resolver el problema.

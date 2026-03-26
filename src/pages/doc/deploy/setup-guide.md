---
layout: ../../../components/doc/DocLayout.astro
---
# Guia de instalacion para usuarios no tecnicos

Esta guia explica paso a paso como montar tu propio Planning Game XP. No necesitas experiencia previa con Firebase ni con herramientas de desarrollo, pero si necesitaras instalar algunos programas y seguir los pasos en orden.

Si prefieres que una IA te guie, ve directamente a la seccion [Prompt para IA](#prompt-para-ia) al final de esta pagina.

## Antes de empezar

### Que vas a necesitar

| Que | Para que | Tiempo de setup |
|-----|----------|-----------------|
| Una cuenta de GitHub | Copiar (fork) el codigo del proyecto | 2 min |
| Una cuenta de Google | Crear el proyecto en Firebase | 2 min |
| Una tarjeta de credito\* | Activar el plan Blaze en Firebase | 2 min |
| Node.js instalado | Ejecutar la aplicacion en tu ordenador | 5 min |

\* Firebase Blaze es pago por uso. Para un equipo pequeno (<20 personas) el coste es practicamente cero (unos pocos centimos al mes). Necesitas la tarjeta para activarlo, pero no se cobra nada significativo.

### Que vas a obtener

Al terminar tendras:
- Tu propia app web de gestion de proyectos en `https://tu-proyecto.web.app`
- Base de datos propia y privada
- Tu usuario configurado como administrador
- (Opcional) Notificaciones por email

## Paso 1: Instalar programas necesarios

### Node.js (obligatorio)

1. Ve a [nodejs.org](https://nodejs.org/) y descarga la version LTS (boton verde grande)
2. Instala siguiendo el asistente (siguiente, siguiente, instalar)
3. Abre una terminal (en Windows: busca "cmd" o "PowerShell") y escribe:

```bash
node --version
```

Debe mostrar algo como `v20.x.x`. Si no, reinicia la terminal.

### Firebase CLI (obligatorio)

En la misma terminal, escribe:

```bash
npm install -g firebase-tools
```

Verifica con:

```bash
firebase --version
```

### Git (obligatorio)

- **Windows**: Descarga desde [git-scm.com](https://git-scm.com/) e instala
- **Mac**: Abre terminal y escribe `git --version` (se instala automaticamente)
- **Linux**: `sudo apt install git`

## Paso 2: Copiar el proyecto (fork)

1. Ve a [github.com/AgilePlanning-io/planning-game-xp](https://github.com/manufosela/planning-game-xp)
2. Si no tienes cuenta en GitHub, creala (es gratis)
3. Haz click en el boton **Fork** (esquina superior derecha)
4. Esto crea una copia del proyecto en tu cuenta de GitHub

Ahora, en tu terminal:

```bash
# Reemplaza TU-USUARIO con tu nombre de usuario de GitHub
git clone https://github.com/TU-USUARIO/planning-game-xp.git

# Entra en la carpeta del proyecto
cd planning-game-xp

# Instala las dependencias (puede tardar 1-2 minutos)
npm install

# Instala las dependencias de Cloud Functions
cd functions && npm install && cd ..
```

## Paso 3: Crear proyecto en Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com/)
2. Inicia sesion con tu cuenta de Google
3. Click en **"Agregar proyecto"**
4. Pon un nombre (por ejemplo: `mi-planning-game`)
5. Puedes desactivar Google Analytics (no es necesario)
6. Click en **Crear proyecto**

### Activar servicios

Dentro de tu proyecto en Firebase Console, activa estos servicios:

| Servicio | Donde encontrarlo | Que hacer |
|----------|--------------------|-----------|
| Authentication | Menu lateral > Build > Authentication | Click en "Comenzar" y habilita un proveedor (Google es el mas facil) |
| Realtime Database | Menu lateral > Build > Realtime Database | Click en "Crear base de datos", elige `europe-west1`, modo de prueba |
| Storage | Menu lateral > Build > Storage | Click en "Comenzar", modo de prueba |
| Hosting | Menu lateral > Build > Hosting | Click en "Comenzar" |
| Functions | Menu lateral > Build > Functions | Requiere **plan Blaze**: click en "Actualizar" en la parte inferior |

### Obtener credenciales

1. Click en el **engranaje** (esquina superior izquierda) > **Configuracion del proyecto**
2. Pestana **General** > scroll hasta "Tus apps" > click en icono web (`</>`)
3. Registra la app con cualquier nombre
4. **Copia los valores** que aparecen (apiKey, authDomain, etc.) - los necesitaras en el siguiente paso

### Generar Service Account Key

1. En la misma pagina de configuracion, pestana **Cuentas de servicio**
2. Click en **"Generar nueva clave privada"**
3. Descarga y guarda el archivo como `serviceAccountKey.json` en la carpeta del proyecto

## Paso 4: Configurar el proyecto

Ejecuta el asistente interactivo que te guiara:

```bash
npm run setup
```

Si prefieres hacerlo manualmente, crea un archivo `.env.prod` en la raiz del proyecto con este contenido (reemplaza los valores con los tuyos de Firebase):

```env
PUBLIC_FIREBASE_API_KEY=tu-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
PUBLIC_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.europe-west1.firebasedatabase.app
PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
PUBLIC_FIREBASE_APP_ID=tu-app-id
```

Conecta Firebase CLI con tu proyecto:

```bash
firebase login
firebase use tu-proyecto
```

## Paso 5: Desplegar

```bash
# Desplegar reglas de seguridad
npm run deploy:rules

# Desplegar Cloud Functions
npm run deploy:functions

# Construir la app (sin version bump, recomendado para tu copia)
npm run build:no-bump

# Desplegar la app
npm run deploy
```

Si todo va bien, veras un mensaje con la URL de tu aplicacion: `https://tu-proyecto.web.app`

## Paso 6: Crear tu usuario administrador

```bash
npm run setup:app-admin -- tu-email@ejemplo.com
```

Esto te da permisos de Super Admin. Ahora puedes entrar a tu app, crear proyectos y gestionar usuarios.

## Verificar que funciona

1. Abre `https://tu-proyecto.web.app` en el navegador
2. Inicia sesion con tu email
3. Deberia mostrarte la pantalla principal
4. Prueba a crear un proyecto

## Desarrollo local (opcional)

Si quieres hacer cambios y probarlos antes de desplegar:

```bash
# Terminal 1: Emuladores (base de datos local de prueba)
npm run emulator

# Terminal 2: Servidor local
npm run dev
```

Tu app local estara en `http://localhost:4321`

## Recibir actualizaciones

Cuando el proyecto original publique mejoras:

```bash
git remote add upstream https://github.com/manufosela/planning-game-xp.git
git fetch upstream
git merge upstream/main
npm install
npm run build:no-bump
npm run deploy
```

---

## Prompt para IA

Si prefieres que una IA (como Claude, ChatGPT o similar) te guie en todo el proceso, copia y pega este prompt:

```
Necesito que me ayudes a instalar y desplegar Planning Game XP, una aplicacion
de gestion de proyectos agiles. Soy un usuario no tecnico y necesito que me
guies paso a paso, explicando cada comando antes de que lo ejecute.

El repositorio esta en: https://github.com/manufosela/planning-game-xp

Lo que necesito hacer (en este orden):

1. Hacer fork del repositorio en GitHub e instalarlo en mi ordenador
2. Crear un proyecto nuevo en Firebase Console con estos servicios:
   Authentication, Realtime Database, Storage, Hosting, Cloud Functions
3. Configurar los archivos de entorno (.env.prod) con mis credenciales de Firebase
   - Preguntame los valores uno por uno
   - Explicame donde encontrar cada valor en Firebase Console
4. Desplegar la aplicacion (reglas, funciones y app web)
5. Configurar mi usuario como administrador

Informacion sobre mi entorno:
- Sistema operativo: [Windows / Mac / Linux]
- Mi email para admin: [TU_EMAIL]
- Nombre que quiero para mi proyecto Firebase: [NOMBRE]
- Proveedor de autenticacion: [Google / Microsoft / GitHub]

IMPORTANTE:
- Usa "npm run build:no-bump" para construir (no "npm run build")
- La documentacion completa esta en INSTALL.md y ENV_VARIABLES.md del repo
- Para emails opcionales via Microsoft Graph, necesito Azure AD (preguntame si lo tengo)

Empieza preguntandome la informacion que necesitas y luego guiame paso a paso.
Antes de cada comando, explicame que va a hacer.
```

### Prompt para configurar solo el MCP (sin instalar la app)

Si ya tienes un Planning Game desplegado y solo quieres conectar tu IA:

```
Necesito instalar el MCP server de Planning Game XP para que puedas
leer y gestionar mis tareas directamente. No necesito instalar la app web,
solo el conector MCP.

Guiame paso a paso para:
1. Instalar planning-game-mcp con npm
2. Registrarlo en Claude Code con "claude mcp add"
3. Configurar mi identidad con setup_mcp_user

Mi proyecto Firebase se llama: [TU_PROYECTO_FIREBASE]
Tengo el serviceAccountKey.json en: [RUTA_AL_ARCHIVO]
La URL de mi base de datos es: [URL_DATABASE o "no la se"]

Si no se la URL de la base de datos, ayudame a encontrarla en Firebase Console.
```

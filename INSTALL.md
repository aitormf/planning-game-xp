# Guía de Instalación - Planning Game XP

Esta guía te llevará paso a paso a través de la instalación completa de Planning Game XP.

## Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Rápida (Recomendada)](#instalación-rápida)
3. [Instalación Manual](#instalación-manual)
4. [Configuración de Firebase](#configuración-de-firebase)
5. [Configuración de Microsoft Graph (Emails)](#configuración-de-microsoft-graph)
6. [Primer Despliegue](#primer-despliegue)
7. [Verificación](#verificación)
8. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Verificar con |
|----------|----------------|---------------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Firebase CLI | 13.x | `firebase --version` |
| Git | 2.x | `git --version` |

### Software Opcional

| Software | Propósito | Verificar con |
|----------|-----------|---------------|
| gcloud CLI | Setup de App Admin | `gcloud --version` |
| Docker | Emuladores locales | `docker --version` |

### Instalación de Requisitos

```bash
# Node.js (usando nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Firebase CLI
npm install -g firebase-tools

# gcloud CLI (opcional, para setup de admin)
# Ver: https://cloud.google.com/sdk/docs/install
```

---

## Instalación Rápida

La forma más fácil de instalar es usando el asistente interactivo:

```bash
# 1. Clonar el repositorio

Por https:
git clone https://github.com/AgilePlanning-io/planning-game-xp.git
O por ssh:
git clone git@github.com:AgilePlanning-io/planning-game-xp.git

cd planning-game-xp

# 2. Instalar dependencias
npm install
cd functions && npm install && cd ..

# 3. Ejecutar el asistente de configuración
npm run setup
```

El asistente te guiará a través de toda la configuración.

---

## Instalación Manual

Si prefieres configurar manualmente:

### 1. Clonar y preparar

```bash
git clone https://github.com/AgilePlanning-io/planning-game-xp.git
cd planning-game-xp
npm install
cd functions && npm install && cd ..
```

### 2. Crear archivos de entorno

Copia las plantillas de entorno:

```bash
# Crear desde ejemplo (si existe) o crear vacío
touch .env.dev .env.pre .env.prod
touch functions/.env
```

Consulta [ENV_VARIABLES.md](./ENV_VARIABLES.md) para la lista completa de variables.

### 3. Configurar Firebase

```bash
# Autenticarse
firebase login

# Seleccionar proyecto
firebase use tu-proyecto-id
```

---

## Configuración de Firebase

### Crear Proyecto en Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Click en **Add project**
3. Nombre del proyecto: `planning-gamexp` (o el que prefieras)
4. Habilitar Google Analytics (recomendado)
5. Esperar a que se cree el proyecto

### Habilitar Servicios

En la consola de Firebase, habilitar:

1. **Authentication**
   - Ir a Authentication → Sign-in method
   - Habilitar **Microsoft** (requiere Azure AD App Registration)

2. **Realtime Database**
   - Ir a Realtime Database → Create Database
   - Seleccionar región: `europe-west1` (recomendado para EU)
   - Empezar en modo bloqueado (las reglas se desplegarán después)

3. **Storage**
   - Ir a Storage → Get started
   - Seleccionar región: `europe-west1`

4. **Cloud Functions**
   - Requiere plan Blaze (pay-as-you-go)
   - Ir a Functions → Get started

### Obtener Configuración

1. Ir a Project Settings (engranaje) → General
2. Scroll down a "Your apps"
3. Click en el icono de Web (`</>`)
4. Registrar la app con nickname
5. Copiar los valores de `firebaseConfig`

### Configurar Archivo .env

```bash
PUBLIC_FIREBASE_API_KEY=tu-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
PUBLIC_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.europe-west1.firebasedatabase.app
PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
PUBLIC_SUPER_ADMIN_EMAIL=tu-email@dominio.com
```

---

## Configuración de Microsoft Graph

Para habilitar notificaciones por email, necesitas configurar Microsoft Graph API.

### Crear App Registration en Azure

1. Ir a [Azure Portal](https://portal.azure.com/)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Configurar:
   - Name: `PlanningGameXP-Notifications`
   - Supported account types: Single tenant (o Multi-tenant si necesario)
   - Redirect URI: (dejar vacío por ahora)

### Configurar Permisos

1. En la App Registration → **API permissions**
2. **Add a permission** → **Microsoft Graph** → **Application permissions**
3. Añadir: `Mail.Send`
4. **Grant admin consent** (requiere ser admin del tenant)

### Crear Secret

1. En la App Registration → **Certificates & secrets**
2. **New client secret**
3. Copiar el valor inmediatamente (no se puede ver después)

### Configurar en functions/.env

```bash
MS_CLIENT_ID=application-client-id
MS_CLIENT_SECRET=secret-value
MS_TENANT_ID=directory-tenant-id
MS_FROM_EMAIL=noreply@tudominio.com
```

---

## Primer Despliegue

### Desplegar Reglas

```bash
npm run deploy:rules
```

### Desplegar Cloud Functions

```bash
npm run deploy:functions
```

### Configurar Primer App Admin

```bash
# Autenticarse con gcloud
gcloud auth application-default login

# Ejecutar setup de admin
npm run setup:app-admin -- tu-email@dominio.com
```

### Construir y Desplegar Aplicación

```bash
npm run build
npm run deploy
```

---

## Verificación

### Verificar Configuración

```bash
npm run verify-setup
```

### Verificar Manualmente

1. **Acceder a la aplicación**
   - Abrir `https://tu-proyecto.web.app`
   - Debe mostrar la pantalla de login

2. **Iniciar sesión**
   - Click en "Sign in with Microsoft"
   - Autenticarse con el email del Super Admin

3. **Verificar permisos**
   - Abrir consola del navegador (F12)
   - Ejecutar: `console.log(window.isAppAdmin)`
   - Debe mostrar `true`

4. **Probar funcionalidad de Apps**
   - Ir a un proyecto → Sección Apps
   - Debe poder subir y gestionar aplicaciones

---

## Solución de Problemas

### Error: "Firebase CLI not found"

```bash
npm install -g firebase-tools
firebase login
```

### Error: "Permission denied" al desplegar

```bash
# Verificar autenticación
firebase login --reauth

# Verificar proyecto seleccionado
firebase use
```

### Error: "User does not have permission" en Storage

El usuario necesita estar en `/data/appUploaders/{projectId}` o `/data/appAdmins`.

```bash
# Añadir como App Admin
npm run setup:app-admin -- email@dominio.com
```

### Error: "isAppAdmin is undefined"

El claim no se ha sincronizado. Soluciones:
1. Cerrar sesión y volver a entrar
2. Ejecutar la función de sincronización manualmente

### Los emails no se envían

Verificar configuración de Microsoft Graph:
1. ¿El secret ha expirado?
2. ¿Se ha dado "Admin consent" a los permisos?
3. ¿El email FROM existe en el tenant?

---

## Documentación Adicional

| Archivo | Descripción |
|---------|-------------|
| [README.md](./README.md) | Visión general del proyecto |
| [ENV_VARIABLES.md](./ENV_VARIABLES.md) | Todas las variables de entorno |
| [CLAUDE.md](./CLAUDE.md) | Guía para desarrollo con IA |
| [NEWUSER.md](./NEWUSER.md) | Cómo añadir nuevos usuarios |
| [docs/MCP_INSTALLATION_GUIDE.md](./docs/MCP_INSTALLATION_GUIDE.md) | Instalar MCP Server |

---

## Soporte

Si encuentras problemas:

1. Revisa la sección de [Solución de Problemas](#solución-de-problemas)
2. Consulta la documentación en `/docs`
3. Abre un issue en GitHub

# Variables de Entorno

Este documento lista TODAS las variables de entorno necesarias para instalar la aplicación desde cero.

## Archivos de Entorno

| Archivo | Propósito |
|---------|-----------|
| `.env.dev` | Desarrollo local (usa emuladores o BD de tests) |
| `.env.pre` | Entorno de pre-producción |
| `.env.prod` | Producción |
| `functions/.env` | Variables para Cloud Functions |

> **IMPORTANTE**: Estos archivos NO se suben a git. Se almacenan en Google Drive: `APP-CONFIG/Planning-GameXP/`

---

## Variables del Cliente (Astro)

### Firebase Configuration (REQUERIDAS)

```bash
# API Key del proyecto Firebase
PUBLIC_FIREBASE_API_KEY=AIzaSy...

# Dominio de autenticación
PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com

# URL de Realtime Database
# DEV: https://tu-proyecto-tests-rtdb.europe-west1.firebasedatabase.app
# PROD: https://tu-proyecto-default-rtdb.europe-west1.firebasedatabase.app
PUBLIC_FIREBASE_DATABASE_URL=https://...

# ID del proyecto
PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto

# Bucket de Storage
PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app

# Messaging Sender ID (para push notifications)
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789

# App ID
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Measurement ID (Google Analytics)
PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX

# VAPID Key (para push notifications)
PUBLIC_FIREBASE_VAPID_KEY=BH5fN8...
```

### Super Admin (REQUERIDA)

```bash
# Email del Super Admin (tiene acceso a /development y puede hacer bootstrap inicial)
PUBLIC_SUPER_ADMIN_EMAIL=admin@tudominio.com
```

### Authentication Provider (REQUERIDA)

```bash
# Proveedor de autenticación OAuth: google, microsoft, github, gitlab
# Se configura durante npm run setup
PUBLIC_AUTH_PROVIDER=google

# URL de la instancia GitLab (solo si PUBLIC_AUTH_PROVIDER=gitlab)
PUBLIC_GITLAB_ISSUER_URL=https://gitlab.com
```

### Emuladores (SOLO para desarrollo)

```bash
# Activar emuladores
USE_FIREBASE_EMULATOR=true
```

> **Nota**: Los puertos de los emuladores (Firestore: 8080, Database: 9000, Storage: 9199, Auth: 9099) se detectan automaticamente desde el codigo. No es necesario definir variables `*_EMULATOR_HOST` en los archivos `.env`.

### Testing (SOLO para tests E2E)

```bash
# Usuario de pruebas para tests automatizados
TEST_USER_EMAIL=pruebas@tudominio.com
TEST_USER_PASSWORD=contraseña_segura
```

---

## Variables de Cloud Functions

Archivo: `functions/.env`

### Azure AD (para SharePoint/OneDrive integration)

```bash
# Credenciales de Azure AD
AZURE_TENANT_ID=73e4694f-...
AZURE_CLIENT_ID=93f86082-...
AZURE_CLIENT_SECRET=u518Q~...

# SharePoint (para integracion de documentos)
SHAREPOINT_SITE_ID=tu-sharepoint-site-id
SHAREPOINT_DRIVE_ID=tu-sharepoint-drive-id
```

### Microsoft Graph API (para envio de emails)

Las credenciales de envio de email se almacenan como **Firebase Secrets**, no en `functions/.env`:

```bash
# Configurar con:
firebase functions:secrets:set MS_CLIENT_ID
firebase functions:secrets:set MS_CLIENT_SECRET
firebase functions:secrets:set MS_TENANT_ID
firebase functions:secrets:set MS_FROM_EMAIL
firebase functions:secrets:set MS_ALERT_EMAIL
```

### Application URL (REQUERIDA)

```bash
# URL base de la aplicacion (usada en emails de notificacion)
# NUNCA debe apuntar a localhost
PUBLIC_APP_URL=https://planning-gamexp.web.app
```

### Portal de Soporte (OPCIONAL - si se usa portal de incidencias)

```bash
# URL del portal de soporte para notificaciones de bugs resueltos
PORTAL_SOPORTE_URL=https://portal.tudominio.com
```

### Super Admin (OPCIONAL)

```bash
# Email del Super Admin (mismo que en cliente)
# Usado por Cloud Functions para validar bootstrap de appAdmins
PUBLIC_SUPER_ADMIN_EMAIL=admin@tudominio.com
```

### OpenAI API (para generación de criterios de aceptación)

```bash
# API Key de OpenAI (configurado como Secret en Firebase)
# Se configura con: firebase functions:secrets:set OPENAI_API_KEY
```

---

## Configuración de Secrets en Firebase

Algunos valores sensibles se almacenan como Secrets en Firebase:

```bash
# Configurar secret de OpenAI
firebase functions:secrets:set OPENAI_API_KEY --project=tu-proyecto

# Verificar secrets configurados
firebase functions:secrets:access OPENAI_API_KEY --project=tu-proyecto
```

---

## Setup Inicial (Instalación desde Cero)

### 1. Copiar archivos de entorno

```bash
# Copiar desde Google Drive o crear nuevos
cp /path/to/APP-CONFIG/Planning-GameXP/.env.* ./
cp /path/to/APP-CONFIG/Planning-GameXP/functions/.env ./functions/
```

### 2. Configurar Firebase

```bash
# Login en Firebase
firebase login

# Seleccionar proyecto
firebase use tu-proyecto
```

### 3. Configurar primer App Admin

**Se ejecuta UNA SOLA VEZ** después de desplegar, para crear el primer administrador de apps:

```bash
# Requiere estar autenticado con gcloud:
gcloud auth application-default login

# Ejecutar el script de setup
npm run setup:app-admin -- admin@tudominio.com

# O directamente:
node scripts/setup-app-admin.cjs admin@tudominio.com
```

> Este paso solo es necesario la primera vez. Después, los App Admins pueden añadir más desde la UI.

### 4. Desplegar

```bash
# Desplegar reglas y funciones
npm run deploy:rules
npm run deploy:functions

# Desplegar aplicación
npm run build
npm run deploy
```

---

## Obtener valores de Firebase

Los valores de Firebase se obtienen desde la consola:

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar el proyecto
3. Ir a **Project Settings** (engranaje)
4. En **General**, sección **Your apps**, copiar la configuración

---

## Obtener credenciales de Microsoft Graph

Para el envío de emails vía Microsoft Graph:

1. Ir a [Azure Portal](https://portal.azure.com/)
2. **Azure Active Directory** → **App registrations**
3. Crear o seleccionar la aplicación
4. Copiar **Application (client) ID** → `MS_CLIENT_ID`
5. Copiar **Directory (tenant) ID** → `MS_TENANT_ID`
6. En **Certificates & secrets**, crear un nuevo secret → `MS_CLIENT_SECRET`
7. En **API permissions**, añadir `Mail.Send` (delegated o application)

---

## Checklist de Variables

### Cliente (.env.dev / .env.prod)

- [ ] `PUBLIC_FIREBASE_API_KEY`
- [ ] `PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `PUBLIC_FIREBASE_DATABASE_URL`
- [ ] `PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `PUBLIC_FIREBASE_APP_ID`
- [ ] `PUBLIC_FIREBASE_MEASUREMENT_ID`
- [ ] `PUBLIC_FIREBASE_VAPID_KEY`
- [ ] `PUBLIC_SUPER_ADMIN_EMAIL`
- [ ] `PUBLIC_AUTH_PROVIDER`
- [ ] `PUBLIC_GITLAB_ISSUER_URL` (solo si provider = gitlab)

### Cloud Functions (functions/.env)

- [ ] `AZURE_TENANT_ID`
- [ ] `AZURE_CLIENT_ID`
- [ ] `AZURE_CLIENT_SECRET`
- [ ] `SHAREPOINT_SITE_ID` (si se usa integracion SharePoint)
- [ ] `SHAREPOINT_DRIVE_ID` (si se usa integracion SharePoint)
- [ ] `PUBLIC_APP_URL`
- [ ] `PORTAL_SOPORTE_URL` (opcional)
- [ ] `PUBLIC_SUPER_ADMIN_EMAIL` (opcional)

### Secrets (Firebase Secret Manager)

- [ ] `MS_CLIENT_ID`
- [ ] `MS_CLIENT_SECRET`
- [ ] `MS_TENANT_ID`
- [ ] `MS_FROM_EMAIL`
- [ ] `MS_ALERT_EMAIL`
- [ ] `OPENAI_API_KEY`

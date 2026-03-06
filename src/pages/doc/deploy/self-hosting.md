---
layout: ../../../components/doc/DocLayout.astro
---
# Self-Hosting: Monta tu propio Planning Game XP

Esta guia explica como montar tu propia instancia de Planning Game XP en tu proyecto Firebase.

## Requisitos previos

| Software | Version minima | Comprobar |
|----------|---------------|-----------|
| Node.js | v18+ | `node --version` |
| npm | v9+ | `npm --version` |
| Git | cualquiera | `git --version` |
| Firebase CLI | ultima | `firebase --version` |
| Java | v11+ | `java --version` (para emuladores) |

## 1. Fork del repositorio

**No clones directamente** el repositorio original. Haz un **fork** para tener tu propia copia:

1. Ve a [github.com/AgilePlanning-io/planning-game-xp](https://github.com/AgilePlanning-io/planning-game-xp)
2. Click en **Fork** (esquina superior derecha)
3. Clona tu fork:

```bash
git clone https://github.com/TU-USUARIO/planning-game-xp.git
cd planning-game-xp
```

4. (Opcional) Configura el upstream para recibir actualizaciones futuras:

```bash
git remote add upstream https://github.com/AgilePlanning-io/planning-game-xp.git

# Para traer actualizaciones del repo original:
git fetch upstream
git merge upstream/main
```

## 2. Instalar dependencias

```bash
npm install
cd functions && npm install && cd ..
```

## 3. Configuracion

Ejecuta el asistente interactivo:

```bash
npm run setup
```

O configura manualmente creando los archivos `.env.dev`, `.env.pre` y `.env.prod` (ver [ENV_VARIABLES.md](https://github.com/AgilePlanning-io/planning-game-xp/blob/main/ENV_VARIABLES.md)).

## 4. Crear proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita los servicios necesarios:
   - **Authentication** (Google, Microsoft, GitHub o GitLab)
   - **Realtime Database** (region `europe-west1` recomendada)
   - **Storage**
   - **Cloud Functions** (requiere plan Blaze)
   - **Hosting**
4. Genera un Service Account Key (Configuracion > Cuentas de servicio > Generar nueva clave privada)
5. Guarda el archivo como `serviceAccountKey.json` en la raiz del proyecto (esta en `.gitignore`)

## 5. Build y despliegue

### Builds sin version bump (recomendado para forks)

Los scripts de build estandar (`npm run build`) incrementan automaticamente la version del proyecto analizando los mensajes de commit, generan el CHANGELOG y hacen commit+push del bump. Esto esta pensado para el repositorio original.

Para **forks**, usa los scripts sin version bump:

| Script | Descripcion |
|--------|-------------|
| `npm run build:no-bump` | Build de produccion sin subir version |
| `npm run build-prod:no-bump` | Igual que `build:no-bump` |
| `npm run build-preview:no-bump` | Build de preproduccion sin subir version |

Estos scripts ejecutan:
- Syntax check
- Security check
- Generacion del service worker
- Build de Astro

**No** ejecutan: update-version, generate-changelog ni postbuild:version (commit+push).

### Builds con version bump (repo original)

Si prefieres usar el version bump automatico (por ejemplo, si mantienes tu fork como tu proyecto principal):

| Script | Descripcion |
|--------|-------------|
| `npm run build` | Build de produccion con version bump |
| `npm run build-prod` | Igual que `build` |
| `npm run build-preview` | Build de preproduccion con version bump |

El bump sigue conventional commits:
- `feat:` → minor (1.X.0)
- `fix:`, `chore:`, etc. → patch (1.0.X)
- `BREAKING CHANGE:` → major (X.0.0)

### Desplegar

```bash
# Primero, desplegar reglas y funciones
npm run deploy:rules
npm run deploy:functions

# Luego, desplegar la app
npm run deploy
```

## 6. Primer usuario

Configura el primer App Admin:

```bash
gcloud auth application-default login
npm run setup:app-admin -- tu-email@dominio.com
```

Ver [NEWUSER.md](https://github.com/AgilePlanning-io/planning-game-xp/blob/main/NEWUSER.md) para mas detalles.

## 7. Desarrollo local

Abre **dos terminales**:

```bash
# Terminal 1: Emuladores Firebase (con datos demo)
npm run emulator

# Terminal 2: Servidor de desarrollo
npm run dev
```

- App: http://localhost:4321
- Emulator UI: http://localhost:4000

## Recibir actualizaciones del repo original

```bash
git fetch upstream
git merge upstream/main
# Resolver conflictos si los hay
npm install
npm run build:no-bump
```

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| El emulador no arranca | Verificar puertos 4000, 8080, 9000, 9199 libres |
| Build falla en version bump | Usar `npm run build:no-bump` |
| `FORCE_BUILD=1 npm run build-prod` | Forzar build aunque no haya cambios |
| Deploy falla | Verificar `firebase login` y permisos |

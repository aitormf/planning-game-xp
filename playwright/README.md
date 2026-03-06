# E2E Testing with Playwright

Este directorio contiene los tests end-to-end para Planning Game XP usando Playwright.

## Configuracion

### Variables de Entorno

Las credenciales de test se configuran en `.env.dev` o `.env.test`:

```env
TEST_USER_EMAIL=tu_usuario_de_test@ejemplo.com
TEST_USER_PASSWORD=tu_password_de_test
```

### Instalacion

```bash
npm install
npx playwright install
```

## Ejecucion de Tests

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Con navegador visible
npm run test:e2e:headed

# Con interfaz de debugging
npm run test:e2e:ui

# Modo debug paso a paso
npm run test:e2e:debug

# Ver ultimo reporte
npm run test:e2e:report

# Ejecutar un archivo especifico
npx playwright test playwright/tests/e2e/01-auth.spec.js
```

## Estructura de Tests

```
playwright/
├── tests/
│   └── e2e/
│       ├── 01-auth.spec.js           # Autenticacion y login
│       ├── 02-projects.spec.js       # Gestion de proyectos
│       ├── 03-full-workflow.spec.js   # Workflow completo (crear proyecto, tareas, bugs)
│       ├── 04-card-interactions.spec.js # Interacciones con cards
│       └── 05-dark-theme.spec.js     # Tests de tema oscuro
├── helpers/
│   └── test-user-setup.js           # Setup de usuario de test y helpers
└── README.md                        # Esta documentacion
```

## Tests Disponibles

### `01-auth.spec.js`
Login automatico con Microsoft OAuth + 2FA flow.

### `02-projects.spec.js`
Creacion, edicion y eliminacion de proyectos.

### `03-full-workflow.spec.js`
Workflow completo: crear proyecto, crear tareas, verificar persistencia.

### `04-card-interactions.spec.js`
Interacciones con cards: cambio de estados, asignacion, edicion.

### `05-dark-theme.spec.js`
Verificacion del tema oscuro en componentes.

## Prerequisitos

- Servidor de desarrollo corriendo en `http://localhost:4321` (`npm run dev`)
- Credenciales de test configuradas en variables de entorno

## Mejores Practicas

1. **Datos de Test**: Usa nombres unicos con timestamp para evitar conflictos
2. **Limpieza**: Los tests limpian automaticamente los datos creados
3. **Aislamiento**: Cada test es independiente y puede ejecutarse solo
4. **Screenshots**: Se capturan automaticamente en fallos
5. **Variables de Entorno**: Nunca hardcodees credenciales en el codigo

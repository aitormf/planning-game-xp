# Tests E2E con Playwright

## Como ejecutar los tests

```bash
# Con servidor ya corriendo (recomendado):
# Terminal 1: npm run dev
# Terminal 2:
npm run test:e2e

# Con navegador visible
npm run test:e2e:headed

# Con interfaz de debugging
npm run test:e2e:ui

# Modo debug paso a paso
npm run test:e2e:debug

# Ver ultimo reporte
npm run test:e2e:report
```

## Ejecutar tests especificos

```bash
npx playwright test playwright/tests/e2e/01-auth.spec.js
npx playwright test -g "crear un nuevo proyecto"
```

## Estructura

```
playwright/
├── tests/
│   └── e2e/
│       ├── 01-auth.spec.js
│       ├── 02-projects.spec.js
│       ├── 03-full-workflow.spec.js
│       ├── 04-card-interactions.spec.js
│       └── 05-dark-theme.spec.js
├── helpers/
│   └── test-user-setup.js
└── README.md
```

## Prerequisitos

- Servidor de desarrollo corriendo en `http://localhost:4321`
- Credenciales de test en `.env.dev` o `.env.test`: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`

## Tips

- Los tests usan `TestDataManager` para identificadores unicos y limpieza automatica
- Screenshots se capturan automaticamente en fallos
- La autenticacion usa el flujo Microsoft OAuth + 2FA automatizado

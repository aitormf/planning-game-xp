# E2E Testing with Playwright

Este directorio contiene los tests end-to-end para Planning Game XP usando Playwright.

## Configuración

### 1. Variables de Entorno

Copia el archivo `.env.example` como `.env` y configura las credenciales de test:

```bash
cp .env.example .env
```

Edita `.env` y configura:

```env
# Test credentials for E2E testing
TEST_USER_EMAIL=tu_usuario_de_test@ejemplo.com
TEST_USER_PASSWORD=tu_password_de_test
```

### 2. Instalación

Los tests ya están configurados en el proyecto principal. Si necesitas reinstalar Playwright:

```bash
npm install
npx playwright install
```

## Ejecución de Tests

### Tests Principales

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar test principal funcional
npx playwright test production-ready.spec.js --headed

# Ejecutar tests específicos
npx playwright test auth.setup.spec.js
npx playwright test project-management.spec.js
npx playwright test task-management.spec.js
```

### Debugging

```bash
# Ejecutar con navegador visible
npx playwright test --headed

# Ejecutar con interfaz de debugging
npx playwright test --ui

# Modo debug paso a paso
npx playwright test --debug
```

### Reportes

```bash
# Ver último reporte
npx playwright show-report

# Generar reporte nuevo
npx playwright test --reporter=html
```

## Estructura de Tests

```
playwright/
├── tests/
│   ├── production-ready.spec.js    # Test principal completo
│   ├── auth.setup.spec.js         # Configuración de autenticación
│   ├── project-management.spec.js # Tests de gestión de proyectos
│   ├── task-management.spec.js    # Tests de gestión de tareas
│   ├── bug-management.spec.js     # Tests de gestión de bugs
│   └── integration-workflow.spec.js # Tests de workflow completo
├── utils/
│   └── test-helpers.js            # Utilidades y helpers
├── auth/
│   └── user.json                  # Estado de autenticación (generado)
└── README.md                      # Esta documentación
```

## Tests Disponibles

### `production-ready.spec.js`
Test principal que ejecuta un workflow completo:
- Login automático con Microsoft OAuth
- Creación de proyecto
- Creación de tareas
- Verificación de persistencia

### `project-management.spec.js`
Tests específicos de proyectos:
- Creación de proyectos
- Edición de proyectos
- Eliminación con confirmación
- Validación de formularios

### `task-management.spec.js`
Tests específicos de tareas:
- Creación de tareas/historias
- Cambio de estados
- Asignación de usuarios
- Eliminación de tareas

### `bug-management.spec.js`
Tests específicos de bugs:
- Creación de bugs
- Gestión de prioridades
- Cambio de estados
- Resolución de bugs

## Configuración Avanzada

### Configuración del Navegador

En `playwright.config.js`:

```javascript
use: {
  headless: false,  // Ver navegador durante tests
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### Variables de Entorno Adicionales

```env
# Configuración de timeouts (opcional)
PLAYWRIGHT_TIMEOUT=30000

# Configuración de CI/CD
CI=true  # Automáticamente detectado en CI
```

## Solución de Problemas

### Error de Autenticación
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el usuario de test tenga acceso a la aplicación

### Timeouts
- Los tests están configurados para esperar Firebase Auth
- Si hay problemas de red, aumenta los timeouts en la configuración

### Tests Fallan en CI
- Asegúrate de que las variables de entorno estén configuradas en CI
- Verifica que el servidor de desarrollo esté ejecutándose

## Mejores Prácticas

1. **Datos de Test**: Usa nombres únicos con timestamp para evitar conflictos
2. **Limpieza**: Los tests limpian automáticamente los datos creados
3. **Aislamiento**: Cada test es independiente y puede ejecutarse solo
4. **Screenshots**: Se capturan automáticamente en fallos
5. **Variables de Entorno**: Nunca hardcodees credenciales en el código

## Contribuir

1. Añade nuevos tests en el directorio `tests/`
2. Usa las utilidades en `test-helpers.js`
3. Sigue el patrón de nombres: `feature-name.spec.js`
4. Documenta tests complejos con comentarios
5. Asegúrate de que los tests pasen antes de hacer commit
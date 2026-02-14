# Tests E2E con Playwright

## Configuración

El sistema de tests está configurado para:
- **Autenticación persistente**: Solo necesitas hacer login una vez
- **Tests headless**: Los tests corren sin mostrar el navegador
- **Reutilización de sesión**: La sesión se guarda en `playwright/auth/user.json`

## Cómo ejecutar los tests

### Opción 1: Con servidor ya corriendo (recomendado)
```bash
# 1. En una terminal, inicia el servidor
npm run dev

# 2. En otra terminal, ejecuta los tests
npm run test:e2e:no-server
```

### Opción 2: Script todo-en-uno
```bash
# Inicia el servidor y ejecuta los tests automáticamente
npm run test:e2e:with-server
```

### Opción 3: Dejar que Playwright maneje el servidor
```bash
# Esto puede tardar más en iniciar
npm run test:e2e
```

### Ejecutar tests específicos
```bash
# Ejecutar un archivo específico
npx playwright test tests/example.spec.js

# Ejecutar en modo UI (para debugging)
npx playwright test --ui

# Ejecutar mostrando el navegador
npx playwright test --headed

# Ejecutar un test específico por nombre
npx playwright test -g "crear un nuevo proyecto"
```

## Cómo agregar nuevos tests

### 1. Usando Playwright Codegen

Para generar código automáticamente:

```bash
# Esto abrirá el navegador y grabará tus acciones
npx playwright codegen localhost:4322

# Con autenticación previa
npx playwright codegen --load-storage=playwright/auth/user.json localhost:4322
```

### 2. Estructura de un test

```javascript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Mi funcionalidad', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.goToDashboard();
  });

  test('mi test', async ({ page }) => {
    // Pega aquí el código generado por Playwright Codegen
    // o escribe tu propio test
  });
});
```

### 3. Usando los helpers

```javascript
test('crear proyecto y tarea', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  // Crear proyecto
  const projectName = await helpers.createProject('Mi Proyecto', 'Descripción');
  
  // Abrir el proyecto
  await helpers.openProject(projectName);
  
  // Crear una tarea
  await helpers.createTask({
    title: 'Mi Tarea',
    description: 'Descripción de la tarea',
    priority: 'high',
    points: 5
  });
});
```

## Tips para evitar re-login

1. **No borres** el archivo `playwright/auth/user.json`
2. Si la sesión expira, el sistema intentará hacer login automáticamente
3. Para forzar un nuevo login, borra el archivo de auth:
   ```bash
   rm playwright/auth/user.json
   npm run test:e2e
   ```

## Solución de problemas

### La sesión expira frecuentemente
- Asegúrate de que el usuario de pruebas no tenga 2FA activado
- Verifica que las cookies se estén guardando correctamente
- Aumenta el timeout en la configuración si es necesario

### Los tests fallan por timeouts
- Usa `await helpers.waitForLoadingToComplete()` después de acciones que cargan datos
- Aumenta los timeouts específicos: `{ timeout: 30000 }`
- Verifica que el servidor de desarrollo esté corriendo

### Necesito ver qué está pasando
```bash
# Ejecutar con navegador visible
npx playwright test --headed

# Ejecutar con modo debug
npx playwright test --debug

# Ver el trace de un test fallido
npx playwright show-trace
```
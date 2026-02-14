# Playwright Tests - Planning GameXP

## Configuración Inicial

### Prerequisitos
- Node.js instalado
- La aplicación debe estar corriendo en `http://localhost:4321`
- Credenciales de test en `.env`:
  ```
  TEST_USER_EMAIL=test@example.com
  TEST_USER_PASSWORD=Y42A_zVgcQUX
  ```

### Autenticación

Debido a que la aplicación usa Firebase Auth con Microsoft, es necesario generar un estado de autenticación antes de ejecutar los tests.

#### Paso 1: Generar estado de autenticación

Ejecuta el siguiente comando para autenticarte:

```bash
node playwright/simple-auth.js
```

Este script:
1. Abrirá un navegador
2. Navegará a la aplicación
3. Completará el login automáticamente con las credenciales del `.env`
4. Manejará el flujo de 2FA (Next → Skip setup)
5. Guardará el estado en `playwright/auth/user.json`

#### Paso 2: Ejecutar los tests

Una vez generado el estado de autenticación, puedes ejecutar los tests:

```bash
# Ejecutar todos los tests
npm run test:e2e

# Ejecutar tests específicos
npx playwright test nombre-del-test.spec.js

# Ejecutar con interfaz gráfica
npm run test:e2e:ui

# Ejecutar en modo debug
npm run test:e2e:debug
```

### Problemas Comunes

#### El estado de autenticación no funciona

Si los tests fallan porque no están autenticados:

1. **Regenera el estado de autenticación**:
   ```bash
   node playwright/simple-auth.js
   ```

2. **Verifica que la aplicación esté corriendo**:
   ```bash
   npm run dev
   ```

3. **Asegúrate de que el emulador de Firebase esté activo**:
   ```bash
   npm run emulator
   ```

#### Los tests tardan mucho o fallan

- Los tests esperan hasta 30 segundos para que aparezcan elementos
- Si fallan consistentemente, verifica los selectores en los archivos de test
- Revisa los screenshots en `test-results/` para debug

### Estructura de Tests

```
playwright/
├── auth/                    # Estado de autenticación guardado
│   └── user.json
├── tests/                   # Tests E2E
│   ├── e2e-comprehensive.spec.js
│   ├── example.spec.js
│   └── working-example.spec.js
├── simple-auth.js          # Script de autenticación
└── playwright.config.js    # Configuración de Playwright
```

### Notas Importantes

- **NO** comitees el archivo `playwright/auth/user.json` - contiene tokens sensibles
- Los tests usan el estado de autenticación guardado para evitar hacer login en cada test
- Si cambias las credenciales en `.env`, debes regenerar el estado de autenticación
- Los tests se ejecutan en modo headless por defecto (sin ventana visible)

### Escribir Nuevos Tests

Para escribir nuevos tests que requieran autenticación:

```javascript
import { test, expect } from '@playwright/test';

test('mi nuevo test', async ({ page }) => {
  // Navegar a la página - ya estarás autenticado
  await page.goto('/dashboard');
  
  // Tus assertions
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

El estado de autenticación se carga automáticamente gracias a la configuración en `playwright.config.js`.
# 🔒 Política de Seguridad

## Verificación Automática de Seguridad

Este proyecto implementa verificaciones automáticas de seguridad para prevenir la creación de builds con vulnerabilidades conocidas.

### 🛡️ Cómo funciona

1. **Antes de cada build**: Se ejecuta automáticamente `npm audit` para verificar vulnerabilidades
2. **Si hay vulnerabilidades**: La build se cancela y se muestra un resumen
3. **Si no hay vulnerabilidades**: La build continúa normalmente

### 📋 Scripts afectados

Todos los scripts de build incluyen verificación de seguridad:

- `npm run build`
- `npm run build-preview`
- `npm run build-prod`
- `npm run build:core`
- `npm run build:update-package`
- `npm run build:installer`

### 🚀 Verificación manual

Para verificar manualmente el estado de seguridad:

```bash
# Verificación rápida
npm run security-check

# Ver detalles completos
npm audit

# Intentar corregir automáticamente
npm audit fix
```

### 🔧 Configuración

El script de verificación (`scripts/security-check.js`) puede configurarse para:

- **Nivel de severidad**: Por defecto bloquea TODAS las vulnerabilidades
- **Excepciones**: Se pueden añadir excepciones para vulnerabilidades específicas si es necesario

### 📊 CI/CD

- **GitHub Actions**: Ejecuta verificación en cada push y PR
- **Verificación diaria**: Cron job diario para detectar nuevas vulnerabilidades
- **Notificaciones**: Se genera un artifact con los resultados si hay fallos

### ⚠️ Qué hacer si la build falla

1. Ejecuta `npm audit` para ver detalles
2. Intenta `npm audit fix` para correcciones automáticas
3. Si requiere actualización manual:
   - Revisa breaking changes
   - Actualiza las dependencias necesarias
   - Ejecuta tests para verificar que todo funciona

### 🎯 Beneficios

- ✅ Previene despliegues inseguros
- ✅ Detección temprana de vulnerabilidades
- ✅ Cumplimiento de mejores prácticas de seguridad
- ✅ Trazabilidad y auditoría automática

### 📝 Excepciones

Si necesitas temporalmente permitir una build con vulnerabilidades (NO recomendado):

```bash
# Saltarse la verificación (USAR CON PRECAUCIÓN)
SKIP_SECURITY_CHECK=true npm run build
```

**Nota**: Esto debe ser una medida temporal y documentada.
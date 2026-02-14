# Firebase Functions - Weekly Task Summary

Esta función envía un resumen semanal de tareas pendientes todos los lunes a los equipos de cada proyecto.

## Configuración Requerida

### 1. Secrets Configuration (Firebase Functions v2)

Configura los secrets usando Firebase CLI:

```bash
# Azure AD App Registration secrets
firebase functions:secrets:set MS_CLIENT_ID
firebase functions:secrets:set MS_CLIENT_SECRET
firebase functions:secrets:set MS_TENANT_ID
firebase functions:secrets:set MS_FROM_EMAIL
firebase functions:secrets:set MS_ALERT_EMAIL  # Optional: email for system alerts (defaults to MS_FROM_EMAIL)
```

O usa el script automatizado que lee desde `.env`:
```bash
./scripts/set-firebase-credentials.sh
```

### 2. Azure AD App Registration

1. Ve al portal de Azure AD
2. Crea un nuevo App Registration
3. Configura los permisos API:
   - Microsoft Graph API
   - Application permissions: `Mail.Send`
4. Genera un Client Secret
5. Anota el Client ID, Client Secret y Tenant ID

### 3. Estructura de Datos en Firebase

#### /data y /projects (IDs + directorio)
```json
{
  "data": {
    "developers": {
      "dev_001": { "email": "dev1@empresa.com", "name": "Dev Uno", "active": true }
    },
    "stakeholders": {
      "stk_001": { "email": "stakeholder1@empresa.com", "name": "Stake Uno", "active": true }
    }
  },
  "projects": {
    "Cinema4D": {
      "developers": ["dev_001"],
      "stakeholders": ["stk_001"]
    }
  }
}
```

## Funcionalidad

### Análisis de Tareas

La función analiza tareas de **sprints anteriores** (ya terminados) y categoriza:

1. **Tareas Sin Comenzar (TODO)**: Estado "To Do", "Todo", "Pending"
2. **Tareas En Progreso**: Estado "In Progress", "Working" 
3. **Tareas "Completadas" Incompletas**: Estado "Done" pero faltan campos obligatorios
4. **Tareas Bloqueadas**: Estado "Blocked" con razón del bloqueo
5. **Tareas Para Validar**: Estado "To Validate", "Validation", "Review"

### Campos Obligatorios Verificados

Para tareas en estado "Done":
- `startDate`: Fecha de inicio
- `endDate`: Fecha de fin
- `epic`: Épica asociada
- `developer`: Desarrollador asignado

### Envío de Correos

- **Developers**: Reciben resumen completo excepto tareas "To Validate"
- **Stakeholders**: Reciben solo tareas "To Validate" en correo separado
- **Admin**: Recibe notificación si falta configuración de un proyecto

## Despliegue

### 1. Instalar Dependencias
```bash
cd functions
npm install
```

### 2. Desplegar Function
```bash
firebase deploy --only functions
```

### 3. Verificar Despliegue
```bash
firebase functions:log
```

## Testing

### Función de Prueba Manual
```bash
# Llama a la función de prueba (región europea)
curl -X GET https://europe-west1-tu-proyecto.cloudfunctions.net/testWeeklyTaskSummary
```

### Schedule Automático
- Se ejecuta **todos los lunes a las 9:00 AM** (Europe/Madrid)
- Ejecutándose en región **europe-west1** (Bélgica)
- Configurado con Cloud Scheduler automáticamente

## Logs y Monitoreo

Ver logs en tiempo real:
```bash
firebase functions:log --only weeklyTaskSummary
```

Ver logs específicos:
```bash
firebase functions:log --only testWeeklyTaskSummary
```

## Troubleshooting

### Error de Autenticación MS Graph
- Verifica que las credenciales de Azure AD sean correctas
- Asegúrate que el App Registration tenga permisos `Mail.Send`
- Verifica que el email emisor tenga licencia de Office 365

### No se Envían Correos
- Verifica `/projects/{projectId}/developers` y `/projects/{projectId}/stakeholders` (IDs)
- Verifica `/data/developers` y `/data/stakeholders` para resolver emails
- Revisa los logs para errores específicos
- Asegúrate que los sprints tengan fechas de fin configuradas

### Proyectos Sin Configuración
- Se enviará correo al email configurado en `MS_ALERT_EMAIL` automáticamente
- Agrega la configuración en `/projects/{projectId}` para el proyecto

## Estructura del Email

El email incluye:
- Header con nombre del proyecto y fecha
- Resumen de sprints analizados
- Secciones organizadas por tipo de tarea
- Lista de campos faltantes para tareas "Done"
- Razones de bloqueo para tareas bloqueadas
- Footer con información del sistema

Los emails están formateados en HTML con estilos responsive y colores distintivos para cada categoría.

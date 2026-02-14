# Push Notifications - Test Guide

## ¿Qué se ha implementado?

Se ha conectado el sistema de notificaciones de la campanita con las push notifications del navegador.

### Cambios realizados:

1. **NotificationService** (`/public/js/services/notification-service.js`):
   - Se agregó importación del `PushNotificationService`
   - Se integró el envío de push notifications cuando se crean notificaciones
   - Solo se envían push notifications cuando el usuario NO está activo

2. **PushNotificationService** (`/public/js/services/push-notification-service.js`):
   - Se mejoró el método `sendPushNotification` para manejar userIdentifiers (nombres y emails)
   - Se agregó soporte para URLs clickeables en las notificaciones
   - Se agregó el método `getUserEmailFromIdentifier` para resolver nombres a emails
   - Se hizo el servicio disponible globalmente para debugging

3. **Main.js** (`/public/js/main.js`):
   - Se agregó la importación del `PushNotificationService` para asegurar su inicialización

4. **Debug** (`/public/js/debug-notifications.js`):
   - Se agregó función `testPushNotification()` para probar el sistema

## Cómo probar:

### 1. Probar Push Notifications directamente en consola:

```javascript
// Probar push notification directamente
await window.debugNotifications.testPushNotification();
```

### 2. Probar el flujo completo:

```javascript
// Crear una notificación que debería generar push notification
// (solo si el usuario no está activo - abre otra pestaña y vuelve)
await window.notificationService.createTestNotification();
```

### 3. Probar asignación de tareas:

- Asigna una tarea a un usuario
- Si el usuario no está activo, debería recibir una push notification
- Al hacer clic en la notificación, debería abrir la URL del elemento

### 4. Verificar permisos:

```javascript
// Verificar permisos de notificaciones
console.log('Notification permission:', Notification.permission);

// Solicitar permisos si es necesario
await Notification.requestPermission();
```

## Comportamiento esperado:

1. **Usuario activo**: Solo se muestra la notificación en la campanita
2. **Usuario inactivo**: Se muestra la notificación en la campanita + push notification del navegador
3. **Click en push notification**: Se abre la URL correspondiente al elemento relacionado
4. **Soporte para nombres y emails**: El sistema resuelve automáticamente nombres a emails

## Notas importantes:

- Las push notifications solo funcionan con HTTPS o localhost
- El usuario debe dar permisos para las notificaciones
- El sistema detecta automáticamente si el usuario está activo (pestaña visible)
- Se utiliza `sinsole.log` en lugar de `console.log` para seguir las convenciones del proyecto
- **IMPORTANTE**: Las push notifications NO funcionan en modo incógnito debido a restricciones de seguridad del navegador

## Limitaciones del modo incógnito:

- **Chrome/Edge**: No permite notificaciones del navegador en modo incógnito
- **Firefox**: Permite pero con restricciones adicionales
- **Safari**: Similar a Chrome

## Para testing con múltiples usuarios:

- **Opción 1**: Usar perfiles de navegador separados (recomendado)
- **Opción 2**: Usar ventanas normales con logout/login
- **Opción 3**: Usar navegadores diferentes
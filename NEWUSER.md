# Guía para Añadir Nuevos Usuarios

Este documento describe los pasos necesarios para dar de alta a un nuevo usuario en Planning Game XP.

## Resumen de Pasos

1. **Crear usuario en el proveedor de autenticación** (Google, Microsoft, GitHub o GitLab)
2. **Configurar permisos en Realtime Database**
3. **Primera autenticación del usuario**

---

## 1. Crear Usuario en el Proveedor de Autenticación

El sistema usa autenticación OAuth con el proveedor configurado en `PUBLIC_AUTH_PROVIDER`. El usuario debe tener una cuenta válida en dicho proveedor.

**Según el proveedor configurado:**
- **Google**: El usuario necesita una cuenta de Google
- **Microsoft**: Crear el usuario en Azure AD (portal.azure.com)
- **GitHub**: El usuario necesita una cuenta de GitHub
- **GitLab**: El usuario necesita una cuenta en la instancia GitLab configurada

**Nota:** Si se ha configurado `PUBLIC_ALLOWED_EMAIL_DOMAINS` en las variables de entorno, el email del usuario debe pertenecer a uno de los dominios permitidos.

---

## 2. Configuración en Realtime Database

### 2.1 Codificación del Email

Los emails se codifican para usarse como claves en Firebase:
- `@` → `|`
- `.` → `!`
- `#` → `-`

**Ejemplo:** `usuario@example.com` → `usuario|example!com`

### 2.2 Rutas a Configurar

#### A) Acceso a Proyectos (REQUERIDO)
**Ruta:** `/data/projectsByUser/{emailCodificado}`

| Valor | Descripción |
|-------|-------------|
| `"All"` | Acceso a todos los proyectos |
| `"Proyecto1, Proyecto2"` | Acceso solo a proyectos específicos (separados por coma) |

**Ejemplo:**
```
/data/projectsByUser/usuario|example!com = "All"
/data/projectsByUser/consultant|example!com = "ProjectA, ProjectB"
```

#### B) SuperAdmin (OPCIONAL)
**Ruta:** `/data/superAdminEmails/{emailCodificado}`

Para dar permisos de SuperAdmin (gestión de usuarios, todos los proyectos, crear/eliminar proyectos):

```
/data/superAdminEmails/usuario|example!com = true
```

#### C) App Uploader (OPCIONAL)
**Ruta:** `/data/appUploaders/{projectId}/{emailCodificado}`

Para dar permisos de subida de aplicaciones en un proyecto específico:

```
/data/appUploaders/ProjectA/usuario|example!com = true
```

> Las apps subidas quedan en estado "pendiente" hasta que un App Admin las apruebe.

#### D) App Admin (OPCIONAL)
**Ruta:** `/data/appAdmins/{emailCodificado}`

Para dar permisos de administrador de aplicaciones (aprobar, deprecar, eliminar apps):

```
/data/appAdmins/usuario|example!com = true
```

#### F) Permisos de Storage General (OPCIONAL)
**Rutas:**
- `/data/storageReadAllowed/{emailCodificado}` - Lectura de archivos (fuera de /apps/)
- `/data/storageWriteAllowed/{emailCodificado}` - Escritura de archivos (fuera de /apps/)

```
/data/storageReadAllowed/usuario|example!com = true
/data/storageWriteAllowed/usuario|example!com = true
```

> **Nota:** Los usuarios `@example.com` tienen acceso de lectura automático.
> Para subir apps, usar `appUploaders`. Para aprobar apps, usar `appAdmins`.

#### G) Información del Usuario (OPCIONAL)
**Ruta:** `/data/users/{emailCodificado}`

Para almacenar información adicional del usuario:

```json
{
  "name": "Nombre Apellido",
  "email": "usuario@example.com",
  "isAdmin": false,
  "isSuperAdmin": false,
  "aliases": ["alias@otro.com"],
  "roles": {
    "developer": ["Proyecto1", "Proyecto2"],
    "stakeholder": ["Proyecto3"]
  }
}
```

---

## 3. Primera Autenticación

1. El usuario accede a la aplicación
2. Hace clic en "Sign in with ..." (el botón muestra el proveedor configurado)
3. Se autentica con sus credenciales
4. La aplicación verifica sus permisos en Firebase
5. Si no tiene entrada en `/data/projectsByUser/`, se le asignan proyectos por defecto

---

## Tabla Resumen de Permisos

| Ruta Firebase | Propósito | Valores |
|---------------|-----------|---------|
| `/data/projectsByUser/{email}` | Proyectos visibles | `"All"` o lista separada por comas |
| `/data/superAdminEmails/{email}` | SuperAdmin | `true` |
| `/data/appUploaders/{projectId}/{email}` | Subir apps (quedan pendientes) | `true` |
| `/data/appAdmins/{email}` | Aprobar/deprecar/eliminar apps | `true` |
| `/data/storageReadAllowed/{email}` | Leer Storage (general) | `true` |
| `/data/storageWriteAllowed/{email}` | Escribir Storage (general) | `true` |
| `/data/users/{email}` | Info del usuario | Objeto JSON |

---

## Ejemplos de Configuración

### Usuario Normal (solo ciertos proyectos)
```
/data/projectsByUser/empleado|example!com = "ProjectA, ProjectB"
```

### Usuario con Acceso Total
```
/data/projectsByUser/manager|example!com = "All"
```

### SuperAdmin Completo
```
/data/projectsByUser/admin|example!com = "All"
/data/superAdminEmails/admin|example!com = true
/data/appAdmins/admin|example!com = true
/data/storageWriteAllowed/admin|example!com = true
```

### Usuario Externo (consultor)
1. Añadir email a `firestore.rules` si no es `@example.com`
2. Configurar en Realtime Database:
```
/data/projectsByUser/consultant|example!com = "ProyectoCliente"
/data/storageReadAllowed/consultant|example!com = true
```

---

## Herramientas de Ayuda

### Script para Codificar Email
```javascript
function encodeEmailForFirebase(email) {
  return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

// Uso:
console.log(encodeEmailForFirebase('usuario@example.com'));
// Output: usuario|example!com
```

### Verificar Permisos desde la Consola del Navegador
```javascript
// En la consola del navegador (F12) estando logueado:
console.log('Email:', auth.currentUser?.email);
console.log('Has all access:', window.hasAllProjectsAccess);
console.log('User projects:', window.userProjects);
```

---

## Troubleshooting

### El usuario no ve ningún proyecto
- Verificar `/data/projectsByUser/{emailCodificado}` existe
- Verificar que el valor sea `"All"` o contenga nombres de proyectos válidos

### El usuario no puede crear proyectos
- Solo SuperAdmins pueden crear proyectos
- Verificar `/data/superAdminEmails/{emailCodificado}` = `true`

### El usuario no puede subir archivos
- Verificar `/data/storageWriteAllowed/{emailCodificado}` = `true`
- O verificar que sea `@example.com` (tienen acceso automático)

### Error "Permission denied" en Firestore
- Verificar que el usuario está autenticado correctamente
- Desplegar las reglas actualizadas: `npm run deploy:rules`

# Funcionalidad de Apertura de Tickets por URL

## Descripción

La página de tickets ahora soporta la apertura automática de tickets específicos mediante parámetros en la URL. Esto permite compartir enlaces directos a tickets específicos.

## Formato de URL

```
/tickets?id=TICKET_ID#PROJECT_NAME
```

### Parámetros

- `id`: ID del ticket a abrir (ej: `C4D-BUG-0001`)
- `#PROJECT_NAME`: Nombre del proyecto como hashtag (ej: `#cinema4d`)

### Ejemplos

```
/tickets?id=C4D-BUG-0001#cinema4d
/tickets?id=BUG-001#myproject
/tickets?id=TEST-123#testproject
```

## Funcionamiento

1. **Detección del proyecto**: El sistema busca el proyecto especificado en el hashtag de la URL
2. **Carga de datos**: Se cargan los tickets del proyecto seleccionado
3. **Apertura automática**: Si el ticket existe, se abre automáticamente en modo expandido
4. **Limpieza de URL**: Al cerrar el modal, se elimina el parámetro `id` de la URL

## Características

- **Búsqueda flexible**: Busca tickets tanto por ID directo como por `cardId`
- **Manejo de errores**: Muestra notificaciones si el ticket no se encuentra
- **Persistencia de cambios**: Los cambios se guardan en Firebase y se actualiza la tabla
- **URL limpia**: Al cerrar el modal, la URL se limpia automáticamente

## Casos de uso

- Compartir enlaces directos a tickets específicos
- Integración con sistemas externos
- Navegación directa desde notificaciones o emails
- Bookmarks de tickets importantes

## Notas técnicas

- La funcionalidad está implementada en `public/js/tickets-page.js`
- Utiliza el componente `BugCard` en modo expandido
- Se integra con el sistema de modales existente (`AppModal`)
- Mantiene compatibilidad con la funcionalidad existente

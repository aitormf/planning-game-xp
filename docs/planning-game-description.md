# Planning Game XP - Descripción del Proyecto

## Para usar con MCP después de reiniciar:

```
mcp__planning-game__update_project({
  projectId: "PlanningGame",
  updates: {
    description: "... (copiar el texto de abajo)"
  }
})
```

---

## Descripción (campo `description`)

```
# Planning Game XP

Aplicación web de gestión de proyectos ágiles siguiendo prácticas de eXtreme Programming (XP).

## Propósito
Herramienta interna para la planificación y seguimiento de desarrollo de software, permitiendo gestionar el ciclo completo de trabajo: desde propuestas hasta validación.

## Entidades Principales
- **Épicas**: Agrupaciones de funcionalidades relacionadas
- **Tareas**: Unidades de trabajo con formato User Story (Como/Quiero/Para)
- **Bugs**: Incidencias con prioridades estandarizadas
- **Sprints**: Iteraciones de trabajo con fechas y puntos planificados
- **Propuestas**: Ideas pendientes de convertir en tareas
- **QA**: Items de control de calidad

## Convenios de IDs
- Formato: {ABREV}-{TIPO}-{NUM} (ej: PLN-TSK-0001)
- Tipos: TSK (task), BUG (bug), EPC (epic), SPR (sprint), PRP (proposal), QA_ (qa)

## Estados de Tareas
To Do → In Progress → To Validate → Done/Done&Validated

## Estados de Bugs
Reported → Assigned → Fixed → Verified/Closed

## Roles
- **SuperAdmin**: Acceso total, puede asignar tareas a otros
- **Admin**: Gestión de proyecto
- **User**: Solo puede auto-asignarse tareas
- **Consultant**: Solo lectura

## Reglas WIP
- Cada developer solo puede tener UNA tarea "In Progress" simultáneamente
- Los developers solo pueden auto-asignarse tareas (excepto SuperAdmin)

## Sistemas de Puntuación
- **1-5**: Escala lineal simple
- **Fibonacci**: 1, 2, 3, 5, 8, 13, 21...

## Tecnología
Frontend: Astro + Lit Web Components
Backend: Firebase (RTDB, Auth, Functions, Storage, FCM)
```

---

## AGENTS Guidelines (campo `agentsGuidelines`)

```
# AGENTS para PlanningGame

## Contexto
Este es el proyecto de la propia aplicación Planning Game XP. BecarIA debe ser especialmente cuidadosa al trabajar aquí ya que los cambios afectan directamente a la herramienta de gestión.

## Reglas específicas
1. SIEMPRE ejecutar tests antes de marcar tareas como completadas: `npm test`
2. NUNCA modificar firebase-service.js sin revisión manual
3. Los cambios en componentes web (public/js/wc/) requieren verificar que no rompen otros componentes
4. Seguir estrictamente los convenios de CLAUDE.md

## Archivos críticos (requieren especial cuidado)
- /public/js/services/firebase-service.js
- /public/js/services/permission-service.js
- /public/js/main.js
- /src/pages/*.astro

## Workflow de desarrollo
1. Leer la tarea completa y sus criterios de aceptación
2. Verificar que existen tests o crearlos primero
3. Implementar cambios incrementalmente
4. Ejecutar `npm test` después de cada cambio significativo
5. Marcar como "To Validate" solo cuando todos los tests pasen
```

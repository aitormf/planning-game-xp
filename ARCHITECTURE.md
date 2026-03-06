# Guía de Arquitectura - Planning GameXP v1.2.0

## Resumen

Este documento describe la implementación arquitectónica actual de Planning GameXP v1.2.0, que incluye una arquitectura orientada a servicios con servicios centralizados, patrones de delegación de eventos y web components basados en Lit para mejorar la mantenibilidad y el rendimiento.

## Stack Tecnológico

- **Framework Frontend**: Astro (v5.x) con web components Lit
- **Servicios Backend**: Firebase (Realtime Database, Firestore, Auth, Cloud Functions, Storage, FCM)
- **Testing**: Vitest (tests unitarios), Playwright (tests E2E)
- **Sistema de Build**: Astro con generación personalizada de service worker
- **Patrón de Arquitectura**: Arquitectura Orientada a Servicios con Delegación de Eventos

## Servicios Principales

### 1. Firebase Service (`firebase-service.js`)

Servicio central para todas las operaciones de Firebase incluyendo autenticación, acceso a base de datos y configuración.

```javascript
import { FirebaseService } from "./services/firebase-service.js";

// Inicializar servicios de Firebase
FirebaseService.init();

// Acceder a diferentes servicios de Firebase
const auth = FirebaseService.getAuth();
const database = FirebaseService.getDatabase();
const firestore = FirebaseService.getFirestore();
```

### 2. Permission Service (`permission-service.js`)

Centraliza la lógica de control de acceso basado en roles en todos los componentes.

```javascript
import { permissionService } from "./services/permission-service.js";

// Inicializar con datos del usuario
permissionService.init(user, userRole, viewMode);

// Obtener permisos para cualquier tipo de tarjeta
const permissions = permissionService.getCardPermissions(cardData, "task");
// Devuelve: { canView, canEdit, canSave, canDelete, canCreate }
```

**Permisos Basados en Roles:**
- **Admin**: Acceso completo en modo gestión
- **User**: Derechos de creación limitados en modo consulta
- **Consultant**: Acceso de solo lectura con permisos específicos de creación

### 3. Card Service (`card-service.js`)

Maneja toda la lógica de negocio relacionada con tarjetas y operaciones CRUD.

```javascript
import { CardService } from "./services/card-service.js";

const cardService = new CardService(firebaseService);

// Operaciones con tarjetas
await cardService.createCard(cardData);
await cardService.updateCard(cardId, updates);
await cardService.deleteCard(cardId);
const card = await cardService.getCard(cardId);
```

### 4. Card Realtime Service (`card-realtime-service.js`)

Gestiona la sincronización en tiempo real de datos de tarjetas entre clientes usando Firebase Realtime Database.

```javascript
import { initCardRealtimeService } from "./services/card-realtime-service.js";

// Inicializar sincronización en tiempo real
await initCardRealtimeService();

// Actualizaciones automáticas en tiempo real para todas las tarjetas
// Maneja resolución de conflictos y consistencia de datos
```

### 5. Filter Service (`filter-service.js`)

Sistema de filtrado genérico que soporta múltiples tipos de tarjetas con opciones de filtro configurables.

```javascript
import { filterService } from './services/filter-service.js';

// Registrar configuración de filtros
filterService.registerFilterConfig('task', {
  filters: {
    search: { type: 'text', fields: ['title', 'description'] },
    status: { type: 'select', multiple: true, options: [...] },
    priority: { type: 'select', options: [...] }
  },
  sortOptions: ['title', 'createdDate', 'status']
});

// Aplicar filtros
const filteredCards = filterService.applyFilters('task', cards, filterState);
```

### 6. Modal Service (`modal-service.js`)

Gestión centralizada de modales con apilamiento LIFO y diferentes tipos de modales.

```javascript
import { modalService } from "./services/modal-service.js";

// Crear modal básico
const modal = await modalService.createModal({
  title: "Editar Tarjeta",
  content: cardElement,
  maxWidth: "80vw",
});

// Crear modal de confirmación
const confirmed = await modalService.createConfirmationModal({
  title: "Eliminar Tarjeta",
  message: "¿Estás seguro?",
  confirmText: "Eliminar",
  cancelText: "Cancelar",
});
```

### 7. Push Notification Service (`push-notification-service.js`)

Maneja Firebase Cloud Messaging para notificaciones en tiempo real.

```javascript
import { pushNotificationService } from "./services/push-notification-service.js";

// Inicializar notificaciones push
await pushNotificationService.init();

// Enviar notificación
await pushNotificationService.sendNotification(userId, {
  title: "Tarea asignada",
  message: "Se te ha asignado una nueva tarea",
  data: { taskId, projectId }
});
```

### 8. Global Data Manager (`global-data-manager.js`)

Gestión centralizada del estado para datos globales de la aplicación.

```javascript
import { globalDataManager } from "./services/global-data-manager.js";

// Acceder al estado global
const currentProject = globalDataManager.getCurrentProject();
const userRole = globalDataManager.getUserRole();

// Escuchar cambios de estado
globalDataManager.addListener('project-changed', (project) => {
  // Manejar cambio de proyecto
});
```

### 9. Update Service (`update-service.js`)

Gestiona actualizaciones de la aplicación y control de versiones.

```javascript
import { updateService } from "./services/update-service.js";

// Verificar actualizaciones
const hasUpdate = await updateService.checkForUpdates();

// Aplicar actualizaciones
if (hasUpdate) {
  await updateService.applyUpdate();
}
```

## Sistema de Eventos

### Sistema de Eventos Unificado (`unified-event-system.js`)

Sistema avanzado de delegación de eventos que gestiona todos los eventos de la aplicación de forma centralizada.

```javascript
import { UnifiedEventSystem } from "./events/unified-event-system.js";

// Registrar manejadores de eventos
UnifiedEventSystem.register(".add-button", "click", (event, element) => {
  // Manejar clicks en botones de añadir
});

// Delegación de eventos con prioridad y opciones
UnifiedEventSystem.register(".critical-button", "click", handler, {
  priority: 10,
  preventDefault: true,
});
```

### Event Delegation Manager (`event-delegation-manager.js`)

Implementación central de delegación de eventos para optimización del rendimiento.

```javascript
import { eventDelegationManager } from "./events/event-delegation-manager.js";

// Un solo listener de eventos por tipo de evento en el documento
// Limpieza automática y gestión de memoria
// Ejecución de manejadores basada en prioridad
```

## Patrones Factory

### Card Factory (`card-factory.js`)

Crea tipos de tarjetas apropiados según la configuración.

```javascript
import { CardFactory } from "./factories/card-factory.js";

// Crear diferentes tipos de tarjetas
const taskCard = await CardFactory.createCard("task", taskConfig);
const bugCard = await CardFactory.createCard("bug", bugConfig);
```

### View Factory (`view-factory.js`)

Crea diferentes renderizadores de vistas (Lista, Kanban, Sprint, Gantt).

```javascript
import { ViewFactory } from "./factories/view-factory.js";

// Crear renderizadores de vistas
const listView = ViewFactory.createRenderer("list", config);
const kanbanView = ViewFactory.createRenderer("kanban", config);
```

## Sistema de Renderizado

### Card Renderer (`card-renderer.js`)

Maneja la lógica de renderizado para todos los tipos de tarjetas.

### Renderizadores de Vistas
- **List Renderer** (`list-renderer.js`): Vista de lista tradicional
- **Kanban Renderer** (`kanban-renderer.js`): Vista de tablero Kanban
- **Sprint Renderer** (`sprint-renderer.js`): Vista específica de Sprint
- **Gantt Renderer** (`gantt-renderer.js`): Vista de línea temporal
- **Table Renderer** (`table-renderer.js`): Vista tabular

## Arquitectura de Web Components

### Componentes Base

Todos los componentes extienden de clases base con funcionalidad compartida:

- **BaseCard** (`base-card.js`): Clase base para todos los componentes de tarjeta
- **EditableCard** (`editable-card.js`): Base mejorada con capacidades de edición

### Componentes de Tarjetas
- **TaskCard** (`TaskCard.js`): Tarjetas de gestión de tareas
- **BugCard** (`BugCard.js`): Tarjetas de seguimiento de bugs
- **SprintCard** (`SprintCard.js`): Tarjetas de planificación de sprints
- **EpicCard** (`EpicCard.js`): Tarjetas de gestión de épicas
- **ProposalCard** (`ProposalCard.js`): Tarjetas de propuestas
- **QACard** (`QACard.js`): Tarjetas de control de calidad

### Componentes de UI
- **AppManager** (`AppManager.js`): Gestor principal de la aplicación
- **AppModal** (`AppModal.js`): Sistema de diálogos modales
- **ProjectSelector** (`ProjectSelector.js`): Interfaz de selección de proyecto
- **NotificationBell** (`NotificationBell.js`): Centro de notificaciones
- **MenuNav** (`MenuNav.js`): Menú de navegación
- **GanttChart** (`GanttChart.js`): Visualización de diagrama Gantt
- **SprintPointsChart** (`SprintPointsChart.js`): Analíticas de sprint

### Componentes de Filtros
- **TaskFilters** (`TaskFilters.js`): Interfaz de filtrado de tareas
- **BugFilters** (`BugFilters.js`): Interfaz de filtrado de bugs
- **MultiSelect** (`MultiSelect.js`): Componente de selección múltiple

## Sistema de Utilidades

### Utilidades Principales
- **Common Functions** (`common-functions.js`): Funciones de utilidad compartidas
- **UI Utils** (`ui-utils.js`): Utilidades específicas de UI
- **URL Utils** (`url-utils.js`): Utilidades de manipulación de URLs
- **Service Communicator** (`service-communicator.js`): Comunicación entre servicios
- **Modal Manager** (`modal-manager.js`): Utilidades de gestión de modales
- **Cache Manager** (`cache-manager.js`): Sistema de caché
- **Lazy Loader** (`lazy-loader.js`): Utilidades de carga dinámica
- **Email Sanitizer** (`email-sanitizer.js`): Utilidades de procesamiento de email
- **User Display Utils** (`user-display-utils.js`): Utilidades de presentación de usuario
- **Logging**: Se usa `console.error` / `console.warn` para errores y advertencias. `console.log` solo para debugging temporal. `sinsole` esta DEPRECATED.

## Tematización y Estilos

### Sistema de Temas
- **Theme Variables** (`theme-variables.js`): Propiedades CSS personalizadas
- **Base Styles** (`base-card-styles.js`, `base-tab-styles.js`): Estilos comunes
- **Temas Específicos por Componente**:
  - Task Theme (`task-theme.js`)
  - Bug Theme (`bug-theme.js`)
  - Sprint Theme (`sprint-theme.js`)
  - Story Theme (`story-theme.js`)

### Arquitectura de Estilos
Cada componente tiene su propio archivo de estilos dedicado manteniendo la separación de responsabilidades mientras permite la tematización compartida.

## Controladores

### App Controller (`app-controller.js`)

Controlador principal de la aplicación que orquesta todos los servicios y componentes.

```javascript
import { AppController } from './controllers/app-controller.js';

// Crear e inicializar la aplicación
const appController = await AppController.create();
```

### Controladores Especializados
- **Project Controller** (`project-controller.js`): Lógica de gestión de proyectos
- **Tab Controller** (`tab-controller.js`): Gestión de navegación por pestañas

## Sistema de Configuración

### App Constants (`app-constants.js`)

Configuración centralizada para constantes de toda la aplicación.

### Client Config (`client-config.js`)

Configuración específica del cliente.

### Theme Config (`theme-config.js`)

Configuración de temas y estilos.

## Estructura de Archivos

```
public/js/
├── services/              # Servicios de lógica de negocio centralizados
│   ├── firebase-service.js
│   ├── permission-service.js
│   ├── card-service.js
│   ├── card-realtime-service.js
│   ├── filter-service.js
│   ├── modal-service.js
│   ├── push-notification-service.js
│   ├── global-data-manager.js
│   ├── notification-service.js
│   └── update-service.js
├── events/                # Sistema de eventos
│   ├── unified-event-system.js
│   ├── event-delegation-manager.js
│   └── dom-update-functions.js
├── factories/             # Patrones factory
│   ├── card-factory.js
│   └── view-factory.js
├── renderers/             # Lógica de renderizado de vistas
│   ├── card-renderer.js
│   ├── list-renderer.js
│   ├── kanban-renderer.js
│   ├── sprint-renderer.js
│   ├── gantt-renderer.js
│   └── table-renderer.js
├── controllers/           # Controladores de aplicación
│   ├── app-controller.js
│   ├── project-controller.js
│   └── tab-controller.js
├── wc/                   # Web Components Lit
│   ├── base-card.js
│   ├── editable-card.js
│   ├── TaskCard.js
│   ├── BugCard.js
│   └── [otros componentes...]
├── utils/                # Funciones de utilidad
│   ├── common-functions.js
│   ├── ui-utils.js
│   ├── service-communicator.js
│   └── [otras utilidades...]
├── ui/styles/            # Tematización y estilos
│   ├── theme-variables.js
│   ├── themes/
│   └── [estilos de componentes...]
├── filters/              # Sistema de filtros
│   ├── filter-factory.js
│   ├── base-filter-system.js
│   └── types/
├── views/                # Gestores de vistas
│   ├── list-view-manager.js
│   ├── kanban-view-manager.js
│   └── [otros gestores de vistas...]
├── core/                 # Inicialización central
│   └── app-initializer.js
├── config/               # Configuración
│   ├── app-constants.js
│   ├── client-config.js
│   └── theme-config.js
├── constants/            # Constantes de aplicación
│   └── app-constants.js
└── main.js              # Punto de entrada de la aplicación
```

## Principios de Arquitectura

### 1. Arquitectura Orientada a Servicios
- **Separación de Responsabilidades**: Cada servicio tiene una única responsabilidad
- **Inyección de Dependencias**: Los servicios pueden ser fácilmente mockeados para testing
- **Lógica Centralizada**: La lógica de negocio está centralizada en los servicios

### 2. Arquitectura Orientada a Eventos
- **Sistema de Eventos Unificado**: Todos los eventos pasan por gestión centralizada
- **Bajo Acoplamiento**: Los componentes se comunican mediante eventos, no referencias directas
- **Optimización de Rendimiento**: Listeners de eventos únicos con delegación

### 3. Arquitectura Basada en Componentes
- **Web Components Lit**: Componentes reutilizables basados en estándares
- **Composición**: UI compleja construida a partir de componentes simples y componibles
- **Separación de Responsabilidades**: Lógica, estilos y plantillas separados

### 4. Arquitectura en Tiempo Real
- **Integración con Firebase**: Sincronización de datos en tiempo real
- **Resolución de Conflictos**: Manejo automático de ediciones concurrentes
- **Soporte Offline**: Degradación elegante cuando está offline

## Optimizaciones de Rendimiento

### Gestión de Memoria
- **Delegación de Eventos**: O(1) listeners de eventos en lugar de O(n)
- **Carga Diferida (Lazy Loading)**: Componentes cargados bajo demanda
- **Gestión de Caché**: Caché inteligente de datos accedidos frecuentemente

### Rendimiento en Tiempo Real
- **Actualizaciones Optimistas**: UI se actualiza antes de la confirmación del servidor
- **Operaciones por Lotes**: Múltiples operaciones combinadas para eficiencia
- **Gestión de Conexiones**: Manejo eficiente de conexiones Firebase

## Arquitectura de Seguridad

### Sistema de Permisos
- **Control de Acceso Basado en Roles**: Roles Admin, User, Consultant
- **Permisos a Nivel de Campo**: Control granular sobre el acceso a datos
- **Actualizaciones de Permisos en Tiempo Real**: Permisos actualizados en tiempo real

### Seguridad de Datos
- **Reglas de Seguridad de Firebase**: Validación del lado del servidor
- **Sanitización de Entrada**: Toda entrada del usuario sanitizada
- **Autenticación Requerida**: Todas las operaciones requieren autenticación

## Arquitectura de Testing

### Testing Unitario (Vitest)
- **Testing de Servicios**: Todos los servicios tienen tests unitarios
- **Testing de Componentes**: Web components testeados de forma aislada
- **Servicios Mock**: Los servicios pueden ser mockeados para testing

### Testing E2E (Playwright)
- **Suite de Tests Completa**: Testing completo de flujos de usuario
- **Autenticación Automática**: Login persistente entre tests
- **Gestión de Datos de Test**: Limpieza automática de datos de test

## Migración y Despliegue

### Proceso de Build
- **Verificaciones de Seguridad**: Escaneo automático de vulnerabilidades
- **Generación de Service Worker**: Service worker personalizado para caché
- **Multi-Entorno**: Builds de desarrollo, pre-producción y producción

### Despliegue
- **Firebase Hosting**: Despliegue de assets estáticos
- **Cloud Functions**: Despliegue de lógica del lado del servidor
- **Reglas de Base de Datos**: Despliegue de reglas de seguridad

## Buenas Prácticas

### Desarrollo
1. **Usar Servicios**: Siempre usar servicios centralizados en lugar de lógica inline
2. **Comunicación por Eventos**: Usar eventos para comunicación entre componentes
3. **Limpieza Adecuada**: Siempre limpiar listeners de eventos y suscripciones
4. **Manejo de Errores**: Manejo completo de errores y logging
5. **Rendimiento Primero**: Considerar las implicaciones de rendimiento de las decisiones arquitectónicas

### Organización de Código
1. **Responsabilidad Única**: Cada archivo/servicio tiene un propósito claro
2. **Nomenclatura Consistente**: Seguir las convenciones de nomenclatura establecidas
3. **Documentación**: El código es auto-documentado con comentarios claros
4. **Testing**: Cada servicio y componente debe ser testeable

Esta arquitectura proporciona una base robusta y escalable para la aplicación Planning GameXP con clara separación de responsabilidades, excelentes características de rendimiento y fuerte mantenibilidad.

---

# Architecture Guide - Planning GameXP v1.2.0 (English Version)

## Overview

This document describes the current architectural implementation of Planning GameXP v1.2.0, featuring a service-oriented architecture with centralized services, event delegation patterns, and Lit-based web components for improved maintainability and performance.

## Tech Stack

- **Frontend Framework**: Astro (v5.x) with Lit web components
- **Backend Services**: Firebase (Realtime Database, Firestore, Auth, Cloud Functions, Storage, FCM)
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Build System**: Astro with custom service worker generation
- **Architecture Pattern**: Service-Oriented Architecture with Event Delegation

## Core Services

### 1. Firebase Service (`firebase-service.js`)

Central service for all Firebase operations including authentication, database access, and configuration.

```javascript
import { FirebaseService } from "./services/firebase-service.js";

// Initialize Firebase services
FirebaseService.init();

// Access different Firebase services
const auth = FirebaseService.getAuth();
const database = FirebaseService.getDatabase();
const firestore = FirebaseService.getFirestore();
```

### 2. Permission Service (`permission-service.js`)

Centralizes role-based access control logic across all components.

```javascript
import { permissionService } from "./services/permission-service.js";

// Initialize with user data
permissionService.init(user, userRole, viewMode);

// Get permissions for any card type
const permissions = permissionService.getCardPermissions(cardData, "task");
// Returns: { canView, canEdit, canSave, canDelete, canCreate }
```

**Role-Based Permissions:**
- **Admin**: Full access in management mode
- **User**: Limited creation rights in consultation mode
- **Consultant**: Read-only access with specific creation permissions

### 3. Card Service (`card-service.js`)

Handles all card-related business logic and CRUD operations.

```javascript
import { CardService } from "./services/card-service.js";

const cardService = new CardService(firebaseService);

// Card operations
await cardService.createCard(cardData);
await cardService.updateCard(cardId, updates);
await cardService.deleteCard(cardId);
const card = await cardService.getCard(cardId);
```

### 4. Card Realtime Service (`card-realtime-service.js`)

Manages real-time synchronization of card data across clients using Firebase Realtime Database.

```javascript
import { initCardRealtimeService } from "./services/card-realtime-service.js";

// Initialize real-time synchronization
await initCardRealtimeService();

// Automatic real-time updates for all cards
// Handles conflict resolution and data consistency
```

### 5. Filter Service (`filter-service.js`)

Generic filtering system supporting multiple card types with configurable filter options.

```javascript
import { filterService } from './services/filter-service.js';

// Register filter configuration
filterService.registerFilterConfig('task', {
  filters: {
    search: { type: 'text', fields: ['title', 'description'] },
    status: { type: 'select', multiple: true, options: [...] },
    priority: { type: 'select', options: [...] }
  },
  sortOptions: ['title', 'createdDate', 'status']
});

// Apply filters
const filteredCards = filterService.applyFilters('task', cards, filterState);
```

### 6. Modal Service (`modal-service.js`)

Centralized modal management with LIFO stacking and different modal types.

```javascript
import { modalService } from "./services/modal-service.js";

// Create basic modal
const modal = await modalService.createModal({
  title: "Edit Card",
  content: cardElement,
  maxWidth: "80vw",
});

// Create confirmation modal
const confirmed = await modalService.createConfirmationModal({
  title: "Delete Card",
  message: "Are you sure?",
  confirmText: "Delete",
  cancelText: "Cancel",
});
```

### 7. Push Notification Service (`push-notification-service.js`)

Handles Firebase Cloud Messaging for real-time notifications.

```javascript
import { pushNotificationService } from "./services/push-notification-service.js";

// Initialize push notifications
await pushNotificationService.init();

// Send notification
await pushNotificationService.sendNotification(userId, {
  title: "Task assigned",
  message: "New task has been assigned to you",
  data: { taskId, projectId }
});
```

### 8. Global Data Manager (`global-data-manager.js`)

Centralized state management for global application data.

```javascript
import { globalDataManager } from "./services/global-data-manager.js";

// Access global state
const currentProject = globalDataManager.getCurrentProject();
const userRole = globalDataManager.getUserRole();

// Listen for state changes
globalDataManager.addListener('project-changed', (project) => {
  // Handle project change
});
```

### 9. Update Service (`update-service.js`)

Manages application updates and version control.

```javascript
import { updateService } from "./services/update-service.js";

// Check for updates
const hasUpdate = await updateService.checkForUpdates();

// Apply updates
if (hasUpdate) {
  await updateService.applyUpdate();
}
```

## Event System

### Unified Event System (`unified-event-system.js`)

Advanced event delegation system that manages all application events centrally.

```javascript
import { UnifiedEventSystem } from "./events/unified-event-system.js";

// Register event handlers
UnifiedEventSystem.register(".add-button", "click", (event, element) => {
  // Handle add button clicks
});

// Event delegation with priority and options
UnifiedEventSystem.register(".critical-button", "click", handler, {
  priority: 10,
  preventDefault: true,
});
```

### Event Delegation Manager (`event-delegation-manager.js`)

Core event delegation implementation for performance optimization.

```javascript
import { eventDelegationManager } from "./events/event-delegation-manager.js";

// Single event listener per event type on document
// Automatic cleanup and memory management
// Priority-based handler execution
```

## Factory Patterns

### Card Factory (`card-factory.js`)

Creates appropriate card types based on configuration.

```javascript
import { CardFactory } from "./factories/card-factory.js";

// Create different card types
const taskCard = await CardFactory.createCard("task", taskConfig);
const bugCard = await CardFactory.createCard("bug", bugConfig);
```

### View Factory (`view-factory.js`)

Creates different view renderers (List, Kanban, Sprint, Gantt).

```javascript
import { ViewFactory } from "./factories/view-factory.js";

// Create view renderers
const listView = ViewFactory.createRenderer("list", config);
const kanbanView = ViewFactory.createRenderer("kanban", config);
```

## Rendering System

### Card Renderer (`card-renderer.js`)

Handles rendering logic for all card types.

### View Renderers
- **List Renderer** (`list-renderer.js`): Traditional list view
- **Kanban Renderer** (`kanban-renderer.js`): Kanban board view
- **Sprint Renderer** (`sprint-renderer.js`): Sprint-specific view
- **Gantt Renderer** (`gantt-renderer.js`): Timeline view
- **Table Renderer** (`table-renderer.js`): Tabular view

## Web Components Architecture

### Base Components

All components extend from base classes with shared functionality:

- **BaseCard** (`base-card.js`): Base class for all card components
- **EditableCard** (`editable-card.js`): Enhanced base with editing capabilities

### Card Components
- **TaskCard** (`TaskCard.js`): Task management cards
- **BugCard** (`BugCard.js`): Bug tracking cards
- **SprintCard** (`SprintCard.js`): Sprint planning cards
- **EpicCard** (`EpicCard.js`): Epic management cards
- **ProposalCard** (`ProposalCard.js`): Proposal cards
- **QACard** (`QACard.js`): Quality assurance cards

### UI Components
- **AppManager** (`AppManager.js`): Main application manager
- **AppModal** (`AppModal.js`): Modal dialog system
- **ProjectSelector** (`ProjectSelector.js`): Project selection interface
- **NotificationBell** (`NotificationBell.js`): Notification center
- **MenuNav** (`MenuNav.js`): Navigation menu
- **GanttChart** (`GanttChart.js`): Gantt chart visualization
- **SprintPointsChart** (`SprintPointsChart.js`): Sprint analytics

### Filter Components
- **TaskFilters** (`TaskFilters.js`): Task filtering interface
- **BugFilters** (`BugFilters.js`): Bug filtering interface
- **MultiSelect** (`MultiSelect.js`): Multi-selection component

## Utility System

### Core Utils
- **Common Functions** (`common-functions.js`): Shared utility functions
- **UI Utils** (`ui-utils.js`): UI-specific utilities
- **URL Utils** (`url-utils.js`): URL manipulation utilities
- **Service Communicator** (`service-communicator.js`): Inter-service communication
- **Modal Manager** (`modal-manager.js`): Modal management utilities
- **Cache Manager** (`cache-manager.js`): Caching system
- **Lazy Loader** (`lazy-loader.js`): Dynamic loading utilities
- **Email Sanitizer** (`email-sanitizer.js`): Email processing utilities
- **User Display Utils** (`user-display-utils.js`): User presentation utilities
- **Logging**: Uses `console.error` / `console.warn` for persistent errors and warnings. `console.log` only for temporary debugging. `sinsole` is DEPRECATED.

## Theming and Styling

### Theme System
- **Theme Variables** (`theme-variables.js`): CSS custom properties
- **Base Styles** (`base-card-styles.js`, `base-tab-styles.js`): Common styling
- **Component-Specific Themes**:
  - Task Theme (`task-theme.js`)
  - Bug Theme (`bug-theme.js`)
  - Sprint Theme (`sprint-theme.js`)
  - Story Theme (`story-theme.js`)

### Style Architecture
Each component has its own dedicated style file maintaining separation of concerns while allowing for shared theming.

## Controllers

### App Controller (`app-controller.js`)

Main application controller that orchestrates all services and components.

```javascript
import { AppController } from './controllers/app-controller.js';

// Create and initialize application
const appController = await AppController.create();
```

### Specialized Controllers
- **Project Controller** (`project-controller.js`): Project management logic
- **Tab Controller** (`tab-controller.js`): Tab navigation management

## Configuration System

### App Constants (`app-constants.js`)

Centralized configuration for application-wide constants.

### Client Config (`client-config.js`)

Client-specific configuration settings.

### Theme Config (`theme-config.js`)

Theme and styling configuration.

## File Structure

```
public/js/
├── services/              # Centralized business logic services
│   ├── firebase-service.js
│   ├── permission-service.js
│   ├── card-service.js
│   ├── card-realtime-service.js
│   ├── filter-service.js
│   ├── modal-service.js
│   ├── push-notification-service.js
│   ├── global-data-manager.js
│   ├── notification-service.js
│   └── update-service.js
├── events/                # Event system
│   ├── unified-event-system.js
│   ├── event-delegation-manager.js
│   └── dom-update-functions.js
├── factories/             # Factory patterns
│   ├── card-factory.js
│   └── view-factory.js
├── renderers/             # View rendering logic
│   ├── card-renderer.js
│   ├── list-renderer.js
│   ├── kanban-renderer.js
│   ├── sprint-renderer.js
│   ├── gantt-renderer.js
│   └── table-renderer.js
├── controllers/           # Application controllers
│   ├── app-controller.js
│   ├── project-controller.js
│   └── tab-controller.js
├── wc/                   # Lit Web Components
│   ├── base-card.js
│   ├── editable-card.js
│   ├── TaskCard.js
│   ├── BugCard.js
│   └── [other components...]
├── utils/                # Utility functions
│   ├── common-functions.js
│   ├── ui-utils.js
│   ├── service-communicator.js
│   └── [other utils...]
├── ui/styles/            # Theming and styles
│   ├── theme-variables.js
│   ├── themes/
│   └── [component styles...]
├── filters/              # Filter system
│   ├── filter-factory.js
│   ├── base-filter-system.js
│   └── types/
├── views/                # View managers
│   ├── list-view-manager.js
│   ├── kanban-view-manager.js
│   └── [other view managers...]
├── core/                 # Core initialization
│   └── app-initializer.js
├── config/               # Configuration
│   ├── app-constants.js
│   ├── client-config.js
│   └── theme-config.js
├── constants/            # Application constants
│   └── app-constants.js
└── main.js              # Application entry point
```

## Architecture Principles

### 1. Service-Oriented Architecture
- **Separation of Concerns**: Each service has a single responsibility
- **Dependency Injection**: Services can be easily mocked for testing
- **Centralized Logic**: Business logic is centralized in services

### 2. Event-Driven Architecture
- **Unified Event System**: All events go through centralized management
- **Loose Coupling**: Components communicate via events, not direct references
- **Performance Optimized**: Single event listeners with delegation

### 3. Component-Based Architecture
- **Lit Web Components**: Reusable, standards-based components
- **Composition**: Complex UI built from simple, composable components
- **Separation of Concerns**: Logic, styling, and templates separated

### 4. Real-time Architecture
- **Firebase Integration**: Real-time data synchronization
- **Conflict Resolution**: Automatic handling of concurrent edits
- **Offline Support**: Graceful degradation when offline

## Performance Optimizations

### Memory Management
- **Event Delegation**: O(1) event listeners instead of O(n)
- **Lazy Loading**: Components loaded on demand
- **Cache Management**: Intelligent caching of frequently accessed data

### Real-time Performance
- **Optimistic Updates**: UI updates before server confirmation
- **Batch Operations**: Multiple operations combined for efficiency
- **Connection Management**: Efficient Firebase connection handling

## Security Architecture

### Permission System
- **Role-Based Access Control**: Admin, User, Consultant roles
- **Field-Level Permissions**: Granular control over data access
- **Real-time Permission Updates**: Permissions updated in real-time

### Data Security
- **Firebase Security Rules**: Server-side validation
- **Input Sanitization**: All user input sanitized
- **Authentication Required**: All operations require authentication

## Testing Architecture

### Unit Testing (Vitest)
- **Service Testing**: All services have unit tests
- **Component Testing**: Web components tested in isolation
- **Mock Services**: Services can be mocked for testing

### E2E Testing (Playwright)
- **Comprehensive Test Suite**: Full user workflow testing
- **Automatic Authentication**: Persistent login across tests
- **Test Data Management**: Automatic cleanup of test data

## Migration and Deployment

### Build Process
- **Security Checks**: Automatic vulnerability scanning
- **Service Worker Generation**: Custom service worker for caching
- **Multi-Environment**: Development, pre-production, production builds

### Deployment
- **Firebase Hosting**: Static asset deployment
- **Cloud Functions**: Server-side logic deployment
- **Database Rules**: Security rules deployment

## Best Practices

### Development
1. **Use Services**: Always use centralized services instead of inline logic
2. **Event Communication**: Use events for component communication
3. **Proper Cleanup**: Always clean up event listeners and subscriptions
4. **Error Handling**: Comprehensive error handling and logging
5. **Performance First**: Consider performance implications of architectural decisions

### Code Organization
1. **Single Responsibility**: Each file/service has one clear purpose
2. **Consistent Naming**: Follow established naming conventions
3. **Documentation**: Code is self-documenting with clear comments
4. **Testing**: Every service and component should be testable

This architecture provides a robust, scalable foundation for the Planning GameXP application with clear separation of concerns, excellent performance characteristics, and strong maintainability.

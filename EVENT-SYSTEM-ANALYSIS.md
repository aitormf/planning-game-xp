# Sistema de Eventos - Planning Game XP

## Resumen Ejecutivo

El sistema de eventos de Planning Game XP utiliza una arquitectura híbrida que combina:
- **Event Delegation**: Gestión centralizada de eventos DOM
- **Custom Events**: Comunicación entre componentes 
- **Request/Response Pattern**: Para obtener datos
- **Publish/Subscribe Pattern**: Para notificaciones y cambios de estado

## 1. Arquitectura del Sistema de Eventos

### Event Delegation Manager
**Archivo:** `/public/js/events/event-delegation-manager.js`

El sistema centraliza la gestión de eventos DOM nativos usando un único listener global:

```javascript
// Listeners globales centralizados
document.addEventListener('click', handleGlobalClick, true)
document.addEventListener('change', handleGlobalChange, true)  
document.addEventListener('input', handleGlobalInput, true)
```

**Beneficios:**
- Mejora la performance eliminando múltiples listeners
- Gestión centralizada de eventos
- Fácil registro/desregistro de handlers

### Global Data Manager
**Archivo:** `/public/js/services/global-data-manager.js`

Centraliza las respuestas a solicitudes de datos mediante eventos:
- Escucha eventos `request-*-data`
- Emite eventos `provide-*-data`
- Mantiene una única instancia de listeners

## 2. Categorías de Eventos

### 2.1 Eventos de Datos (Request/Response Pattern)

#### `request-taskcard-data` / `provide-taskcard-data`
**Emisor:** TaskCard componentes  
**Receptor:** GlobalDataManager → TaskCard componentes

```javascript
// Solicitud
document.dispatchEvent(new CustomEvent('request-taskcard-data', {
  detail: {
    cardId: string,
    cardType: 'task-card'
  }
}));

// Respuesta
document.dispatchEvent(new CustomEvent('provide-taskcard-data', {
  detail: {
    cardId: string,
    cardType: string,
    developerList: Array,
    stakeholders: Array,
    sprintList: Object,
    statusList: Array
  }
}));
```

#### `request-bugcard-data` / `provide-bugcard-data`
**Emisor:** BugCard componentes  
**Receptor:** GlobalDataManager → BugCard componentes

```javascript
// Solicitud
detail: { cardId: string, cardType: 'bug-card' }

// Respuesta
detail: {
  cardId: string,
  cardType: string,
  statusList: Array,
  priorityList: Array,
  developerList: Object,
  userAuthorizedEmails: Array
}
```

#### `request-epiccard-data` / `provide-epiccard-data`
**Emisor:** EpicCard componentes  
**Receptor:** GlobalDataManager → EpicCard componentes

```javascript
// Solicitud
detail: { cardId: string, cardType: 'epic-card' }

// Respuesta
detail: {
  cardId: string,
  cardType: string,
  stakeholders: Array
}
```

#### `request-qacard-data` / `provide-qacard-data`
**Emisor:** QACard componentes  
**Receptor:** GlobalDataManager → QACard componentes

```javascript
// Solicitud
detail: { cardId: string, cardType: 'qa-card' }

// Respuesta
detail: {
  cardId: string,
  cardType: string,
  suitesList: Object,
  taskIdList: Array
}
```

#### `request-firebase-storage-config` / `provide-firebase-storage-config`
**Emisor:** FirebaseStorageUploader  
**Receptor:** GlobalDataManager → FirebaseStorageUploader

```javascript
// Solicitud
detail: { requester: HTMLElement }

// Respuesta (en window)
detail: { config: Object }
```

### 2.2 Eventos de Filtrado

#### `filters-changed`
**Emisor:** TaskFilters, BugFilters  
**Receptor:** ViewFactory, renderers

```javascript
detail: {
  filterId: string,
  selectedValues: Array,
  allFilters: Object  // Estado completo actual
}
```

#### `filters-cleared`
**Emisor:** TaskFilters, BugFilters  
**Receptor:** ViewFactory, renderers

```javascript
detail: {
  allFilters: Object  // Estado antes del clearing
}
```

#### `list-filters-changed`
**Emisor:** Componentes de filtros globales  
**Receptor:** ViewFactory

```javascript
detail: {
  filters: Object,  // Estado completo de filtros
  triggerType: string  // Tipo de trigger
}
```

### 2.3 Eventos de Tarjetas (Cards)

#### `card-saved`
**Emisor:** FirebaseService  
**Receptor:** Componentes de UI, controllers

```javascript
detail: { id: string }  // Card ID
```

#### `card-deleted`
**Emisor:** FirebaseService  
**Receptor:** Componentes de UI, controllers

```javascript
detail: { id: string }  // Card ID
```

#### `card-expanded`
**Emisor:** TaskCard  
**Receptor:** Modal handlers

```javascript
detail: {
  cardId: string,
  cardType: string,
  element: HTMLElement
}
```

#### `cards-rendered`
**Emisor:** CardRenderer  
**Receptor:** AppController

```javascript
detail: { section: string }
```

#### `suite-deleted`
**Emisor:** FirebaseService  
**Receptor:** QA components

```javascript
detail: { id: string }  // Suite ID
```

### 2.4 Eventos de Modales

#### `close-modal`
**Emisor:** ModalManager, varios componentes  
**Receptor:** AppModal, ModalService

```javascript
detail: {
  modalId?: string,           // ID específico (opcional)
  target: 'specific' | 'all'  // Alcance del cierre
}
```

#### `modal-closed`
**Emisor:** ProposalCard, modal components  
**Receptor:** Controllers para cleanup

```javascript
detail: {}  // Usualmente vacío
```

#### `modal-closed-requested`
**Emisor:** AppModal  
**Receptor:** ModalService, parent components

```javascript
detail: {
  contentElementId: string,
  contentElementType: string,
  modalId: string
}
```

#### `modal-close-confirmed`
**Emisor:** QACard  
**Receptor:** ModalService

```javascript
detail: {
  contentElementId: string,
  contentElementType: string
}
```

#### `modal-action1`, `modal-action2`, `modal-action3`
**Emisor:** AppModal  
**Receptor:** Parent components

```javascript
detail: {
  contentElementId: string,
  contentElementType: string
}
```

### 2.5 Eventos de Permisos

#### `request-user-permissions`
**Emisor:** Componentes de tarjetas  
**Receptor:** adminproject.astro

```javascript
detail: {
  requestId: string,
  cardType: string,
  cardId: string
}
```

#### `request-task-permissions`
**Emisor:** TaskCard  
**Receptor:** adminproject.astro

```javascript
detail: {
  cardId: string,
  cardType: string,
  userEmail: string,
  createdBy: string,
  callback: Function
}
```

#### `request-bug-permissions`
**Emisor:** BugCard  
**Receptor:** adminproject.astro

```javascript
detail: {
  cardId: string,
  cardType: string,
  userEmail: string,
  createdBy: string,
  callback: Function
}
```

#### `request-ticket-permissions`
**Emisor:** Ticket components  
**Receptor:** adminproject.astro

```javascript
detail: {
  cardId: string,
  cardType: string,
  userEmail: string,
  callback: Function
}
```

#### `request-ownership-permissions`
**Emisor:** Varios componentes  
**Receptor:** adminproject.astro

```javascript
detail: {
  cardId: string,
  cardType: string,
  userEmail: string,
  createdBy: string,
  callback: Function
}
```

#### `request-card-permissions`
**Emisor:** Componentes genéricos  
**Receptor:** adminproject.astro

```javascript
detail: {
  cardId: string,
  cardType: string,
  userEmail: string,
  callback: Function
}
```

### 2.6 Eventos de Notificaciones

#### `show-slide-notification`
**Emisor:** FirebaseService, varios componentes  
**Receptor:** NotificationService/Component

```javascript
detail: {
  options: {
    message: string,
    type?: 'success' | 'warning' | 'error' | 'info',
    duration?: number
  }
}
```

#### `new-notification`
**Emisor:** PushNotificationService  
**Receptor:** NotificationBell

```javascript
detail: {
  title: string,
  body: string,
  data: Object
}
```

### 2.7 Eventos de Aplicación

#### `user-authenticated`
**Emisor:** Auth handlers  
**Receptor:** NotificationBell, UI components

```javascript
detail: { user: Object }  // Firebase user
```

#### `tab-changed`
**Emisor:** UI controls  
**Receptor:** AppController

```javascript
detail: {
  tabId: string,
  tabElement: HTMLElement
}
```

#### `project-changed`
**Emisor:** ProjectController  
**Receptor:** AppController

```javascript
detail: {
  projectId: string,
  projectData: Object
}
```

#### `component-lazy-loaded`
**Emisor:** LazyLoader  
**Receptor:** Debugging/monitoring

```javascript
detail: {
  componentName: string,
  path: string
}
```

## 3. Patrones de Uso

### 3.1 Request/Response Pattern
Utilizado para obtener datos de forma asíncrona:

```javascript
// 1. Componente solicita datos
document.dispatchEvent(new CustomEvent('request-taskcard-data', {
  detail: { cardId: 'task-123', cardType: 'task-card' }
}));

// 2. GlobalDataManager responde
document.addEventListener('request-taskcard-data', (e) => {
  const data = fetchTaskData(e.detail.cardId);
  document.dispatchEvent(new CustomEvent('provide-taskcard-data', {
    detail: { ...e.detail, ...data }
  }));
});

// 3. Componente recibe datos
document.addEventListener('provide-taskcard-data', (e) => {
  if (e.detail.cardId === this.cardId) {
    this.updateWithData(e.detail);
  }
});
```

### 3.2 Event Delegation Pattern
Para eventos DOM nativos:

```javascript
// Registro centralizado
eventDelegationManager.register('.card-button', 'click', (event, element) => {
  // Handler logic
});
```

### 3.3 Publish/Subscribe Pattern
Para notificaciones y cambios de estado:

```javascript
// Emisión
document.dispatchEvent(new CustomEvent('card-saved', {
  detail: { id: cardId },
  bubbles: true,
  composed: true
}));

// Suscripción
document.addEventListener('card-saved', (e) => {
  updateUI(e.detail.id);
});
```

## 4. Ubicaciones de Event Listeners

### 4.1 Document-level Listeners

#### Inicialización de Aplicación
- `public/js/main.js:33` - `DOMContentLoaded` → initializeApplication
- `src/pages/*.astro` - Múltiples `DOMContentLoaded` handlers
- `public/js/utils/lazy-loader.js:285` - `DOMContentLoaded` → LazyLoader.init()

#### Event Delegation System
- `public/js/events/event-delegation-manager.js:18-24` - Click, change, input handlers globales

#### Gestión de Cache y Visibilidad
- `public/js/utils/cache-manager.js:79` - `visibilitychange`
- `public/js/utils/cache-manager.js:413` - `window.beforeunload`

### 4.2 Custom Event Listeners

#### GlobalDataManager
- `public/js/services/global-data-manager.js:310-393` - Request data events

#### AppController
- `public/js/controllers/app-controller.js:156-288` - Tab changes, filters, renders

#### Modal System
- `public/js/services/modal-service.js` - Modal lifecycle events
- `public/js/wc/AppModal.js:94` - Keyboard (ESC) handling

## 5. Componentes con Event Delegation

### UI Components
- **CardRenderer** (`public/js/renderers/card-renderer.js:212`) - Card clicks
- **KanbanRenderer** (`public/js/renderers/kanban-renderer.js`) - Drag & drop
- **TableRenderer** (`public/js/renderers/table-renderer.js`) - Sorting, actions
- **FilterComponents** - Filter changes, clear actions

### Form Components  
- **ModalService** - Form submissions, button clicks
- **MultiSelect** (`public/js/wc/MultiSelect.js:129`) - Global click handling

## 6. Mejores Prácticas Observadas

### ✅ Buenas Prácticas
1. **Event Delegation**: Uso centralizado para mejor performance
2. **Namespacing**: Eventos con nombres descriptivos y únicos
3. **Payload Consistency**: Estructuras de datos consistentes
4. **Error Handling**: Try-catch en handlers críticos
5. **Cleanup**: Removal de listeners cuando es necesario
6. **Bubbling Control**: Uso apropiado de bubbles/composed

### ⚠️ Consideraciones
1. **Event Listener Memory**: Algunos listeners podrían necesitar cleanup
2. **Global State**: Dependencia del document como event bus
3. **Type Safety**: No hay tipado de eventos (JavaScript vanilla)

## 7. Diagrama de Flujo de Eventos Principales

```
Request Flow:
Component → request-*-data → GlobalDataManager → provide-*-data → Component

Filter Flow:
FilterComponent → filters-changed → ViewFactory → Renderers → UI Update

Card Operations:
FirebaseService → card-saved/deleted → Multiple Listeners → UI Updates

Modal Flow:
User Action → close-modal → ModalService → modal-closed → Cleanup
```

## 8. Estadísticas del Sistema

- **Total de eventos custom**: ~35 tipos diferentes
- **Listeners globales**: 3 (click, change, input)
- **Servicios principales**: GlobalDataManager, ModalService, EventDelegationManager
- **Patrones utilizados**: Request/Response, Publish/Subscribe, Event Delegation
- **Scope**: document (mayoría), window (algunos), elementos específicos (modales, forms)

Este sistema de eventos proporciona una base sólida para la comunicación entre componentes manteniendo bajo acoplamiento y alta cohesión en la aplicación.
/**
 * Event Constants - Centralización de todos los tipos de eventos
 * Consolidación de eventos desde el sistema duplicado
 */

// Eventos del EventBus (pub/sub)
export const EVENT_BUS_EVENTS = {
  // Card click events
  KANBAN_CARD_CLICKED: 'kanban-card-clicked',
  SPRINT_TASK_CLICKED: 'sprint-task-clicked',
  
  // App events
  TAB_CHANGED: 'tab-changed',
  PROJECT_CHANGED: 'project-changed'
};

// Eventos del DOM (document.addEventListener)
export const DOM_EVENTS = {
  // Firebase data request/provide events
  REQUEST_EPICCARD_DATA: 'request-epiccard-data',
  PROVIDE_EPICCARD_DATA: 'provide-epiccard-data',
  REQUEST_TASKCARD_DATA: 'request-taskcard-data',
  PROVIDE_TASKCARD_DATA: 'provide-taskcard-data',
  REQUEST_BUGCARD_DATA: 'request-bugcard-data',
  PROVIDE_BUGCARD_DATA: 'provide-bugcard-data',
  REQUEST_QACARD_DATA: 'request-qacard-data',
  PROVIDE_QACARD_DATA: 'provide-qacard-data',
  REQUEST_FIREBASE_STORAGE_CONFIG: 'request-firebase-storage-config',
  PROVIDE_FIREBASE_STORAGE_CONFIG: 'provide-firebase-storage-config',
  
  // UI events
  CARDS_RENDERED: 'cards-rendered',
  CARD_SAVED: 'card-saved',
  
  // CRUD events (desde lib/eventHandlers.js)
  SAVE_CARD: 'save-card',
  DELETE_CARD: 'delete-card',
  CREATE_TASK: 'create-task',
  
  // Auth events
  USER_LOGGED_IN: 'user-logged-in',
  USER_LOGGED_OUT: 'user-logged-out',
  
  // Data events
  GET_CARDS_POINTS: 'get-cards-points',
  RELOAD_ALL_CARDS: 'reload-all-cards',
  REFRESH_CARDS_VIEW: 'refresh-cards-view',
  
  // Notification events
  SHOW_SLIDE_NOTIFICATION: 'show-slide-notification',
  SHOW_MODAL: 'show-modal'
};

// Todos los eventos disponibles
export const ALL_EVENTS = {
  ...EVENT_BUS_EVENTS,
  ...DOM_EVENTS
};

// Eventos que requieren stopPropagation/preventDefault
export const EVENTS_REQUIRING_CONTROL = [
  DOM_EVENTS.REQUEST_FIREBASE_STORAGE_CONFIG
];

// Eventos que requieren propagación
export const EVENTS_REQUIRING_BUBBLING = [
  DOM_EVENTS.PROVIDE_FIREBASE_STORAGE_CONFIG
];

/**
 * Events Module Index - Punto de entrada para el sistema de eventos unificado
 * 
 * Este archivo facilita la migración exportando las principales funcionalidades
 * del sistema unificado de eventos.
 */

import { unifiedEventSystem } from './unified-event-system.js';

export { EventBus, UnifiedEventSystem, unifiedEventSystem } from './unified-event-system.js';
export { EVENT_BUS_EVENTS, DOM_EVENTS, ALL_EVENTS } from './event-constants.js';
export { 
  updateSpecificGlobalData, 
  repaintSpecificElement, 
  updateTableCache, 
  updateDependentComponents 
} from './dom-update-functions.js';

// Para compatibilidad, exportar el singleton como eventBus
export const eventBus = unifiedEventSystem.getEventBus();

// Exportar instancia del sistema unificado
export const eventSystem = unifiedEventSystem;
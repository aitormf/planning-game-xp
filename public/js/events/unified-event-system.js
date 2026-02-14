/**
 * Unified Event System - Consolidación de EventBus + EventHandlers
 * 
 * Este sistema unifica:
 * - EventBus (pub/sub pattern)
 * - EventHandlers simples (event-handlers.js)
 * - EventHandlers complejos (lib/eventHandlers.js)
 */
import { showExpandedCardInModal } from '../utils/common-functions.js';
import { FirebaseService } from '../services/firebase-service.js';
import { EVENT_BUS_EVENTS, DOM_EVENTS, EVENTS_REQUIRING_CONTROL } from './event-constants.js';
import { 
  updateSpecificGlobalData, 
  repaintSpecificElement, 
  updateTableCache, 
  updateDependentComponents 
} from './dom-update-functions.js';

/**
 * EventBus mejorado con funcionalidades adicionales
 */
export class EventBus {
  constructor() {
    this.events = {};
    this.isDebugMode = false;
  }

  /**
   */
  setDebugMode(enabled) {
    this.isDebugMode = enabled;
  }

  /**
   * Suscribirse a un evento
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Desuscribirse de un evento
   */
  off(event, callback) {
    if (!this.events[event]) return;

    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  /**
   * Emitir un evento
   */
  emit(event, data) {
    if (!this.events[event]) return;

    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        // Silently ignore callback errors to prevent event chain interruption
      }
    });
  }

  /**
   * Suscribirse a un evento una sola vez
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Obtener todos los eventos registrados
   */
  getRegisteredEvents() {
    return Object.keys(this.events);
  }

  /**
   * Limpiar todos los listeners
   */
  clear() {
    this.events = {};
  }
}

/**
 * Sistema de manejo de eventos unificado
 */
export class UnifiedEventSystem {
  constructor(appController = null) {
    this.appController = appController;
    this.eventBus = new EventBus();
    this.domEventHandlers = new Map();
    
    // Auto-setup si hay un appController
    if (this.appController) {
      this.setupAllEventHandlers();
    }
  }

  /**
   * Configurar todos los event handlers
   */
  setupAllEventHandlers() {
    this.setupEventBusHandlers();
    this.setupDOMEventHandlers();
  }

  /**
   * Configurar handlers del EventBus (eventos pub/sub)
   */
  setupEventBusHandlers() {
    // Card click handlers
    this.eventBus.on(EVENT_BUS_EVENTS.KANBAN_CARD_CLICKED, (data) => {
      showExpandedCardInModal(data.card);
    });

    this.eventBus.on(EVENT_BUS_EVENTS.SPRINT_TASK_CLICKED, (data) => {
      showExpandedCardInModal(data.task);
    });

    // Tab changes
    this.eventBus.on(EVENT_BUS_EVENTS.TAB_CHANGED, (data) => {
      if (data.section === 'sprints' && this.appController) {
        document.dispatchEvent(new CustomEvent(DOM_EVENTS.GET_CARDS_POINTS, {
          detail: { projectId: this.appController.getCurrentProjectId() }
        }));
      }
    });

    // Project changes
    this.eventBus.on(EVENT_BUS_EVENTS.PROJECT_CHANGED, (data) => {
      this.handleProjectChanged(data);
    });
  }

  /**
   * Configurar handlers del DOM
   */
  setupDOMEventHandlers() {
    // Firebase data request handlers
    this.addDOMEventHandler(DOM_EVENTS.REQUEST_EPICCARD_DATA, (e) => {
      this.handleEpicCardDataRequest(e);
    });

    this.addDOMEventHandler(DOM_EVENTS.REQUEST_TASKCARD_DATA, (e) => {
      this.handleTaskCardDataRequest(e);
    });

    this.addDOMEventHandler(DOM_EVENTS.REQUEST_BUGCARD_DATA, (e) => {
      this.handleBugCardDataRequest(e);
    });

    this.addDOMEventHandler(DOM_EVENTS.REQUEST_QACARD_DATA, (e) => {
      this.handleQACardDataRequest(e);
    });

    this.addDOMEventHandler(DOM_EVENTS.REQUEST_FIREBASE_STORAGE_CONFIG, (e) => {
      this.handleFirebaseStorageConfigRequest(e);
    });

    // UI event handlers
    this.addDOMEventHandler(DOM_EVENTS.CARDS_RENDERED, (e) => {
      this.handleCardsRendered(e);
    });

    // DEPRECATED: Este handler cerraba CUALQUIER modal al guardar una card
    // Ahora usamos un sistema LIFO más inteligente en ModalStateManager
    // this.addDOMEventHandler(DOM_EVENTS.CARD_SAVED, () => {
    //   const modal = document.querySelector('app-modal');
    //   if (modal) modal.remove();
    // });

    // CRUD event handlers (migrados de lib/eventHandlers.js)
    this.addDOMEventHandler(DOM_EVENTS.SAVE_CARD, (e) => {
      this.handleSaveCard(e);
    });

    this.addDOMEventHandler(DOM_EVENTS.DELETE_CARD, (e) => {
      this.handleDeleteCard(e);
    });

    this.addDOMEventHandler(DOM_EVENTS.CREATE_TASK, (e) => {
      this.handleCreateTask(e);
    });

    // Auth event handlers
    this.addDOMEventHandler(DOM_EVENTS.USER_LOGGED_IN, (e) => {
      const { user } = e.detail;
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.SHOW_SLIDE_NOTIFICATION, { 
        detail: { options: { message: `Welcome, ${user.displayName}!` } } 
      }));
    });

    this.addDOMEventHandler(DOM_EVENTS.USER_LOGGED_OUT, () => {
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.SHOW_SLIDE_NOTIFICATION, { 
        detail: { options: { message: 'You have been logged out' } } 
      }));
    });

    // Data event handlers
    this.addDOMEventHandler(DOM_EVENTS.GET_CARDS_POINTS, async (e) => {
      await FirebaseService.updateSprintPoints(e.detail);
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.SHOW_SLIDE_NOTIFICATION, { 
        detail: { options: { message: 'Sprint points updated' } } 
      }));
    });

    this.addDOMEventHandler(DOM_EVENTS.RELOAD_ALL_CARDS, (e) => {
      this.handleReloadAllCards(e);
    });
  }

  /**
   * Añadir un handler del DOM
   */
  addDOMEventHandler(eventName, handler) {
    // Crear wrapper que maneja control de eventos si es necesario
    const wrappedHandler = (e) => {
      if (EVENTS_REQUIRING_CONTROL.includes(eventName)) {
        e.stopPropagation();
        e.preventDefault();
      }
      
      handler(e);
    };

    document.addEventListener(eventName, wrappedHandler);
    this.domEventHandlers.set(eventName, wrappedHandler);
  }

  /**
   * Eliminar un handler del DOM
   */
  removeDOMEventHandler(eventName) {
    const handler = this.domEventHandlers.get(eventName);
    if (handler) {
      document.removeEventListener(eventName, handler);
      this.domEventHandlers.delete(eventName);
    }
  }

  // === HANDLERS ESPECÍFICOS ===

  handleProjectChanged(data) {
    if (this.appController) {
      this.appController.clearCache();
    }
  }

  handleCardsRendered(event) {
    const urlParams = new URLSearchParams(window.location.search);
    const cardIdToOpen = urlParams.get('cardId');

    if (cardIdToOpen && this.appController && !this.appController.cardAutoOpened) {
      const card = document.querySelector(`[card-id="${cardIdToOpen}"]`);
      if (card) {
        showExpandedCardInModal(card);
        this.appController.cardAutoOpened = true;
      }
    }
  }

  handleEpicCardDataRequest(e) {
    const { cardId, cardType } = e.detail || {};
    document.dispatchEvent(new CustomEvent(DOM_EVENTS.PROVIDE_EPICCARD_DATA, {
      detail: {
        cardId,
        cardType,
        stakeholders: window.globalStakeholders || []
      }
    }));
  }

  handleTaskCardDataRequest(e) {
    const { cardId, cardType } = e.detail || {};
    let statusList = [];

    if (window.statusLists?.[cardType]) {
      statusList = Object.keys(window.statusLists[cardType]);
    }

    document.dispatchEvent(new CustomEvent(DOM_EVENTS.PROVIDE_TASKCARD_DATA, {
      detail: {
        cardId,
        cardType,
        developerList: window.globalDeveloperList || [],
        stakeholders: window.globalStakeholders || [],
        sprintList: window.globalSprintList || {},
        statusList
      }
    }));
  }

  async handleBugCardDataRequest(e) {
    const { cardId, cardType } = e.detail || {};
    let statusList = [];
    let priorityList = [];

    if (window.statusLists?.['bug-card']) {
      statusList = Object.keys(window.statusLists['bug-card']);
    }

    if (window.globalBugPriorityList) {
      priorityList = window.globalBugPriorityList;
    }

    document.dispatchEvent(new CustomEvent(DOM_EVENTS.PROVIDE_BUGCARD_DATA, {
      detail: {
        cardId,
        cardType,
        statusList,
        priorityList,
        developerList: window.globalDeveloperList || [],
        userAuthorizedEmails: window.userAdminEmails || []
      }
    }));
  }

  handleQACardDataRequest(e) {
    const { cardId, cardType } = e.detail || {};
    document.dispatchEvent(new CustomEvent(DOM_EVENTS.PROVIDE_QACARD_DATA, {
      detail: {
        cardId,
        cardType,
        suitesList: window.globalSuites || [],
        taskIdList: window.globalTaskIds || []
      }
    }));
  }

  handleFirebaseStorageConfigRequest(e) {
    if (this.appController) {
      e.target.dispatchEvent(new CustomEvent(DOM_EVENTS.PROVIDE_FIREBASE_STORAGE_CONFIG, {
        detail: { config: this.appController.getFirebaseConfig() },
        bubbles: true,
        composed: true
      }));
    }
  }

  // === HANDLERS COMPLEJOS (migrados de lib/eventHandlers.js) ===

  async handleSaveCard(event) {
    const { cardData } = event.detail;
    // Añadir createdBy si es una Task y no está presente
    if ((cardData.cardType === 'task-card' || cardData.group === 'tasks' || cardData.section === 'tasks') && !cardData.createdBy) {
      cardData.createdBy = document.body.dataset.userEmail;
    }

    const isNewCard = !cardData.id;

    // IMPORTANTE: Guardar referencia a la tarjeta expandida ANTES de guardar
    // porque después de guardar, los IDs pueden cambiar para nuevas tarjetas
    let expandedCard = null;
    const expandedCards = document.querySelectorAll('[expanded="true"]');
    for (const card of expandedCards) {
      const cardType = card.tagName?.toLowerCase();
      const cardGroup = cardData.group;
      // Verificar que es el mismo tipo de tarjeta
      if ((cardType === 'task-card' && cardGroup === 'tasks') ||
          (cardType === 'bug-card' && cardGroup === 'bugs') ||
          (cardType === 'proposal-card' && cardGroup === 'proposals') ||
          (cardType === 'qa-card' && cardGroup === 'qa')) {
        expandedCard = card;
        break;
      }
    }

    // Asegurar que cardData tenga projectId (de la card, URL, o variable global)
    if (!cardData.projectId) {
      cardData.projectId = globalThis.currentProjectId || new URLSearchParams(globalThis.location.search).get('projectId');
    }
    const projectId = cardData.projectId;

    // Obtener datos anteriores para comparar asignaciones ANTES de guardar
    let previousData = null;
    if (!isNewCard) {
      try {
        // Obtener datos anteriores directamente desde Firebase
        const collectionName = cardData.group === 'tasks' ? 'tasks' : 'bugs';
        const firebaseService = this.appController?.getFirebaseService();
        if (firebaseService) {
          const allCards = await firebaseService.getCards(projectId, collectionName);
          previousData = allCards ? allCards[cardData.id] : null;
        }
      } catch (error) {
        console.warn('[UnifiedEventSystem] Error getting previous data:', error);
      }
    }

    await FirebaseService.saveCard(cardData);

    // IMPORTANTE: Para nuevas tarjetas, actualizar la tarjeta expandida con el nuevo ID
    // Esto evita que al guardar de nuevo se cree otra tarjeta
    if (isNewCard && expandedCard && cardData.id) {
      console.log('[UnifiedEventSystem] Updating expanded card with new Firebase ID:', cardData.id);
      expandedCard.id = cardData.id;
      expandedCard.firebaseId = cardData.id;
      if (cardData.cardId) {
        expandedCard.cardId = cardData.cardId;
      }
      // También actualizar el atributo data-id
      expandedCard.setAttribute('data-id', cardData.id);
    }

    // Emitir evento card-save-success para cerrar modales
    if (expandedCard) {
      expandedCard.dispatchEvent(new CustomEvent('card-save-success', {
        detail: {
          cardId: cardData.id || cardData.cardId,
          isNewCard: isNewCard,
          newFirebaseId: cardData.id
        },
        bubbles: true,
        composed: true
      }));
    }

    if (projectId) {
      // Usar las funciones de actualización eficiente importadas
      updateSpecificGlobalData(cardData, projectId);
      updateTableCache(cardData);
      updateDependentComponents(cardData);
      repaintSpecificElement(cardData);
    }

    // Procesar notificaciones de asignación si no es una nueva tarjeta
    if (!isNewCard && previousData) {
      await this.handleAssignmentNotifications(cardData, previousData, projectId);
    }

    // Si es una nueva tarjeta, refrescar la vista de la sección correspondiente
    if (isNewCard && cardData.group) {
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.REFRESH_CARDS_VIEW, {
        detail: {
          section: cardData.group,
          preserveFilters: true  // IMPORTANTE: Mantener filtros al recargar
        }
      }));
    }
  }

  async handleAssignmentNotifications(cardData, previousData, projectId) {
    try {
      const currentUserEmail = document.body.dataset.userEmail;
      if (!currentUserEmail) return;

      // Verificar cambios en el developer
      if (cardData.developer !== previousData.developer) {
        // Note: Notifications for developer assignment/unassignment are now handled
        // directly in TaskCard.js to avoid duplication and ensure URL links are included
}

      // Verificar cambios en el validator (solo para tasks)
      // Note: Notifications for validator assignment/unassignment are now handled
      // directly in TaskCard.js to avoid duplication and ensure URL links are included
    } catch (error) {
      // Silently ignore notification errors
    }
  }

  async handleDeleteCard(event) {
    const { cardData, confirmed, card } = event.detail || {};
    const resolvedCard = cardData || card;
    if (!resolvedCard) {
return;
    }
    if (!confirmed) {
      const title = resolvedCard?.title || 'Sin título';
      const cardId = resolvedCard?.cardId || resolvedCard?.id || 'sin id';
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.SHOW_MODAL, {
        detail: {
          options: {
            title: 'Confirmar eliminación',
            message: `¿Estás seguro de que quieres eliminar <b>${title}</b>?<br><span style="color:#666">${cardId}</span>`,
            button1Text: 'Eliminar',
            button2Text: 'Cancelar',
            button1css: 'background-color: #dc3545; color: white;',
            button2css: 'background-color: #6c757d; color: white;',
            button1Action: () => {
              document.dispatchEvent(new CustomEvent(DOM_EVENTS.DELETE_CARD, {
                detail: { cardData: resolvedCard, confirmed: true }
              }));
            },
            button2Action: () => {}
          }
        }
      }));
      return;
    }

    // Eliminar la tarjeta del DOM inmediatamente para feedback visual rápido
    if (resolvedCard.id) {
      const cardElements = document.querySelectorAll(`[id="${resolvedCard.id}"]`);
      cardElements.forEach(el => {
        if (el.tagName.toLowerCase().includes('-card')) {
          el.remove();
        }
      });
    }

    await FirebaseService.deleteCard(resolvedCard);

    // Refrescar la vista de la sección correspondiente después de borrar
    if (resolvedCard.group) {
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.REFRESH_CARDS_VIEW, {
        detail: { section: resolvedCard.group }
      }));
    }
  }

  async handleCreateTask(event) {
    const { taskData, originalProposal } = event.detail;
    try {
      // Forzar grupo y sección a 'tasks' para asegurar la ruta correcta
      taskData.group = 'tasks';
      taskData.section = 'tasks';
      // Guardar la nueva tarea
      await FirebaseService.saveCard(taskData);
      // Eliminar la propuesta solo si la tarea se guardó correctamente
      if (originalProposal?.id) {
        const proposalToDelete = {
          ...originalProposal,
          group: 'proposals',
          section: 'proposals'
        };
        await FirebaseService.deleteCard(proposalToDelete);
      }

      // Recargar las vistas para reflejar los cambios
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.RELOAD_ALL_CARDS));
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.SHOW_SLIDE_NOTIFICATION, { 
        detail: { options: { message: 'Propuesta convertida en tarea correctamente.' } } 
      }));
    } catch (error) {
document.dispatchEvent(new CustomEvent(DOM_EVENTS.SHOW_SLIDE_NOTIFICATION, { 
        detail: { options: { message: 'Error al convertir propuesta en tarea', type: 'error' } } 
      }));
    }
  }

  async handleReloadAllCards() {
const projectId = new URLSearchParams(window.location.search).get('projectId');
    if (!projectId) {
return;
    }

    try {
      // Recargar todos los datos globales desde Firebase
      const [sprintsData, epicsData, suitesData] = await Promise.all([
        FirebaseService.getCards(projectId, 'sprints'),
        FirebaseService.getCards(projectId, 'epics'),
        FirebaseService.getSuites(projectId).catch(() => ({}))
      ]);

      // Actualizar datos globales
      if (sprintsData) {
        window.globalSprintList = {};
        Object.values(sprintsData).forEach(sprint => {
          if (sprint.cardId && !sprint.deletedAt) {
            window.globalSprintList[sprint.cardId] = sprint;
          }
        });
      }

      if (epicsData) {
        window.globalEpicList = Object.values(epicsData).map(epic => ({
          id: epic.cardId || epic.id,
          name: epic.title || epic.name
        }));
      }

      if (suitesData) {
        window.globalSuites = suitesData;
      }

      // Forzar actualización de todos los componentes
      document.querySelectorAll('task-card, bug-card, epic-card, sprint-card, proposal-card, qa-card, task-filters, bug-filters').forEach(component => {
        if (component.requestUpdate) {
          component.requestUpdate();
        }
      });

      // Recargar la vista actual
      const currentSection = this.getCurrentSection();
      document.dispatchEvent(new CustomEvent(DOM_EVENTS.REFRESH_CARDS_VIEW, {
        detail: { section: currentSection }
      }));
    } catch (error) {
      // Silently ignore year migration errors
    }
  }

  // === FUNCIONES DE UTILIDAD (migradas de lib/eventHandlers.js) ===

  getCurrentSection() {
    // Intentar obtener del TabController si está disponible
    if (this.appController?.tabController) {
      const currentTab = this.appController.tabController.getCurrentTab();
      if (currentTab) {
        return currentTab;
      }
    }

    // Intentar obtener del AppController
    if (this.appController?.section) {
      return this.appController.section;
    }

    // Intentar obtener del hash de la URL
    const hashSection = window.location.hash.replace('#', '');
    if (hashSection) {
      return hashSection;
    }

    // Intentar obtener del botón activo del tab
    const activeTabButton = document.querySelector('.tablinks.active');
    if (activeTabButton) {
      const section = activeTabButton.getAttribute('data-section');
      if (section) {
        return section;
      }
    }

    // Por defecto, asumir tasks
    return 'tasks';
  }

  // Métodos públicos para acceso externo
  getEventBus() {
    return this.eventBus;
  }

  setAppController(appController) {
    this.appController = appController;
    this.setupAllEventHandlers();
  }

  destroy() {
    // Limpiar EventBus
    this.eventBus.clear();
    
    // Remover todos los DOM event handlers
    for (const eventName of this.domEventHandlers.keys()) {
      this.removeDOMEventHandler(eventName);
    }
  }
}

// Singleton instance
export const unifiedEventSystem = new UnifiedEventSystem();

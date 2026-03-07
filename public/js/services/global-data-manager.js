/**
 * GlobalDataManager - Singleton para gestionar datos globales de la aplicación
 * Carga todos los datos una sola vez y los distribuye a los componentes según sea necesario
 */
export class GlobalDataManager {
  static instance = null;

  constructor() {
    if (GlobalDataManager.instance) {
      return GlobalDataManager.instance;
    }

    this.firebaseService = null;
    this.projectId = null;
    this.isLoaded = false;
    this.loadPromise = null;

    // Datos simples (se pasan como atributos)
    this.simpleData = {
      userEmail: '',
      projectId: '',
      userAdminEmails: []
    };

    // Datos complejos (se solicitan por eventos)
    this.complexData = {
      statusLists: {},
      developerList: {},
      stakeholders: [],
      sprintList: {},
      epicList: [],
      bugPriorityList: [],
      suites: {},
      tasksList: []
    };

    // Cache de listeners para evitar duplicados
    this.eventListeners = new Set();
    // Store handler references for proper removeEventListener cleanup
    this._handlerRefs = new Map();

    GlobalDataManager.instance = this;
  }

  static getInstance() {
    if (!GlobalDataManager.instance) {
      GlobalDataManager.instance = new GlobalDataManager();
    }
    return GlobalDataManager.instance;
  }

  /**
   * Inicializa el manager con las dependencias necesarias
   */
  init(firebaseService, projectId) {
    this.firebaseService = firebaseService;
    this.projectId = projectId;
    this.simpleData.projectId = projectId;
    this.simpleData.userEmail = document.body.dataset.userEmail || '';
  }

  /**
   * Carga todos los datos globales una sola vez
   */
  async loadAll() {
    if (this.isLoaded) {
      return this.complexData;
    }

    // SonarQube may flag the next line as "Expected non-Promise value in a boolean conditional".
    // However, this is the correct way to check if a promise is already in flight.
    // We are checking for the existence of the promise object itself, not its resolved value.
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._performLoad();
    return this.loadPromise;
  }

  async _performLoad() {
    try {
// Cargar datos en paralelo para mejor rendimiento
const [
        statusLists,
        projectLists,
        sprintList,
        epicsData,
        suitesData,
        tasksData
      ] = await Promise.all([
        this.firebaseService.loadAllStatusLists().catch(err => {
return null;
        }),
        this.firebaseService.getProjectLists(this.projectId),
        this.firebaseService.getSprintList(this.projectId),
        this._loadEpics(),
        this._loadSuites(),
        this._loadTasks()
      ]);

      // Debug status lists

      // Procesar y almacenar datos
      this.complexData.statusLists = statusLists || {};
      
      // Fallback para statusLists si está vacío o falló la carga
      if (!statusLists || Object.keys(statusLists).length === 0) {
// Intentar usar variables globales existentes como fallback
        const fallbackStatusLists = {};
        
        if (window.statusTasksList && Object.keys(window.statusTasksList).length > 0) {
          fallbackStatusLists['task-card'] = window.statusTasksList;
}
        
        if (window.statusBugList && Object.keys(window.statusBugList).length > 0) {
          fallbackStatusLists['bug-card'] = window.statusBugList;
}
        
        // Si no hay variables globales, crear una lista básica por defecto
        if (Object.keys(fallbackStatusLists).length === 0) {
fallbackStatusLists['task-card'] = {
            'To Do': 'To Do',
            'In Progress': 'In Progress',
            'To Validate': 'To Validate',
            'Done&Validated': 'Done&Validated',
            'Blocked': 'Blocked'
          };
          fallbackStatusLists['bug-card'] = {
            'Open': 'Open',
            'In Progress': 'In Progress',
            'Fixed': 'Fixed',
            'Closed': 'Closed'
          };
        }
        
        this.complexData.statusLists = fallbackStatusLists;
}
      
      // Usar listas del proyecto actual (derivadas de /projects)
      this.complexData.developerList = projectLists?.developerList || [];
      this.complexData.stakeholders = projectLists?.stakeholders || [];
      
      this.complexData.bugPriorityList = projectLists?.bugpriorityList || [];
      this.complexData.sprintList = sprintList || {};
      this.complexData.epicList = epicsData || [];
      this.complexData.suites = suitesData || {};
      this.complexData.tasksList = tasksData || [];

      // Almacenar datos simples
this.simpleData.userAdminEmails = projectLists?.userAdminEmails || [];
// Configurar variables globales para compatibilidad con código existente
      this._setupGlobalVariables();
      
      // Pre-load email mappings to avoid individual loads
      this._setupEmailMappings();

      // Configurar listeners de eventos
      this._setupEventListeners();

      this.isLoaded = true;
return this.complexData;

    } catch (error) {
throw error;
    }
  }

  async _loadEpics() {
    try {
      const epicsData = await this.firebaseService.getCards(this.projectId, 'epics');
      return Object.values(epicsData || {}).map(epic => ({
        id: epic.cardId || epic.id,
        name: epic.title || epic.name
      }));
    } catch (error) {
return [];
    }
  }

  async _loadSuites() {
    try {
      const { FirebaseService } = await import('./firebase-service.js');
      return await FirebaseService.getSuites(this.projectId);
    } catch (error) {
return {};
    }
  }

  async _loadTasks() {
    try {
      const tasksData = await this.firebaseService.getCards(this.projectId, 'tasks');
      return Object.entries(tasksData || {}).map(([id, task]) => ({
        id: task.cardId || id,
        title: task.title || 'Sin título'
      }));
    } catch (error) {
return [];
    }
  }

  // Funciones eliminadas - no cargar datos globales

  /**
   * Configura variables globales para compatibilidad con código existente
   */
  _setupGlobalVariables() {
    window.statusLists = this.complexData.statusLists;
    
    // NO configurar variables globales para developers ni stakeholders
    // Cada proyecto maneja sus propios developers y stakeholders
    
    window.globalSprintList = this.complexData.sprintList;
    window.globalEpicList = this.complexData.epicList;
    window.globalBugPriorityList = this.complexData.bugPriorityList;
    window.globalSuites = this.complexData.suites;
    window.globalTasksList = this.complexData.tasksList;
    window.userAdminEmails = this.simpleData.userAdminEmails;

    // Variables específicas para listas de estado
    window.statusTasksList = this.complexData.statusLists['task-card'] || {};
    window.statusBugList = this.complexData.statusLists['bug-card'] || {};
  }

  /**
   * Configura los mapeos de email para evitar cargas individuales
   */
  _setupEmailMappings() {
    // NO configurar mappings globales para developers ni stakeholders
    // Cada proyecto maneja sus propios mappings
  }

  /**
   * Configura listeners de eventos para responder a solicitudes de datos
   */
  _setupEventListeners() {
    if (this.eventListeners.has('request-taskcard-data')) return;

    // TaskCard data requests
    this._addEventListenerOnce('request-taskcard-data', (e) => {
      const { cardId, cardType } = e.detail || {};
      
      // Debug logging for TaskCard status list
const statusList = Object.keys(this.complexData.statusLists[cardType] || {});
document.dispatchEvent(new CustomEvent('provide-taskcard-data', {
        detail: {
          cardId,
          cardType,
          developerList: this.complexData.developerList || [],
          stakeholders: this.complexData.stakeholders || [],
          sprintList: this.complexData.sprintList,
          statusList: statusList
        }
      }));
    });

    // BugCard data requests
    this._addEventListenerOnce('request-bugcard-data', (e) => {
      const { cardId, cardType } = e.detail || {};
      
      // Provide robust fallback data for bug cards
      const statusList = Object.keys(this.complexData.statusLists['bug-card'] || {});
      const priorityList = this.complexData.bugPriorityList || [];
      
      // Fallback status list if empty
      const finalStatusList = statusList.length > 0 ? statusList : [
        'Open', 'In Progress', 'Fixed', 'Closed', 'Reopened'
      ];
      
      // Fallback priority list if empty - NO usar fallback hardcodeado, dejar vacío para que solicite desde Firebase
      const finalPriorityList = priorityList.length > 0 ? priorityList : [];
document.dispatchEvent(new CustomEvent('provide-bugcard-data', {
        detail: {
          cardId,
          cardType,
          statusList: finalStatusList,
          priorityList: finalPriorityList,
          developerList: this.complexData.developerList || [],
          userAuthorizedEmails: this.simpleData.userAdminEmails
        }
      }));
    });

    // EpicCard data requests
    this._addEventListenerOnce('request-epiccard-data', (e) => {
      const { cardId, cardType } = e.detail || {};
      document.dispatchEvent(new CustomEvent('provide-epiccard-data', {
        detail: {
          cardId,
          cardType,
          stakeholders: this.complexData.stakeholders || []
        }
      }));
    });

    // QACard data requests
    this._addEventListenerOnce('request-qacard-data', (e) => {
      const { cardId, cardType } = e.detail || {};
      
      document.dispatchEvent(new CustomEvent('provide-qacard-data', {
        detail: {
          cardId,
          cardType,
          suitesList: this.complexData.suites,
          taskIdList: this.complexData.tasksList
        }
      }));
    });

    // Firebase storage config requests (still handled here for now)
    this._addEventListenerOnce('request-firebase-storage-config', async (e) => {
      try {
        const { firebaseConfig } = await import('../../firebase-config.js');
        window.dispatchEvent(new CustomEvent('provide-firebase-storage-config', {
          detail: { config: firebaseConfig },
          bubbles: true,
          composed: true
        }));
      } catch (error) {
        // Silently ignore Firebase config load errors
      }
    });
  }

  _addEventListenerOnce(eventName, handler) {
    if (!this.eventListeners.has(eventName)) {
      document.addEventListener(eventName, handler);
      this.eventListeners.add(eventName);
      this._handlerRefs.set(eventName, handler);
    }
  }

  /**
   * Removes all registered document event listeners
   */
  _removeAllEventListeners() {
    for (const [eventName, handler] of this._handlerRefs) {
      document.removeEventListener(eventName, handler);
    }
    this.eventListeners.clear();
    this._handlerRefs.clear();
  }

  /**
   * Obtiene datos simples para pasar como atributos a componentes
   */
  getSimpleDataForCard(cardType) {
    return {
      projectId: this.simpleData.projectId,
      userEmail: this.simpleData.userEmail,
      userAdminEmails: this.simpleData.userAdminEmails, // ← Siempre incluir para verificación de roles
      // Solo incluir datos simples específicos por tipo de tarjeta
      ...(cardType === 'bug-card' && {
        userAuthorizedEmails: this.simpleData.userAdminEmails
      })
    };
  }

  /**
   * Verifica si los datos están cargados
   */
  isDataLoaded() {
    return this.isLoaded;
  }

  /**
   * Fuerza recarga de datos (por ejemplo, después de cambios de proyecto)
   */
  async reload() {
    this.isLoaded = false;
    this.loadPromise = null;
    return this.loadAll();
  }

  /**
   * Limpia el cache y reinicia el manager
   */
  reset() {
    this._removeAllEventListeners();
    this.isLoaded = false;
    this.loadPromise = null;
    this.complexData = {
      statusLists: {},
      developerList: {},
      stakeholders: [],
      sprintList: {},
      epicList: [],
      bugPriorityList: [],
      suites: {},
      tasksList: []
    };
    this.simpleData = {
      userEmail: '',
      projectId: '',
      userAdminEmails: []
    };
  }
}

// Exportar instancia singleton
export const globalDataManager = GlobalDataManager.getInstance();

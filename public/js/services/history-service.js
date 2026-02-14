import { ref, push, get, query, orderByChild, limitToLast, onValue, database } from '../../firebase-config.js';
/**
 * Servicio para gestionar el histórico de cambios de las tarjetas
 * Guarda solo los cambios diferenciales en una estructura separada
 */
export class HistoryService {
  constructor() {
    this.previousStates = new Map(); // Cache de estados previos para calcular diferencias
    this._initialized = false;
  }

  /**
   * Inicializa el servicio de historial
   */
  init() {
    if (this._initialized) return;
this._initialized = true;
  }

  /**
   * Obtiene el tipo de tarjeta normalizado para el path
   */
  getCardTypeForPath(cardType) {
    const typeMap = {
      'task-card': 'tasks',
      'bug-card': 'bugs',
      'sprint-card': 'sprints',
      'proposal-card': 'proposals',
      'epic-card': 'epics',
      'qa-card': 'qa'
    };
    return typeMap[cardType] || cardType;
  }

  /**
   * Calcula las diferencias entre dos estados de una tarjeta
   * @param {Object} oldState - Estado anterior
   * @param {Object} newState - Estado nuevo
   * @returns {Object} - Solo los campos que cambiaron con valores from/to
   */
  calculateDifferences(oldState, newState) {
    const changes = {};
    const ignoredFields = [
      // Historical data fields
      'history', 'developerHistory', 'blockedHistory', 'updatedAt', 'lastModified',
      // UI state fields
      'isEditable', 'expanded', 'canEditPermission', 'hasUnsavedChanges', 'activeTab',
      // Color and styling fields
      'descriptionColor', 'acceptanceCriteriaColor', 'notesColor',
      // Internal validation and caching
      'invalidFields', '_cachedElements', '_debouncedTitleChange', '_debouncedDescriptionChange',
      // Component state
      'originalStatus', 'userAuthorizedEmails'
    ];
    
    // Comparar cada campo del nuevo estado
    Object.keys(newState).forEach(key => {
      if (ignoredFields.includes(key)) return;
      
      const oldValue = oldState ? oldState[key] : undefined;
      const newValue = newState[key];
      
      // Solo registrar si hay cambio real
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          from: oldValue === undefined ? null : oldValue,
          to: newValue === undefined ? null : newValue
        };
      }
    });
    
    // Verificar campos eliminados
    if (oldState) {
      Object.keys(oldState).forEach(key => {
        if (ignoredFields.includes(key)) return;
        if (!(key in newState)) {
          changes[key] = {
            from: oldState[key],
            to: null
          };
        }
      });
    }
    
    return changes;
  }

  /**
   * Guarda un cambio en el histórico
   * @param {Object} card - La tarjeta actualizada
   * @param {Object} previousCard - El estado anterior de la tarjeta (opcional)
   * @param {String} userEmail - Email del usuario que realiza el cambio
   * @returns {Promise<void>}
   */
  async saveHistory(card, previousCard, userEmail) {
    try {
      if (!card.projectId || !card.cardId) {
return;
      }

      // Obtener el estado anterior si no se proporciona
      let oldState = previousCard;
      if (!oldState && card.id) {
        oldState = this.previousStates.get(card.cardId);
      }

      // Si es una tarjeta completamente nueva (sin estado anterior), no guardar histórico
      if (!oldState) {
// Actualizar cache para futuras comparaciones
        this.previousStates.set(card.cardId, JSON.parse(JSON.stringify(card)));
        return;
      }

      // Calcular diferencias
      const changes = this.calculateDifferences(oldState, card);
      
      // Si no hay cambios, no guardar
      if (Object.keys(changes).length === 0) {
return;
      }

      // Construir path del histórico
      const cardType = this.getCardTypeForPath(card.cardType || card.group);
      const historyPath = `/history/${card.projectId}/${cardType}/${card.cardId}`;
      
      // Crear entrada de histórico
      const historyEntry = {
        changedBy: userEmail || card.updatedBy || card.createdBy || 'system',
        timestamp: new Date().toISOString(),
        changes: changes,
        action: oldState ? 'update' : 'create'
      };

      // Guardar en Firebase
      push(ref(database, historyPath), historyEntry);

      // Actualizar cache de estado
      this.previousStates.set(card.cardId, JSON.parse(JSON.stringify(card)));
    } catch (error) {
      // Silently ignore history tracking errors
    }
  }

  /**
   * Obtiene el histórico de una tarjeta
   * @param {String} projectId - ID del proyecto
   * @param {String} cardType - Tipo de tarjeta
   * @param {String} cardId - ID de la tarjeta
   * @param {Number} limit - Límite de entradas a obtener
   * @returns {Promise<Array>} - Array de entradas de histórico
   */
  async getHistory(projectId, cardType, cardId, limit = 50) {
    try {
      const normalizedType = this.getCardTypeForPath(cardType);
      const historyPath = `/history/${projectId}/${normalizedType}/${cardId}`;
      
      const historyRef = ref(database, historyPath);
      const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(limit));
      
      const snapshot = await get(historyQuery);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const history = [];
      snapshot.forEach(child => {
        history.push({
          id: child.key,
          ...child.val()
        });
      });
      
      // Ordenar por timestamp descendente (más reciente primero)
      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
    } catch (error) {
return [];
    }
  }

  /**
   * Suscribe a cambios en el histórico de una tarjeta
   * @param {String} projectId - ID del proyecto
   * @param {String} cardType - Tipo de tarjeta
   * @param {String} cardId - ID de la tarjeta
   * @param {Function} callback - Función a ejecutar cuando hay cambios
   * @returns {Function} - Función para cancelar la suscripción
   */
  subscribeToHistory(projectId, cardType, cardId, callback) {
    const normalizedType = this.getCardTypeForPath(cardType);
    const historyPath = `/history/${projectId}/${normalizedType}/${cardId}`;
    
    const historyRef = ref(database, historyPath);
    const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(50));
    
    const unsubscribe = onValue(historyQuery, (snapshot) => {
      const history = [];
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          history.push({
            id: child.key,
            ...child.val()
          });
        });
      }
      
      // Ordenar y enviar al callback
      const sortedHistory = history.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      callback(sortedHistory);
    });
    
    return unsubscribe;
  }

  /**
   * Migra el histórico embebido existente a la nueva estructura
   * @param {Object} card - Tarjeta con histórico embebido
   * @returns {Promise<void>}
   */
  async migrateEmbeddedHistory(card) {
    try {
      if (!card.history || !Array.isArray(card.history) || card.history.length === 0) {
        return;
      }

      const cardType = this.getCardTypeForPath(card.cardType || card.group);
      const historyPath = `/history/${card.projectId}/${cardType}/${card.cardId}`;
// Migrar cada entrada del histórico embebido
      for (const entry of card.history) {
        const historyRef = push(ref(database, historyPath));
        await historyRef.set({
          changedBy: entry.updatedBy || entry.user || 'migrated',
          timestamp: entry.timestamp || entry.date || new Date().toISOString(),
          changes: entry.changes || { migrated: { from: 'embedded', to: 'separated' } },
          action: 'migrated'
        });
      }
    } catch (error) {
      // Silently ignore migration errors
    }
  }

  /**
   * Obtiene estadísticas del histórico
   * @param {String} projectId - ID del proyecto
   * @param {String} cardType - Tipo de tarjeta (opcional)
   * @returns {Promise<Object>} - Estadísticas del histórico
   */
  async getHistoryStats(projectId, cardType) {
    try {
      const basePath = cardType 
        ? `/history/${projectId}/${this.getCardTypeForPath(cardType)}`
        : `/history/${projectId}`;
      
      const historyRef = ref(database, basePath);
      const snapshot = await get(historyRef);
      
      if (!snapshot.exists()) {
        return { totalEntries: 0, cards: 0 };
      }
      
      let totalEntries = 0;
      let users = new Set();
      let lastUpdate = null;
      
      const processSnapshot = (snap) => {
        snap.forEach(child => {
          if (child.hasChildren()) {
            processSnapshot(child);
          } else {
            const val = child.val();
            if (val && val.timestamp) {
              totalEntries++;
              if (val.changedBy) users.add(val.changedBy);
              if (!lastUpdate || val.timestamp > lastUpdate) {
                lastUpdate = val.timestamp;
              }
            }
          }
        });
      };
      
      processSnapshot(snapshot);
      
      return {
        totalEntries,
        uniqueUsers: users.size,
        lastUpdate,
        estimatedSize: JSON.stringify(snapshot.val()).length
      };
      
    } catch (error) {
return { totalEntries: 0, cards: 0 };
    }
  }
}

// Exportar instancia singleton
export const historyService = new HistoryService();

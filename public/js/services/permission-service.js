/**
 * Servicio centralizado para gestión de permisos
 * Elimina la duplicación de lógica de permisos en múltiples componentes
 * 
 * Ahora soporta comunicación via eventos para desacoplar componentes
 */
export class PermissionService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.viewMode = 'consultation';
    this.permissionCache = new Map();
    this.listeners = new Set();
    this.setupEventListeners();
  }

  /**
   * Inicializa el servicio con la información del usuario
   */
  init(user, userRole, viewMode = 'consultation') {
    this.currentUser = user;
    this.userRole = userRole;
    this.viewMode = viewMode;
    this.clearCache();
    this.notifyListeners();
  }

  /**
   * Actualiza el modo de vista
   */
  setViewMode(mode) {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
      this.clearCache();
      this.notifyListeners();
    }
  }

  /**
   * Actualiza el rol del usuario
   */
  setUserRole(role) {
    this.userRole = role;
    this.clearCache();
    this.notifyListeners();
  }

  /**
   * Calcula permisos para una tarjeta específica
   * @param {Object} cardData - Datos de la tarjeta
   * @param {string} cardType - Tipo de tarjeta (bug, task, etc.)
   * @returns {Object} Objeto con permisos
   */
  getCardPermissions(cardData, cardType) {
    const cacheKey = this.generateCacheKey(cardData, cardType);
    
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey);
    }

    const permissions = this.calculatePermissions(cardData, cardType);
    this.permissionCache.set(cacheKey, permissions);
    
    return permissions;
  }

  /**
   * Calcula permisos basado en el tipo de tarjeta y contexto
   */
  calculatePermissions(cardData, cardType) {
    const isNewCard = this.isNewCard(cardData);
    const isOwner = this.isOwner(cardData);
    const isAdmin = this.isAdmin();

    switch (cardType) {
      case 'bug':
        return this.getBugPermissions(cardData, { isNewCard, isOwner, isAdmin });
      
      case 'task':
        return this.getTaskPermissions(cardData, { isNewCard, isOwner, isAdmin });
      
      case 'proposal':
        return this.getProposalPermissions(cardData, { isNewCard, isOwner, isAdmin });
      
      case 'epic':
        return this.getEpicPermissions(cardData, { isNewCard, isOwner, isAdmin });
      
      default:
        return this.getDefaultPermissions(cardData, { isNewCard, isOwner, isAdmin });
    }
  }

  /**
   * Permisos específicos para bugs
   */
  getBugPermissions(cardData, { isNewCard, isOwner, isAdmin }) {
    const basePermissions = {
      canView: true,
      canEdit: false,
      canSave: false,
      canDelete: false,
      canCreate: true // Todos pueden crear bugs
    };

    if (isNewCard) {
      return {
        ...basePermissions,
        canEdit: true,
        canSave: true
      };
    }

    // En modo gestión, Admin puede hacer todo
    if (isAdmin && this.viewMode === 'management') {
      return {
        ...basePermissions,
        canEdit: true,
        canSave: true,
        canDelete: true
      };
    }

    // En modo consulta (o usuario normal): puede editar cualquier bug, pero solo borrar los suyos
    return {
      ...basePermissions,
      canEdit: true,
      canSave: true,
      canDelete: isOwner
    };
  }

  /**
   * Permisos específicos para tareas
   */
  getTaskPermissions(cardData, { isNewCard, isOwner, isAdmin }) {
    const basePermissions = {
      canView: true,
      canEdit: false,
      canSave: false,
      canDelete: false,
      canCreate: false
    };

    // En modo gestión, Admin puede hacer todo
    if (isAdmin && this.viewMode === 'management') {
      return {
        ...basePermissions,
        canEdit: true,
        canSave: true,
        canDelete: true,
        canCreate: true
      };
    }

    // En modo consulta, solo puede ver (incluso Admin)
    return basePermissions;
  }

  /**
   * Permisos específicos para propuestas
   */
  getProposalPermissions(cardData, { isNewCard, isOwner, isAdmin }) {
    const basePermissions = {
      canView: true,
      canEdit: false,
      canSave: false,
      canDelete: false,
      canCreate: true // Todos pueden crear propuestas
    };

    if (isNewCard) {
      return {
        ...basePermissions,
        canEdit: true,
        canSave: true
      };
    }

    // En modo gestión, Admin puede hacer todo
    if (isAdmin && this.viewMode === 'management') {
      return {
        ...basePermissions,
        canEdit: true,
        canSave: true,
        canDelete: true
      };
    }

    // En modo consulta: usuarios pueden editar sus propias propuestas (incluso Admin)
    return {
      ...basePermissions,
      canEdit: isOwner,
      canSave: isOwner,
      canDelete: isOwner
    };
  }

  /**
   * Permisos específicos para épicas
   */
  getEpicPermissions(cardData, { isNewCard, isOwner, isAdmin }) {
    const basePermissions = {
      canView: true,
      canEdit: false,
      canSave: false,
      canDelete: false,
      canCreate: false
    };

    // En modo gestión, Admin puede hacer todo
    if (isAdmin && this.viewMode === 'management') {
      return {
        ...basePermissions,
        canEdit: true,
        canSave: true,
        canDelete: true,
        canCreate: true
      };
    }

    // En modo consulta, solo puede ver (incluso Admin)
    return basePermissions;
  }

  /**
   * Permisos por defecto
   */
  getDefaultPermissions(cardData, { isNewCard, isOwner, isAdmin }) {
    return {
      canView: true,
      canEdit: isAdmin && this.viewMode === 'management',
      canSave: isAdmin && this.viewMode === 'management',
      canDelete: isAdmin && this.viewMode === 'management',
      canCreate: isAdmin && this.viewMode === 'management'
    };
  }

  /**
   * Determina si una tarjeta es nueva
   */
  isNewCard(cardData) {
    return !cardData.cardId || 
           cardData.cardId.startsWith('temp_') || 
           cardData.cardId === '';
  }

  /**
   * Determina si el usuario actual es propietario de la tarjeta
   */
  isOwner(cardData) {
    if (!this.currentUser || !cardData.createdBy) return false;
    
    const currentUserEmail = this.currentUser.email;
    const createdBy = cardData.createdBy;
    
    // Comparación directa por email
    if (createdBy === currentUserEmail) {
      return true;
    }
    
    // Si createdBy es un display name, intentar convertirlo de vuelta a email usando relEmailUser
    if (!createdBy.includes('@')) {
      // Es un display name, buscar el email correspondiente en relEmailUser
      const relEmailUser = window.relEmailUser || {};
      
      // Buscar qué email tiene este display name
      for (const [email, displayName] of Object.entries(relEmailUser)) {
        if (displayName === createdBy) {
          return email === currentUserEmail;
        }
      }
      
      // Si no se encontró en relEmailUser, hacer comparación flexible por nombre/email
      const emailUsername = currentUserEmail.split('@')[0].toLowerCase();
      const createdByLower = createdBy.toLowerCase();
      
      // Comparación por username del email
      if (createdByLower.includes(emailUsername) || emailUsername.includes(createdByLower)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determina si el usuario actual es administrador
   */
  isAdmin() {
    return this.userRole?.isResponsable;
  }

  /**
   * Genera clave para cache de permisos
   */
  generateCacheKey(cardData, cardType) {
    const userId = this.currentUser?.email || 'anonymous';
    const cardId = cardData.cardId || 'new';
    const createdBy = cardData.createdBy || 'none';
    
    return `${userId}:${cardType}:${cardId}:${createdBy}:${this.viewMode}:${this.userRole?.isResponsable}`;
  }

  /**
   * Limpia la cache de permisos
   */
  clearCache() {
    this.permissionCache.clear();
  }

  /**
   * Registra un listener para cambios de permisos
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remueve un listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notifica a todos los listeners sobre cambios
   */
  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener({
          user: this.currentUser,
          userRole: this.userRole,
          viewMode: this.viewMode
        });
      } catch (error) {
        console.error('Error notifying permission listener:', error);
      }
    }
  }

  /**
   * Configura los event listeners para comunicación via eventos
   */
  setupEventListeners() {
    document.addEventListener('request-permissions', this.handlePermissionRequest.bind(this));
}

  /**
   * Maneja solicitudes de permisos via eventos
   * @param {CustomEvent} event - Evento de solicitud de permisos
   */
  async handlePermissionRequest(event) {
    const { requestId, type, cardId, cardType, userEmail, createdBy } = event.detail;
try {
      let permissions;

      switch (type) {
        case 'task-permissions':
          permissions = this.checkTaskPermissions(cardId, userEmail, createdBy);
          break;

        case 'bug-permissions':
          permissions = this.checkBugPermissions(cardId, userEmail, createdBy);
          break;

        case 'epic-permissions':
          permissions = this.checkEpicPermissions(cardId, userEmail, createdBy);
          break;

        case 'qa-permissions':
          permissions = this.checkQAPermissions(cardId, userEmail, createdBy);
          break;

        case 'ownership-permissions':
          permissions = this.checkOwnershipPermissions(cardId, cardType, userEmail, createdBy);
          break;

        case 'card-permissions':
          permissions = this.checkCardPermissions(cardId, cardType, userEmail);
          break;

        default:
          throw new Error(`Unknown permission type: ${type}`);
      }

      // Responder con los permisos
      document.dispatchEvent(new CustomEvent('provide-permissions-result', {
        detail: {
          requestId,
          type,
          success: true,
          result: permissions
        },
        bubbles: true,
        composed: true
      }));
} catch (error) {
// Responder con error
      document.dispatchEvent(new CustomEvent('provide-permissions-result', {
        detail: {
          requestId,
          type,
          success: false,
          error: error.message
        },
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * Verifica permisos de QA (método que faltaba en la implementación original)
   * @param {string} cardId - ID de la tarjeta
   * @param {string} userEmail - Email del usuario
   * @param {string} createdBy - Creador de la tarjeta
   * @returns {Object} - Permisos de QA
   */
  checkQAPermissions(cardId, userEmail, createdBy) {
    // Lógica similar a otras funciones de permisos
    const isOwner = createdBy === userEmail;
    const isAdmin = this.isAdmin();
    const canEditMode = this.viewMode !== 'consultation';

    return {
      canView: true,
      canEdit: isAdmin || (canEditMode && isOwner),
      canDelete: isAdmin || (canEditMode && isOwner),
      canAssign: isAdmin || canEditMode
    };
  }

  /**
   * Verifica permisos generales de tarjeta
   * @param {string} cardId - ID de la tarjeta
   * @param {string} cardType - Tipo de tarjeta
   * @param {string} userEmail - Email del usuario
   * @returns {Object} - Permisos generales
   */
  checkCardPermissions(cardId, cardType, userEmail) {
    // Lógica general para cualquier tipo de tarjeta
    const isAdmin = this.isAdmin();
    const canEditMode = this.viewMode !== 'consultation';

    return {
      canView: true,
      canEdit: isAdmin || canEditMode,
      canDelete: isAdmin,
      canAssign: isAdmin || canEditMode
    };
  }

  /**
   * Verifica permisos de tareas
   * @param {string} cardId - ID de la tarjeta
   * @param {string} userEmail - Email del usuario
   * @param {string} createdBy - Creador de la tarjeta
   * @returns {Object} - Permisos de tareas
   */
  checkTaskPermissions(cardId, userEmail, createdBy) {
    // Usar la lógica ya existente para tareas
    const cardData = { cardId, createdBy };
    return this.getTaskPermissions(cardData, {
      isNewCard: this.isNewCard(cardData),
      isOwner: this.isOwner(cardData),
      isAdmin: this.isAdmin()
    });
  }

  /**
   * Verifica permisos de bugs
   * @param {string} cardId - ID de la tarjeta
   * @param {string} userEmail - Email del usuario
   * @param {string} createdBy - Creador de la tarjeta
   * @returns {Object} - Permisos de bugs
   */
  checkBugPermissions(cardId, userEmail, createdBy) {
    // Usar la lógica ya existente para bugs
    const cardData = { cardId, createdBy };
    return this.getBugPermissions(cardData, {
      isNewCard: this.isNewCard(cardData),
      isOwner: this.isOwner(cardData),
      isAdmin: this.isAdmin()
    });
  }

  /**
   * Verifica permisos de épicas
   * @param {string} cardId - ID de la tarjeta
   * @param {string} userEmail - Email del usuario
   * @param {string} createdBy - Creador de la tarjeta
   * @returns {Object} - Permisos de épicas
   */
  checkEpicPermissions(cardId, userEmail, createdBy) {
    // Usar la lógica ya existente para épicas
    const cardData = { cardId, createdBy };
    return this.getEpicPermissions(cardData, {
      isNewCard: this.isNewCard(cardData),
      isOwner: this.isOwner(cardData),
      isAdmin: this.isAdmin()
    });
  }

  /**
   * Verifica permisos de propiedad
   * @param {string} cardId - ID de la tarjeta
   * @param {string} cardType - Tipo de tarjeta
   * @param {string} userEmail - Email del usuario
   * @param {string} createdBy - Creador de la tarjeta
   * @returns {Object} - Permisos de propiedad
   */
  checkOwnershipPermissions(cardId, cardType, userEmail, createdBy) {
    // Usar la lógica ya existente
    const cardData = { cardId, createdBy };
    return this.getCardPermissions(cardData, cardType);
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      cacheSize: this.permissionCache.size,
      listenersCount: this.listeners.size,
      currentUser: this.currentUser?.email || 'none',
      viewMode: this.viewMode,
      isAdmin: this.isAdmin()
    };
  }
}

// Instancia global del servicio
export const permissionService = new PermissionService();
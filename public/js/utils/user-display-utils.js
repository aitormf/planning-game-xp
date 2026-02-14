/**
 * Utilidades centralizadas para conversión y display de usuarios
 * Mantiene coherencia entre email (datos) y nombre (display)
 */
import { decodeEmailFromFirebase } from './email-sanitizer.js';
import { userDirectoryService } from '../services/user-directory-service.js';

export class UserDisplayUtils {
  
  /**
   * Convierte email a nombre de usuario para display
   * @param {string} email - Email del usuario
   * @returns {string} Nombre del usuario o email si no se encuentra
  */
  static emailToDisplayName(email) {
    if (!email) return '';

    // Lanzar carga en background si aún no está listo el directorio
    if (userDirectoryService && typeof userDirectoryService.load === 'function' && !userDirectoryService._loaded) {
      userDirectoryService.load().catch(() => {});
    }

    // 1) Servicio centralizado con resolución agresiva
    if (userDirectoryService && typeof userDirectoryService.resolveDisplayName === 'function') {
      const name = userDirectoryService.resolveDisplayName(email);
      if (name) return name;
    }

    // 2) Mapping global derivado de usersDirectory
    if (window.globalRelEmailUser) {
      const direct = window.globalRelEmailUser[email];
      if (direct) return direct;
      const decoded = this._safeDecode(email);
      if (decoded && window.globalRelEmailUser[decoded]) {
        return window.globalRelEmailUser[decoded];
      }
    }
    
    // 3) Fallback: mostrar email sin dominio
    return email.split('@')[0];
  }
  
  /**
   * Convierte nombre de display a email para operaciones internas
   * @param {string} displayName - Nombre mostrado
   * @returns {string} Email del usuario o displayName si no se encuentra
   */
  static displayNameToEmail(displayName) {
    if (!displayName) return '';
    
    // Usar mapping inverso si existe
    if (window.globalUserEmailRel && window.globalUserEmailRel[displayName]) {
      return window.globalUserEmailRel[displayName];
    }
    
    // Si ya es un email, devolverlo tal cual
    if (displayName.includes('@')) {
      return displayName;
    }

    // Resolver contra usersDirectory por nombre exacto
    if (userDirectoryService && typeof userDirectoryService._allKeysForIdentifier === 'function') {
      const candidates = userDirectoryService._allKeysForIdentifier(displayName);
      for (const key of candidates) {
        const entry = userDirectoryService._byEmail?.[key] || userDirectoryService._byAlias?.[key];
        if (entry) {
          return entry.email || displayName;
        }
      }
    }
    
    // Si no encontramos mapping, asumir que es el displayName
    return displayName;
  }
  
  /**
   * Normaliza createdBy para comparaciones de ownership
   * Maneja tanto emails como nombres de display
   * @param {string} createdBy - Valor de createdBy (puede ser email o nombre)
   * @param {string} currentUserEmail - Email del usuario actual
   * @returns {boolean} True si son la misma persona
   */
  static isOwner(createdBy, currentUserEmail) {
    if (!createdBy || !currentUserEmail) return false;
    
    // Comparación directa de emails
    if (createdBy === currentUserEmail) return true;
    
    // Convertir currentUserEmail a nombre y comparar
    const currentUserName = this.emailToDisplayName(currentUserEmail);
    if (createdBy === currentUserName) return true;
    
    // Convertir createdBy (si es nombre) a email y comparar
    const createdByEmail = this.displayNameToEmail(createdBy);
    if (createdByEmail === currentUserEmail) return true;
    
    return false;
  }
  
  /**
   * Obtiene el email sanitizado para Firebase
   * @param {string} email - Email original
   * @returns {string} Email sanitizado para usar como key en Firebase
   */
  static sanitizeEmailForFirebase(email) {
    if (!email) return '';
    return email.replace(/\./g, '_').replace(/@/g, '_at_');
  }
  
  /**
   * Restaura email desde formato sanitizado de Firebase
   * @param {string} sanitizedEmail - Email sanitizado
   * @returns {string} Email original
   */
  static unsanitizeEmailFromFirebase(sanitizedEmail) {
    if (!sanitizedEmail) return '';
    return sanitizedEmail.replace(/_at_/g, '@').replace(/_/g, '.');
  }
  
  /**
   * Configura un card con información de usuario coherente
   * @param {Object} card - Objeto de la card
   * @param {string} userEmail - Email del usuario actual
   */
  static setCardUserInfo(card, userEmail) {
    if (!userEmail) return;
    
    // Siempre guardar email para lógica interna
    card.userEmail = userEmail;
    card.createdBy = userEmail; // Guardar email internamente
    
    // Para display, siempre mostrar nombre
    card._displayCreatedBy = this.emailToDisplayName(userEmail);
  }
  
  /**
   * Obtiene el nombre de display para una card
   * @param {Object} card - Objeto de la card
   * @returns {string} Nombre para mostrar
   */
  static getCardDisplayCreatedBy(card) {
    // Si ya tiene display name calculado, usarlo
    if (card._displayCreatedBy) return card._displayCreatedBy;
    
    // Si createdBy es email, convertir a nombre
    if (card.createdBy) {
      return this.emailToDisplayName(card.createdBy);
    }
    
    return '';
  }

  static _safeDecode(value) {
    try {
      return decodeEmailFromFirebase(value);
    } catch (e) {
      return value;
    }
  }
  
  /**
   * Actualiza todos los displays de createdBy en las cards existentes
   */
  static updateAllCardDisplays() {
    // Actualizar cards en DOM
    const allCards = document.querySelectorAll('task-card, bug-card, epic-card, qa-card, proposal-card, sprint-card');
    
    allCards.forEach(card => {
      if (card.createdBy && !card._displayCreatedBy) {
        card._displayCreatedBy = this.emailToDisplayName(card.createdBy);
        card.requestUpdate?.();
      }
    });
}
  
}

// Auto-run cuando se inicializa
document.addEventListener('DOMContentLoaded', () => {
  // Actualizar displays existentes después de que se carguen los mappings
  setTimeout(() => {
    UserDisplayUtils.updateAllCardDisplays();
  }, 1000);
});

window.UserDisplayUtils = UserDisplayUtils;

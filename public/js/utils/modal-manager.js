/**
 * Gestor global de modales
 */
class ModalManager {
  constructor() {
    this.modals = new Map(); // Map<modalId, modalElement>
  }

  /**
   * Registrar un modal
   */
  register(modalId, modalElement) {
    this.modals.set(modalId, modalElement);
}

  /**
   * Desregistrar un modal
   */
  unregister(modalId) {
    this.modals.delete(modalId);
}

  /**
   * Cerrar un modal específico por ID
   */
  closeModal(modalId) {
    document.dispatchEvent(new CustomEvent('close-modal', {
      detail: { modalId, target: 'specific' },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Cerrar todos los modales
   */
  closeAllModals() {
    document.dispatchEvent(new CustomEvent('close-modal', {
      detail: { target: 'all' },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Obtener el último modal registrado (el más reciente)
   */
  getLastModal() {
    const modalIds = Array.from(this.modals.keys());
    if (modalIds.length === 0) return null;
    
    const lastModalId = modalIds[modalIds.length - 1];
    return {
      id: lastModalId,
      element: this.modals.get(lastModalId)
    };
  }

  /**
   * Cerrar el último modal (el más reciente)
   */
  closeLastModal() {
    const lastModal = this.getLastModal();
    if (lastModal) {
      this.closeModal(lastModal.id);
      return lastModal.id;
    }
    return null;
  }

  /**
   * Obtener todos los modales registrados
   */
  getAllModals() {
    return Array.from(this.modals.entries()).map(([id, element]) => ({ id, element }));
  }
}

// Instancia global del gestor de modales
export const modalManager = new ModalManager();

window.modalManager = modalManager;
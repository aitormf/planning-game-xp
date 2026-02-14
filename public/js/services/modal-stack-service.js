/**
 * Servicio para gestión de pila LIFO de modales
 * Evita cerrar modales cuando se va a abrir otro modal encima
 */
export class ModalStackService {
  constructor() {
    this.modalStack = [];
    this.zIndexCounter = 10000;
  }

  /**
   * Agrega un modal a la pila
   * @param {HTMLElement} modal - Modal a agregar
   * @param {Object} options - Opciones del modal
   */
  pushModal(modal, options = {}) {
    const modalInfo = {
      element: modal,
      id: modal.modalId || modal.id || `modal-${Date.now()}`,
      zIndex: this.zIndexCounter++,
      ...options
    };
    
    this.modalStack.push(modalInfo);
    
    // Configurar z-index
    modal.style.zIndex = modalInfo.zIndex;
return modalInfo;
  }

  /**
   * Remueve el modal superior de la pila
   * @returns {Object|null} Información del modal removido
   */
  popModal() {
    if (this.modalStack.length === 0) return null;
    
    const modalInfo = this.modalStack.pop();
return modalInfo;
  }

  /**
   * Obtiene el modal superior sin removerlo
   * @returns {Object|null} Información del modal superior
   */
  peekTopModal() {
    return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
  }

  /**
   * Verifica si un modal específico está en el tope de la pila
   * @param {string} modalId - ID del modal
   * @returns {boolean} True si está en el tope
   */
  isTopModal(modalId) {
    const topModal = this.peekTopModal();
    return topModal && topModal.id === modalId;
  }

  /**
   * Remueve un modal específico de la pila
   * @param {string} modalId - ID del modal a remover
   * @returns {Object|null} Información del modal removido
   */
  removeModal(modalId) {
    const index = this.modalStack.findIndex(modal => modal.id === modalId);
    if (index === -1) return null;
    
    const modalInfo = this.modalStack.splice(index, 1)[0];
return modalInfo;
  }

  /**
   * Crea un modal de confirmación centrado y lo añade a la pila
   * @param {Object} options - Opciones del modal
   * @returns {Promise<boolean>} Promesa que resuelve con la respuesta del usuario
   */
  createConfirmationModal(options = {}) {
    const {
      title = 'Confirmación',
      message = '¿Estás seguro?',
      confirmText = 'Sí',
      cancelText = 'No',
      confirmColor = '#f44336',
      cancelColor = '#fcaf00'
    } = options;

    return new Promise((resolve) => {
      // Crear modal usando app-modal del proyecto
      const modal = document.createElement('app-modal');
      modal._programmaticMode = true;
      const modalId = `confirmation-modal-${Date.now()}`;

      modal.modalId = modalId;
      modal.title = title;
      modal.maxWidth = '450px';
      modal.showHeader = true;
      modal.showFooter = true;
      modal.interceptClose = true; // Forzar decisión via botones

      // Contenido del modal
      modal.innerHTML = `
        <div style="padding: 1.5rem; text-align: center;">
          <p style="margin: 0; color: #666; line-height: 1.4; font-size: 1.1rem;">
            ${message}
          </p>
        </div>
      `;

      // Configurar botones
      modal.button1Text = cancelText;
      modal.button1Css = `background-color: ${cancelColor}; color: white; padding: 0.75rem 1.5rem; margin-right: 0.5rem;`;
      modal.button1Action = () => {
        this._closeConfirmationModal(modal, modalId);
        resolve(false); // Usuario canceló
      };

      modal.button2Text = confirmText;
      modal.button2Css = `background-color: ${confirmColor}; color: white; padding: 0.75rem 1.5rem;`;
      modal.button2Action = () => {
        this._closeConfirmationModal(modal, modalId);
        resolve(true); // Usuario confirmó
      };

      // Añadir a la pila antes de mostrar
      this.pushModal(modal, { type: 'confirmation' });

      // Añadir al DOM y mostrar
      document.body.appendChild(modal);
      modal.show();
    });
  }

  /**
   * Cierra un modal de confirmación y lo remueve de la pila
   * @private
   */
  _closeConfirmationModal(modal, modalId) {
    // Remover de la pila
    this.removeModal(modalId);
    
    // Cerrar y remover del DOM
    modal.close();
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
}

  /**
   * Obtiene estadísticas de la pila
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      stackLength: this.modalStack.length,
      topModal: this.peekTopModal()?.id || null,
      nextZIndex: this.zIndexCounter,
      allModals: this.modalStack.map(m => ({ id: m.id, zIndex: m.zIndex }))
    };
  }

  /**
   * Limpia toda la pila
   */
  clearStack() {
    this.modalStack = [];
    this.zIndexCounter = 10000;
}
}

// Instancia global del servicio
export const modalStackService = new ModalStackService();

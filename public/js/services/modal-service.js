/**
 * Servicio centralizado para gestión de modales
 * Elimina la duplicación de lógica de modales en múltiples lugares
 */
export class ModalService {
  constructor() {
    this.activeModals = new Set();
    this.modalStack = [];
    this.zIndexCounter = 1000;
  }

  /**
   * Crea y muestra un modal con contenido específico
   * @param {Object} options - Opciones del modal
   * @returns {HTMLElement} Elemento modal creado
   */
  async createModal(options = {}) {
    const {
      title = 'Modal',
      content = '',
      maxWidth = '80vw',
      maxHeight = '80vh',
      closeOnBackdrop = true,
      closeOnEscape = true,
      className = '',
      onClose = null
    } = options;

    // Crear elemento modal
    const modal = document.createElement('app-modal');
    modal._programmaticMode = true;
    modal.title = title;
    modal.maxWidth = maxWidth;
    modal.maxHeight = maxHeight;
    modal.className = className;
    
    // Configurar z-index para stacking
    modal.style.zIndex = this.zIndexCounter++;

    // Si content es un string, crear elemento
    if (typeof content === 'string') {
      modal.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modal.appendChild(content);
    }

    // Configurar event listeners
    if (closeOnEscape) {
      this.setupEscapeKeyHandler(modal);
    }

    if (closeOnBackdrop) {
      this.setupBackdropClickHandler(modal);
    }

    // Handler de cierre
    const closeHandler = (event) => {
      this.closeModal(modal);
      if (onClose) {
        onClose(event);
      }
    };

    modal.addEventListener('close', closeHandler);

    // Agregar al DOM y stack
    document.body.appendChild(modal);
    this.activeModals.add(modal);
    this.modalStack.push(modal);

    // Esperar a que el componente esté listo
    await modal.updateComplete;

    return modal;
  }

  /**
   * Crea un modal para edición de tarjetas
   * @param {HTMLElement} cardElement - Elemento de tarjeta
   * @param {Object} options - Opciones adicionales
   */
  async createCardModal(cardElement, options = {}) {
    const defaultOptions = {
      title: this.getCardModalTitle(cardElement),
      maxWidth: '80vw',
      maxHeight: '80vh',
      content: cardElement,
      className: 'card-modal',
      onClose: () => {
        // Limpiar estado de la tarjeta si es necesario
        if (cardElement.cleanup) {
          cardElement.cleanup();
        }
      }
    };

    return this.createModal({ ...defaultOptions, ...options });
  }

  /**
   * Crea un modal de confirmación
   * @param {Object} options - Opciones del modal de confirmación
   * @returns {Promise<boolean>} Promesa que resuelve con la respuesta del usuario
   */
  async createConfirmationModal(options = {}) {
    const {
      title = 'Confirm Action',
      message = 'Are you sure?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmButtonClass = 'confirm-button',
      cancelButtonClass = 'cancel-button'
    } = options;

    return new Promise(async (resolve) => {
      let modal = null;

      const content = this.createConfirmationContent({
        message,
        confirmText,
        cancelText,
        confirmButtonClass,
        cancelButtonClass,
        onConfirm: () => {
          resolve(true);
          if (modal) this.closeModal(modal);
        },
        onCancel: () => {
          resolve(false);
          if (modal) this.closeModal(modal);
        }
      });

      modal = await this.createModal({
        title,
        content,
        maxWidth: '400px',
        closeOnBackdrop: false,
        closeOnEscape: true
      });
    });
  }

  /**
   * Crea un modal de formulario genérico
   * @param {Object} formConfig - Configuración del formulario
   * @returns {Promise<Object>} Datos del formulario o null si se cancela
   */
  async createFormModal(formConfig = {}) {
    const {
      title = 'Form',
      fields = [],
      submitText = 'Submit',
      cancelText = 'Cancel'
    } = formConfig;

    return new Promise(async (resolve) => {
      let modal = null;

      const content = this.createFormContent({
        fields,
        submitText,
        cancelText,
        onSubmit: (formData) => {
          resolve(formData);
          if (modal) this.closeModal(modal);
        },
        onCancel: () => {
          resolve(null);
          if (modal) this.closeModal(modal);
        }
      });

      modal = await this.createModal({
        title,
        content,
        maxWidth: '500px'
      });
    });
  }

  /**
   * Cierra un modal específico
   * @param {HTMLElement} modal - Modal a cerrar
   */
  closeModal(modal) {
    if (this.activeModals.has(modal)) {
      // Remover del stack
      const index = this.modalStack.indexOf(modal);
      if (index > -1) {
        this.modalStack.splice(index, 1);
      }

      // Remover del set de activos
      this.activeModals.delete(modal);

      // Remover del DOM
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }

      // Manejar focus si hay otros modales
      if (this.modalStack.length > 0) {
        const topModal = this.modalStack[this.modalStack.length - 1];
        topModal.focus();
      }
    }
  }

  /**
   * Cierra el modal más reciente
   */
  closeTopModal() {
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack[this.modalStack.length - 1];
      this.closeModal(topModal);
    }
  }

  /**
   * Cierra todos los modales
   */
  closeAllModals() {
    const modals = [...this.activeModals];
    modals.forEach(modal => this.closeModal(modal));
  }

  /**
   * Obtiene el título apropiado para un modal de tarjeta
   */
  getCardModalTitle(cardElement) {
    const cardType = cardElement.tagName.toLowerCase();
    const isNew = !cardElement.cardId || cardElement.cardId.startsWith('temp_');
    
    const titles = {
      'task-card': isNew ? '' : 'Editar Tarea',
      'bug-card': isNew ? '' : 'Editar Bug',
      'epic-card': isNew ? '' : 'Editar Épica',
      'proposal-card': isNew ? '' : 'Editar Propuesta',
      'qa-card': isNew ? '' : 'Editar Test QA',
      'sprint-card': isNew ? '' : 'Editar Sprint'
    };

    return titles[cardType] || (isNew ? '' : 'Editar Tarjeta');
  }

  /**
   * Crea contenido para modal de confirmación
   */
  createConfirmationContent(options) {
    const {
      message,
      confirmText,
      cancelText,
      confirmButtonClass,
      cancelButtonClass,
      onConfirm,
      onCancel
    } = options;

    const container = document.createElement('div');
    container.className = 'confirmation-modal-content';

    // Build buttons HTML - only include cancel button if cancelText is provided
    const cancelButtonHtml = cancelText
      ? `<button class="${cancelButtonClass}" type="button">${cancelText}</button>`
      : '';

    container.innerHTML = `
      <div class="confirmation-message">${message}</div>
      <div class="confirmation-buttons">
        ${cancelButtonHtml}
        <button class="${confirmButtonClass}" type="button">${confirmText}</button>
      </div>
    `;

    // Event listeners
    const cancelBtn = container.querySelector(`.${cancelButtonClass}`);
    if (cancelBtn) {
      cancelBtn.addEventListener('click', onCancel);
    }
    container.querySelector(`.${confirmButtonClass}`).addEventListener('click', onConfirm);

    return container;
  }

  /**
   * Crea contenido para modal de formulario
   */
  createFormContent(options) {
    const {
      fields,
      submitText,
      cancelText,
      onSubmit,
      onCancel
    } = options;

    const container = document.createElement('div');
    container.className = 'form-modal-content';

    const form = document.createElement('form');
    form.className = 'modal-form';

    // Crear campos
    fields.forEach(field => {
      const fieldContainer = this.createFormField(field);
      form.appendChild(fieldContainer);
    });

    // Botones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'form-buttons';
    buttonsContainer.innerHTML = `
      <button type="button" class="cancel-button">${cancelText}</button>
      <button type="submit" class="submit-button">${submitText}</button>
    `;

    form.appendChild(buttonsContainer);

    // Event listeners
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      onSubmit(data);
    });

    buttonsContainer.querySelector('.cancel-button').addEventListener('click', onCancel);

    container.appendChild(form);
    return container;
  }

  /**
   * Crea un campo de formulario
   */
  createFormField(field) {
    const {
      name,
      label,
      type = 'text',
      required = false,
      options = [],
      placeholder = '',
      value = ''
    } = field;

    const container = document.createElement('div');
    container.className = 'form-field';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.setAttribute('for', name);
    container.appendChild(labelElement);

    let inputElement;

    switch (type) {
      case 'select':
        inputElement = document.createElement('select');
        options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value || option;
          optionElement.textContent = option.label || option;
          inputElement.appendChild(optionElement);
        });
        break;

      case 'textarea':
        inputElement = document.createElement('textarea');
        inputElement.placeholder = placeholder;
        inputElement.value = value;
        break;

      default:
        inputElement = document.createElement('input');
        inputElement.type = type;
        inputElement.placeholder = placeholder;
        inputElement.value = value;
    }

    inputElement.name = name;
    inputElement.id = name;
    inputElement.required = required;

    container.appendChild(inputElement);
    return container;
  }

  /**
   * Configura el handler para cerrar con Escape
   */
  setupEscapeKeyHandler(modal) {
    const handler = (event) => {
      if (event.key === 'Escape' && this.modalStack[this.modalStack.length - 1] === modal) {
        this.closeModal(modal);
      }
    };

    document.addEventListener('keydown', handler);
    
    // Limpiar el listener cuando se cierre el modal
    modal.addEventListener('close', () => {
      document.removeEventListener('keydown', handler);
    });
  }

  /**
   * Configura el handler para cerrar haciendo click en el backdrop
   */
  setupBackdropClickHandler(modal) {
    const handler = (event) => {
      if (event.target === modal) {
        this.closeModal(modal);
      }
    };

    modal.addEventListener('click', handler);
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      activeModals: this.activeModals.size,
      modalStack: this.modalStack.length,
      nextZIndex: this.zIndexCounter
    };
  }

  /**
   * Limpia todos los recursos
   */
  cleanup() {
    this.closeAllModals();
    this.zIndexCounter = 1000;
  }
}

// Instancia global del servicio
export const modalService = new ModalService();

/**
 * Configura el cierre automático del modal cuando la card se guarda exitosamente.
 * Uso: setupAutoCloseOnSave(modal, card, modalId)
 * @param {HTMLElement} modal - El elemento modal (app-modal)
 * @param {HTMLElement} card - El elemento card que emite 'card-save-success'
 * @param {string} [modalId] - ID del modal (opcional, usa modal.modalId si no se proporciona)
 */
export function setupAutoCloseOnSave(modal, card, modalId = null) {
  const id = modalId || modal.modalId;

  const closeModal = () => {
    // Cleanup listeners
    card.removeEventListener('card-save-success', handleCardSaveSuccess);
    document.removeEventListener('card-save-success', handleDocumentSaveSuccess);

    document.dispatchEvent(new CustomEvent('close-modal', {
      detail: { modalId: id }
    }));
  };

  // Listener para eventos en la card misma
  const handleCardSaveSuccess = () => {
    closeModal();
  };

  // Listener para eventos en document (verificar que es nuestra card por sourceElement)
  const handleDocumentSaveSuccess = (event) => {
    // Verificar que el evento viene de nuestra card usando sourceElement
    const sourceElement = event.detail?.sourceElement;
    if (sourceElement && sourceElement === card) {
      closeModal();
    }
  };

  // Escuchar tanto en la card como en document (algunos cards emiten en uno u otro)
  card.addEventListener('card-save-success', handleCardSaveSuccess);
  document.addEventListener('card-save-success', handleDocumentSaveSuccess);
}
import { FirebaseService } from '../services/firebase-service.js';
import { generateSecureTestId } from '../utils/common-functions.js';
import { modalStackService } from '../services/modal-stack-service.js';
import { setupAutoCloseOnSave } from '../services/modal-service.js';

export class CardFactory {
  static async createCard(section, config) {
    const cardType = config.projectCardElement[section];
    const modal = document.createElement('app-modal');
    modal._programmaticMode = true;
    modal.maxWidth = '80vw';
    modal.maxHeight = '80vh';
    modal.interceptClose = true; // Interceptar cierre para verificar cambios

    const creators = {
      'task-card': () => this.createTaskCard(modal, config),
      'bug-card': () => section === 'tickets' ? this.createTicketCard(modal, config) : this.createBugCard(modal, config),
      'qa-card': () => this.createQACard(modal, config),
      'proposal-card': () => this.createProposalCard(modal, config),
      'sprint-card': () => this.createSprintCard(modal, config),
      'epic-card': () => this.createEpicCard(modal, config)
    };

    const creator = creators[cardType];
    if (creator) {
      await creator();
    } else {
      throw new Error(`Unsupported card type: ${cardType}`);
    }

    return modal;
  }

  static async createTaskCard(modal, config) {
    modal.title = '';
    const newCard = this.createBaseCard('task-card', config);

    await this.setupModal(modal, newCard);

    newCard.status = config.statusTasksList[0];
    newCard.statusList = config.statusTasksList;
    // No asignar listas globales vacías - el TaskCard cargará sus propios datos del proyecto
    // No asignar listas globales vacías - el card cargará sus propios stakeholders del proyecto
  }

  static async createBugCard(modal, config) {
    modal.title = '';
    const newCard = this.createBaseCard('bug-card', config);

    await this.setupModal(modal, newCard);

    newCard.status = config.statusBugList[0];
    newCard.statusList = config.statusBugList;
    // No asignar listas globales vacías - el card cargará sus propios stakeholders del proyecto
    newCard.priorityList = config.bugpriorityList;

    if (config.projectId === 'Cinema4D') {
      newCard.bugType = 'c4d';
      newCard.cardId = await FirebaseService.generateProjectSectionId(config.projectId, 'BUG');
    }
  }

  static async createTicketCard(modal, config) {
    modal.title = '';
    const newCard = this.createBaseCard('bug-card', config);

    await this.setupModal(modal, newCard);

    // Configurar el card para funcionar como ticket
    newCard.section = 'tickets'; // Importante: marcar como tickets para permisos especiales
    newCard.group = 'bugs'; // Pero se guarda en la sección bugs
    newCard.status = config.statusBugList[0];
    newCard.statusList = config.statusBugList;
    // No asignar listas globales vacías - el card cargará sus propios stakeholders del proyecto
    newCard.priorityList = config.bugpriorityList;

    if (config.projectId === 'Cinema4D') {
      newCard.bugType = 'c4d';
      newCard.cardId = await FirebaseService.generateProjectSectionId(config.projectId, 'BUG');
    }
  }

  static async createQACard(modal, config) {
    modal.title = '';
    const newCard = this.createBaseCard('qa-card', config);

    await this.setupModal(modal, newCard);

    newCard.status = 'Pendiente';
  }

  static async createProposalCard(modal, config) {
    modal.title = '';
    const newCard = this.createBaseCard('proposal-card', config);

    await this.setupModal(modal, newCard);
  }

  static async createSprintCard(modal, config) {
    modal.title = '';
    const newCard = this.createBaseCard('sprint-card', config);

    await this.setupModal(modal, newCard);
  }

  static async createEpicCard(modal, config) {
    modal.title = '';
    const newCard = this.createBaseCard('epic-card', config);

    await this.setupModal(modal, newCard);

    // No asignar listas globales - el EpicCard cargará sus propios stakeholders del proyecto
  }

  static createBaseCard(cardType, config) {
    const newCard = document.createElement(cardType);
    newCard.expanded = true;
    newCard.group = config.section;
    newCard.section = config.section;
    newCard.projectId = config.projectId;
    
    // Generate temporary cardId for new cards to avoid validation errors
    newCard.cardId = generateSecureTestId('temp');
    
    // Use centralized utility for consistent user info
    if (window.UserDisplayUtils) {
      window.UserDisplayUtils.setCardUserInfo(newCard, config.userEmail);
    } else {
      // Fallback if utils not loaded yet
      newCard.createdBy = config.userEmail;
      newCard.userEmail = config.userEmail;
    }
    newCard.userAuthorizedEmails = config.userAdminEmails || [];
    // No asignar listas globales vacías - el TaskCard cargará sus propios datos del proyecto

    return newCard;
  }

  static async setupModal(modal, card) {
    modal.appendChild(card);
    document.body.appendChild(modal);

    // Handler para interceptar cierre y verificar cambios sin guardar
    const handleCloseRequested = async (event) => {
      // Detener propagación inmediatamente para evitar que otros listeners cierren el modal
      event.stopImmediatePropagation();

      if (card && typeof card.hasChanges === 'function') {
        const hasUnsavedChanges = card.hasChanges();
        if (hasUnsavedChanges) {
          try {
            const cardType = card.cardType?.replace('-card', '') || 'elemento';
            const confirmed = await modalStackService.createConfirmationModal({
              title: 'Cambios sin guardar',
              message: `Tienes cambios sin guardar en este ${cardType}.<br><br>¿Quieres cerrar de todos modos?`,
              confirmText: 'Sí, cerrar sin guardar',
              cancelText: 'No, volver a editar',
              confirmColor: '#f44336',
              cancelColor: '#fcaf00'
            });
            if (!confirmed) {
              return; // Usuario canceló, no cerrar
            }
          } catch (error) {
            // En caso de error, permitir cerrar
          }
        }
      }
      // Cerrar el modal
      document.dispatchEvent(new CustomEvent('close-modal', {
        detail: { modalId: modal.modalId }
      }));
    };
    modal.addEventListener('modal-closed-requested', handleCloseRequested);

    // Cerrar modal automáticamente al guardar
    setupAutoCloseOnSave(modal, card);

    await modal.updateComplete;
    modal.setContent(card);
    card.requestUpdate();
    if (typeof card.initializeChecksum === 'function') {
      try {
        await card.initializeChecksum();
      } catch (error) {
        console.warn('⚠️ Failed to initialize checksum for card', { error, cardId: card.cardId, tagName: card.tagName });
      }
    }
  }
}

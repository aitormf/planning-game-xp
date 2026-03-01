import { UIUtils } from '../utils/ui-utils.js';
import { showExpandedCardInModal } from '../utils/common-functions.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';
const KANBAN_BG_COLORS = APP_CONSTANTS.KANBAN_COLORS;

export class KanbanRenderer {
  constructor() {
    this.draggedElement = null;
    this.dropZoneHandler = null;
  }

  renderKanbanColumns(container, statusList, kanbanType = 'status') {
    container.innerHTML = '';

    // Style the container for horizontal scroll and max height
    // Note: height is controlled by CSS in adminproject.astro
    Object.assign(container.style, {
      display: 'flex',
      flexDirection: 'row',
      gap: '1rem',
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: '0.5rem',
      alignItems: 'stretch'
    });

    statusList.forEach(status => {
      const column = UIUtils.createElement('div', {
        className: 'kanban-column',
        'data-status': status,
        style: {
          width: '250px',
          minWidth: '250px',
          maxWidth: '250px',
          flexShrink: '0',
          display: 'flex',
          flexDirection: 'column'
        }
      });

      const header = UIUtils.createElement('h4', {}, status);

      // Aplicar gradiente dinámico del header basado en app-constants o common-constants
      const colorKey = status.toUpperCase();
      let headerGradient;

      // Usar KANBAN_BG_COLORS que tiene todos los colores definidos
      headerGradient = KANBAN_BG_COLORS[colorKey] || KANBAN_BG_COLORS['DEFAULT'];

      // Si no se encuentra en KANBAN_BG_COLORS, usar fallbacks específicos por tipo
      if (!headerGradient || headerGradient === KANBAN_BG_COLORS['DEFAULT']) {
        if (kanbanType === 'priority') {
          // Para bugs por prioridad, usar gradientes específicos
          switch (colorKey) {
            case 'HIGH':
            case 'CRITICAL':
              headerGradient = 'linear-gradient(135deg, #f43f5e, #e11d48)';
              break;
            case 'MEDIUM':
            case 'NORMAL':
              headerGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
              break;
            case 'LOW':
              headerGradient = 'linear-gradient(135deg, #10b981, #059669)';
              break;
            default:
              headerGradient = 'linear-gradient(135deg, #64748b, #475569)';
          }
        } else {
          // Para status que no están definidos, usar el gradiente por defecto
          headerGradient = 'linear-gradient(135deg, #64748b, #475569)';
        }
      }

      // Aplicar todos los estilos solicitados
      Object.assign(header.style, {
        background: headerGradient,
        margin: '0',
        padding: '0.5rem',
        color: 'white',
        borderRadius: '6px',
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: '600',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginBottom: '0.5rem',
        minHeight: '2rem',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1.2'
      });

      const cardsContainer = UIUtils.createElement('div', {
        className: 'kanban-cards',
        'data-status': status,
        style: {
          flex: '1',
          minHeight: '100px',
          padding: '0.5rem',
          backgroundColor: 'rgba(0,0,0,0.02)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          overflowY: 'auto',
          overflowX: 'hidden'
        }
      });

      column.appendChild(header);
      column.appendChild(cardsContainer);
      container.appendChild(column);
    });
  }

  renderCardsInColumns(cards, config, kanbanType = 'status') {
    // Clear all columns first
    document.querySelectorAll('.kanban-cards').forEach(container => {
      container.innerHTML = '';
    });

    cards.forEach(cardData => {
      // Determinar qué campo usar para la agrupación según el tipo de kanban
      const groupingField = kanbanType === 'priority' ? cardData.priority : cardData.status;
      const column = document.querySelector(`[data-status="${groupingField}"] .kanban-cards`);
      if (column) {
        const card = this.createKanbanCard(cardData, config);
        column.appendChild(card);
      }
    });
  }

  createKanbanCard(cardData, config) {
    const card = document.createElement(cardData.cardType);

    // Configure card properties - assign individually to trigger Lit setters
    Object.keys(cardData).forEach(key => {
      card[key] = cardData[key];
    });

    // Ensure firebaseId is set (id from Firebase)
    card.firebaseId = cardData.id;

    // Set id attribute explicitly for drag/drop
    card.setAttribute('id', cardData.id);

    card.projectId = config.projectId;
    card.userEmail = config.userEmail;
    card.draggable = true;

    // Use ultra-compact view for kanban
    card.viewMode = 'ultra-compact';

    // Add event listeners
    this.addCardEventListeners(card);

    return card;
  }

  addCardEventListeners(card) {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      // epic-card has its own expandCard() method that creates modals
      // with proper close handling and unsaved changes detection
      const tagName = card.tagName.toLowerCase();
      if (tagName === 'epic-card') {
        return; // Let the component handle its own expansion
      }
      showExpandedCardInModal(card);
    });

    card.addEventListener('dragstart', (e) => {
      this.draggedElement = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', card.outerHTML);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      this.draggedElement = null;
    });
  }

  setupDragAndDrop(onCardDrop) {
    this.dropZoneHandler = onCardDrop;

    document.querySelectorAll('.kanban-cards').forEach(dropZone => {
      dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
      dropZone.addEventListener('drop', this.handleDrop.bind(this));
      dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this));
      dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
    e.currentTarget.style.border = '2px dashed #6366f1';
  }

  handleDragLeave(e) {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('drag-over');
      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)';
      e.currentTarget.style.border = 'none';
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    dropZone.style.backgroundColor = 'rgba(0,0,0,0.02)';
    dropZone.style.border = 'none';

    if (this.draggedElement && this.dropZoneHandler) {
      const newStatus = dropZone.dataset.status;
      const cardId = this.draggedElement.id;

      // Check if dropping in the same column - skip if no change
      const currentColumn = this.draggedElement.closest('.kanban-cards');
      if (currentColumn && currentColumn.dataset.status === newStatus) {
        return; // No change needed
      }

      // Don't manually move the element - let Firebase re-render handle it
      // This prevents duplication when Firebase updates

      // Notify about the change
      this.dropZoneHandler(cardId, newStatus);
    }
  }

  cleanup() {
    this.draggedElement = null;
    this.dropZoneHandler = null;
  }
}
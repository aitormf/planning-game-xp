import { KanbanRenderer } from '../renderers/kanban-renderer.js';
import { getUnifiedFilterService } from '../services/unified-filter-service.js';

export class KanbanViewManager {
  constructor(cardService, firebaseService) {
    this.cardService = cardService;
    this.firebaseService = firebaseService;
    this.kanbanRenderer = new KanbanRenderer();
    this.unsubscribe = null;
    this.unifiedFilterService = getUnifiedFilterService();
    this.currentProjectId = null;
    this.currentConfig = null;
    this.currentKanbanType = 'status';
    this.cardsCache = [];

    // Listen for unified filter changes to re-render
    window.addEventListener('unified-filters-changed', (event) => {
      const { projectId, cardType } = event.detail;
      if (this._isCurrentProjectAndSection(projectId, cardType)) {
        this._renderFilteredCards();
      }
    });
  }

  /**
   * Get the selected year from localStorage
   * @returns {number} The selected year or current year as default
   */
  _getSelectedYear() {
    const savedYear = localStorage.getItem('selectedYear');
    return savedYear ? Number(savedYear) : new Date().getFullYear();
  }

  /**
   * Filter cards by year
   * @param {Array} cards - Array of cards
   * @returns {Array} Filtered cards
   */
  _filterCardsByYear(cards) {
    if (!cards || cards.length === 0) return cards;

    const selectedYear = this._getSelectedYear();
    const filtered = cards.filter(card => {
      // Si no tiene year, mostrar (compatibilidad temporal)
      if (!card.year) return true;
      // Comparar como números para evitar problemas de tipos (string vs number)
      return Number(card.year) === selectedYear;
    });
return filtered;
  }

  renderKanbanView(projectId, statusList, config, kanbanType = 'status') {
    const kanbanColumns = config.section === 'bugs'
      ? document.getElementById(kanbanType === 'priority' ? 'bugsPriorityKanbanColumns' : 'bugsStatusKanbanColumns')
      : document.getElementById('kanbanColumns');

    if (kanbanColumns) {
      this.kanbanRenderer.renderKanbanColumns(kanbanColumns, statusList, kanbanType);
      this.subscribeToCards(projectId, config, kanbanType);
    }
  }

  subscribeToCards(projectId, config, kanbanType = 'status') {
    // Store current state for re-rendering on filter changes
    this.currentProjectId = projectId;
    this.currentConfig = config;
    this.currentKanbanType = kanbanType;

    // Usar vistas optimizadas para reducir transferencia de datos
    const pathCards = config.section === 'bugs'
      ? `/views/bug-list/${projectId}`
      : `/views/task-list/${projectId}`;

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.firebaseService.subscribeToPath(pathCards, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let cards = Object.entries(data).map(([id, card]) => ({
          id,
          ...card,
          cardType: config.section === 'bugs' ? 'bug-card' : 'task-card',
          group: config.section,
          section: config.section
        }));

        // Filtrar por año seleccionado
        cards = this._filterCardsByYear(cards);

        // Cache cards for re-rendering on filter changes
        this.cardsCache = cards;

        // Apply unified filters and render
        this._renderFilteredCards();
      }
    });
  }

  /**
   * Get card type from current section
   * @returns {string|null}
   */
  _getCardTypeFromSection() {
    if (!this.currentConfig) return null;
    return this.currentConfig.section === 'bugs' ? 'bug' : 'task';
  }

  /**
   * Check if filter change event is for current project and section
   * @param {string} projectId
   * @param {string} cardType
   * @returns {boolean}
   */
  _isCurrentProjectAndSection(projectId, cardType) {
    if (!this.currentProjectId || !this.currentConfig) {
      return false;
    }
    if (this.currentProjectId !== projectId) {
      return false;
    }
    return this._getCardTypeFromSection() === cardType;
  }

  /**
   * Render cards with unified filters applied
   */
  _renderFilteredCards() {
    if (!this.currentConfig || this.cardsCache.length === 0) {
      return;
    }

    const cardType = this._getCardTypeFromSection();
    let filteredCards = this.cardsCache;

    // Apply unified filters if available
    if (cardType && this.currentProjectId) {
      // Convert array to object for filtering, then back to array
      const cardsObj = {};
      this.cardsCache.forEach(card => {
        cardsObj[card.id] = card;
      });

      const filteredObj = this.unifiedFilterService.applyFilters(
        cardsObj,
        this.currentProjectId,
        cardType
      );

      filteredCards = Object.values(filteredObj);
    }

    this.kanbanRenderer.renderCardsInColumns(filteredCards, this.currentConfig, this.currentKanbanType);
    this.kanbanRenderer.setupDragAndDrop((cardId, newStatus) => {
      this.handleCardDrop(cardId, newStatus, this.currentProjectId, this.currentConfig.section, this.currentKanbanType);
    });

    // Update results count in unified-filters component
    this._updateUnifiedFiltersCount(filteredCards);
  }

  /**
   * Update the unified-filters component with results count
   * @param {Array} filteredCards
   */
  _updateUnifiedFiltersCount(filteredCards) {
    const unifiedFilters = document.querySelector('unified-filters');
    if (unifiedFilters?.setResultsCount) {
      unifiedFilters.setResultsCount(filteredCards.length, this.cardsCache.length);
    }
  }

  async handleCardDrop(cardId, newValue, projectId, section = 'tasks', kanbanType = 'status') {
    const cardType = section === 'bugs' ? 'BUGS' : 'TASKS';

    let result;
    if (kanbanType === 'priority') {
      result = await this.cardService.moveCardToPriority(projectId, cardType, cardId, newValue);
    } else {
      result = await this.cardService.moveCardToStatus(projectId, cardType, cardId, newValue);
    }

    if (result.success) {
      const cardTypeDisplay = section === 'bugs' ? 'Bug' : 'Task';
      const fieldName = kanbanType === 'priority' ? 'priority' : 'status';
      this._showNotification(`${cardTypeDisplay} moved to ${fieldName}: ${newValue}`, 'success');
    } else {
      const cardTypeDisplay = section === 'bugs' ? 'bug' : 'task';
      const fieldName = kanbanType === 'priority' ? 'priority' : 'status';
      this._showNotification(`Error moving ${cardTypeDisplay} to ${fieldName}`, 'error');
    }
  }

  _showNotification(message, type = 'info') {
    const notification = document.createElement('slide-notification');
    notification.message = message;
    notification.type = type;
    document.body.appendChild(notification);
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.kanbanRenderer) {
      this.kanbanRenderer.cleanup();
    }
  }
}
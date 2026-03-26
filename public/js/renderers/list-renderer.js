import { UIUtils } from '../utils/ui-utils.js';

export class ListRenderer {
  constructor() {
    this.sortOrder = { field: null, direction: 'asc' };
  }

  renderListView(container, cards, config) {
    container.innerHTML = '';

    if (!cards || Object.keys(cards).length === 0) {
      const emptyMessage = UIUtils.createElement('p', {
        style: { textAlign: 'center', padding: '2rem', color: '#64748b' }
      }, 'No cards found');
      container.appendChild(emptyMessage);
      return;
    }

    // Render cards
    const cardsContainer = UIUtils.createElement('div', {
      className: 'cards-list-container',
      style: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'flex-start',
        alignContent: 'flex-start',
        width: '100%'
      }
    });

    // Cards arrive pre-filtered by UnifiedFilterService, only apply sorting
    const sortedCards = this.applySorting(cards);

    Object.entries(sortedCards).forEach(([id, cardData]) => {
      if (cardData.deletedAt) return;

      const cardElement = this.createListCard(cardData, id, config);
      cardsContainer.appendChild(cardElement);
    });

    container.appendChild(cardsContainer);
  }

  createListCard(cardData, id, config) {
    const card = document.createElement(cardData.cardType || config.projectCardElement[config.section]);

    // Configure card properties
    Object.assign(card, cardData);
    card.firebaseId = id;  // Asignar Firebase ID explícitamente
    card.projectId = config.projectId;
    card.userEmail = config.userEmail;
    card.group = config.section;
    card.section = config.section;

    return card;
  }

  applySorting(cards) {
    const entries = Object.entries(cards);

    if (!this.sortOrder.field) {
      // Pre-compute sprint numbers once O(n) to avoid regex in O(n log n) comparisons
      const sprintNumbers = new Map();
      for (const [, card] of entries) {
        const sprint = card.sprint || '';
        if (sprint && !sprintNumbers.has(sprint)) {
          const match = sprint.match(/sprint\s*(\d+)/i);
          sprintNumbers.set(sprint, match ? parseInt(match[1]) : 0);
        }
      }
      entries.sort(([, cardA], [, cardB]) => this._sortBySprintPrecomputed(cardA, cardB, sprintNumbers));
    } else {
      entries.sort(([, cardA], [, cardB]) => {
        let valueA = cardA[this.sortOrder.field];
        let valueB = cardB[this.sortOrder.field];

        if (this.sortOrder.field === 'priority') {
          valueA = this.calculatePriority(cardA);
          valueB = this.calculatePriority(cardB);
        }

        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();

        let comparison = 0;
        if (valueA < valueB) comparison = -1;
        if (valueA > valueB) comparison = 1;

        return this.sortOrder.direction === 'desc' ? -comparison : comparison;
      });
    }

    return Object.fromEntries(entries);
  }

  _sortBySprintPrecomputed(cardA, cardB, sprintNumbers) {
    const sprintA = cardA.sprint || '';
    const sprintB = cardB.sprint || '';

    if (!sprintA && !sprintB) return 0;
    if (!sprintA) return 1;
    if (!sprintB) return -1;

    const numberA = sprintNumbers.get(sprintA) || 0;
    const numberB = sprintNumbers.get(sprintB) || 0;

    if (numberA && numberB) return numberB - numberA;
    if (numberA && !numberB) return -1;
    if (!numberA && numberB) return 1;

    return sprintB.localeCompare(sprintA);
  }

  cleanup() {
    this.sortOrder = { field: null, direction: 'asc' };
  }
}
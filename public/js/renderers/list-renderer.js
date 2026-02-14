import { UIUtils } from '../utils/ui-utils.js';

export class ListRenderer {
  constructor() {
    this.sortOrder = { field: null, direction: 'asc' };
    this.filters = {};
  }

  renderListView(container, cards, config) {
    container.innerHTML = '';

    if (!cards || Object.keys(cards).length === 0) {
      const emptyMessage = UIUtils.createElement('p', {
        style: { textAlign: 'center', padding: '2rem', color: '#666' }
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

    // Apply filters and sorting
    const filteredCards = this.applyFilters(cards);
    const sortedCards = this.applySorting(filteredCards);

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

  /**
   * Filter with "no-X" option logic (for validator, sprint, epic)
   * @param {string} noOptionKey - The "no-X" key (e.g., 'no-sprint')
   * @param {Array} filterValues - Selected filter values
   * @param {boolean} cardHasNoValue - Whether the card lacks the value
   * @param {*} cardValue - The card's value for this field
   * @returns {boolean} Whether the card passes the filter
   */
  _matchesWithNoOption(noOptionKey, filterValues, cardHasNoValue, cardValue) {
    const hasNoOption = filterValues.includes(noOptionKey);
    const otherValues = filterValues.filter(v => v !== noOptionKey);

    if (hasNoOption && otherValues.length === 0) {
      return cardHasNoValue;
    }
    if (hasNoOption && otherValues.length > 0) {
      return cardHasNoValue || otherValues.includes(cardValue);
    }
    return filterValues.includes(cardValue);
  }

  /**
   * Check if a card matches the completedInSprint filter
   */
  _matchesCompletedInSprintFilter(card, filterValues) {
    const completedStatuses = ['Fixed', 'Verified', 'Closed', 'Cerrado'];
    if (!completedStatuses.includes(card.status) || !card.endDate) {
      return false;
    }

    const bugEnd = new Date(card.endDate);
    return filterValues.some(selectedSprint => {
      const sprint = Object.values(globalThis.globalSprintList || {}).find(s =>
        s.title === selectedSprint || s.name === selectedSprint || s.cardId === selectedSprint
      );
      if (!sprint) return false;
      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      return bugEnd >= startDate && bugEnd <= endDate;
    });
  }

  /**
   * Check if a card matches the priority filter
   */
  _matchesPriorityFilterForCard(card, filterValues) {
    if (card.cardType === 'bug' || card.group === 'bugs') {
      return filterValues.includes(card.priority);
    }
    const priority = this.calculatePriority(card);
    return filterValues.some(v => this.matchesPriorityFilter(priority, v));
  }

  /**
   * Check if a card passes a specific filter
   */
  _cardPassesFilter(card, field, filterValues) {
    switch (field) {
      case 'status':
      case 'developer':
      case 'createdBy':
        return filterValues.includes(card[field]);

      case 'validator':
        return this._matchesWithNoOption('no-validator', filterValues, !card.validator, card.validator);

      case 'sprint': {
        const isValidSprintId = card.sprint && globalThis.globalSprintList?.[card.sprint];
        return this._matchesWithNoOption('no-sprint', filterValues, !isValidSprintId, card.sprint);
      }

      case 'epic':
        return this._matchesWithNoOption('no-epic', filterValues, !card.epic, card.epic);

      case 'priority':
        return this._matchesPriorityFilterForCard(card, filterValues);

      case 'completedInSprint':
        return this._matchesCompletedInSprintFilter(card, filterValues);

      default: {
        const cardValue = card[field];
        return cardValue === undefined || filterValues.includes(cardValue);
      }
    }
  }

  applyFilters(cards) {
    if (Object.keys(this.filters).length === 0) {
      return cards;
    }

    const filtered = {};

    Object.entries(cards).forEach(([id, card]) => {
      const passesAllFilters = Object.entries(this.filters).every(([field, value]) => {
        if (value === null || (Array.isArray(value) && value.length === 0)) {
          return true; // Skip empty filters
        }
        const filterValues = Array.isArray(value) ? value : [value];
        return this._cardPassesFilter(card, field, filterValues);
      });

      if (passesAllFilters) {
        filtered[id] = card;
      }
    });

    return filtered;
  }

  calculatePriority(card) {
    if (!card.devPoints || card.devPoints === 0) return 0;
    return (card.businessPoints / card.devPoints) * 100;
  }

  matchesPriorityFilter(priority, filterValue) {
    switch (filterValue) {
      case 'High': return priority >= 200;
      case 'Medium': return priority >= 100 && priority < 200;
      case 'Low': return priority < 100;
      default: return true;
    }
  }

  applySorting(cards) {
    const entries = Object.entries(cards);
    
    
    entries.sort(([idA, cardA], [idB, cardB]) => {
      // Default sorting: by sprint (most recent first), tasks without sprint at the end
      if (!this.sortOrder.field) {
        return this.sortBySprint(cardA, cardB);
      }

      // Custom field sorting
      let valueA = cardA[this.sortOrder.field];
      let valueB = cardB[this.sortOrder.field];

      // Handle special sorting cases
      if (this.sortOrder.field === 'priority') {
        valueA = this.calculatePriority(cardA);
        valueB = this.calculatePriority(cardB);
      }

      // Convert to comparable values
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      let comparison = 0;
      if (valueA < valueB) comparison = -1;
      if (valueA > valueB) comparison = 1;

      return this.sortOrder.direction === 'desc' ? -comparison : comparison;
    });

    return Object.fromEntries(entries);
  }

  sortBySprint(cardA, cardB) {
    const sprintA = cardA.sprint || '';
    const sprintB = cardB.sprint || '';

    // Tasks without sprint go to the end
    if (!sprintA && !sprintB) return 0;
    if (!sprintA) return 1;
    if (!sprintB) return -1;

    // Extract sprint number for comparison (e.g., "Sprint 3" -> 3)
    const getSprintNumber = (sprintName) => {
      const match = sprintName.match(/sprint\s*(\d+)/i);
      return match ? parseInt(match[1]) : 0;
    };

    const numberA = getSprintNumber(sprintA);
    const numberB = getSprintNumber(sprintB);

    // If both have numbers, sort by number (descending - most recent first)
    if (numberA && numberB) {
      return numberB - numberA;
    }

    // If only one has a number, prioritize the numbered one
    if (numberA && !numberB) return -1;
    if (!numberA && numberB) return 1;

    // If neither has numbers, sort alphabetically (descending)
    return sprintB.localeCompare(sprintA);
  }

  cleanup() {
    this.filters = {};
    this.sortOrder = { field: null, direction: 'asc' };
  }
}
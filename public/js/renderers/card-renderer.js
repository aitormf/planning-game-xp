import { APP_CONSTANTS } from '../constants/app-constants.js';
const projectCardElement = APP_CONSTANTS.PROJECT_CARD_ELEMENT;
import { showExpandedCardInModal } from '../utils/common-functions.js';
import { UIUtils } from '../utils/ui-utils.js';
import { globalDataManager } from '../services/global-data-manager.js';

export class CardRenderer {
  constructor(cardService) {
    this.cardService = cardService;
  }

  renderCollapsedCards(cards, section, config) {
    const cardsListElement = document.querySelector(`#${section}CardsList`);

    if (!cardsListElement) {
      return;
    }

    const newCardsListElement = UIUtils.clearContainer(cardsListElement);

    if (!cards || Object.keys(cards).length === 0) {
      this.renderEmptyMessage(newCardsListElement, section);
      return;
    }

    const cardType = projectCardElement[section];
    if (!cardType) {
      return;
    }

    const orderedCards = this.cardService.orderCards(cards, cardType);
    this.renderCardElements(orderedCards, newCardsListElement, section, cardType, config);
    this.attachCardClickHandler(newCardsListElement, cardType);

    requestAnimationFrame(() => {
      document.dispatchEvent(new CustomEvent('cards-rendered', { detail: { section } }));
    });
  }

  renderCollapsedQACards(cards, section = 'qa', config) {
    const cardsListElement = document.querySelector(`#${section}CardsList`);
    if (!cardsListElement) return;

    const newCardsListElement = UIUtils.clearContainer(cardsListElement);

    if (!cards || Object.keys(cards).length === 0) {
      this.renderEmptyMessage(newCardsListElement, section);
      return;
    }

    // Group cards by suite
    const cardsBySuite = this.groupCardsBySuite(cards);
    this.renderQACardsBySuite(cardsBySuite, newCardsListElement, config);
    this.attachCardClickHandler(newCardsListElement, 'qa-card');

    requestAnimationFrame(() => {
      document.dispatchEvent(new CustomEvent('cards-rendered', { detail: { section } }));
    });
  }

  groupCardsBySuite(cards) {
    const cardsBySuite = {};
    Object.entries(cards).forEach(([id, cardData]) => {
      if (cardData.deletedAt) return;
      const suiteId = cardData.suiteId || 'no-suite';
      if (!cardsBySuite[suiteId]) {
        cardsBySuite[suiteId] = [];
      }
      cardsBySuite[suiteId].push({ id, ...cardData });
    });
    return cardsBySuite;
  }

  renderQACardsBySuite(cardsBySuite, container, config) {
    Object.entries(cardsBySuite).forEach(([suiteId, suiteCards]) => {
      const details = document.createElement('details');
      const summary = document.createElement('summary');

      let suiteName = 'Sin suite';
      if (suiteId !== 'no-suite') {
        const suitesArray = Array.isArray(window.globalSuites) ? window.globalSuites :
          Object.entries(window.globalSuites || {}).map(([id, data]) => ({
            id,
            name: typeof data === 'object' ? data.name : data
          }));

        const suite = suitesArray.find(s => String(s.id) === String(suiteId));
        suiteName = suite ? suite.name : suiteId;
      }

      summary.textContent = `${suiteName} (${suiteCards.length})`;
      details.appendChild(summary);

      const cardsContainer = UIUtils.createElement('div', {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem'
        }
      });

      suiteCards.forEach(cardData => {
        const card = this.createCardElement(cardData, cardData.id, 'qa', 'qa-card', config);
        cardsContainer.appendChild(card);
      });

      details.appendChild(cardsContainer);
      container.appendChild(details);
    });
  }

  renderEmptyMessage(container, section) {
    const emptyMessage = UIUtils.createElement('p', {
      style: { textAlign: 'center' }
    }, `No hay tarjetas en esta sección`);
    container.appendChild(emptyMessage);
  }

  renderCardElements(cards, container, section, cardType, config) {
    Object.entries(cards).forEach(([id, cardData]) => {
      if (cardData.deletedAt) return;

      const card = this.createCardElement(cardData, id, section, cardType, config);
      container.appendChild(card);
    });
  }

  createCardElement(cardData, id, section, cardType, config) {
    // NO transformar createdBy - siempre guardar email original
    // La presentación es responsabilidad del display, no del dato

    const card = document.createElement(cardType);

    // Filtrar propiedades según el tipo de card
    const filteredCardData = this.filterCardDataByType(cardData, cardType);

    // No pasar status/priority vacíos que sobrescribirían los defaults del constructor
    if (filteredCardData.status === '' || filteredCardData.status === undefined) {
      delete filteredCardData.status;
    }
    if (filteredCardData.priority === '' || filteredCardData.priority === undefined) {
      delete filteredCardData.priority;
    }

    Object.assign(card, filteredCardData);

    card.firebaseId = id;  // Asignar Firebase ID explícitamente
    card.setAttribute('data-firebase-id', id);
    card.group = section;
    card.section = section;
    card.projectId = config.projectId;
    card.userEmail = config.userEmail;

    this.configureCardByType(card, cardType, config);

    return card;
  }

  filterCardDataByType(cardData, cardType) {
    const filtered = { ...cardData };

    // TaskCard no debe recibir priority guardada (tiene priority calculada)
    if (cardType === 'task-card' && 'priority' in filtered) {
      delete filtered.priority;
    }

    return filtered;
  }

  configureCardByType(card, cardType, config) {
    // Get simple data from GlobalDataManager
    const simpleData = globalDataManager.getSimpleDataForCard(cardType);

    // Apply simple data as attributes
    Object.assign(card, simpleData);

    switch (cardType) {
      case 'task-card':
        // Only set essential simple values, complex data will be requested via events when needed
        // No longer setting statusList, developerList, stakeholders as attributes
        break;
      case 'bug-card':
        if (config.projectId === 'Cinema4D') {
          card.bugType = 'c4d';
        }
        // No longer setting statusList, priorityList, developerList as attributes
        break;
      case 'qa-card':
        // QA cards will request suite data via events when needed
        // No longer setting suitesList as attribute
        break;
      case 'epic-card':
        // Epic cards will request stakeholder data via events when needed
        break;
      case 'sprint-card':
        // Sprint cards have minimal external dependencies
        break;
    }
  }

  attachCardClickHandler(container, cardType) {
    const handleCardClick = (event) => {
      const clickedCard = event.target.closest(cardType);
      if (clickedCard) {
        // epic-card has its own expandCard() method that creates modals
        // with proper close handling and unsaved changes detection
        const tagName = clickedCard.tagName.toLowerCase();
        if (tagName === 'epic-card') {
          return; // Let the component handle its own expansion
        }
        showExpandedCardInModal(clickedCard);
      }
    };

    if (window.cardClickHandler) {
      container.removeEventListener('click', window.cardClickHandler);
    }

    window.cardClickHandler = handleCardClick;
    container.addEventListener('click', handleCardClick);
  }
}

/**
 * Sistema de filtros base genérico
 * Proporciona funcionalidad común para todos los tipos de filtros de cards
 */
export class BaseFilter {
  constructor(cardType) {
    this.cardType = cardType;
    this.filtersContainer = null;
    this.currentFilters = {};
    this.filterConfig = this.getFilterConfig();
    this.initializeFilters();
  }

  /**
   * Configuración de filtros específica para cada tipo de card
   * Debe ser sobrescrita por las clases hijas
   * @returns {Object} Configuración de filtros
   */
  getFilterConfig() {
    throw new Error('getFilterConfig must be implemented by subclass');
  }

  /**
   * Inicializa los filtros vacíos basándose en la configuración
   */
  initializeFilters() {
    this.currentFilters = {};
    Object.keys(this.filterConfig).forEach(filterType => {
      const config = this.filterConfig[filterType];
      this.currentFilters[filterType] = config.isMultiSelect ? [] : '';
    });
  }

  /**
   * Configura los filtros para el tipo de card específico
   */
  setupFilters() {
    const containerId = `${this.cardType}Filters`;
    this.filtersContainer = document.getElementById(containerId);
    if (!this.filtersContainer) return;

    // Limpiar filtros existentes
    this.filtersContainer.innerHTML = '';

    // Aplicar estilos al contenedor si es necesario
    this.applyContainerStyles();

    // Crear los selectores de filtro
    Object.keys(this.filterConfig).forEach(filterType => {
      const config = this.filterConfig[filterType];
      this.createFilterSelect(filterType, config);
    });

    // Botón para limpiar filtros
    this.createClearFiltersButton();

    // Contador de resultados si no es de tipo simple
    if (this.isComplexFilterLayout()) {
      this.createResultsCounter();
    }
  }

  /**
   * Determina si el layout de filtros es complejo (como TaskFilters)
   * @returns {boolean}
   */
  isComplexFilterLayout() {
    return Object.values(this.filterConfig).some(config => config.isMultiSelect);
  }

  /**
   * Aplica estilos al contenedor de filtros
   */
  applyContainerStyles() {
    if (this.isComplexFilterLayout()) {
      this.filtersContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-start;
        padding: 1rem;
        background: var(--bg-secondary, #f8f9fa);
        border-radius: 6px;
        margin-bottom: 1rem;
      `;
    }
  }

  /**
   * Crea un selector de filtro (select simple o multi-select)
   * @param {string} filterType - Tipo de filtro
   * @param {Object} config - Configuración del filtro
   */
  createFilterSelect(filterType, config) {
    if (config.isMultiSelect) {
      this.createMultiFilterSelect(filterType, config);
    } else {
      this.createSimpleFilterSelect(filterType, config);
    }
  }

  /**
   * Crea un select simple de filtro
   * @param {string} filterType - Tipo de filtro
   * @param {Object} config - Configuración del filtro
   */
  createSimpleFilterSelect(filterType, config) {
    const select = document.createElement('select');
    select.id = `${this.cardType}Filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    select.className = `${this.cardType}-filter-select`;
    select.style.marginRight = '0.5rem';

    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `${config.label}...`;
    select.appendChild(defaultOption);

    this.filtersContainer.appendChild(select);

    // Cargar opciones de forma asíncrona
    config.optionsMethod().then(options => {
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
      });
    });

    // Añadir event listener
    select.addEventListener('change', () => {
      this.currentFilters[filterType] = select.value;
      this.applyFilters();
    });
  }

  /**
   * Crea un multi-select de filtro
   * @param {string} filterType - Tipo de filtro
   * @param {Object} config - Configuración del filtro
   */
  createMultiFilterSelect(filterType, config) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 150px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = config.label;
    labelElement.style.cssText = `
      font-size: 0.9em;
      font-weight: 500;
      color: var(--text-primary, #333);
    `;

    const multiSelect = document.createElement('multi-select');
    multiSelect.id = `${this.cardType}Filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    multiSelect.className = `${this.cardType}-filter-select`;
    multiSelect.placeholder = `Filtrar por ${config.label.toLowerCase()}`;

    // Configurar el multiselect
    multiSelect.selectedValues = this.currentFilters[filterType] || [];

    container.appendChild(labelElement);
    container.appendChild(multiSelect);
    this.filtersContainer.appendChild(container);

    // Cargar opciones de forma asíncrona
    config.optionsMethod().then(options => {
      multiSelect.options = options;
    }).catch(error => {
      console.error(`Error loading ${filterType} options:`, error);
      multiSelect.options = [];
    });

    // Añadir event listener
    multiSelect.addEventListener('change', (e) => {
      this.currentFilters[filterType] = e.detail.selectedValues;
      this.applyFilters();
    });
  }

  /**
   * Crea el botón para limpiar filtros
   */
  createClearFiltersButton() {
    const clearButton = document.createElement('button');
    clearButton.textContent = this.isComplexFilterLayout() ? '🗑️ Limpiar todos' : '🗑️ Limpiar';
    clearButton.className = 'clear-filters-button';

    if (this.isComplexFilterLayout()) {
      clearButton.style.cssText = `
        padding: 10px 16px;
        background: var(--color-error, #f43f5e);
        color: var(--text-inverse, white);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 500;
        transition: background-color 0.2s;
        align-self: flex-end;
        margin-top: 20px;
      `;

      clearButton.addEventListener('mouseover', () => {
        clearButton.style.backgroundColor = '#e11d48';
      });

      clearButton.addEventListener('mouseout', () => {
        clearButton.style.backgroundColor = '#f43f5e';
      });
    } else {
      clearButton.style.cssText = `
        padding: 8px 12px;
        background: var(--color-error, #f43f5e);
        color: var(--text-inverse, white);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        margin-left: 0.5rem;
      `;
    }

    clearButton.addEventListener('click', () => {
      this.clearAllFilters();
    });

    this.filtersContainer.appendChild(clearButton);
  }

  /**
   * Crea el contador de resultados (solo para layouts complejos)
   */
  createResultsCounter() {
    const counter = document.createElement('div');
    counter.id = `${this.cardType}FilterCounter`;
    counter.style.cssText = `
      font-size: 0.9em;
      color: var(--text-muted, #666);
      font-weight: 500;
      align-self: flex-end;
      margin-top: 20px;
      padding: 10px 16px;
      background: var(--bg-primary, white);
      border-radius: 6px;
      border: 1px solid var(--border-default, #dee2e6);
    `;
    this.filtersContainer.appendChild(counter);
  }

  /**
   * Aplica los filtros a las tarjetas
   */
  applyFilters() {
    const cardsListId = `${this.cardType}CardsList`;
    const cardsList = document.getElementById(cardsListId);
    if (!cardsList) return;

    const cardTagName = `${this.cardType}-card`;
    const cards = Array.from(cardsList.querySelectorAll(cardTagName));
    let visibleCount = 0;

    cards.forEach(card => {
      let shouldShow = true;

      // Aplicar cada filtro
      Object.keys(this.currentFilters).forEach(filterType => {
        const filterValue = this.currentFilters[filterType];
        const config = this.filterConfig[filterType];

        if (config.isMultiSelect) {
          if (filterValue && filterValue.length > 0) {
            if (!this.applyMultiSelectFilter(card, filterType, filterValue, config)) {
              shouldShow = false;
            }
          }
        } else {
          if (filterValue) {
            if (!this.applySingleSelectFilter(card, filterType, filterValue, config)) {
              shouldShow = false;
            }
          }
        }
      });

      card.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Mostrar contador de resultados
    this.updateResultsCounter(visibleCount, cards.length);
  }

  /**
   * Aplica un filtro de selección simple
   * @param {HTMLElement} card - Tarjeta a filtrar
   * @param {string} filterType - Tipo de filtro
   * @param {string} filterValue - Valor del filtro
   * @param {Object} config - Configuración del filtro
   * @returns {boolean} true si la tarjeta pasa el filtro
   */
  applySingleSelectFilter(card, filterType, filterValue, config) {
    const cardValue = this.getCardValue(card, filterType, config);
    return cardValue === filterValue;
  }

  /**
   * Aplica un filtro de selección múltiple
   * @param {HTMLElement} card - Tarjeta a filtrar
   * @param {string} filterType - Tipo de filtro
   * @param {Array} filterValues - Valores del filtro
   * @param {Object} config - Configuración del filtro
   * @returns {boolean} true si la tarjeta pasa el filtro
   */
  applyMultiSelectFilter(card, filterType, filterValues, config) {
    // Manejar filtros especiales como "no-sprint", "no-epic"
    const noValueKey = `no-${filterType}`;
    if (filterValues.includes(noValueKey)) {
      const cardValue = this.getCardValue(card, filterType, config);
      const hasValue = cardValue && cardValue.trim() !== '' && 
                      cardValue !== `Sin ${filterType}` && 
                      cardValue !== `Sin ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
      
      const hasOtherValuesSelected = filterValues.some(v => v !== noValueKey);
      
      if (hasValue && hasOtherValuesSelected) {
        // Si la tarjeta tiene valor y hay otros valores seleccionados, verificar si coincide
        return this.checkCardValueInArray(card, filterType, filterValues.filter(v => v !== noValueKey), config);
      } else if (hasValue && !hasOtherValuesSelected) {
        // Si solo está seleccionado "Sin X" y la tarjeta tiene valor
        return false;
      }
      // Si no tiene valor, pasa el filtro de "Sin X"
      return true;
    } else {
      return this.checkCardValueInArray(card, filterType, filterValues, config);
    }
  }

  /**
   * Verifica si el valor de una tarjeta está en un array de valores
   * @param {HTMLElement} card - Tarjeta a verificar
   * @param {string} filterType - Tipo de filtro
   * @param {Array} filterValues - Valores a comparar
   * @param {Object} config - Configuración del filtro
   * @returns {boolean} true si el valor está en el array
   */
  checkCardValueInArray(card, filterType, filterValues, config) {
    const cardValue = this.getCardValue(card, filterType, config);
    return filterValues.includes(cardValue);
  }

  /**
   * Obtiene el valor de una propiedad de una tarjeta
   * @param {HTMLElement} card - Tarjeta
   * @param {string} filterType - Tipo de filtro
   * @param {Object} config - Configuración del filtro
   * @returns {*} Valor de la propiedad
   */
  getCardValue(card, filterType, config) {
    // Si hay un getter personalizado, usarlo
    if (config.cardValueGetter) {
      return config.cardValueGetter(card);
    }
    
    // Por defecto, usar la propiedad directamente
    return card[filterType];
  }

  /**
   * Actualiza el contador de resultados
   * @param {number} visible - Número de tarjetas visibles
   * @param {number} total - Número total de tarjetas
   */
  updateResultsCounter(visible, total) {
    const counterId = `${this.cardType}FilterCounter`;
    let counter = document.getElementById(counterId);

    if (!counter && !this.isComplexFilterLayout()) {
      // Crear contador para layouts simples
      counter = document.createElement('span');
      counter.id = counterId;
      counter.style.cssText = `
        font-size: 0.9em;
        color: var(--text-muted, #666);
        margin-left: 1rem;
        font-weight: bold;
      `;
      this.filtersContainer.appendChild(counter);
    }

    if (counter) {
      const cardTypeDisplayName = this.getCardTypeDisplayName();
      if (this.isComplexFilterLayout()) {
        counter.textContent = `Mostrando ${visible} de ${total} ${cardTypeDisplayName}`;
      } else {
        counter.textContent = `${visible} de ${total} ${cardTypeDisplayName}`;
      }
    }
  }

  /**
   * Obtiene el nombre de visualización del tipo de card
   * @returns {string} Nombre para mostrar
   */
  getCardTypeDisplayName() {
    const displayNames = {
      'bugs': 'bugs',
      'tasks': 'tasks',
      'epics': 'épicas',
      'sprints': 'sprints',
      'qa': 'QA',
      'proposals': 'propuestas',
      'logs': 'logs'
    };
    return displayNames[this.cardType] || this.cardType;
  }

  /**
   * Limpia todos los filtros
   */
  clearAllFilters() {
    // Resetear filtros
    this.initializeFilters();

    // Resetear controles UI
    if (this.isComplexFilterLayout()) {
      this.filtersContainer.querySelectorAll('multi-select').forEach(multiSelect => {
        multiSelect.selectedValues = [];
      });
    } else {
      this.filtersContainer.querySelectorAll('select').forEach(select => {
        select.value = '';
      });
    }

    // Mostrar todas las tarjetas
    const cardsListId = `${this.cardType}CardsList`;
    const cardsList = document.getElementById(cardsListId);
    if (cardsList) {
      const cardTagName = `${this.cardType}-card`;
      const cards = Array.from(cardsList.querySelectorAll(cardTagName));
      cards.forEach(card => {
        card.style.display = '';
      });
      this.updateResultsCounter(cards.length, cards.length);
    }
  }

  /**
   * Resetea los filtros al cambiar de vista
   */
  resetFilters() {
    this.clearAllFilters();
  }

  /**
   * Método de conveniencia para obtener opciones de una lista global
   * @param {string} globalListName - Nombre de la lista global
   * @returns {Promise<Array>} Opciones formateadas
   */
  async getGlobalListOptions(globalListName) {
    const list = window[globalListName] || [];
    return list.map(item => ({
      value: item,
      label: item
    }));
  }

  /**
   * Método de conveniencia para obtener creadores únicos desde el DOM
   * @returns {Promise<Array>} Opciones de creadores
   */
  async getCreatedByOptionsFromDOM() {
    const cardsListId = `${this.cardType}CardsList`;
    const cardsList = document.getElementById(cardsListId);
    if (!cardsList) return [];

    const cardTagName = `${this.cardType}-card`;
    const cards = Array.from(cardsList.querySelectorAll(cardTagName));
    const createdBySet = new Set();

    cards.forEach(card => {
      if (card.createdBy) {
        createdBySet.add(card.createdBy);
      }
    });

    const options = Array.from(createdBySet).map(creator => ({
      value: creator,
      label: creator
    }));

    // Añadir opción para sin creador si hay tarjetas sin createdBy
    const hasCardsWithoutCreator = cards.some(card => !card.createdBy);
    if (hasCardsWithoutCreator) {
      options.unshift({
        value: 'no-creator',
        label: 'Sin creador'
      });
    }

    return options;
  }
}
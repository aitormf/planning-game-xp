/**
 * Clase para manejar los filtros de bugs
 */
export class BugFilters {
  constructor() {
    this.filtersContainer = null;
    this.currentFilters = {
      status: '',
      priority: '',
      developer: '',
      createdBy: ''
    };
  }

  /**
   * Inicializa los filtros de bugs
   */
  setupBugFilters() {
    this.filtersContainer = document.getElementById('bugsFilters');
    if (!this.filtersContainer) return;

    // Limpiar filtros existentes
    this.filtersContainer.innerHTML = '';

    // Crear los selectores de filtro
    this.createFilterSelect('status', 'Estado', this.getStatusOptions());
    this.createFilterSelect('priority', 'Prioridad', this.getPriorityOptions());
    this.createFilterSelect('developer', 'Desarrollador', this.getDeveloperOptions());
    this.createFilterSelect('createdBy', 'Creado por', this.getCreatedByOptions());

    // Botón para limpiar filtros
    this.createClearFiltersButton();
  }

  /**
   * Crea un select de filtro
   * @param {string} filterType - Tipo de filtro
   * @param {string} label - Etiqueta del filtro
   * @param {Promise<Array>} optionsPromise - Promesa que resuelve las opciones
   */
  createFilterSelect(filterType, label, optionsPromise) {
    const select = document.createElement('select');
    select.id = `bugFilter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    select.className = 'bug-filter-select';
    select.style.marginRight = '0.5rem';

    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `${label}...`;
    select.appendChild(defaultOption);

    this.filtersContainer.appendChild(select);

    // Cargar opciones de forma asíncrona
    optionsPromise.then(options => {
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
      this.applyBugFilters();
    });
  }

  /**
   * Crea el botón para limpiar filtros
   */
  createClearFiltersButton() {
    const clearButton = document.createElement('button');
    clearButton.textContent = '🗑️ Limpiar';
    clearButton.className = 'clear-filters-button';
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

    clearButton.addEventListener('click', () => {
      this.clearAllFilters();
    });

    this.filtersContainer.appendChild(clearButton);
  }

  /**
   * Obtiene las opciones de estado
   * @returns {Promise<Array>} Opciones de estado
   */
  async getStatusOptions() {
    const statusList = window.statusBugList || [];
    return statusList.map(status => ({
      value: status,
      label: status
    }));
  }

  /**
   * Obtiene las opciones de prioridad
   * @returns {Promise<Array>} Opciones de prioridad
   */
  async getPriorityOptions() {
    const priorityList = window.globalBugPriorityList || [];
    return priorityList.map(priority => ({
      value: priority,
      label: priority
    }));
  }

  /**
   * Obtiene las opciones de desarrollador
   * @returns {Promise<Array>} Opciones de desarrollador
   */
  async getDeveloperOptions() {
    const developerList = window.globalDeveloperList || [];
    return developerList.map((dev) => {
      if (dev && typeof dev === 'object') {
        const value = dev.id || dev.email || dev.name || '';
        return {
          value,
          label: dev.name || dev.email || dev.id || value
        };
      }
      return {
        value: dev,
        label: dev
      };
    }).filter(option => option.value);
  }

  /**
   * Obtiene las opciones de "creado por"
   * @returns {Promise<Array>} Opciones de creado por
   */
  async getCreatedByOptions() {
    // Obtener todos los bugs para extraer los creadores únicos
    const bugsList = document.getElementById('bugsCardsList');
    if (!bugsList) return [];

    const cards = Array.from(bugsList.querySelectorAll('bug-card'));
    const createdBySet = new Set();

    cards.forEach(card => {
      if (card.createdBy) {
        createdBySet.add(card.createdBy);
      }
    });

    return Array.from(createdBySet).map(creator => ({
      value: creator,
      label: creator
    }));
  }

  /**
   * Aplica los filtros a las tarjetas de bugs
   */
  applyBugFilters() {
    const cardsList = document.getElementById('bugsCardsList');
    if (!cardsList) return;

    const cards = Array.from(cardsList.querySelectorAll('bug-card'));
    let visibleCount = 0;

    cards.forEach(card => {
      let shouldShow = true;

      // Filtro por estado
      if (this.currentFilters.status && card.status !== this.currentFilters.status) {
        shouldShow = false;
      }

      // Filtro por prioridad
      if (this.currentFilters.priority && card.priority !== this.currentFilters.priority) {
        shouldShow = false;
      }

      // Filtro por desarrollador
      if (this.currentFilters.developer && card.developer !== this.currentFilters.developer) {
        shouldShow = false;
      }

      // Filtro por creado por
      if (this.currentFilters.createdBy && card.createdBy !== this.currentFilters.createdBy) {
        shouldShow = false;
      }

      card.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Mostrar contador de resultados
    this.updateResultsCounter(visibleCount, cards.length);
  }

  /**
   * Actualiza el contador de resultados
   * @param {number} visible - Número de tarjetas visibles
   * @param {number} total - Número total de tarjetas
   */
  updateResultsCounter(visible, total) {
    let counter = document.getElementById('bugsFilterCounter');

    if (!counter) {
      counter = document.createElement('span');
      counter.id = 'bugsFilterCounter';
      counter.style.cssText = `
        font-size: 0.9em;
        color: var(--text-muted, #666);
        margin-left: 1rem;
        font-weight: bold;
      `;
      this.filtersContainer.appendChild(counter);
    }

    counter.textContent = `${visible} de ${total} bugs`;
  }

  /**
   * Limpia todos los filtros
   */
  clearAllFilters() {
    // Resetear filtros
    this.currentFilters = {
      status: '',
      priority: '',
      developer: '',
      createdBy: ''
    };

    // Resetear selects
    this.filtersContainer.querySelectorAll('select').forEach(select => {
      select.value = '';
    });

    // Mostrar todas las tarjetas
    const cardsList = document.getElementById('bugsCardsList');
    if (cardsList) {
      const cards = Array.from(cardsList.querySelectorAll('bug-card'));
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
} 

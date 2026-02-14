import '@manufosela/multi-select';

/**
 * Clase para manejar los filtros de tasks
 */
export class TaskFilters {
  constructor() {
    this.filtersContainer = null;
    this.currentFilters = {
      status: [],
      sprint: [],
      epic: [],
      developer: [],
      createdBy: []
    };
  }

  /**
   * Inicializa los filtros de tasks
   */
  setupTaskFilters() {
    this.filtersContainer = document.getElementById('tasksFilters');
    if (!this.filtersContainer) return;

    // Limpiar filtros existentes
    this.filtersContainer.innerHTML = '';

    // Aplicar estilos al contenedor
    this.filtersContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 1rem;
    `;

    // Crear los selectores de filtro
    this.createFilterSelect('status', 'Estado', this.getStatusOptions());
    this.createFilterSelect('sprint', 'Sprint', this.getSprintOptions());
    this.createFilterSelect('epic', 'Épica', this.getEpicOptions());
    this.createFilterSelect('developer', 'Desarrollador', this.getDeveloperOptions());
    this.createFilterSelect('createdBy', 'Creado por', this.getCreatedByOptions());

    // Botón para limpiar filtros
    this.createClearFiltersButton();

    // Contador de resultados
    this.createResultsCounter();
  }

  /**
   * Crea un MultiSelect de filtro
   * @param {string} filterType - Tipo de filtro
   * @param {string} label - Etiqueta del filtro
   * @param {Promise<Array>} optionsPromise - Promesa que resuelve las opciones
   */
  createFilterSelect(filterType, label, optionsPromise) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 150px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      font-size: 0.9em;
      font-weight: 500;
      color: #333;
    `;

    const multiSelect = document.createElement('multi-select');
    multiSelect.id = `taskFilter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    multiSelect.className = 'task-filter-select';
    multiSelect.placeholder = `Filtrar por ${label.toLowerCase()}`;

    // Configurar el multiselect
    multiSelect.selectedValues = this.currentFilters[filterType] || [];

    container.appendChild(labelElement);
    container.appendChild(multiSelect);
    this.filtersContainer.appendChild(container);

    // Cargar opciones de forma asíncrona
    optionsPromise.then(options => {
      multiSelect.options = options;
    }).catch(error => {
multiSelect.options = [];
    });

    // Añadir event listener
    multiSelect.addEventListener('change', (e) => {
      this.currentFilters[filterType] = e.detail.selectedValues;
      this.applyTaskFilters();
    });
  }

  /**
   * Crea el botón para limpiar filtros
   */
  createClearFiltersButton() {
    const clearButton = document.createElement('button');
    clearButton.textContent = '🗑️ Limpiar todos';
    clearButton.className = 'clear-filters-button';
    clearButton.style.cssText = `
      padding: 10px 16px;
      background: #dc3545;
      color: white;
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
      clearButton.style.backgroundColor = '#c82333';
    });

    clearButton.addEventListener('mouseout', () => {
      clearButton.style.backgroundColor = '#dc3545';
    });

    clearButton.addEventListener('click', () => {
      this.clearAllFilters();
    });

    this.filtersContainer.appendChild(clearButton);
  }

  /**
   * Crea el contador de resultados
   */
  createResultsCounter() {
    const counter = document.createElement('div');
    counter.id = 'tasksFilterCounter';
    counter.style.cssText = `
      font-size: 0.9em;
      color: #666;
      font-weight: 500;
      align-self: flex-end;
      margin-top: 20px;
      padding: 10px 16px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    `;
    this.filtersContainer.appendChild(counter);
  }

  /**
   * Obtiene las opciones de estado
   * @returns {Promise<Array>} Opciones de estado
   */
  async getStatusOptions() {
    const statusList = window.statusTasksList || [];
    return statusList.map(status => ({
      value: status,
      label: status
    }));
  }

  /**
   * Obtiene las opciones de sprint filtradas por año seleccionado
   * @returns {Promise<Array>} Opciones de sprint
   */
  async getSprintOptions() {
    const sprintList = window.globalSprintList || {};
    const selectedYear = this._getSelectedYear();

    // Filtrar sprints por año seleccionado
    const options = Object.entries(sprintList)
      .filter(([id, sprint]) => {
        // Si el sprint no tiene year, mostrarlo (compatibilidad pre-migración)
        if (!sprint.year) return true;
        // Comparar como números para evitar problemas de tipos
        return Number(sprint.year) === selectedYear;
      })
      // Ordenar por startDate descendente (más recientes primero)
      .sort((a, b) => {
        const sprintA = a[1];
        const sprintB = b[1];
        const dateA = sprintA.startDate ? new Date(sprintA.startDate) : null;
        const dateB = sprintB.startDate ? new Date(sprintB.startDate) : null;

        if (dateA && dateB) return dateB - dateA;
        if (dateA) return -1;
        if (dateB) return 1;

        const labelA = (sprintA.title || sprintA.name || a[0]).toLowerCase();
        const labelB = (sprintB.title || sprintB.name || b[0]).toLowerCase();
        return labelB.localeCompare(labelA);
      })
      .map(([id, sprint]) => ({
        value: id,
        label: sprint.title || sprint.name || id
      }));

    // Añadir opción para tareas sin sprint
    options.unshift({
      value: 'no-sprint',
      label: 'Sin Sprint'
    });

    return options;
  }

  /**
   * Obtiene el año seleccionado desde localStorage
   * @returns {number} Año seleccionado
   */
  _getSelectedYear() {
    const savedYear = localStorage.getItem('selectedYear');
    return savedYear ? Number(savedYear) : new Date().getFullYear();
  }

  /**
   * Obtiene las opciones de épica
   * @returns {Promise<Array>} Opciones de épica
   */
  async getEpicOptions() {
    try {
      let epics = [];

      // Intentar obtener épicas desde Firebase a través del AppController
      if (window.appController && window.appController.getFirebaseService) {
        try {
          const projectId = window.appController.getCurrentProjectId();
          const firebaseService = window.appController.getFirebaseService();
          const epicData = await firebaseService.getCards(projectId, 'epics');
          epics = Object.entries(epicData || {}).map(([id, epic]) => ({
            id: epic.cardId || id,
            title: epic.title || epic.name || id
          }));
        } catch (firebaseError) {
          // Silently ignore - will fallback to DOM
        }
      }

      // Si no hay épicas desde Firebase, obtener desde el DOM
      if (epics.length === 0) {
        const epicCards = document.querySelectorAll('epic-card');
        epics = Array.from(epicCards).map(card => ({
          id: card.cardId || card.id || card.getAttribute('card-id'),
          title: card.title || card.textContent.trim()
        })).filter(epic => epic.id && epic.title);
}

      const options = epics.map(epic => ({
        value: epic.id,
        label: epic.title || epic.name || epic.id
      }));

      // Añadir opción para tareas sin épica
      options.unshift({
        value: 'no-epic',
        label: 'Sin Épica'
      });
return options;
    } catch (error) {
return [{
        value: 'no-epic',
        label: 'Sin Épica'
      }];
    }
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
    // Obtener todas las tasks para extraer los creadores únicos
    const tasksList = document.getElementById('tasksCardsList');
    if (!tasksList) return [];

    const cards = Array.from(tasksList.querySelectorAll('task-card'));
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
   * Aplica los filtros a las tarjetas de tasks
   */
  applyTaskFilters() {
    const cardsList = document.getElementById('tasksCardsList');
    if (!cardsList) return;

    const cards = Array.from(cardsList.querySelectorAll('task-card'));
    let visibleCount = 0;

    cards.forEach(card => {
      let shouldShow = true;

      // Filtro por estado
      if (this.currentFilters.status && this.currentFilters.status.length > 0) {
        if (!this.currentFilters.status.includes(card.status)) {
          shouldShow = false;
        }
      }

      // Filtro por sprint
      if (this.currentFilters.sprint && this.currentFilters.sprint.length > 0) {
        if (this.currentFilters.sprint.includes('no-sprint')) {
          // Si se selecciona "Sin Sprint", mostrar tareas sin sprint
          const hasOtherSprintSelected = this.currentFilters.sprint.some(s => s !== 'no-sprint');
          if (card.sprint && hasOtherSprintSelected) {
            // Si la tarea tiene sprint y hay otros sprints seleccionados, verificar si coincide
            if (!this.currentFilters.sprint.includes(card.sprint)) {
              shouldShow = false;
            }
          } else if (card.sprint && !hasOtherSprintSelected) {
            // Si solo está seleccionado "Sin Sprint" y la tarea tiene sprint
            shouldShow = false;
          }
        } else {
          if (!this.currentFilters.sprint.includes(card.sprint)) shouldShow = false;
        }
      }

      // Filtro por épica
      if (this.currentFilters.epic && this.currentFilters.epic.length > 0) {
        if (this.currentFilters.epic.includes('no-epic')) {
          // Para tareas sin épica, verificar que no tengan valor de épica
          const cardEpic = card.epic || card.epicId || card.getAttribute('epic') || card.getAttribute('epic-id') || '';
          const hasEpic = cardEpic && cardEpic.trim() !== '' && cardEpic !== 'Sin épica' && cardEpic !== 'Sin Épica';
          const hasOtherEpicSelected = this.currentFilters.epic.some(e => e !== 'no-epic');

          if (hasEpic && hasOtherEpicSelected) {
            // Si la tarea tiene épica y hay otras épicas seleccionadas, verificar si coincide
            let epicMatches = false;
            if (card.selectedEpicId && typeof card.selectedEpicId === 'string') {
              epicMatches = this.currentFilters.epic.includes(card.selectedEpicId);
            } else if (card.selectedEpicId && typeof card.selectedEpicId === 'function') {
              try {
                epicMatches = this.currentFilters.epic.includes(card.selectedEpicId());
              } catch (e) { /* Silently ignore getter errors */ }
            }
            epicMatches = epicMatches || this.currentFilters.epic.includes(cardEpic);
            if (!epicMatches) shouldShow = false;
          } else if (hasEpic && !hasOtherEpicSelected) {
            // Si solo está seleccionado "Sin Épica" y la tarea tiene épica
            shouldShow = false;
          }
        } else {
          // Obtener el valor de épica de la tarjeta de múltiples formas posibles
          let cardEpic = card.epic || card.epicId || card.getAttribute('epic') || card.getAttribute('epic-id');
          if (card.selectedEpicId && typeof card.selectedEpicId === 'string') {
            cardEpic = card.selectedEpicId;
          } else if (card.selectedEpicId && typeof card.selectedEpicId === 'function') {
            try {
              cardEpic = card.selectedEpicId();
            } catch (e) { /* Silently ignore getter errors */ }
          }
          const epicMatches = this.currentFilters.epic.includes(cardEpic) ||
            this.currentFilters.epic.includes(card.epic) ||
            this.currentFilters.epic.includes(card.epicId);
          if (!epicMatches) shouldShow = false;
        }
      }

      // Filtro por desarrollador
      if (this.currentFilters.developer && this.currentFilters.developer.length > 0) {
        if (!this.currentFilters.developer.includes(card.developer)) {
          shouldShow = false;
        }
      }

      // Filtro por creado por
      if (this.currentFilters.createdBy && this.currentFilters.createdBy.length > 0) {
        if (!this.currentFilters.createdBy.includes(card.createdBy)) {
          shouldShow = false;
        }
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
    const counter = document.getElementById('tasksFilterCounter');
    if (counter) {
      counter.textContent = `Mostrando ${visible} de ${total} tasks`;
    }
  }

  /**
   * Limpia todos los filtros
   */
  clearAllFilters() {
    // Resetear filtros
    this.currentFilters = {
      status: [],
      sprint: [],
      epic: [],
      developer: [],
      createdBy: []
    };

    // Resetear todos los multiselects
    this.filtersContainer.querySelectorAll('multi-select').forEach(multiSelect => {
      multiSelect.selectedValues = [];
    });

    // Mostrar todas las tarjetas
    const cardsList = document.getElementById('tasksCardsList');
    if (cardsList) {
      const cards = Array.from(cardsList.querySelectorAll('task-card'));
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

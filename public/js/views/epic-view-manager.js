import { GanttRenderer } from '../renderers/gantt-renderer.js';

export class EpicViewManager {
  constructor(cardService, firebaseService) {
    this.cardService = cardService;
    this.firebaseService = firebaseService;
    this.ganttRenderer = new GanttRenderer();
    this.unsubscribe = null;
    this.allEpicsData = null;
    this.selectedYear = null;
    this.container = null;
    this._yearChangeHandler = null;
  }

  renderGanttView(projectId, config) {
    this.container = document.getElementById('epicsGanttView');

    if (this.container) {
      this._initYearListener();
      this.subscribeToEpics(projectId, this.container);
    }
  }

  /**
   * Initialize listener for global year-selector changes
   */
  _initYearListener() {
    // Get selected year from localStorage or use current year
    const savedYear = localStorage.getItem('selectedYear');
    this.selectedYear = savedYear ? Number(savedYear) : new Date().getFullYear();

    // Listen for year changes from the global year-selector
    this._yearChangeHandler = (e) => {
      const newYear = e.detail?.year;
      if (newYear && newYear !== this.selectedYear) {
        this.selectedYear = Number(newYear);
        this._renderFilteredEpics();
      }
    };
    document.addEventListener('year-changed', this._yearChangeHandler);
  }

  /**
   * Filter epics by selected year and render
   */
  _renderFilteredEpics() {
    if (!this.allEpicsData || !this.container) return;

    const filteredEpics = this._filterEpicsByYear(this.allEpicsData);
    this.ganttRenderer.renderGanttView(this.container, filteredEpics, this.selectedYear);
  }

  /**
   * Filter epics by year using range overlap logic
   *
   * Show epic in year X if:
   * - startDate <= end of year X (or no startDate)
   * - endDate >= start of year X (or no endDate)
   */
  _filterEpicsByYear(epicsData) {
    if (!this.selectedYear) return epicsData;

    const yearStart = new Date(this.selectedYear, 0, 1);
    const yearEnd = new Date(this.selectedYear, 11, 31);
    const filtered = {};

    Object.entries(epicsData).forEach(([id, epic]) => {
      const epicStart = epic.startDate ? new Date(epic.startDate) : null;
      const epicEnd = epic.endDate ? new Date(epic.endDate) : null;

      const startsBeforeOrInYear = !epicStart || epicStart <= yearEnd;
      const endsAfterOrInYear = !epicEnd || epicEnd >= yearStart;

      if (startsBeforeOrInYear && endsAfterOrInYear) {
        filtered[id] = epic;
      }
    });

    return filtered;
  }

  subscribeToEpics(projectId, container) {
    const pathEpics = `/cards/${projectId}/EPICS_${projectId}`;

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.firebaseService.subscribeToPath(pathEpics, (snapshot) => {
      if (snapshot.exists()) {
        this.allEpicsData = snapshot.val();
        this._renderFilteredEpics();
      }
    });
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.ganttRenderer) {
      this.ganttRenderer.cleanup();
    }
    if (this._yearChangeHandler) {
      document.removeEventListener('year-changed', this._yearChangeHandler);
      this._yearChangeHandler = null;
    }
    this.allEpicsData = null;
  }
}
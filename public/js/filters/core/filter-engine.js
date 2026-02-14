/**
 * FilterEngine - Pure filter engine that operates on data objects
 * Single Source of Truth for all filtering logic
 *
 * This engine operates ONLY on data, never on DOM elements.
 * It receives card objects and returns filtered card objects.
 */

export class FilterEngine {
  constructor() {
    this.matchers = new Map();
  }

  /**
   * Register a matcher for a specific filter type
   * @param {string} filterType - Filter type (e.g., 'status', 'developer', 'sprint')
   * @param {Function} matcher - Matcher function that takes (card, filterValues, context) and returns boolean
   */
  registerMatcher(filterType, matcher) {
    if (typeof matcher !== 'function') {
      throw new Error(`Matcher for '${filterType}' must be a function`);
    }
    this.matchers.set(filterType, matcher);
  }

  /**
   * Unregister a matcher
   * @param {string} filterType - Filter type to unregister
   */
  unregisterMatcher(filterType) {
    this.matchers.delete(filterType);
  }

  /**
   * Check if a matcher is registered for a filter type
   * @param {string} filterType - Filter type
   * @returns {boolean}
   */
  hasMatcher(filterType) {
    return this.matchers.has(filterType);
  }

  /**
   * Get all registered filter types
   * @returns {string[]}
   */
  getRegisteredFilterTypes() {
    return Array.from(this.matchers.keys());
  }

  /**
   * Apply filters to a collection of cards
   * @param {Object|Array} cards - Cards to filter (object dict or array)
   * @param {Object} activeFilters - Active filters { filterType: [values] }
   * @param {Object} context - Optional context for matchers (e.g., global lists, services)
   * @returns {Object|Array} - Filtered cards in same format as input
   */
  applyFilters(cards, activeFilters, context = {}) {
    if (!cards) {
      return cards;
    }

    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      return cards;
    }

    const isArray = Array.isArray(cards);
    const cardEntries = isArray
      ? cards.map((card, index) => [index, card])
      : Object.entries(cards);

    const filteredEntries = cardEntries.filter(([, card]) => {
      return this._matchesAllFilters(card, activeFilters, context);
    });

    if (isArray) {
      return filteredEntries.map(([, card]) => card);
    }

    return Object.fromEntries(filteredEntries);
  }

  /**
   * Check if a single card matches all active filters
   * @param {Object} card - Card to check
   * @param {Object} activeFilters - Active filters
   * @param {Object} context - Optional context
   * @returns {boolean}
   */
  _matchesAllFilters(card, activeFilters, context) {
    for (const [filterType, filterValues] of Object.entries(activeFilters)) {
      if (filterValues === null || filterValues === undefined) {
        continue;
      }

      const values = Array.isArray(filterValues) ? filterValues : [filterValues];

      if (values.length === 0) {
        continue;
      }

      const matcher = this.matchers.get(filterType);
      if (!matcher) {
        console.warn(`FilterEngine: No matcher registered for filter type '${filterType}'`);
        continue;
      }

      if (!matcher(card, values, context)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a single card matches a single filter
   * @param {Object} card - Card to check
   * @param {string} filterType - Filter type
   * @param {Array} filterValues - Filter values
   * @param {Object} context - Optional context
   * @returns {boolean}
   */
  matchesSingleFilter(card, filterType, filterValues, context = {}) {
    if (!filterValues || filterValues.length === 0) {
      return true;
    }

    const matcher = this.matchers.get(filterType);
    if (!matcher) {
      console.warn(`FilterEngine: No matcher registered for filter type '${filterType}'`);
      return true;
    }

    const values = Array.isArray(filterValues) ? filterValues : [filterValues];
    return matcher(card, values, context);
  }

  /**
   * Create a pre-configured filter function for a specific filter set
   * Useful for performance when filtering large datasets with the same filters
   * @param {Object} activeFilters - Active filters
   * @param {Object} context - Optional context
   * @returns {Function} - Function that takes a card and returns boolean
   */
  createFilterFunction(activeFilters, context = {}) {
    return (card) => this._matchesAllFilters(card, activeFilters, context);
  }
}

// Singleton instance
let filterEngineInstance = null;

/**
 * Get the singleton FilterEngine instance
 * @returns {FilterEngine}
 */
export function getFilterEngine() {
  if (!filterEngineInstance) {
    filterEngineInstance = new FilterEngine();
  }
  return filterEngineInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetFilterEngine() {
  filterEngineInstance = null;
}

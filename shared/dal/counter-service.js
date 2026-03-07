/**
 * @fileoverview Counter service interface for atomic ID generation.
 * Uses Firestore transactions for atomic increment regardless of backend choice.
 *
 * Counter key format: {PROJECT_ABBR}-{SECTION_ABBR} (e.g., 'PLN-TSK')
 * Generated ID format: {counterKey}-{0000} (e.g., 'PLN-TSK-0001')
 *
 * @module shared/dal/counter-service
 */

/**
 * @abstract
 */
export class CounterService {
  constructor() {
    if (new.target === CounterService) {
      throw new Error('CounterService is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Atomically increment a counter and return the next formatted ID.
   * @param {string} counterKey - Counter key (e.g., 'PLN-TSK')
   * @returns {Promise<string>} Formatted ID (e.g., 'PLN-TSK-0001')
   */
  async nextId(counterKey) {
    throw new Error('Not implemented: nextId()');
  }

  /**
   * Get the current counter value without incrementing.
   * @param {string} counterKey
   * @returns {Promise<number>} Current lastId value, or 0 if not exists
   */
  async currentId(counterKey) {
    throw new Error('Not implemented: currentId()');
  }

  /**
   * Build a counter key from project abbreviation and section abbreviation.
   * @param {string} projectAbbr - e.g., 'PLN'
   * @param {string} sectionAbbr - e.g., 'TSK'
   * @returns {string} e.g., 'PLN-TSK'
   */
  static buildKey(projectAbbr, sectionAbbr) {
    return `${projectAbbr}-${sectionAbbr}`;
  }

  /**
   * Format a numeric ID with zero-padding.
   * @param {string} counterKey
   * @param {number} id
   * @param {number} [padLength=4]
   * @returns {string} e.g., 'PLN-TSK-0001'
   */
  static formatId(counterKey, id, padLength = 4) {
    return `${counterKey}-${id.toString().padStart(padLength, '0')}`;
  }
}

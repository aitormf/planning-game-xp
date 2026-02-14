/**
 * Status Matcher - Filters cards by status field
 * Simple direct comparison
 */

/**
 * Status matcher function
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected status values
 * @param {Object} context - Optional context (not used)
 * @returns {boolean} - True if card matches filter
 */
export function statusMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  return filterValues.includes(card.status);
}

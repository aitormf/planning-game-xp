/**
 * Repository Matcher - Filters cards by repositoryLabel field
 * Simple direct comparison
 */

/**
 * Repository label matcher function
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected repository labels
 * @param {Object} context - Context (not used)
 * @returns {boolean} - True if card matches filter
 */
export function repositoryLabelMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  return filterValues.includes(card.repositoryLabel);
}

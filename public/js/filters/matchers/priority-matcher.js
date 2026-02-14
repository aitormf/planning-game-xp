/**
 * Priority Matcher - Filters cards by calculated priority
 * Priority = (businessPoints / devPoints) * 100
 * High: >= 200, Medium: 100-199, Low: 1-99, Not evaluated: no points
 */

const PRIORITY_THRESHOLDS = {
  High: { min: 200, max: Infinity },
  Medium: { min: 100, max: 199 },
  Low: { min: 1, max: 99 }
};

const NOT_EVALUATED = 'Not evaluated';

/**
 * Calculate priority score for a card
 * @param {Object} card - Card with businessPoints and devPoints
 * @returns {number} - Priority score or 0 if not evaluable
 */
export function calculatePriority(card) {
  if (!card.devPoints || card.devPoints === 0) {
    return 0;
  }
  return (card.businessPoints / card.devPoints) * 100;
}

/**
 * Check if card is not evaluated (missing or zero points)
 * @param {Object} card - Card to check
 * @returns {boolean}
 */
function isNotEvaluated(card) {
  return !card.businessPoints ||
         !card.devPoints ||
         card.businessPoints === 0 ||
         card.devPoints === 0;
}

/**
 * Check if priority falls within a specific range
 * @param {number} priority - Calculated priority
 * @param {string} level - Priority level ('High', 'Medium', 'Low')
 * @returns {boolean}
 */
function matchesPriorityLevel(priority, level) {
  const threshold = PRIORITY_THRESHOLDS[level];
  if (!threshold) {
    return false;
  }
  return priority >= threshold.min && priority <= threshold.max;
}

/**
 * Priority matcher function
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected priority values ('High', 'Medium', 'Low', 'Not evaluated')
 * @param {Object} context - Context (not used)
 * @returns {boolean} - True if card matches filter
 */
export function priorityMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  // Check for "Not evaluated" filter
  if (filterValues.includes(NOT_EVALUATED) && isNotEvaluated(card)) {
    return true;
  }

  // Check priority levels
  const priority = calculatePriority(card);
  const priorityLevels = filterValues.filter(v => v !== NOT_EVALUATED);

  return priorityLevels.some(level => matchesPriorityLevel(priority, level));
}

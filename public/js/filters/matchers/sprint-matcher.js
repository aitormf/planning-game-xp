/**
 * Sprint Matcher - Filters cards by sprint field
 * Supports 'no-sprint' special value for cards without valid sprint
 */

import { hasSpecialValue, getRegularValues } from './base-matcher.js';

const NO_SPRINT = 'no-sprint';

/**
 * Check if a card has a valid sprint
 * @param {Object} card - Card to check
 * @param {Object} context - Context with globalSprintList
 * @returns {boolean}
 */
function hasValidSprint(card, context) {
  if (!card.sprint) {
    return false;
  }

  // Check if sprint exists in global sprint list
  const sprintList = context.globalSprintList || globalThis.globalSprintList;
  if (sprintList && typeof sprintList === 'object') {
    return Boolean(sprintList[card.sprint]);
  }

  // If no sprint list available, consider any non-empty sprint as valid
  return true;
}

/**
 * Sprint matcher function
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected sprint values (may include 'no-sprint')
 * @param {Object} context - Context with globalSprintList
 * @returns {boolean} - True if card matches filter
 */
export function sprintMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  const hasNoSprintFilter = hasSpecialValue(filterValues, NO_SPRINT);
  const specificSprints = getRegularValues(filterValues, NO_SPRINT);
  const cardHasValidSprint = hasValidSprint(card, context);

  // Only "no-sprint" selected - show only cards without valid sprint
  if (hasNoSprintFilter && specificSprints.length === 0) {
    return !cardHasValidSprint;
  }

  // "no-sprint" + specific sprints - show cards without sprint OR matching selected sprints
  if (hasNoSprintFilter && specificSprints.length > 0) {
    return !cardHasValidSprint || specificSprints.includes(card.sprint);
  }

  // Only specific sprints - show only matching sprints
  return specificSprints.includes(card.sprint);
}

/**
 * CompletedInSprint matcher - for bugs that were completed in a specific sprint
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected sprint values
 * @param {Object} context - Context
 * @returns {boolean}
 */
export function completedInSprintMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  const hasNoSprintFilter = hasSpecialValue(filterValues, NO_SPRINT);
  const specificSprints = getRegularValues(filterValues, NO_SPRINT);
  const hasCompletedSprint = card.completedInSprint && card.completedInSprint !== '';

  if (hasNoSprintFilter && specificSprints.length === 0) {
    return !hasCompletedSprint;
  }

  if (hasNoSprintFilter && specificSprints.length > 0) {
    return !hasCompletedSprint || specificSprints.includes(card.completedInSprint);
  }

  return specificSprints.includes(card.completedInSprint);
}

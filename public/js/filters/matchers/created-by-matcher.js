/**
 * CreatedBy Matcher - Filters cards by createdBy field
 * Supports 'no-creator' special value for cards without creator
 */

import { hasSpecialValue, getRegularValues, isEmpty } from './base-matcher.js';

const NO_CREATOR = 'no-creator';

/**
 * Resolve creator to display name
 * @param {string} creatorId - Creator ID or email
 * @param {Object} context - Context with userDirectoryService
 * @returns {string} - Display name or original value
 */
function resolveCreatorName(creatorId, context) {
  if (!creatorId) {
    return '';
  }

  // Try userDirectoryService first
  if (context.userDirectoryService?.getDisplayName) {
    const resolved = context.userDirectoryService.getDisplayName(creatorId);
    if (resolved && resolved !== creatorId) {
      return resolved;
    }
  }

  // Fallback to usersDirectory global
  const usersDir = context.usersDirectory || globalThis.usersDirectory;
  if (usersDir && usersDir[creatorId]) {
    return usersDir[creatorId].displayName || usersDir[creatorId].name || creatorId;
  }

  return creatorId;
}

/**
 * CreatedBy matcher function
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected creator values (may include 'no-creator')
 * @param {Object} context - Context with userDirectoryService
 * @returns {boolean} - True if card matches filter
 */
export function createdByMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  const hasNoCreatorFilter = hasSpecialValue(filterValues, NO_CREATOR);
  const specificCreators = getRegularValues(filterValues, NO_CREATOR);

  const creatorId = card.createdBy;
  const creatorName = resolveCreatorName(creatorId, context);
  const cardHasNoCreator = isEmpty(creatorId) || creatorName === '' || creatorName === 'Sin creador';

  // Only "no-creator" selected - show only cards without creator
  if (hasNoCreatorFilter && specificCreators.length === 0) {
    return cardHasNoCreator;
  }

  // "no-creator" + specific creators - show cards without creator OR matching selected creators
  if (hasNoCreatorFilter && specificCreators.length > 0) {
    return cardHasNoCreator || specificCreators.includes(creatorName) || specificCreators.includes(creatorId);
  }

  // Only specific creators - show only matching creators
  return specificCreators.includes(creatorName) || specificCreators.includes(creatorId);
}

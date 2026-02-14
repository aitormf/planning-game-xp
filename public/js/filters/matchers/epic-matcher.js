/**
 * Epic Matcher - Filters cards by epic field
 * Supports 'no-epic' special value for cards without epic
 */

import { hasSpecialValue, getRegularValues, isEmpty } from './base-matcher.js';

const NO_EPIC = 'no-epic';

/**
 * Epic matcher function
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected epic values (may include 'no-epic')
 * @param {Object} context - Context (not used currently)
 * @returns {boolean} - True if card matches filter
 */
export function epicMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  const hasNoEpicFilter = hasSpecialValue(filterValues, NO_EPIC);
  const specificEpics = getRegularValues(filterValues, NO_EPIC);
  const cardHasNoEpic = isEmpty(card.epic);

  // Only "no-epic" selected - show only cards without epic
  if (hasNoEpicFilter && specificEpics.length === 0) {
    return cardHasNoEpic;
  }

  // "no-epic" + specific epics - show cards without epic OR matching selected epics
  if (hasNoEpicFilter && specificEpics.length > 0) {
    return cardHasNoEpic || specificEpics.includes(card.epic);
  }

  // Only specific epics - show only matching epics
  return specificEpics.includes(card.epic);
}

/**
 * Base matcher utilities for filter matchers
 * All matchers follow the same signature: (card, filterValues, context) => boolean
 */

/**
 * Normalize filter values to array
 * @param {*} values - Filter values (single value or array)
 * @returns {Array}
 */
export function normalizeFilterValues(values) {
  if (values === null || values === undefined) {
    return [];
  }
  return Array.isArray(values) ? values : [values];
}

/**
 * Check if filter has special value (e.g., 'no-sprint', 'no-epic')
 * @param {Array} filterValues - Filter values
 * @param {string} specialValue - Special value to check
 * @returns {boolean}
 */
export function hasSpecialValue(filterValues, specialValue) {
  return filterValues.includes(specialValue);
}

/**
 * Get non-special values from filter values
 * @param {Array} filterValues - Filter values
 * @param {string} specialValue - Special value to exclude
 * @returns {Array}
 */
export function getRegularValues(filterValues, specialValue) {
  return filterValues.filter(v => v !== specialValue);
}

/**
 * Check if a value is empty (null, undefined, empty string)
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isEmpty(value) {
  return value === null || value === undefined || value === '';
}

/**
 * Create a matcher for fields with "no-X" special value support
 * Common pattern: filter by specific values OR by "no-X" (empty value)
 * @param {string} fieldName - Card field name
 * @param {string} specialEmptyValue - Special value for empty (e.g., 'no-sprint')
 * @param {Function} validateValue - Optional function to validate if value is considered valid
 * @returns {Function} Matcher function
 */
export function createFieldWithEmptyMatcher(fieldName, specialEmptyValue, validateValue = null) {
  return (card, filterValues, context) => {
    const hasEmpty = hasSpecialValue(filterValues, specialEmptyValue);
    const regularValues = getRegularValues(filterValues, specialEmptyValue);

    const cardValue = card[fieldName];
    const cardHasNoValue = validateValue
      ? !validateValue(cardValue, context)
      : isEmpty(cardValue);

    // Only special empty value selected - show only cards without value
    if (hasEmpty && regularValues.length === 0) {
      return cardHasNoValue;
    }

    // Special empty + specific values - show cards without value OR matching selected values
    if (hasEmpty && regularValues.length > 0) {
      return cardHasNoValue || regularValues.includes(cardValue);
    }

    // Only specific values - show only matching values
    return filterValues.includes(cardValue);
  };
}

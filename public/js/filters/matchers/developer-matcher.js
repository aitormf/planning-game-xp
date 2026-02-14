/**
 * Developer Matcher - Filters cards by developer field
 * Supports matching by developer ID (dev_XXX) or display name
 */

/**
 * Resolve developer ID to display name using context
 * @param {string} developerId - Developer ID
 * @param {Object} context - Context with entityDirectoryService or globalDeveloperList
 * @returns {string} - Display name or original ID
 */
function resolveDeveloperName(developerId, context) {
  if (!developerId) {
    return '';
  }

  // Try entityDirectoryService first
  if (context.entityDirectoryService?.resolveDeveloper) {
    const resolved = context.entityDirectoryService.resolveDeveloper(developerId);
    if (resolved) {
      return resolved;
    }
  }

  // Fallback to globalDeveloperList
  const globalList = context.globalDeveloperList || globalThis.globalDeveloperList;
  if (globalList && globalList[developerId]) {
    return globalList[developerId].displayName || globalList[developerId].name || developerId;
  }

  return developerId;
}

/**
 * Developer matcher function
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected developer values (can be IDs or display names)
 * @param {Object} context - Context with entityDirectoryService or globalDeveloperList
 * @returns {boolean} - True if card matches filter
 */
export function developerMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  const developerId = card.developer;
  const developerDisplay = resolveDeveloperName(developerId, context);

  // Match by ID or display name
  return filterValues.includes(developerId) || filterValues.includes(developerDisplay);
}

/**
 * Validator matcher - same logic as developer
 * @param {Object} card - Card to check
 * @param {Array} filterValues - Selected validator values
 * @param {Object} context - Context with entityDirectoryService
 * @returns {boolean}
 */
export function validatorMatcher(card, filterValues, context = {}) {
  if (!filterValues || filterValues.length === 0) {
    return true;
  }

  const validatorId = card.validator;
  const validatorDisplay = resolveDeveloperName(validatorId, context);

  return filterValues.includes(validatorId) || filterValues.includes(validatorDisplay);
}

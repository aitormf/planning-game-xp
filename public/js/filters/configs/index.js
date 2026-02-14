/**
 * Filter Configs Index
 */

export { taskFilterConfig } from './task-filter-config.js';
export { bugFilterConfig } from './bug-filter-config.js';

// Registry for all filter configs
const configRegistry = new Map();

/**
 * Register a filter config
 * @param {string} cardType - Card type
 * @param {Object} config - Filter config
 */
export function registerFilterConfig(cardType, config) {
  configRegistry.set(cardType, config);
}

/**
 * Get filter config for a card type
 * @param {string} cardType - Card type
 * @returns {Object|null}
 */
export function getFilterConfig(cardType) {
  return configRegistry.get(cardType) || null;
}

/**
 * Get all registered card types
 * @returns {string[]}
 */
export function getRegisteredCardTypes() {
  return Array.from(configRegistry.keys());
}

// Auto-register task and bug configs
import { taskFilterConfig } from './task-filter-config.js';
import { bugFilterConfig } from './bug-filter-config.js';

registerFilterConfig('task', taskFilterConfig);
registerFilterConfig('bug', bugFilterConfig);

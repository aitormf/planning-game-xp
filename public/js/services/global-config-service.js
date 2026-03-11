/**
 * Global Configuration Service
 * Handles CRUD operations for global AGENTS, PROMPTS, INSTRUCTIONS, and GUIDELINES
 * These are shared across projects and can be selectively assigned to each project
 *
 * Structure:
 * /global/agents/{agentId}/
 *   id, name, description, content, category, createdAt, createdBy, updatedAt, updatedBy
 * /global/prompts/{promptId}/
 *   id, name, description, content, category, createdAt, createdBy, updatedAt, updatedBy
 * /global/instructions/{instructionId}/
 *   id, name, description, content, category, createdAt, createdBy, updatedAt, updatedBy
 * /global/guidelines/{guidelineId}/
 *   id, name, description, content, category, targetFile, version,
 *   createdAt, createdBy, updatedAt, updatedBy
 *
 * /global-history/agents/{agentId}/{historyId}/...
 * /global-history/prompts/{promptId}/{historyId}/...
 * /global-history/instructions/{instructionId}/{historyId}/...
 * /global-history/guidelines/{guidelineId}/{historyId}/...
 */

/**
 * Valid configuration types
 */
export const CONFIG_TYPES = ['agents', 'prompts', 'instructions', 'guidelines'];

/**
 * Valid categories for global configs
 */
export const CONFIG_CATEGORIES = [
  'development',    // Code development
  'planning',       // Planning and estimation
  'qa',             // Testing and quality
  'documentation',  // Documentation
  'architecture'    // Technical decisions
];

class GlobalConfigService {
  constructor() {
    this.cache = new Map(); // key: `${type}/${configId}`
    this.typeCache = new Map(); // key: type, value: array of configs
    this.initialized = false;
  }

  /**
   * Get Firebase modules dynamically
   */
  async getFirebaseModules() {
    const module = await import(
      /* @vite-ignore */ `${window.location.origin}/firebase-config.js`
    );
    return {
      database: module.database,
      ref: module.ref,
      get: module.get,
      set: module.set,
      push: module.push,
      remove: module.remove,
      onValue: module.onValue,
      off: module.off,
      auth: module.auth
    };
  }

  /**
   * Validate config type
   */
  _validateType(type) {
    if (!CONFIG_TYPES.includes(type)) {
      throw new Error(`Invalid config type: ${type}. Valid types: ${CONFIG_TYPES.join(', ')}`);
    }
  }

  /**
   * Get cache key
   */
  _getCacheKey(type, configId) {
    return `${type}/${configId}`;
  }

  /**
   * Get all configs of a specific type
   * @param {string} type - Config type (agents, prompts, instructions)
   * @returns {Promise<Array>} Array of configs
   */
  async getAllConfigs(type) {
    this._validateType(type);

    try {
      const { database, ref, get } = await this.getFirebaseModules();
      const configsRef = ref(database, `global/${type}`);
      const snapshot = await get(configsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const configs = [];
      snapshot.forEach((child) => {
        const config = {
          id: child.key,
          type,
          ...child.val()
        };
        configs.push(config);
        this.cache.set(this._getCacheKey(type, config.id), config);
      });

      // Sort by name
      configs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // Update type cache
      this.typeCache.set(type, configs);

      return configs;
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get a single config
   * @param {string} type - Config type
   * @param {string} configId - Config ID
   * @returns {Promise<Object|null>} Config or null
   */
  async getConfig(type, configId) {
    this._validateType(type);

    // Check cache first
    const cacheKey = this._getCacheKey(type, configId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { database, ref, get } = await this.getFirebaseModules();
      const configRef = ref(database, `global/${type}/${configId}`);
      const snapshot = await get(configRef);

      if (!snapshot.exists()) {
        return null;
      }

      const config = {
        id: configId,
        type,
        ...snapshot.val()
      };

      this.cache.set(cacheKey, config);
      return config;
    } catch (error) {
      console.error(`Error getting ${type}/${configId}:`, error);
      throw error;
    }
  }

  /**
   * Save a config (create or update)
   * @param {string} type - Config type
   * @param {Object} config - Config data
   * @returns {Promise<Object>} Saved config with ID
   */
  async saveConfig(type, config) {
    this._validateType(type);

    try {
      const { database, ref, set, push, get, auth } = await this.getFirebaseModules();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to save configs');
      }

      const now = new Date().toISOString();
      const isNew = !config.id;
      let configId = config.id;
      let previousConfig = null;

      if (isNew) {
        // Create new config
        const configsRef = ref(database, `global/${type}`);
        const newConfigRef = push(configsRef);
        configId = newConfigRef.key;
      } else {
        // Get previous state for history
        const configRef = ref(database, `global/${type}/${configId}`);
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          previousConfig = snapshot.val();
        }
      }

      // Validate category if provided
      const category = config.category || 'development';
      if (!CONFIG_CATEGORIES.includes(category)) {
        throw new Error(`Invalid category: ${category}. Valid categories: ${CONFIG_CATEGORIES.join(', ')}`);
      }

      const configData = {
        name: config.name || 'Untitled',
        description: config.description || '',
        content: config.content || '',
        category: category,
        updatedAt: now,
        updatedBy: currentUser.email
      };

      // Guidelines-specific fields
      if (type === 'guidelines') {
        configData.targetFile = config.targetFile || '';
        configData.version = config.version || '1.0.0';
      }

      if (isNew) {
        configData.createdAt = now;
        configData.createdBy = currentUser.email;
      } else {
        // Preserve creation info
        configData.createdAt = previousConfig?.createdAt || now;
        configData.createdBy = previousConfig?.createdBy || currentUser.email;
      }

      // Save config
      const configRef = ref(database, `global/${type}/${configId}`);
      await set(configRef, configData);

      // Save history
      await this.saveHistory(type, configId, configData, isNew ? 'create' : 'update', currentUser.email);

      // Update cache
      const savedConfig = { id: configId, type, ...configData };
      this.cache.set(this._getCacheKey(type, configId), savedConfig);

      // Invalidate type cache
      this.typeCache.delete(type);

      return savedConfig;
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      throw error;
    }
  }

  /**
   * Delete a config
   * @param {string} type - Config type
   * @param {string} configId - Config ID
   * @returns {Promise<boolean>} Success
   */
  async deleteConfig(type, configId) {
    this._validateType(type);

    try {
      const { database, ref, set, get, remove, auth } = await this.getFirebaseModules();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to delete configs');
      }

      // Get config data before deletion
      const configRef = ref(database, `global/${type}/${configId}`);
      const snapshot = await get(configRef);

      if (!snapshot.exists()) {
        return false;
      }

      const configData = snapshot.val();

      // Move to trash
      const trashRef = ref(database, `global-trash/${type}/${configId}`);
      await set(trashRef, {
        ...configData,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.email
      });

      // Save history
      await this.saveHistory(type, configId, configData, 'delete', currentUser.email);

      // Delete from main location
      await remove(configRef);

      // Remove from cache
      this.cache.delete(this._getCacheKey(type, configId));
      this.typeCache.delete(type);

      return true;
    } catch (error) {
      console.error(`Error deleting ${type}/${configId}:`, error);
      throw error;
    }
  }

  /**
   * Save history entry
   */
  async saveHistory(type, configId, configData, action, userEmail) {
    try {
      const { database, ref, push, set } = await this.getFirebaseModules();

      const historyRef = ref(database, `global-history/${type}/${configId}`);
      const newHistoryRef = push(historyRef);

      const historyEntry = {
        name: configData.name,
        description: configData.description,
        content: configData.content,
        category: configData.category,
        timestamp: new Date().toISOString(),
        changedBy: userEmail,
        action: action
      };

      // Include guidelines-specific fields in history
      if (configData.targetFile !== undefined) {
        historyEntry.targetFile = configData.targetFile;
      }
      if (configData.version !== undefined) {
        historyEntry.version = configData.version;
      }

      await set(newHistoryRef, historyEntry);
    } catch (error) {
      console.error('Error saving history:', error);
      // Don't throw - history is secondary
    }
  }

  /**
   * Get config history
   * @param {string} type - Config type
   * @param {string} configId - Config ID
   * @returns {Promise<Array>} History entries sorted by timestamp desc
   */
  async getConfigHistory(type, configId) {
    this._validateType(type);

    try {
      const { database, ref, get } = await this.getFirebaseModules();
      const historyRef = ref(database, `global-history/${type}/${configId}`);
      const snapshot = await get(historyRef);

      if (!snapshot.exists()) {
        return [];
      }

      const history = [];
      snapshot.forEach((child) => {
        history.push({
          id: child.key,
          ...child.val()
        });
      });

      // Sort by timestamp descending
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return history;
    } catch (error) {
      console.error(`Error getting history for ${type}/${configId}:`, error);
      throw error;
    }
  }

  /**
   * Get configs by category
   * @param {string} type - Config type
   * @param {string} category - Category to filter by
   * @returns {Promise<Array>} Filtered configs
   */
  async getConfigsByCategory(type, category) {
    const configs = await this.getAllConfigs(type);
    return configs.filter(c => c.category === category);
  }

  /**
   * Get all agents
   * @returns {Promise<Array>}
   */
  async getAllAgents() {
    return this.getAllConfigs('agents');
  }

  /**
   * Get all prompts
   * @returns {Promise<Array>}
   */
  async getAllPrompts() {
    return this.getAllConfigs('prompts');
  }

  /**
   * Get all instructions
   * @returns {Promise<Array>}
   */
  async getAllInstructions() {
    return this.getAllConfigs('instructions');
  }

  /**
   * Get all guidelines
   * @returns {Promise<Array>}
   */
  async getAllGuidelines() {
    return this.getAllConfigs('guidelines');
  }

  /**
   * Restore a config to a previous version from history
   * @param {string} type - Config type
   * @param {string} configId - Config ID
   * @param {string} historyId - History entry ID to restore
   * @returns {Promise<Object>} Restored config
   */
  async restoreConfigVersion(type, configId, historyId) {
    this._validateType(type);

    try {
      const { database, ref, get, auth } = await this.getFirebaseModules();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to restore configs');
      }

      // Get history entry
      const historyRef = ref(database, `global-history/${type}/${configId}/${historyId}`);
      const snapshot = await get(historyRef);

      if (!snapshot.exists()) {
        throw new Error(`History entry ${historyId} not found for ${type}/${configId}`);
      }

      const historyData = snapshot.val();

      // Build config from history data
      const restoredConfig = {
        id: configId,
        name: historyData.name,
        description: historyData.description,
        content: historyData.content,
        category: historyData.category
      };

      // Include guidelines-specific fields
      if (type === 'guidelines') {
        restoredConfig.targetFile = historyData.targetFile || '';
        // Increment version on restore
        const currentConfig = await this.getConfig(type, configId);
        const currentVersion = currentConfig?.version || '1.0.0';
        restoredConfig.version = this._incrementVersion(currentVersion);
      }

      return await this.saveConfig(type, restoredConfig);
    } catch (error) {
      console.error(`Error restoring ${type}/${configId} from history ${historyId}:`, error);
      throw error;
    }
  }

  /**
   * Increment a semver-like version string
   * @param {string} version - Current version (e.g. '1.2.3')
   * @returns {string} Incremented version (e.g. '1.2.4')
   */
  _incrementVersion(version) {
    const parts = version.split('.').map(Number);
    if (parts.length === 3) {
      parts[2] += 1;
    }
    return parts.join('.');
  }

  /**
   * Clear cache
   */
  clearCache(type) {
    if (type) {
      this._validateType(type);
      this.typeCache.delete(type);
      // Clear individual caches for this type
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${type}/`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.typeCache.clear();
    }
  }
}

// Export singleton instance
export const globalConfigService = new GlobalConfigService();

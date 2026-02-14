/**
 * ADR (Architecture Decision Records) Service
 * Handles CRUD operations for ADRs stored per project in Firebase Realtime Database
 *
 * Structure:
 * /adrs/{projectId}/{adrId}/
 *   id, title, context, decision, consequences, status, supersededBy, createdAt, createdBy, updatedAt, updatedBy
 *
 * /adr-history/{projectId}/{adrId}/{historyId}/
 *   ...snapshot of adr data with timestamp and action
 */

/**
 * Valid ADR statuses
 */
export const ADR_STATUSES = ['proposed', 'accepted', 'deprecated', 'superseded'];

class AdrService {
  constructor() {
    this.cache = new Map(); // key: `${projectId}/${adrId}`
    this.projectCache = new Map(); // key: projectId, value: array of ADRs
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
   * Get cache key for an ADR
   */
  _getCacheKey(projectId, adrId) {
    return `${projectId}/${adrId}`;
  }

  /**
   * Get all ADRs for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of ADRs
   */
  async getAllAdrs(projectId) {
    if (!projectId) {
      throw new Error('projectId is required');
    }

    try {
      const { database, ref, get } = await this.getFirebaseModules();
      const adrsRef = ref(database, `adrs/${projectId}`);
      const snapshot = await get(adrsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const adrs = [];
      snapshot.forEach((child) => {
        const adr = {
          id: child.key,
          ...child.val()
        };
        adrs.push(adr);
        this.cache.set(this._getCacheKey(projectId, adr.id), adr);
      });

      // Sort by createdAt descending (newest first)
      adrs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      // Update project cache
      this.projectCache.set(projectId, adrs);

      return adrs;
    } catch (error) {
      console.error('Error getting ADRs:', error);
      throw error;
    }
  }

  /**
   * Get a single ADR by ID
   * @param {string} projectId - Project ID
   * @param {string} adrId - ADR ID
   * @returns {Promise<Object|null>} ADR or null
   */
  async getAdr(projectId, adrId) {
    if (!projectId || !adrId) {
      throw new Error('projectId and adrId are required');
    }

    // Check cache first
    const cacheKey = this._getCacheKey(projectId, adrId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { database, ref, get } = await this.getFirebaseModules();
      const adrRef = ref(database, `adrs/${projectId}/${adrId}`);
      const snapshot = await get(adrRef);

      if (!snapshot.exists()) {
        return null;
      }

      const adr = {
        id: adrId,
        projectId,
        ...snapshot.val()
      };

      this.cache.set(cacheKey, adr);
      return adr;
    } catch (error) {
      console.error('Error getting ADR:', error);
      throw error;
    }
  }

  /**
   * Save an ADR (create or update)
   * @param {string} projectId - Project ID
   * @param {Object} adr - ADR data
   * @returns {Promise<Object>} Saved ADR with ID
   */
  async saveAdr(projectId, adr) {
    if (!projectId) {
      throw new Error('projectId is required');
    }

    try {
      const { database, ref, set, push, get, auth } = await this.getFirebaseModules();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to save ADRs');
      }

      const now = new Date().toISOString();
      const isNew = !adr.id;
      let adrId = adr.id;
      let previousAdr = null;

      if (isNew) {
        // Create new ADR
        const adrsRef = ref(database, `adrs/${projectId}`);
        const newAdrRef = push(adrsRef);
        adrId = newAdrRef.key;
      } else {
        // Get previous state for history
        const adrRef = ref(database, `adrs/${projectId}/${adrId}`);
        const snapshot = await get(adrRef);
        if (snapshot.exists()) {
          previousAdr = snapshot.val();
        }
      }

      // Validate status
      const status = adr.status || 'proposed';
      if (!ADR_STATUSES.includes(status)) {
        throw new Error(`Invalid ADR status: ${status}. Valid statuses: ${ADR_STATUSES.join(', ')}`);
      }

      const adrData = {
        title: adr.title || 'Untitled ADR',
        context: adr.context || '',
        decision: adr.decision || '',
        consequences: adr.consequences || '',
        status: status,
        supersededBy: adr.supersededBy || null,
        updatedAt: now,
        updatedBy: currentUser.email
      };

      if (isNew) {
        adrData.createdAt = now;
        adrData.createdBy = currentUser.email;
      } else {
        // Preserve creation info
        adrData.createdAt = previousAdr?.createdAt || now;
        adrData.createdBy = previousAdr?.createdBy || currentUser.email;
      }

      // Save ADR
      const adrRef = ref(database, `adrs/${projectId}/${adrId}`);
      await set(adrRef, adrData);

      // Save history
      await this.saveHistory(projectId, adrId, adrData, isNew ? 'create' : 'update', currentUser.email);

      // Update cache
      const savedAdr = { id: adrId, projectId, ...adrData };
      this.cache.set(this._getCacheKey(projectId, adrId), savedAdr);

      // Invalidate project cache
      this.projectCache.delete(projectId);

      return savedAdr;
    } catch (error) {
      console.error('Error saving ADR:', error);
      throw error;
    }
  }

  /**
   * Delete an ADR
   * @param {string} projectId - Project ID
   * @param {string} adrId - ADR ID
   * @returns {Promise<boolean>} Success
   */
  async deleteAdr(projectId, adrId) {
    if (!projectId || !adrId) {
      throw new Error('projectId and adrId are required');
    }

    try {
      const { database, ref, set, get, remove, auth } = await this.getFirebaseModules();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to delete ADRs');
      }

      // Get ADR data before deletion
      const adrRef = ref(database, `adrs/${projectId}/${adrId}`);
      const snapshot = await get(adrRef);

      if (!snapshot.exists()) {
        return false;
      }

      const adrData = snapshot.val();

      // Move to trash
      const trashRef = ref(database, `adrs-trash/${projectId}/${adrId}`);
      await set(trashRef, {
        ...adrData,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.email
      });

      // Save history
      await this.saveHistory(projectId, adrId, adrData, 'delete', currentUser.email);

      // Delete from main location
      await remove(adrRef);

      // Remove from cache
      this.cache.delete(this._getCacheKey(projectId, adrId));
      this.projectCache.delete(projectId);

      return true;
    } catch (error) {
      console.error('Error deleting ADR:', error);
      throw error;
    }
  }

  /**
   * Save ADR history entry
   * @param {string} projectId - Project ID
   * @param {string} adrId - ADR ID
   * @param {Object} adrData - ADR data
   * @param {string} action - Action type (create, update, delete)
   * @param {string} userEmail - User email
   */
  async saveHistory(projectId, adrId, adrData, action, userEmail) {
    try {
      const { database, ref, push, set } = await this.getFirebaseModules();

      const historyRef = ref(database, `adr-history/${projectId}/${adrId}`);
      const newHistoryRef = push(historyRef);

      await set(newHistoryRef, {
        title: adrData.title,
        context: adrData.context,
        decision: adrData.decision,
        consequences: adrData.consequences,
        status: adrData.status,
        timestamp: new Date().toISOString(),
        changedBy: userEmail,
        action: action
      });
    } catch (error) {
      console.error('Error saving ADR history:', error);
      // Don't throw - history is secondary
    }
  }

  /**
   * Get ADR history
   * @param {string} projectId - Project ID
   * @param {string} adrId - ADR ID
   * @returns {Promise<Array>} History entries sorted by timestamp desc
   */
  async getAdrHistory(projectId, adrId) {
    if (!projectId || !adrId) {
      throw new Error('projectId and adrId are required');
    }

    try {
      const { database, ref, get } = await this.getFirebaseModules();
      const historyRef = ref(database, `adr-history/${projectId}/${adrId}`);
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

      // Sort by timestamp descending (most recent first)
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return history;
    } catch (error) {
      console.error('Error getting ADR history:', error);
      throw error;
    }
  }

  /**
   * Mark an ADR as superseded by another
   * @param {string} projectId - Project ID
   * @param {string} adrId - ADR to supersede
   * @param {string} supersededByAdrId - ID of the new ADR that supersedes this one
   * @returns {Promise<Object>} Updated ADR
   */
  async supersedeAdr(projectId, adrId, supersededByAdrId) {
    const adr = await this.getAdr(projectId, adrId);
    if (!adr) {
      throw new Error('ADR not found');
    }

    return this.saveAdr(projectId, {
      ...adr,
      status: 'superseded',
      supersededBy: supersededByAdrId
    });
  }

  /**
   * Get ADRs by status
   * @param {string} projectId - Project ID
   * @param {string} status - Status to filter by
   * @returns {Promise<Array>} Filtered ADRs
   */
  async getAdrsByStatus(projectId, status) {
    const adrs = await this.getAllAdrs(projectId);
    return adrs.filter(adr => adr.status === status);
  }

  /**
   * Get accepted ADRs for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Accepted ADRs
   */
  async getAcceptedAdrs(projectId) {
    return this.getAdrsByStatus(projectId, 'accepted');
  }

  /**
   * Clear cache for a project
   * @param {string} projectId - Project ID (optional, clears all if not provided)
   */
  clearCache(projectId) {
    if (projectId) {
      // Clear specific project cache
      this.projectCache.delete(projectId);
      // Clear individual ADR caches for this project
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${projectId}/`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all caches
      this.cache.clear();
      this.projectCache.clear();
    }
  }
}

// Export singleton instance
export const adrService = new AdrService();

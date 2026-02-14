/**
 * Advanced Caching Manager for Firebase Data and UI State
 * Implements multiple caching strategies for optimal performance
 */
export class CacheManager {
  static _instance = null;
  static _caches = {
    firebase: new Map(),      // Firebase data cache
    ui: new Map(),           // UI state cache
    computed: new Map(),     // Computed values cache
    assets: new Map()        // Asset cache
  };
  static _config = {
    firebase: { ttl: 5 * 60 * 1000, maxSize: 500 },    // 5 minutes, 500 items
    ui: { ttl: 2 * 60 * 1000, maxSize: 200 },          // 2 minutes, 200 items
    computed: { ttl: 10 * 60 * 1000, maxSize: 100 },   // 10 minutes, 100 items
    assets: { ttl: 30 * 60 * 1000, maxSize: 50 }       // 30 minutes, 50 items
  };
  static _cleanupInterval = null;

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!CacheManager._instance) {
      CacheManager._instance = new CacheManager();
      CacheManager._instance.init();
    }
    return CacheManager._instance;
  }

  /**
   * Initialize cache manager
   */
  init() {
    // Setup periodic cleanup
    this._setupCleanup();
    
    // Setup memory pressure handling
    this._setupMemoryPressureHandling();
    
    // Restore cache from localStorage if available
    this._restoreFromStorage();
}

  /**
   * Setup periodic cache cleanup
   */
  _setupCleanup() {
    CacheManager._cleanupInterval = setInterval(() => {
      this._cleanupExpiredEntries();
      this._enforceMaxSizes();
    }, 60 * 1000); // Every minute
  }

  /**
   * Setup memory pressure handling
   */
  _setupMemoryPressureHandling() {
    // Listen for memory pressure events
    if ('memory' in performance) {
      const checkMemory = () => {
        const memInfo = performance.memory;
        const ratio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        if (ratio > 0.8) {
          console.warn('⚠️ High memory usage detected, clearing caches');
          this.clearAllCaches();
        }
      };

      setInterval(checkMemory, 30 * 1000); // Check every 30 seconds
    }

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._saveToStorage();
      }
    });
  }

  /**
   * Set cache entry with automatic expiration
   */
  set(cacheType, key, value, customTtl = null) {
    if (!CacheManager._caches[cacheType]) {
      console.warn(`⚠️ Invalid cache type: ${cacheType}`);
      return false;
    }

    const cache = CacheManager._caches[cacheType];
    const config = CacheManager._config[cacheType];
    const ttl = customTtl || config.ttl;

    const entry = {
      value,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      hits: 0,
      size: this._calculateSize(value)
    };

    cache.set(key, entry);

    // Enforce max size if needed
    this._enforceMaxSize(cacheType);

    return true;
  }

  /**
   * Get cache entry with hit tracking
   */
  get(cacheType, key) {
    if (!CacheManager._caches[cacheType]) {
      return null;
    }

    const cache = CacheManager._caches[cacheType];
    const entry = cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expires) {
      cache.delete(key);
      return null;
    }

    // Track hit
    entry.hits++;
    entry.lastAccess = Date.now();

    return entry.value;
  }

  /**
   * Check if cache has valid entry
   */
  has(cacheType, key) {
    return this.get(cacheType, key) !== null;
  }

  /**
   * Delete cache entry
   */
  delete(cacheType, key) {
    if (CacheManager._caches[cacheType]) {
      return CacheManager._caches[cacheType].delete(key);
    }
    return false;
  }

  /**
   * Get or set with factory function
   */
  async getOrSet(cacheType, key, factory, customTtl = null) {
    let value = this.get(cacheType, key);
    
    if (value === null) {
      value = await factory();
      this.set(cacheType, key, value, customTtl);
    }
    
    return value;
  }

  /**
   * Cached Firebase data getter
   */
  async getFirebaseData(path, fetchFunction) {
    return this.getOrSet('firebase', path, fetchFunction);
  }

  /**
   * Cached computed value getter
   */
  async getComputedValue(key, computeFunction, dependencies = []) {
    // Create cache key with dependencies hash
    const depHash = this._hashDependencies(dependencies);
    const cacheKey = `${key}:${depHash}`;
    
    return this.getOrSet('computed', cacheKey, computeFunction);
  }

  /**
   * Cache UI state
   */
  setUIState(component, state) {
    const key = `ui:${component}`;
    this.set('ui', key, state);
  }

  /**
   * Get cached UI state
   */
  getUIState(component) {
    const key = `ui:${component}`;
    return this.get('ui', key);
  }

  /**
   * Cache assets (images, files, etc.)
   */
  setAsset(url, blob) {
    this.set('assets', url, blob, CacheManager._config.assets.ttl);
  }

  /**
   * Get cached asset
   */
  getAsset(url) {
    return this.get('assets', url);
  }

  /**
   * Clear specific cache type
   */
  clearCache(cacheType) {
    if (CacheManager._caches[cacheType]) {
      CacheManager._caches[cacheType].clear();
}
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    Object.keys(CacheManager._caches).forEach(type => {
      CacheManager._caches[type].clear();
    });
}

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {};
    
    Object.keys(CacheManager._caches).forEach(type => {
      const cache = CacheManager._caches[type];
      const config = CacheManager._config[type];
      
      let totalSize = 0;
      let totalHits = 0;
      let expiredCount = 0;
      const now = Date.now();
      
      cache.forEach(entry => {
        totalSize += entry.size || 0;
        totalHits += entry.hits || 0;
        if (now > entry.expires) expiredCount++;
      });
      
      stats[type] = {
        entries: cache.size,
        maxSize: config.maxSize,
        totalSize,
        totalHits,
        expiredCount,
        hitRate: cache.size > 0 ? (totalHits / cache.size).toFixed(2) : 0
      };
    });
    
    return stats;
  }

  /**
   * Cleanup expired entries
   */
  _cleanupExpiredEntries() {
    const now = Date.now();
    let totalCleaned = 0;
    
    Object.keys(CacheManager._caches).forEach(type => {
      const cache = CacheManager._caches[type];
      const toDelete = [];
      
      cache.forEach((entry, key) => {
        if (now > entry.expires) {
          toDelete.push(key);
        }
      });
      
      toDelete.forEach(key => cache.delete(key));
      totalCleaned += toDelete.length;
    });
  }

  /**
   * Enforce maximum cache sizes using LRU strategy
   */
  _enforceMaxSizes() {
    Object.keys(CacheManager._caches).forEach(type => {
      this._enforceMaxSize(type);
    });
  }

  /**
   * Enforce max size for specific cache type
   */
  _enforceMaxSize(cacheType) {
    const cache = CacheManager._caches[cacheType];
    const config = CacheManager._config[cacheType];
    
    if (cache.size <= config.maxSize) {
      return;
    }
    
    // Convert to array and sort by last access (LRU)
    const entries = Array.from(cache.entries())
      .sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));
    
    // Remove oldest entries
    const toRemove = cache.size - config.maxSize;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
}

  /**
   * Calculate approximate size of value
   */
  _calculateSize(value) {
    if (typeof value === 'string') {
      return value.length * 2; // Approximate UTF-16
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 8; // Approximate for primitives
  }

  /**
   * Hash dependencies for computed values
   */
  _hashDependencies(dependencies) {
    return dependencies.map(dep => 
      typeof dep === 'object' ? JSON.stringify(dep) : String(dep)
    ).join('|');
  }

  /**
   * Save critical cache data to localStorage
   */
  _saveToStorage() {
    try {
      const criticalData = {
        ui: Array.from(CacheManager._caches.ui.entries()),
        timestamp: Date.now()
      };
      
      localStorage.setItem('cache-manager-backup', JSON.stringify(criticalData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Restore cache from localStorage
   */
  _restoreFromStorage() {
    try {
      const backup = localStorage.getItem('cache-manager-backup');
      if (!backup) return;
      
      const data = JSON.parse(backup);
      const age = Date.now() - data.timestamp;
      
      // Only restore if less than 10 minutes old
      if (age < 10 * 60 * 1000) {
        data.ui.forEach(([key, entry]) => {
          if (Date.now() < entry.expires) {
            CacheManager._caches.ui.set(key, entry);
          }
        });
}
    } catch (error) {
      console.warn('Failed to restore cache from localStorage:', error);
    }
  }

  /**
   * Cleanup on page unload
   */
  static cleanup() {
    if (CacheManager._cleanupInterval) {
      clearInterval(CacheManager._cleanupInterval);
    }
    
    // Save critical data before unload
    CacheManager.getInstance()._saveToStorage();
  }
}

// Setup cleanup on page unload
window.addEventListener('beforeunload', () => {
  CacheManager.cleanup();
});

// Auto-initialize and expose globally
const cacheManager = CacheManager.getInstance();
window.CacheManager = cacheManager;

export default cacheManager;
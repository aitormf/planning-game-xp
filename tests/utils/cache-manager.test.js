import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window, document, localStorage, and performance before importing
vi.stubGlobal('localStorage', {
  _store: {},
  getItem(key) { return this._store[key] ?? null; },
  setItem(key, value) { this._store[key] = String(value); },
  removeItem(key) { delete this._store[key]; },
  clear() { this._store = {}; }
});
vi.stubGlobal('performance', { memory: undefined });
vi.stubGlobal('document', {
  addEventListener: vi.fn(),
  hidden: false
});
vi.stubGlobal('window', {
  addEventListener: vi.fn(),
  CacheManager: null
});

const { CacheManager } = await import('@/utils/cache-manager.js');

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    // Reset static state between tests
    CacheManager._caches.firebase.clear();
    CacheManager._caches.ui.clear();
    CacheManager._caches.computed.clear();
    CacheManager._caches.assets.clear();
    cache = CacheManager.getInstance();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const a = CacheManager.getInstance();
      const b = CacheManager.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('firebase', 'key1', 'value1');
      expect(cache.get('firebase', 'key1')).toBe('value1');
    });

    it('should return null for missing key', () => {
      expect(cache.get('firebase', 'nonexistent')).toBeNull();
    });

    it('should return null for invalid cache type', () => {
      expect(cache.get('invalid', 'key')).toBeNull();
    });

    it('should return false when setting invalid cache type', () => {
      expect(cache.set('invalid', 'key', 'val')).toBe(false);
    });

    it('should store objects', () => {
      const obj = { foo: 'bar', nested: { x: 1 } };
      cache.set('firebase', 'obj', obj);
      expect(cache.get('firebase', 'obj')).toEqual(obj);
    });

    it('should track hits', () => {
      cache.set('firebase', 'hitkey', 'val');
      cache.get('firebase', 'hitkey');
      cache.get('firebase', 'hitkey');
      cache.get('firebase', 'hitkey');
      const entry = CacheManager._caches.firebase.get('hitkey');
      expect(entry.hits).toBe(3);
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', () => {
      cache.set('firebase', 'expired', 'val');
      // Manually expire the entry
      const entry = CacheManager._caches.firebase.get('expired');
      entry.expires = Date.now() - 1000;
      expect(cache.get('firebase', 'expired')).toBeNull();
    });

    it('should accept custom TTL', () => {
      cache.set('firebase', 'custom', 'val', 60000);
      const entry = CacheManager._caches.firebase.get('custom');
      expect(entry.expires).toBeGreaterThan(Date.now());
    });
  });

  describe('has', () => {
    it('should return true when entry exists and not expired', () => {
      cache.set('firebase', 'exists', 'val');
      expect(cache.has('firebase', 'exists')).toBe(true);
    });

    it('should return false when entry does not exist', () => {
      expect(cache.has('firebase', 'nope')).toBe(false);
    });

    it('should return false when entry is expired', () => {
      cache.set('firebase', 'exp', 'val');
      const entry = CacheManager._caches.firebase.get('exp');
      entry.expires = Date.now() - 1;
      expect(cache.has('firebase', 'exp')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an existing entry', () => {
      cache.set('firebase', 'del', 'val');
      expect(cache.delete('firebase', 'del')).toBe(true);
      expect(cache.get('firebase', 'del')).toBeNull();
    });

    it('should return false for invalid cache type', () => {
      expect(cache.delete('invalid', 'key')).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value without calling factory', async () => {
      cache.set('firebase', 'cached', 'existing');
      const factory = vi.fn(() => 'new');
      const result = await cache.getOrSet('firebase', 'cached', factory);
      expect(result).toBe('existing');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result on miss', async () => {
      const factory = vi.fn(() => 'computed');
      const result = await cache.getOrSet('firebase', 'miss', factory);
      expect(result).toBe('computed');
      expect(factory).toHaveBeenCalledOnce();
      expect(cache.get('firebase', 'miss')).toBe('computed');
    });

    it('should handle async factory functions', async () => {
      const factory = vi.fn(async () => 'async-value');
      const result = await cache.getOrSet('firebase', 'async', factory);
      expect(result).toBe('async-value');
    });
  });

  describe('getFirebaseData', () => {
    it('should cache firebase data', async () => {
      const fetch = vi.fn(() => ({ data: 'test' }));
      const result = await cache.getFirebaseData('/path/data', fetch);
      expect(result).toEqual({ data: 'test' });
      expect(fetch).toHaveBeenCalledOnce();

      // Second call should use cache
      const result2 = await cache.getFirebaseData('/path/data', fetch);
      expect(result2).toEqual({ data: 'test' });
      expect(fetch).toHaveBeenCalledOnce();
    });
  });

  describe('UI state', () => {
    it('should store and retrieve UI state', () => {
      cache.setUIState('my-component', { open: true });
      expect(cache.getUIState('my-component')).toEqual({ open: true });
    });

    it('should return null for missing UI state', () => {
      expect(cache.getUIState('unknown')).toBeNull();
    });
  });

  describe('assets', () => {
    it('should store and retrieve assets', () => {
      cache.setAsset('https://example.com/img.png', 'blob-data');
      expect(cache.getAsset('https://example.com/img.png')).toBe('blob-data');
    });

    it('should return null for missing assets', () => {
      expect(cache.getAsset('https://missing.com/x')).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear specific cache type', () => {
      cache.set('firebase', 'a', 1);
      cache.set('ui', 'b', 2);
      cache.clearCache('firebase');
      expect(cache.get('firebase', 'a')).toBeNull();
      expect(cache.get('ui', 'b')).toBe(2);
    });

    it('should handle invalid cache type gracefully', () => {
      expect(() => cache.clearCache('nonexistent')).not.toThrow();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all cache types', () => {
      cache.set('firebase', 'a', 1);
      cache.set('ui', 'b', 2);
      cache.set('computed', 'c', 3);
      cache.set('assets', 'd', 4);
      cache.clearAllCaches();
      expect(cache.get('firebase', 'a')).toBeNull();
      expect(cache.get('ui', 'b')).toBeNull();
      expect(cache.get('computed', 'c')).toBeNull();
      expect(cache.get('assets', 'd')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return statistics for all cache types', () => {
      cache.set('firebase', 'x', 'val');
      cache.get('firebase', 'x');
      const stats = cache.getStats();
      expect(stats.firebase.entries).toBe(1);
      expect(stats.firebase.totalHits).toBe(1);
      expect(stats.ui.entries).toBe(0);
    });

    it('should count expired entries', () => {
      cache.set('firebase', 'exp', 'val');
      CacheManager._caches.firebase.get('exp').expires = Date.now() - 1;
      const stats = cache.getStats();
      expect(stats.firebase.expiredCount).toBe(1);
    });
  });

  describe('_cleanupExpiredEntries', () => {
    it('should remove expired entries', () => {
      cache.set('firebase', 'fresh', 'val1');
      cache.set('firebase', 'stale', 'val2');
      CacheManager._caches.firebase.get('stale').expires = Date.now() - 1;
      cache._cleanupExpiredEntries();
      expect(CacheManager._caches.firebase.has('fresh')).toBe(true);
      expect(CacheManager._caches.firebase.has('stale')).toBe(false);
    });
  });

  describe('_enforceMaxSize', () => {
    it('should remove least recently accessed entries when over max', () => {
      // Temporarily lower max size
      const origMax = CacheManager._config.firebase.maxSize;
      CacheManager._config.firebase.maxSize = 3;

      cache.set('firebase', 'a', 1);
      cache.set('firebase', 'b', 2);
      cache.set('firebase', 'c', 3);
      // Access 'b' and 'c' so 'a' is least recently used
      cache.get('firebase', 'b');
      cache.get('firebase', 'c');

      cache.set('firebase', 'd', 4); // This triggers enforcement
      expect(CacheManager._caches.firebase.size).toBeLessThanOrEqual(3);

      CacheManager._config.firebase.maxSize = origMax;
    });
  });

  describe('_calculateSize', () => {
    it('should calculate string size as length * 2', () => {
      expect(cache._calculateSize('hello')).toBe(10);
    });

    it('should calculate object size via JSON.stringify', () => {
      const size = cache._calculateSize({ a: 1 });
      expect(size).toBe(JSON.stringify({ a: 1 }).length * 2);
    });

    it('should return 8 for primitives', () => {
      expect(cache._calculateSize(42)).toBe(8);
      expect(cache._calculateSize(true)).toBe(8);
    });
  });

  describe('_hashDependencies', () => {
    it('should create consistent hash for same dependencies', () => {
      const hash1 = cache._hashDependencies(['a', 'b', 'c']);
      const hash2 = cache._hashDependencies(['a', 'b', 'c']);
      expect(hash1).toBe(hash2);
    });

    it('should create different hashes for different dependencies', () => {
      const hash1 = cache._hashDependencies(['a', 'b']);
      const hash2 = cache._hashDependencies(['a', 'c']);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle object dependencies', () => {
      const hash = cache._hashDependencies([{ x: 1 }]);
      expect(typeof hash).toBe('string');
      expect(hash).toBe('{"x":1}');
    });

    it('should handle empty dependencies', () => {
      expect(cache._hashDependencies([])).toBe('');
    });
  });

  describe('getComputedValue', () => {
    it('should cache computed values with dependencies', async () => {
      const compute = vi.fn(() => 42);
      const result = await cache.getComputedValue('sum', compute, ['a', 'b']);
      expect(result).toBe(42);

      const result2 = await cache.getComputedValue('sum', compute, ['a', 'b']);
      expect(result2).toBe(42);
      expect(compute).toHaveBeenCalledOnce();
    });

    it('should recompute when dependencies change', async () => {
      const compute = vi.fn(() => 'v1');
      await cache.getComputedValue('val', compute, ['dep1']);

      const compute2 = vi.fn(() => 'v2');
      const result = await cache.getComputedValue('val', compute2, ['dep2']);
      expect(result).toBe('v2');
    });
  });

  describe('_saveToStorage and _restoreFromStorage', () => {
    it('should save UI cache to localStorage', () => {
      cache.set('ui', 'ui:component', { state: 'open' });
      cache._saveToStorage();
      const stored = JSON.parse(localStorage.getItem('cache-manager-backup'));
      expect(stored).toBeTruthy();
      expect(stored.ui.length).toBeGreaterThan(0);
    });

    it('should restore UI cache from localStorage', () => {
      cache.set('ui', 'ui:restored', { data: 'test' });
      cache._saveToStorage();

      // Clear caches
      CacheManager._caches.ui.clear();
      expect(cache.get('ui', 'ui:restored')).toBeNull();

      // Restore
      cache._restoreFromStorage();
      expect(cache.get('ui', 'ui:restored')).toEqual({ data: 'test' });
    });

    it('should not restore data older than 10 minutes', () => {
      const old = {
        ui: [['ui:old', { value: 'stale', expires: Date.now() + 60000, hits: 0, size: 10 }]],
        timestamp: Date.now() - 11 * 60 * 1000
      };
      localStorage.setItem('cache-manager-backup', JSON.stringify(old));
      CacheManager._caches.ui.clear();
      cache._restoreFromStorage();
      expect(cache.get('ui', 'ui:old')).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should clear cleanup interval', () => {
      const clearSpy = vi.spyOn(globalThis, 'clearInterval');
      CacheManager._cleanupInterval = 123;
      CacheManager.cleanup();
      expect(clearSpy).toHaveBeenCalledWith(123);
    });
  });
});

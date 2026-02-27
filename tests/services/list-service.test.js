/**
 * Tests for ListService (mcp/services/list-service.js)
 *
 * Tests the Firebase RTDB-backed list service used by MCP tools
 * for bug priorities, bug statuses, and task statuses.
 *
 * Mocks firebase-adapter.js to avoid real Firebase calls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// In-memory mock data store for Firebase RTDB
// ---------------------------------------------------------------------------
let mockRtdbData = {};

function setMockRtdbData(path, data) {
  const parts = path.split('/').filter(p => p);
  let current = mockRtdbData;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = data;
}

function getNestedValue(obj, path) {
  const parts = path.split('/').filter(p => p);
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function resetMockData() {
  mockRtdbData = {};
}

// Mock ref that resolves data from the in-memory store
class MockRef {
  constructor(path) {
    this.path = path;
  }

  async once() {
    let data = getNestedValue(mockRtdbData, this.path);
    return {
      val: () => (data !== undefined ? data : null),
      exists: () => data !== undefined && data !== null
    };
  }
}

const mockDb = {
  ref: (path) => new MockRef(path)
};

// Mock firebase-adapter before importing the module under test
vi.mock('../../mcp/firebase-adapter.js', () => ({
  getDatabase: () => mockDb
}));

// Dynamic import AFTER mock is in place
const {
  getListTexts,
  getListPairs,
  isValidValue,
  resolveValue,
  invalidateCache
} = await import('../../mcp/services/list-service.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Populate mock data with realistic list values */
function setupMockLists() {
  setMockRtdbData('/data/bugpriorityList', {
    'Application Blocker': 1,
    'Department Blocker': 2,
    'Individual Blocker': 3,
    'User Experience Issue': 4,
    'Workaround Available Issue': 5,
    'Workflow Improvement': 6
  });
  setMockRtdbData('/data/statusList/bug-card', {
    'Created': 1,
    'Assigned': 2,
    'Fixed': 3,
    'Verified': 4,
    'Closed': 5
  });
  setMockRtdbData('/data/statusList/task-card', {
    'To Do': 1,
    'In Progress': 2,
    'To Validate': 3,
    'Done&Validated': 4,
    'Blocked': 5,
    'Reopened': 6
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ListService', () => {
  beforeEach(() => {
    resetMockData();
    invalidateCache();
    setupMockLists();
  });

  // -------------------------------------------------------------------------
  // getListTexts
  // -------------------------------------------------------------------------
  describe('getListTexts', () => {
    it('should return sorted bug priority texts', async () => {
      const texts = await getListTexts('bugPriority');
      expect(texts).toEqual([
        'Application Blocker',
        'Department Blocker',
        'Individual Blocker',
        'User Experience Issue',
        'Workaround Available Issue',
        'Workflow Improvement'
      ]);
    });

    it('should return sorted bug status texts', async () => {
      const texts = await getListTexts('bugStatus');
      expect(texts).toEqual([
        'Created',
        'Assigned',
        'Fixed',
        'Verified',
        'Closed'
      ]);
    });

    it('should return sorted task status texts', async () => {
      const texts = await getListTexts('taskStatus');
      expect(texts).toEqual([
        'To Do',
        'In Progress',
        'To Validate',
        'Done&Validated',
        'Blocked',
        'Reopened'
      ]);
    });

    it('should sort by order value, not alphabetically', async () => {
      resetMockData();
      invalidateCache();
      setMockRtdbData('/data/bugpriorityList', {
        'Zebra': 1,
        'Alpha': 3,
        'Middle': 2
      });
      const texts = await getListTexts('bugPriority');
      expect(texts).toEqual(['Zebra', 'Middle', 'Alpha']);
    });

    it('should throw for unknown list type', async () => {
      await expect(getListTexts('nonexistent'))
        .rejects.toThrow(/Unknown list type/);
    });

    it('should include valid types in the error message for unknown type', async () => {
      await expect(getListTexts('invalidType'))
        .rejects.toThrow(/bugPriority/);
    });

    it('should throw when Firebase returns null data', async () => {
      resetMockData();
      invalidateCache();
      await expect(getListTexts('bugPriority'))
        .rejects.toThrow(/Empty or null data at Firebase path/);
    });

    it('should throw when Firebase returns empty object', async () => {
      setMockRtdbData('/data/bugpriorityList', {});
      invalidateCache('bugPriority');
      await expect(getListTexts('bugPriority'))
        .rejects.toThrow(/Empty or null data/);
    });
  });

  // -------------------------------------------------------------------------
  // getListPairs
  // -------------------------------------------------------------------------
  describe('getListPairs', () => {
    it('should return pairs with id, text, and order fields', async () => {
      const pairs = await getListPairs('bugPriority');
      expect(pairs.length).toBe(6);

      // Verify first and last items
      expect(pairs[0]).toEqual({
        id: 'Application Blocker',
        text: 'Application Blocker',
        order: 1
      });
      expect(pairs[5]).toEqual({
        id: 'Workflow Improvement',
        text: 'Workflow Improvement',
        order: 6
      });
    });

    it('should return pairs sorted by order', async () => {
      const pairs = await getListPairs('bugStatus');
      const orders = pairs.map(p => p.order);
      expect(orders).toEqual([1, 2, 3, 4, 5]);
    });

    it('should have id equal to text for each pair', async () => {
      const pairs = await getListPairs('taskStatus');
      for (const pair of pairs) {
        expect(pair.id).toBe(pair.text);
      }
    });

    it('should return all task statuses', async () => {
      const pairs = await getListPairs('taskStatus');
      expect(pairs).toHaveLength(6);
      const texts = pairs.map(p => p.text);
      expect(texts).toContain('To Do');
      expect(texts).toContain('In Progress');
      expect(texts).toContain('To Validate');
      expect(texts).toContain('Done&Validated');
      expect(texts).toContain('Blocked');
      expect(texts).toContain('Reopened');
    });

    it('should throw for unknown list type', async () => {
      await expect(getListPairs('noSuchList'))
        .rejects.toThrow(/Unknown list type/);
    });
  });

  // -------------------------------------------------------------------------
  // isValidValue
  // -------------------------------------------------------------------------
  describe('isValidValue', () => {
    it('should return true for existing bug priority value', async () => {
      expect(await isValidValue('bugPriority', 'Application Blocker')).toBe(true);
    });

    it('should return true for last bug priority value', async () => {
      expect(await isValidValue('bugPriority', 'Workflow Improvement')).toBe(true);
    });

    it('should return false for non-existing value', async () => {
      expect(await isValidValue('bugPriority', 'High')).toBe(false);
    });

    it('should return false for empty string', async () => {
      expect(await isValidValue('bugPriority', '')).toBe(false);
    });

    it('should return false for wrong casing (strict match)', async () => {
      expect(await isValidValue('bugPriority', 'APPLICATION BLOCKER')).toBe(false);
    });

    it('should return true for valid task status', async () => {
      expect(await isValidValue('taskStatus', 'To Do')).toBe(true);
      expect(await isValidValue('taskStatus', 'In Progress')).toBe(true);
      expect(await isValidValue('taskStatus', 'Done&Validated')).toBe(true);
    });

    it('should return false for task status that belongs to bug list', async () => {
      expect(await isValidValue('taskStatus', 'Created')).toBe(false);
    });

    it('should return true for valid bug status', async () => {
      expect(await isValidValue('bugStatus', 'Created')).toBe(true);
      expect(await isValidValue('bugStatus', 'Closed')).toBe(true);
    });

    it('should return false for bug status that belongs to task list', async () => {
      expect(await isValidValue('bugStatus', 'To Do')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // resolveValue
  // -------------------------------------------------------------------------
  describe('resolveValue', () => {
    it('should resolve exact match', async () => {
      const resolved = await resolveValue('bugPriority', 'Application Blocker');
      expect(resolved).toBe('Application Blocker');
    });

    it('should resolve UPPER CASE to canonical form', async () => {
      const resolved = await resolveValue('bugPriority', 'APPLICATION BLOCKER');
      expect(resolved).toBe('Application Blocker');
    });

    it('should resolve lowercase to canonical form', async () => {
      const resolved = await resolveValue('bugPriority', 'application blocker');
      expect(resolved).toBe('Application Blocker');
    });

    it('should resolve mixed case to canonical form', async () => {
      const resolved = await resolveValue('bugPriority', 'aPpLiCaTiOn BlOcKeR');
      expect(resolved).toBe('Application Blocker');
    });

    it('should resolve case-insensitive task status', async () => {
      const resolved = await resolveValue('taskStatus', 'to do');
      expect(resolved).toBe('To Do');
    });

    it('should resolve case-insensitive bug status', async () => {
      const resolved = await resolveValue('bugStatus', 'CREATED');
      expect(resolved).toBe('Created');
    });

    it('should resolve special characters correctly (Done&Validated)', async () => {
      const resolved = await resolveValue('taskStatus', 'done&validated');
      expect(resolved).toBe('Done&Validated');
    });

    it('should throw for completely invalid value', async () => {
      await expect(resolveValue('bugPriority', 'NONEXISTENT'))
        .rejects.toThrow(/Invalid bugPriority value/);
    });

    it('should throw for invalid bug status', async () => {
      await expect(resolveValue('bugStatus', 'Unknown'))
        .rejects.toThrow(/Invalid bugStatus value/);
    });

    it('should include valid values in the error message', async () => {
      try {
        await resolveValue('bugPriority', 'invalid');
      } catch (error) {
        expect(error.message).toContain('Application Blocker');
        expect(error.message).toContain('Workflow Improvement');
      }
    });

    it('should throw for unknown list type', async () => {
      await expect(resolveValue('unknown', 'someValue'))
        .rejects.toThrow(/Unknown list type/);
    });
  });

  // -------------------------------------------------------------------------
  // invalidateCache
  // -------------------------------------------------------------------------
  describe('invalidateCache', () => {
    it('should clear specific list cache', async () => {
      // Populate cache
      await getListTexts('bugPriority');

      // Change underlying data
      setMockRtdbData('/data/bugpriorityList', { 'New Priority': 1 });

      // Without invalidation, cached data is returned
      const cachedTexts = await getListTexts('bugPriority');
      expect(cachedTexts).toContain('Application Blocker');

      // After invalidation, fresh data is returned
      invalidateCache('bugPriority');
      const freshTexts = await getListTexts('bugPriority');
      expect(freshTexts).toEqual(['New Priority']);
    });

    it('should not affect other list caches when invalidating a specific type', async () => {
      // Populate both caches
      await getListTexts('bugPriority');
      await getListTexts('bugStatus');

      // Change both
      setMockRtdbData('/data/bugpriorityList', { 'Changed Priority': 1 });
      setMockRtdbData('/data/statusList/bug-card', { 'Changed Status': 1 });

      // Only invalidate bugPriority
      invalidateCache('bugPriority');

      // bugPriority should be refreshed
      const priorities = await getListTexts('bugPriority');
      expect(priorities).toEqual(['Changed Priority']);

      // bugStatus should still be cached (old data)
      const statuses = await getListTexts('bugStatus');
      expect(statuses).toContain('Created');
    });

    it('should clear all caches when called without argument', async () => {
      // Populate all caches
      await getListTexts('bugPriority');
      await getListTexts('bugStatus');
      await getListTexts('taskStatus');

      // Change all underlying data
      setMockRtdbData('/data/bugpriorityList', { 'Changed': 1 });
      setMockRtdbData('/data/statusList/bug-card', { 'NewBugStatus': 1 });
      setMockRtdbData('/data/statusList/task-card', { 'NewTaskStatus': 1 });

      // Invalidate all
      invalidateCache();

      const priorities = await getListTexts('bugPriority');
      const bugStatuses = await getListTexts('bugStatus');
      const taskStatuses = await getListTexts('taskStatus');

      expect(priorities).toEqual(['Changed']);
      expect(bugStatuses).toEqual(['NewBugStatus']);
      expect(taskStatuses).toEqual(['NewTaskStatus']);
    });
  });

  // -------------------------------------------------------------------------
  // Cache behavior
  // -------------------------------------------------------------------------
  describe('cache behavior', () => {
    it('should use cached data for subsequent calls', async () => {
      const texts1 = await getListTexts('bugPriority');

      // Change the underlying data
      setMockRtdbData('/data/bugpriorityList', { 'New Priority': 1 });

      // Should still return cached (old) data
      const texts2 = await getListTexts('bugPriority');
      expect(texts2).toEqual(texts1);
    });

    it('should return fresh data after invalidation', async () => {
      await getListTexts('bugPriority');

      setMockRtdbData('/data/bugpriorityList', { 'Fresh Priority': 1 });
      invalidateCache('bugPriority');

      const texts = await getListTexts('bugPriority');
      expect(texts).toEqual(['Fresh Priority']);
    });

    it('should refresh cache after TTL expires', async () => {
      // Use fake timers to test TTL
      vi.useFakeTimers();

      try {
        const texts1 = await getListTexts('bugPriority');
        expect(texts1).toContain('Application Blocker');

        // Change data
        setMockRtdbData('/data/bugpriorityList', { 'After TTL': 1 });

        // Advance time past the 5-minute TTL
        vi.advanceTimersByTime(5 * 60 * 1000 + 1);

        // Should now fetch fresh data
        const texts2 = await getListTexts('bugPriority');
        expect(texts2).toEqual(['After TTL']);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should still use cache before TTL expires', async () => {
      vi.useFakeTimers();

      try {
        await getListTexts('bugPriority');

        setMockRtdbData('/data/bugpriorityList', { 'Too Early': 1 });

        // Advance time but NOT past TTL (4 minutes < 5 minutes)
        vi.advanceTimersByTime(4 * 60 * 1000);

        const texts = await getListTexts('bugPriority');
        // Should still return cached data, not the new data
        expect(texts).toContain('Application Blocker');
        expect(texts).not.toContain('Too Early');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should cache independently per list type', async () => {
      const priorities = await getListTexts('bugPriority');
      const statuses = await getListTexts('bugStatus');

      expect(priorities).not.toEqual(statuses);
      expect(priorities).toContain('Application Blocker');
      expect(statuses).toContain('Created');
    });
  });

  // -------------------------------------------------------------------------
  // Error cases
  // -------------------------------------------------------------------------
  describe('error cases', () => {
    it('should throw when Firebase returns null data', async () => {
      resetMockData();
      invalidateCache();
      await expect(getListTexts('bugPriority'))
        .rejects.toThrow(/Empty or null data/);
    });

    it('should throw when Firebase returns empty object', async () => {
      setMockRtdbData('/data/bugpriorityList', {});
      invalidateCache('bugPriority');
      await expect(getListTexts('bugPriority'))
        .rejects.toThrow(/Empty or null data/);
    });

    it('should include the Firebase path in the error message for empty data', async () => {
      resetMockData();
      invalidateCache();
      try {
        await getListTexts('bugPriority');
      } catch (error) {
        expect(error.message).toContain('/data/bugpriorityList');
      }
    });

    it('should throw for unknown list type in all exported functions', async () => {
      const unknownType = 'nonExistentType';

      await expect(getListTexts(unknownType)).rejects.toThrow(/Unknown list type/);
      await expect(getListPairs(unknownType)).rejects.toThrow(/Unknown list type/);
      await expect(isValidValue(unknownType, 'value')).rejects.toThrow(/Unknown list type/);
      await expect(resolveValue(unknownType, 'value')).rejects.toThrow(/Unknown list type/);
    });

    it('should propagate Firebase read errors', async () => {
      // Override the mock to simulate a Firebase failure
      const originalRef = mockDb.ref;
      mockDb.ref = () => ({
        once: async () => { throw new Error('Firebase connection failed'); }
      });

      invalidateCache('bugPriority');

      await expect(getListTexts('bugPriority'))
        .rejects.toThrow('Firebase connection failed');

      // Restore original mock
      mockDb.ref = originalRef;
    });

    it('should not cache failed requests', async () => {
      // Simulate a failure
      const originalRef = mockDb.ref;
      mockDb.ref = () => ({
        once: async () => { throw new Error('Transient failure'); }
      });

      invalidateCache('bugPriority');

      await expect(getListTexts('bugPriority'))
        .rejects.toThrow('Transient failure');

      // Restore and verify a subsequent call succeeds
      mockDb.ref = originalRef;

      const texts = await getListTexts('bugPriority');
      expect(texts).toContain('Application Blocker');
    });

    it('should throw when Firebase returns a non-object (string)', async () => {
      setMockRtdbData('/data/bugpriorityList', 'not an object');
      invalidateCache('bugPriority');
      await expect(getListTexts('bugPriority'))
        .rejects.toThrow(/Empty or null data/);
    });

    it('should throw when Firebase returns a non-object (number)', async () => {
      setMockRtdbData('/data/bugpriorityList', 42);
      invalidateCache('bugPriority');
      await expect(getListTexts('bugPriority'))
        .rejects.toThrow(/Empty or null data/);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { FirestoreBaseRepository } from '../../shared/dal/firestore/base-firestore-repository.js';

function createInMemoryFirestoreAdapter() {
  const store = {};

  function getKey(collection, docId) {
    return `${collection}/${docId}`;
  }

  function getCollection(collectionPath) {
    const result = {};
    const prefix = collectionPath + '/';
    for (const [key, val] of Object.entries(store)) {
      if (key.startsWith(prefix)) {
        const docId = key.slice(prefix.length);
        if (!docId.includes('/')) {
          result[docId] = val;
        }
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }

  return {
    _store: store,
    async getDoc(collectionPath, docId) {
      return store[getKey(collectionPath, docId)] ?? null;
    },
    async listDocs(collectionPath) {
      return getCollection(collectionPath);
    },
    async setDoc(collectionPath, docId, data) {
      store[getKey(collectionPath, docId)] = { ...data };
    },
    async updateDoc(collectionPath, docId, updates) {
      const key = getKey(collectionPath, docId);
      store[key] = { ...(store[key] || {}), ...updates };
    },
    async addDoc(collectionPath, data) {
      const id = `auto-${Object.keys(store).length}`;
      store[getKey(collectionPath, id)] = { ...data };
      return id;
    },
    async deleteDoc(collectionPath, docId) {
      delete store[getKey(collectionPath, docId)];
    },
    subscribe(collectionPath, docId, callback) {
      if (docId) {
        callback(store[getKey(collectionPath, docId)] ?? null);
      } else {
        callback(getCollection(collectionPath));
      }
      return () => {};
    },
    async query(collectionPath, filters) {
      const all = getCollection(collectionPath) || {};
      const result = {};
      for (const [id, doc] of Object.entries(all)) {
        let match = true;
        for (const [field, value] of Object.entries(filters)) {
          if (doc[field] !== value) { match = false; break; }
        }
        if (match) result[id] = doc;
      }
      return result;
    },
    async transaction(fn) {
      const txnHelper = {
        async get(collectionPath, docId) {
          return store[getKey(collectionPath, docId)] ?? null;
        },
        async set(collectionPath, docId, data) {
          store[getKey(collectionPath, docId)] = { ...data };
        }
      };
      return fn(txnHelper);
    },
    batch() {
      const ops = [];
      return {
        set(collectionPath, docId, data) {
          ops.push(() => { store[getKey(collectionPath, docId)] = { ...data }; });
        },
        delete(collectionPath, docId) {
          ops.push(() => { delete store[getKey(collectionPath, docId)]; });
        },
        async commit() { ops.forEach(op => op()); }
      };
    }
  };
}

describe('FirestoreBaseRepository', () => {
  it('should require an adapter', () => {
    expect(() => new FirestoreBaseRepository(null)).toThrow('requires an adapter');
  });

  it('should have firestore as backend', () => {
    const adapter = createInMemoryFirestoreAdapter();
    const repo = new FirestoreBaseRepository(adapter);
    expect(repo.backend).toBe('firestore');
  });

  describe('parsePath', () => {
    it('should parse collection/doc paths', () => {
      const result = FirestoreBaseRepository.parsePath('/projects/PlanningGame');
      expect(result).toEqual({ collection: 'projects', docId: 'PlanningGame' });
    });

    it('should parse collection-only paths', () => {
      const result = FirestoreBaseRepository.parsePath('/projects');
      expect(result).toEqual({ collection: 'projects', docId: null });
    });

    it('should handle nested paths', () => {
      const result = FirestoreBaseRepository.parsePath('projects/PlanningGame/tasks/abc123');
      expect(result).toEqual({ collection: 'projects/PlanningGame/tasks', docId: 'abc123' });
    });

    it('should strip leading/trailing slashes', () => {
      const result = FirestoreBaseRepository.parsePath('/a/b/');
      expect(result).toEqual({ collection: 'a', docId: 'b' });
    });
  });

  describe('CRUD operations', () => {
    let repo, adapter;

    function setup() {
      adapter = createInMemoryFirestoreAdapter();
      repo = new FirestoreBaseRepository(adapter);
    }

    it('should read a document', async () => {
      setup();
      adapter._store['projects/PG'] = { name: 'Planning Game' };
      const result = await repo.read('/projects/PG');
      expect(result).toEqual({ name: 'Planning Game' });
    });

    it('should return null for missing document', async () => {
      setup();
      const result = await repo.read('/projects/missing');
      expect(result).toBeNull();
    });

    it('should list collection documents', async () => {
      setup();
      adapter._store['projects/PG'] = { name: 'PG' };
      adapter._store['projects/C4D'] = { name: 'C4D' };
      const result = await repo.read('/projects');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should write a document', async () => {
      setup();
      await repo.write('/projects/PG', { name: 'PG' });
      expect(adapter._store['projects/PG']).toEqual({ name: 'PG' });
    });

    it('should update a document', async () => {
      setup();
      adapter._store['projects/PG'] = { name: 'PG', version: '1.0' };
      await repo.update('/projects/PG', { version: '2.0' });
      expect(adapter._store['projects/PG'].version).toBe('2.0');
      expect(adapter._store['projects/PG'].name).toBe('PG');
    });

    it('should push and return auto-generated ID', async () => {
      setup();
      const id = await repo.push('/projects/PG/tasks', { title: 'New' });
      expect(id).toBeTruthy();
      expect(adapter._store[`projects/PG/tasks/${id}`]).toEqual({ title: 'New' });
    });

    it('should remove a document', async () => {
      setup();
      adapter._store['projects/PG'] = { data: true };
      await repo.remove('/projects/PG');
      expect(adapter._store['projects/PG']).toBeUndefined();
    });

    it('should run transactions', async () => {
      setup();
      adapter._store['counters/PLN-TSK'] = { lastId: 5 };
      const result = await repo.transaction('/counters/PLN-TSK', (current) => ({
        lastId: (current?.lastId || 0) + 1
      }));
      expect(result).toEqual({ lastId: 6 });
    });

    it('should perform batch operations via multiUpdate', async () => {
      setup();
      await repo.multiUpdate({
        'projects/A': { name: 'A' },
        'projects/B': { name: 'B' }
      });
      expect(adapter._store['projects/A']).toEqual({ name: 'A' });
      expect(adapter._store['projects/B']).toEqual({ name: 'B' });
    });

    it('should delete via multiUpdate with null', async () => {
      setup();
      adapter._store['projects/X'] = { data: true };
      await repo.multiUpdate({ 'projects/X': null });
      expect(adapter._store['projects/X']).toBeUndefined();
    });
  });
});

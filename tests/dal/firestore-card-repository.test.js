import { describe, it, expect, beforeEach } from 'vitest';
import { FirestoreCardRepository } from '../../shared/dal/firestore/firestore-card-repository.js';
import { FirestoreBaseRepository } from '../../shared/dal/firestore/base-firestore-repository.js';

function createInMemoryFirestoreAdapter() {
  const store = {};
  function key(c, d) { return `${c}/${d}`; }
  function getCol(prefix) {
    const result = {};
    const p = prefix + '/';
    for (const [k, v] of Object.entries(store)) {
      if (k.startsWith(p) && !k.slice(p.length).includes('/')) {
        result[k.slice(p.length)] = v;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }

  return {
    _store: store,
    async getDoc(c, d) { return store[key(c, d)] ?? null; },
    async listDocs(c) { return getCol(c); },
    async setDoc(c, d, data) { store[key(c, d)] = { ...data }; },
    async updateDoc(c, d, updates) { store[key(c, d)] = { ...(store[key(c, d)] || {}), ...updates }; },
    async addDoc(c, data) {
      const id = `-fs-${Object.keys(store).length}`;
      store[key(c, id)] = { ...data };
      return id;
    },
    async deleteDoc(c, d) { delete store[key(c, d)]; },
    subscribe(c, d, cb) { cb(d ? (store[key(c, d)] ?? null) : getCol(c)); return () => {}; },
    async query(c, filters) {
      const all = getCol(c) || {};
      const result = {};
      for (const [id, doc] of Object.entries(all)) {
        let match = true;
        for (const [f, v] of Object.entries(filters)) {
          if (doc[f] !== v) { match = false; break; }
        }
        if (match) result[id] = doc;
      }
      return result;
    },
    async transaction() {},
    batch() { return { set() {}, delete() {}, async commit() {} }; }
  };
}

describe('FirestoreCardRepository', () => {
  let repo, adapter;

  beforeEach(() => {
    adapter = createInMemoryFirestoreAdapter();
    const baseRepo = new FirestoreBaseRepository(adapter);
    repo = new FirestoreCardRepository(baseRepo);
  });

  describe('listCards', () => {
    it('should return empty object when no cards', async () => {
      const result = await repo.listCards('PG', 'task');
      expect(result).toEqual({});
    });

    it('should return all cards without filters', async () => {
      adapter._store['projects/PG/tasks/-id1'] = { cardId: 'PG-TSK-0001', status: 'To Do' };
      adapter._store['projects/PG/tasks/-id2'] = { cardId: 'PG-TSK-0002', status: 'Done' };

      const result = await repo.listCards('PG', 'task');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should filter by status using Firestore query', async () => {
      adapter._store['projects/PG/tasks/-id1'] = { status: 'To Do' };
      adapter._store['projects/PG/tasks/-id2'] = { status: 'Done' };

      const result = await repo.listCards('PG', 'task', { status: 'To Do' });
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('getCard', () => {
    it('should return card data', async () => {
      adapter._store['projects/PG/tasks/-id1'] = { title: 'Task 1' };
      const result = await repo.getCard('PG', 'task', '-id1');
      expect(result.title).toBe('Task 1');
    });

    it('should return null for missing card', async () => {
      const result = await repo.getCard('PG', 'task', '-missing');
      expect(result).toBeNull();
    });
  });

  describe('findCardByCardId', () => {
    it('should find by cardId with type', async () => {
      adapter._store['projects/PG/tasks/-id1'] = { cardId: 'PG-TSK-0001', title: 'Found' };

      const result = await repo.findCardByCardId('PG', 'PG-TSK-0001', 'task');
      expect(result).not.toBeNull();
      expect(result.firebaseId).toBe('-id1');
      expect(result.type).toBe('task');
    });

    it('should search all types when type not specified', async () => {
      adapter._store['projects/PG/bugs/-bugId'] = { cardId: 'PG-BUG-0001' };

      const result = await repo.findCardByCardId('PG', 'PG-BUG-0001');
      expect(result).not.toBeNull();
      expect(result.type).toBe('bug');
    });

    it('should return null when not found', async () => {
      const result = await repo.findCardByCardId('PG', 'PG-TSK-9999');
      expect(result).toBeNull();
    });
  });

  describe('createCard', () => {
    it('should create card and return ID', async () => {
      const result = await repo.createCard('PG', 'task', { title: 'New' });
      expect(result.firebaseId).toBeTruthy();
      expect(adapter._store[`projects/PG/tasks/${result.firebaseId}`]).toEqual({ title: 'New' });
    });
  });

  describe('updateCard', () => {
    it('should update fields', async () => {
      adapter._store['projects/PG/tasks/-id1'] = { status: 'To Do' };
      await repo.updateCard('PG', 'task', '-id1', { status: 'In Progress' });
      expect(adapter._store['projects/PG/tasks/-id1'].status).toBe('In Progress');
    });
  });

  describe('deleteCard', () => {
    it('should move to trash and remove', async () => {
      adapter._store['projects/PG/tasks/-id1'] = { title: 'Delete Me' };

      await repo.deleteCard('PG', 'task', '-id1', { deletedAt: '2026-03-08' });

      expect(adapter._store['projects/PG/tasks/-id1']).toBeUndefined();
      const trashed = adapter._store['projects/PG/trash/tasks/-id1'];
      expect(trashed).toBeDefined();
      expect(trashed.title).toBe('Delete Me');
      expect(trashed.deletedAt).toBe('2026-03-08');
    });
  });

  describe('subscribeToCard', () => {
    it('should call callback', () => {
      adapter._store['projects/PG/tasks/-id1'] = { title: 'Sub' };

      let received = null;
      repo.subscribeToCard('PG', 'task', '-id1', (data) => { received = data; });
      expect(received).toEqual({ title: 'Sub' });
    });
  });

  describe('invalid type', () => {
    it('should throw for invalid card type', async () => {
      await expect(repo.listCards('PG', 'invalid')).rejects.toThrow('Invalid card type');
    });
  });
});

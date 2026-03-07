import { describe, it, expect, beforeEach } from 'vitest';
import { RtdbCardRepository } from '../../shared/dal/rtdb/rtdb-card-repository.js';
import { RtdbBaseRepository } from '../../shared/dal/rtdb/base-rtdb-repository.js';

function createInMemoryAdapter() {
  const store = {};
  return {
    _store: store,
    async read(path) { return store[path] ?? null; },
    async write(path, data) { store[path] = data; },
    async update(path, updates) {
      store[path] = { ...(store[path] || {}), ...updates };
    },
    async push(path, data) {
      const key = `-push-${Object.keys(store).length}`;
      store[`${path}/${key}`] = data;
      return key;
    },
    async remove(path) { delete store[path]; },
    subscribe(path, cb) { cb(store[path] ?? null); return () => {}; },
    async transaction(path, fn) { store[path] = fn(store[path]); return store[path]; },
    async multiUpdate(updates) {
      for (const [p, v] of Object.entries(updates)) {
        if (v === null) delete store[p];
        else store[p] = v;
      }
    }
  };
}

describe('RtdbCardRepository', () => {
  let repo, adapter;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    const baseRepo = new RtdbBaseRepository(adapter);
    repo = new RtdbCardRepository(baseRepo);
  });

  describe('listCards', () => {
    it('should return empty object when no cards exist', async () => {
      const result = await repo.listCards('TestProject', 'task');
      expect(result).toEqual({});
    });

    it('should return all cards without filters', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject'] = {
        '-id1': { cardId: 'TP-TSK-0001', title: 'Task 1', status: 'To Do' },
        '-id2': { cardId: 'TP-TSK-0002', title: 'Task 2', status: 'In Progress' }
      };

      const result = await repo.listCards('TestProject', 'task');
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should filter by status', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject'] = {
        '-id1': { cardId: 'TP-TSK-0001', status: 'To Do' },
        '-id2': { cardId: 'TP-TSK-0002', status: 'In Progress' },
        '-id3': { cardId: 'TP-TSK-0003', status: 'To Do' }
      };

      const result = await repo.listCards('TestProject', 'task', { status: 'To Do' });
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['-id1'].status).toBe('To Do');
    });

    it('should filter by year', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject'] = {
        '-id1': { cardId: 'TP-TSK-0001', year: 2025 },
        '-id2': { cardId: 'TP-TSK-0002', year: 2026 }
      };

      const result = await repo.listCards('TestProject', 'task', { year: 2026 });
      expect(Object.keys(result)).toHaveLength(1);
      expect(result['-id2'].year).toBe(2026);
    });

    it('should filter by developer', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject'] = {
        '-id1': { developer: 'dev_001' },
        '-id2': { developer: 'dev_016' }
      };

      const result = await repo.listCards('TestProject', 'task', { developer: 'dev_016' });
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should combine multiple filters', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject'] = {
        '-id1': { status: 'To Do', year: 2026, developer: 'dev_001' },
        '-id2': { status: 'To Do', year: 2026, developer: 'dev_016' },
        '-id3': { status: 'In Progress', year: 2026, developer: 'dev_016' }
      };

      const result = await repo.listCards('TestProject', 'task', {
        status: 'To Do',
        developer: 'dev_016'
      });
      expect(Object.keys(result)).toHaveLength(1);
      expect(Object.keys(result)[0]).toBe('-id2');
    });
  });

  describe('getCard', () => {
    it('should return card data', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject/-id1'] = {
        cardId: 'TP-TSK-0001',
        title: 'Test Task'
      };

      const result = await repo.getCard('TestProject', 'task', '-id1');
      expect(result.title).toBe('Test Task');
    });

    it('should return null for missing card', async () => {
      const result = await repo.getCard('TestProject', 'task', '-nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findCardByCardId', () => {
    it('should find card by cardId with type hint', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject'] = {
        '-id1': { cardId: 'TP-TSK-0001', title: 'Found' }
      };

      const result = await repo.findCardByCardId('TestProject', 'TP-TSK-0001', 'task');
      expect(result).not.toBeNull();
      expect(result.firebaseId).toBe('-id1');
      expect(result.type).toBe('task');
      expect(result.data.title).toBe('Found');
    });

    it('should search all types when type not specified', async () => {
      adapter._store['/cards/TestProject/BUGS_TestProject'] = {
        '-bugId': { cardId: 'TP-BUG-0001', title: 'A Bug' }
      };

      const result = await repo.findCardByCardId('TestProject', 'TP-BUG-0001');
      expect(result).not.toBeNull();
      expect(result.type).toBe('bug');
    });

    it('should return null when card not found', async () => {
      const result = await repo.findCardByCardId('TestProject', 'TP-TSK-9999');
      expect(result).toBeNull();
    });
  });

  describe('createCard', () => {
    it('should push new card and return firebaseId', async () => {
      const data = { cardId: 'TP-TSK-0001', title: 'New Task' };
      const result = await repo.createCard('TestProject', 'task', data);

      expect(result.firebaseId).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(adapter._store[`/cards/TestProject/TASKS_TestProject/${result.firebaseId}`]).toEqual(data);
    });
  });

  describe('updateCard', () => {
    it('should update card fields', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject/-id1'] = {
        cardId: 'TP-TSK-0001',
        status: 'To Do'
      };

      await repo.updateCard('TestProject', 'task', '-id1', { status: 'In Progress' });
      expect(adapter._store['/cards/TestProject/TASKS_TestProject/-id1'].status).toBe('In Progress');
    });
  });

  describe('deleteCard', () => {
    it('should move card to trash and remove from original path', async () => {
      adapter._store['/cards/TestProject/TASKS_TestProject/-id1'] = {
        cardId: 'TP-TSK-0001',
        title: 'To Delete'
      };

      await repo.deleteCard('TestProject', 'task', '-id1', {
        deletedAt: '2026-03-08',
        deletedBy: 'test'
      });

      expect(adapter._store['/cards/TestProject/TASKS_TestProject/-id1']).toBeUndefined();
      const trashData = adapter._store['/trash/cards/TestProject/TASKS_TestProject/-id1'];
      expect(trashData).toBeDefined();
      expect(trashData.title).toBe('To Delete');
      expect(trashData.deletedAt).toBe('2026-03-08');
    });

    it('should handle deleting non-existent card gracefully', async () => {
      await repo.deleteCard('TestProject', 'task', '-nonexistent');
      // Should not throw
    });
  });

  describe('subscribeToCard', () => {
    it('should call callback with card data', () => {
      adapter._store['/cards/TestProject/TASKS_TestProject/-id1'] = {
        title: 'Subscribed'
      };

      let received = null;
      const unsub = repo.subscribeToCard('TestProject', 'task', '-id1', (data) => {
        received = data;
      });

      expect(received).toEqual({ title: 'Subscribed' });
      expect(typeof unsub).toBe('function');
    });
  });
});

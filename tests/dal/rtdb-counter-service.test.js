import { describe, it, expect, beforeEach } from 'vitest';
import { RtdbCounterService } from '../../shared/dal/rtdb/rtdb-counter-service.js';

function createInMemoryCounterAdapter() {
  const store = {};
  return {
    _store: store,
    async runTransaction(counterKey) {
      const current = store[counterKey] || 0;
      store[counterKey] = current + 1;
      return store[counterKey];
    },
    async getCurrentId(counterKey) {
      return store[counterKey] || 0;
    }
  };
}

describe('RtdbCounterService', () => {
  let service, adapter;

  beforeEach(() => {
    adapter = createInMemoryCounterAdapter();
    service = new RtdbCounterService(adapter);
  });

  it('should require an adapter', () => {
    expect(() => new RtdbCounterService(null)).toThrow('requires a Firestore adapter');
  });

  describe('nextId', () => {
    it('should return formatted ID starting from 1', async () => {
      const id = await service.nextId('PLN-TSK');
      expect(id).toBe('PLN-TSK-0001');
    });

    it('should increment on each call', async () => {
      await service.nextId('PLN-TSK');
      const id2 = await service.nextId('PLN-TSK');
      expect(id2).toBe('PLN-TSK-0002');
    });

    it('should maintain separate counters per key', async () => {
      await service.nextId('PLN-TSK');
      await service.nextId('PLN-TSK');
      const bugId = await service.nextId('PLN-BUG');

      expect(bugId).toBe('PLN-BUG-0001');
      expect(adapter._store['PLN-TSK']).toBe(2);
      expect(adapter._store['PLN-BUG']).toBe(1);
    });
  });

  describe('currentId', () => {
    it('should return 0 when counter does not exist', async () => {
      const current = await service.currentId('PLN-TSK');
      expect(current).toBe(0);
    });

    it('should return current value without incrementing', async () => {
      await service.nextId('PLN-TSK');
      await service.nextId('PLN-TSK');

      const current = await service.currentId('PLN-TSK');
      expect(current).toBe(2);

      // Should not have incremented
      const stillCurrent = await service.currentId('PLN-TSK');
      expect(stillCurrent).toBe(2);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { RtdbBaseRepository, createAdminAdapter } from '../../shared/dal/rtdb/base-rtdb-repository.js';

function createMockAdminDb() {
  const store = {};
  const mockRef = (path) => ({
    async once() {
      return { val: () => store[path] ?? null };
    },
    async set(data) { store[path] = data; },
    async update(updates) {
      store[path] = { ...(store[path] || {}), ...updates };
    },
    push() {
      const key = `-mock-${Date.now()}`;
      const childPath = `${path}/${key}`;
      return {
        key,
        async set(data) { store[childPath] = data; }
      };
    },
    async remove() { delete store[path]; },
    on: vi.fn(),
    off: vi.fn(),
    async transaction(fn) {
      const current = store[path] ?? null;
      const newVal = fn(current);
      store[path] = newVal;
      return { committed: true, snapshot: { val: () => newVal } };
    }
  });

  return {
    ref: vi.fn((path) => path ? mockRef(path) : {
      async update(pathUpdates) {
        for (const [p, v] of Object.entries(pathUpdates)) {
          if (v === null) delete store[p];
          else store[p] = v;
        }
      }
    }),
    _store: store
  };
}

describe('RtdbBaseRepository', () => {
  it('should require an adapter', () => {
    expect(() => new RtdbBaseRepository(null)).toThrow('requires an adapter');
  });

  it('should have rtdb as backend', () => {
    const db = createMockAdminDb();
    const adapter = createAdminAdapter(db);
    const repo = new RtdbBaseRepository(adapter);
    expect(repo.backend).toBe('rtdb');
  });
});

describe('RtdbBaseRepository with Admin adapter', () => {
  let db, repo;

  function setup() {
    db = createMockAdminDb();
    const adapter = createAdminAdapter(db);
    repo = new RtdbBaseRepository(adapter);
  }

  it('should read data', async () => {
    setup();
    db._store['/test/path'] = { name: 'hello' };
    const result = await repo.read('/test/path');
    expect(result).toEqual({ name: 'hello' });
  });

  it('should return null for missing data', async () => {
    setup();
    const result = await repo.read('/nonexistent');
    expect(result).toBeNull();
  });

  it('should write data', async () => {
    setup();
    await repo.write('/test/write', { value: 42 });
    expect(db._store['/test/write']).toEqual({ value: 42 });
  });

  it('should update data', async () => {
    setup();
    db._store['/test/update'] = { a: 1, b: 2 };
    await repo.update('/test/update', { b: 3, c: 4 });
    expect(db._store['/test/update']).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should push data and return key', async () => {
    setup();
    const key = await repo.push('/test/push', { item: 'data' });
    expect(key).toMatch(/^-mock-/);
    expect(db._store[`/test/push/${key}`]).toEqual({ item: 'data' });
  });

  it('should remove data', async () => {
    setup();
    db._store['/test/remove'] = { data: true };
    await repo.remove('/test/remove');
    expect(db._store['/test/remove']).toBeUndefined();
  });

  it('should run transactions', async () => {
    setup();
    db._store['/test/counter'] = 5;
    const result = await repo.transaction('/test/counter', (current) => current + 1);
    expect(result).toBe(6);
    expect(db._store['/test/counter']).toBe(6);
  });

  it('should perform multi-path updates', async () => {
    setup();
    await repo.multiUpdate({
      '/a': { val: 1 },
      '/b': { val: 2 },
      '/c': null
    });
    expect(db._store['/a']).toEqual({ val: 1 });
    expect(db._store['/b']).toEqual({ val: 2 });
    expect(db._store['/c']).toBeUndefined();
  });
});

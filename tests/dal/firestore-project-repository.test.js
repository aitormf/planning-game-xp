import { describe, it, expect, beforeEach } from 'vitest';
import { FirestoreProjectRepository } from '../../shared/dal/firestore/firestore-project-repository.js';
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
    async addDoc() { return 'auto'; },
    async deleteDoc(c, d) { delete store[key(c, d)]; },
    subscribe() { return () => {}; },
    async query() { return {}; },
    async transaction() {},
    batch() { return { set() {}, delete() {}, async commit() {} }; }
  };
}

describe('FirestoreProjectRepository', () => {
  let repo, adapter;

  beforeEach(() => {
    adapter = createInMemoryFirestoreAdapter();
    const baseRepo = new FirestoreBaseRepository(adapter);
    repo = new FirestoreProjectRepository(baseRepo);
  });

  describe('listProjects', () => {
    it('should return all projects', async () => {
      adapter._store['projects/PG'] = { name: 'PG', abbreviation: 'PLN' };
      adapter._store['projects/C4D'] = { name: 'C4D', abbreviation: 'C4D' };

      const result = await repo.listProjects();
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should return empty when no projects', async () => {
      const result = await repo.listProjects();
      expect(result).toEqual({});
    });
  });

  describe('getProject', () => {
    it('should return project', async () => {
      adapter._store['projects/PG'] = { name: 'Planning Game' };
      const result = await repo.getProject('PG');
      expect(result.name).toBe('Planning Game');
    });

    it('should return null for missing', async () => {
      const result = await repo.getProject('missing');
      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should write project', async () => {
      await repo.createProject('New', { name: 'New Project' });
      expect(adapter._store['projects/New'].name).toBe('New Project');
    });
  });

  describe('updateProject', () => {
    it('should update fields', async () => {
      adapter._store['projects/PG'] = { name: 'PG', version: '1.0' };
      await repo.updateProject('PG', { version: '2.0' });
      expect(adapter._store['projects/PG'].version).toBe('2.0');
    });
  });

  describe('getProjectAbbreviation', () => {
    it('should return abbreviation', async () => {
      adapter._store['projects/PG'] = { abbreviation: 'PLN' };
      expect(await repo.getProjectAbbreviation('PG')).toBe('PLN');
    });

    it('should return null for missing project', async () => {
      expect(await repo.getProjectAbbreviation('X')).toBeNull();
    });
  });

  describe('getProjectScoringSystem', () => {
    it('should return scoring system', async () => {
      adapter._store['projects/PG'] = { scoringSystem: 'fibonacci' };
      expect(await repo.getProjectScoringSystem('PG')).toBe('fibonacci');
    });

    it('should default to 1-5', async () => {
      adapter._store['projects/PG'] = { name: 'PG' };
      expect(await repo.getProjectScoringSystem('PG')).toBe('1-5');
    });
  });
});

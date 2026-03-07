import { describe, it, expect, beforeEach } from 'vitest';
import { RtdbProjectRepository } from '../../shared/dal/rtdb/rtdb-project-repository.js';
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
    async push() { return '-key'; },
    async remove(path) { delete store[path]; },
    subscribe() { return () => {}; },
    async transaction() {},
    async multiUpdate() {}
  };
}

describe('RtdbProjectRepository', () => {
  let repo, adapter;

  beforeEach(() => {
    adapter = createInMemoryAdapter();
    const baseRepo = new RtdbBaseRepository(adapter);
    repo = new RtdbProjectRepository(baseRepo);
  });

  describe('listProjects', () => {
    it('should return all projects', async () => {
      adapter._store['/projects'] = {
        PlanningGame: { name: 'Planning Game', abbreviation: 'PLN' },
        Cinema4D: { name: 'Cinema4D', abbreviation: 'C4D' }
      };

      const result = await repo.listProjects();
      expect(Object.keys(result)).toHaveLength(2);
      expect(result.PlanningGame.name).toBe('Planning Game');
    });

    it('should return empty object when no projects exist', async () => {
      const result = await repo.listProjects();
      expect(result).toEqual({});
    });
  });

  describe('getProject', () => {
    it('should return project data', async () => {
      adapter._store['/projects/PlanningGame'] = {
        name: 'Planning Game',
        abbreviation: 'PLN'
      };

      const result = await repo.getProject('PlanningGame');
      expect(result.name).toBe('Planning Game');
    });

    it('should return null for missing project', async () => {
      const result = await repo.getProject('NonExistent');
      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should write project data', async () => {
      await repo.createProject('NewProject', { name: 'New', abbreviation: 'NEW' });
      expect(adapter._store['/projects/NewProject'].name).toBe('New');
    });
  });

  describe('updateProject', () => {
    it('should update project fields', async () => {
      adapter._store['/projects/PlanningGame'] = {
        name: 'Planning Game',
        version: '1.0.0'
      };

      await repo.updateProject('PlanningGame', { version: '2.0.0' });
      expect(adapter._store['/projects/PlanningGame'].version).toBe('2.0.0');
      expect(adapter._store['/projects/PlanningGame'].name).toBe('Planning Game');
    });
  });

  describe('getProjectAbbreviation', () => {
    it('should return abbreviation', async () => {
      adapter._store['/projects/PlanningGame'] = { abbreviation: 'PLN' };
      const result = await repo.getProjectAbbreviation('PlanningGame');
      expect(result).toBe('PLN');
    });

    it('should return null when project not found', async () => {
      const result = await repo.getProjectAbbreviation('NonExistent');
      expect(result).toBeNull();
    });
  });

  describe('getProjectScoringSystem', () => {
    it('should return scoring system', async () => {
      adapter._store['/projects/PlanningGame'] = { scoringSystem: 'fibonacci' };
      const result = await repo.getProjectScoringSystem('PlanningGame');
      expect(result).toBe('fibonacci');
    });

    it('should default to 1-5', async () => {
      adapter._store['/projects/PlanningGame'] = { name: 'PG' };
      const result = await repo.getProjectScoringSystem('PlanningGame');
      expect(result).toBe('1-5');
    });

    it('should default to 1-5 when project not found', async () => {
      const result = await repo.getProjectScoringSystem('NonExistent');
      expect(result).toBe('1-5');
    });
  });
});

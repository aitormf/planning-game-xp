import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadSwitchProjectRepository } from '../../shared/dal/read-switch-project-repository.js';

function createMockProjectRepo(name, data = {}) {
  return {
    _repo: {},
    name,
    listProjects: vi.fn().mockResolvedValue(data.listProjects ?? {}),
    getProject: vi.fn().mockResolvedValue(data.getProject ?? null),
    createProject: vi.fn().mockResolvedValue(undefined),
    updateProject: vi.fn().mockResolvedValue(undefined),
    getProjectAbbreviation: vi.fn().mockResolvedValue(data.abbreviation ?? null),
    getProjectScoringSystem: vi.fn().mockResolvedValue(data.scoring ?? '1-5')
  };
}

describe('ReadSwitchProjectRepository', () => {
  let firestore, rtdb, writer, repo;

  beforeEach(() => {
    firestore = createMockProjectRepo('firestore', {
      listProjects: { PG: { name: 'PG' } },
      getProject: { name: 'PG', abbreviation: 'PLN' },
      abbreviation: 'PLN',
      scoring: 'fibonacci'
    });
    rtdb = createMockProjectRepo('rtdb', {
      listProjects: { PG: { name: 'PG-RTDB' } },
      getProject: { name: 'PG-RTDB' },
      abbreviation: 'PLN-RTDB',
      scoring: 'fibonacci'
    });
    writer = createMockProjectRepo('writer');
  });

  describe('reads from Firestore (no fallback)', () => {
    beforeEach(() => {
      repo = new ReadSwitchProjectRepository(firestore, rtdb, writer);
    });

    it('listProjects reads from Firestore', async () => {
      const result = await repo.listProjects();
      expect(firestore.listProjects).toHaveBeenCalled();
      expect(rtdb.listProjects).not.toHaveBeenCalled();
      expect(result).toEqual({ PG: { name: 'PG' } });
    });

    it('getProject reads from Firestore', async () => {
      const result = await repo.getProject('PG');
      expect(firestore.getProject).toHaveBeenCalledWith('PG');
      expect(rtdb.getProject).not.toHaveBeenCalled();
      expect(result.name).toBe('PG');
    });

    it('getProjectAbbreviation reads from Firestore', async () => {
      const result = await repo.getProjectAbbreviation('PG');
      expect(result).toBe('PLN');
      expect(rtdb.getProjectAbbreviation).not.toHaveBeenCalled();
    });

    it('returns null when Firestore has no data and fallback disabled', async () => {
      firestore.getProject.mockResolvedValue(null);
      const result = await repo.getProject('Missing');
      expect(result).toBeNull();
      expect(rtdb.getProject).not.toHaveBeenCalled();
    });
  });

  describe('reads with migration fallback enabled', () => {
    let onFallback;

    beforeEach(() => {
      onFallback = vi.fn();
      repo = new ReadSwitchProjectRepository(firestore, rtdb, writer, {
        migrationFallback: true,
        onFallback
      });
    });

    it('does not fallback when Firestore has data', async () => {
      const result = await repo.getProject('PG');
      expect(result.name).toBe('PG');
      expect(rtdb.getProject).not.toHaveBeenCalled();
      expect(onFallback).not.toHaveBeenCalled();
    });

    it('falls back to RTDB when Firestore returns null for getProject', async () => {
      firestore.getProject.mockResolvedValue(null);
      const result = await repo.getProject('PG');
      expect(result.name).toBe('PG-RTDB');
      expect(onFallback).toHaveBeenCalledWith('getProject', { projectId: 'PG' });
    });

    it('falls back to RTDB when Firestore returns empty for listProjects', async () => {
      firestore.listProjects.mockResolvedValue({});
      const result = await repo.listProjects();
      expect(result).toEqual({ PG: { name: 'PG-RTDB' } });
      expect(onFallback).toHaveBeenCalledWith('listProjects', {});
    });

    it('falls back for getProjectAbbreviation', async () => {
      firestore.getProjectAbbreviation.mockResolvedValue(null);
      const result = await repo.getProjectAbbreviation('PG');
      expect(result).toBe('PLN-RTDB');
      expect(onFallback).toHaveBeenCalledWith('getProjectAbbreviation', { projectId: 'PG' });
    });
  });

  describe('writes delegate to writer', () => {
    beforeEach(() => {
      repo = new ReadSwitchProjectRepository(firestore, rtdb, writer);
    });

    it('createProject delegates to writer', async () => {
      await repo.createProject('New', { name: 'New' });
      expect(writer.createProject).toHaveBeenCalledWith('New', { name: 'New' });
      expect(firestore.createProject).not.toHaveBeenCalled();
    });

    it('updateProject delegates to writer', async () => {
      await repo.updateProject('PG', { version: '2.0' });
      expect(writer.updateProject).toHaveBeenCalledWith('PG', { version: '2.0' });
    });
  });
});

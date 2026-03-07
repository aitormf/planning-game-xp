import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualWriteProjectRepository } from '../../shared/dal/dual-write-project-repository.js';

function createMockProjectRepo(name = 'mock') {
  return {
    _repo: {},
    name,
    listProjects: vi.fn().mockResolvedValue({ PG: { name: 'PG' } }),
    getProject: vi.fn().mockResolvedValue({ name: 'PG', abbreviation: 'PLN' }),
    createProject: vi.fn().mockResolvedValue(undefined),
    updateProject: vi.fn().mockResolvedValue(undefined),
    getProjectAbbreviation: vi.fn().mockResolvedValue('PLN'),
    getProjectScoringSystem: vi.fn().mockResolvedValue('1-5')
  };
}

describe('DualWriteProjectRepository', () => {
  let primary, secondary, dual;

  beforeEach(() => {
    primary = createMockProjectRepo('primary');
    secondary = createMockProjectRepo('secondary');
    dual = new DualWriteProjectRepository(primary, secondary);
  });

  describe('reads delegate to primary only', () => {
    it('listProjects reads from primary', async () => {
      const result = await dual.listProjects();
      expect(primary.listProjects).toHaveBeenCalled();
      expect(secondary.listProjects).not.toHaveBeenCalled();
      expect(result).toEqual({ PG: { name: 'PG' } });
    });

    it('getProject reads from primary', async () => {
      await dual.getProject('PG');
      expect(primary.getProject).toHaveBeenCalledWith('PG');
      expect(secondary.getProject).not.toHaveBeenCalled();
    });

    it('getProjectAbbreviation reads from primary', async () => {
      const result = await dual.getProjectAbbreviation('PG');
      expect(result).toBe('PLN');
      expect(secondary.getProjectAbbreviation).not.toHaveBeenCalled();
    });

    it('getProjectScoringSystem reads from primary', async () => {
      const result = await dual.getProjectScoringSystem('PG');
      expect(result).toBe('1-5');
      expect(secondary.getProjectScoringSystem).not.toHaveBeenCalled();
    });
  });

  describe('writes go to both backends', () => {
    it('createProject writes to both', async () => {
      await dual.createProject('NewProj', { name: 'New' });
      expect(primary.createProject).toHaveBeenCalledWith('NewProj', { name: 'New' });
      expect(secondary.createProject).toHaveBeenCalledWith('NewProj', { name: 'New' });
    });

    it('updateProject writes to both', async () => {
      await dual.updateProject('PG', { version: '2.0' });
      expect(primary.updateProject).toHaveBeenCalledWith('PG', { version: '2.0' });
      expect(secondary.updateProject).toHaveBeenCalledWith('PG', { version: '2.0' });
    });
  });

  describe('shadow write error handling', () => {
    it('should not throw when secondary fails', async () => {
      secondary.updateProject.mockRejectedValue(new Error('Firestore down'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(dual.updateProject('PG', { v: '2' })).resolves.toBeUndefined();
      expect(primary.updateProject).toHaveBeenCalled();
    });

    it('should call custom error handler when provided', async () => {
      const handler = vi.fn();
      const customDual = new DualWriteProjectRepository(primary, secondary, { onShadowError: handler });
      secondary.createProject.mockRejectedValue(new Error('Timeout'));

      await customDual.createProject('X', { name: 'X' });

      expect(handler).toHaveBeenCalledWith('createProject', expect.any(Error));
    });

    it('should throw when primary fails', async () => {
      primary.createProject.mockRejectedValue(new Error('RTDB down'));

      await expect(dual.createProject('X', { name: 'X' })).rejects.toThrow('RTDB down');
    });
  });
});

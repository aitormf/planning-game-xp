import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRef = vi.fn();
const mockOnce = vi.fn();

vi.mock('../../mcp/firebase-adapter.js', () => ({
  getDatabase: () => ({ ref: mockRef })
}));

const { resolveProjectId, discoverProjectByRepo, normalizeRepoUrl, invalidateProjectCache, loadProjects } = await import('../../mcp/services/project-resolver.js');

const MOCK_PROJECTS = {
  PlanningGame: {
    name: 'Planning Game',
    abbreviation: 'PLN',
    repoUrl: 'https://github.com/manufosela/planning-game-xp'
  },
  Cinema4D: {
    name: 'Cinema4D',
    abbreviation: 'C4D',
    repoUrl: 'https://github.com/geniova/cinema4d'
  },
  KarajanCode: {
    name: 'Karajan Code',
    abbreviation: 'KJC',
    repoUrl: 'git@github.com:geniova/karajan-code.git'
  }
};

function setupMockProjects(projects = MOCK_PROJECTS) {
  mockRef.mockImplementation(() => ({
    once: vi.fn().mockResolvedValue({
      val: () => projects
    })
  }));
}

describe('project-resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateProjectCache();
  });

  describe('resolveProjectId', () => {
    it('should return exact match on key with wasResolved=false', async () => {
      setupMockProjects();

      const result = await resolveProjectId('PlanningGame');

      expect(result).toEqual({
        resolvedId: 'PlanningGame',
        wasResolved: false,
        input: 'PlanningGame'
      });
    });

    it('should resolve case-insensitive key match', async () => {
      setupMockProjects();

      const result = await resolveProjectId('planninggame');

      expect(result).toEqual({
        resolvedId: 'PlanningGame',
        wasResolved: true,
        input: 'planninggame'
      });
    });

    it('should resolve by project name (case-insensitive)', async () => {
      setupMockProjects();

      const result = await resolveProjectId('Planning Game');

      expect(result).toEqual({
        resolvedId: 'PlanningGame',
        wasResolved: true,
        input: 'Planning Game'
      });
    });

    it('should resolve by project name case-insensitively', async () => {
      setupMockProjects();

      const result = await resolveProjectId('karajan code');

      expect(result).toEqual({
        resolvedId: 'KarajanCode',
        wasResolved: true,
        input: 'karajan code'
      });
    });

    it('should resolve by abbreviation (case-insensitive)', async () => {
      setupMockProjects();

      const result = await resolveProjectId('pln');

      expect(result).toEqual({
        resolvedId: 'PlanningGame',
        wasResolved: true,
        input: 'pln'
      });
    });

    it('should resolve by HTTPS repoUrl', async () => {
      setupMockProjects();

      const result = await resolveProjectId('https://github.com/manufosela/planning-game-xp');

      expect(result).toEqual({
        resolvedId: 'PlanningGame',
        wasResolved: true,
        input: 'https://github.com/manufosela/planning-game-xp'
      });
    });

    it('should resolve by SSH repoUrl with .git suffix', async () => {
      setupMockProjects();

      const result = await resolveProjectId('git@github.com:geniova/karajan-code.git');

      expect(result).toEqual({
        resolvedId: 'KarajanCode',
        wasResolved: true,
        input: 'git@github.com:geniova/karajan-code.git'
      });
    });

    it('should throw with available projects when no match found', async () => {
      setupMockProjects();

      await expect(resolveProjectId('NoExiste')).rejects.toThrow('Project "NoExiste" not found');
      await expect(resolveProjectId('NoExiste')).rejects.toThrow('PlanningGame');
    });

    it('should throw when input is empty', async () => {
      await expect(resolveProjectId('')).rejects.toThrow('projectId is required');
    });

    it('should throw when input is null', async () => {
      await expect(resolveProjectId(null)).rejects.toThrow('projectId is required');
    });

    it('should throw when input is undefined', async () => {
      await expect(resolveProjectId(undefined)).rejects.toThrow('projectId is required');
    });

    it('should use cache on second call', async () => {
      setupMockProjects();

      await resolveProjectId('PlanningGame');
      await resolveProjectId('Cinema4D');

      // ref() should have been called only once (first loadProjects call)
      expect(mockRef).toHaveBeenCalledTimes(1);
    });

    it('should reload from Firebase after invalidateProjectCache()', async () => {
      setupMockProjects();

      await resolveProjectId('PlanningGame');
      expect(mockRef).toHaveBeenCalledTimes(1);

      invalidateProjectCache();
      await resolveProjectId('PlanningGame');

      expect(mockRef).toHaveBeenCalledTimes(2);
    });

    it('should trim whitespace from input', async () => {
      setupMockProjects();

      const result = await resolveProjectId('  PlanningGame  ');

      expect(result.resolvedId).toBe('PlanningGame');
    });
  });

  describe('discoverProjectByRepo', () => {
    it('should find project by exact HTTPS URL', async () => {
      setupMockProjects();

      const result = await discoverProjectByRepo('https://github.com/manufosela/planning-game-xp');

      expect(result.resolvedId).toBe('PlanningGame');
      expect(result.project.name).toBe('Planning Game');
    });

    it('should find project by SSH URL', async () => {
      setupMockProjects();

      const result = await discoverProjectByRepo('git@github.com:geniova/karajan-code.git');

      expect(result.resolvedId).toBe('KarajanCode');
    });

    it('should find project by URL with trailing slash', async () => {
      setupMockProjects();

      const result = await discoverProjectByRepo('https://github.com/manufosela/planning-game-xp/');

      expect(result.resolvedId).toBe('PlanningGame');
    });

    it('should find project by URL with .git suffix when stored without it', async () => {
      setupMockProjects();

      const result = await discoverProjectByRepo('https://github.com/manufosela/planning-game-xp.git');

      expect(result.resolvedId).toBe('PlanningGame');
    });

    it('should throw when no project matches the URL', async () => {
      setupMockProjects();

      await expect(
        discoverProjectByRepo('https://github.com/unknown/repo')
      ).rejects.toThrow('No project found with repository URL');
    });

    it('should throw when repoUrl is empty', async () => {
      await expect(discoverProjectByRepo('')).rejects.toThrow('repoUrl is required');
    });

    it('should throw when repoUrl is null', async () => {
      await expect(discoverProjectByRepo(null)).rejects.toThrow('repoUrl is required');
    });
  });

  describe('normalizeRepoUrl', () => {
    it('should normalize HTTPS URL', () => {
      expect(normalizeRepoUrl('https://github.com/user/repo')).toBe('github.com/user/repo');
    });

    it('should normalize SSH URL', () => {
      expect(normalizeRepoUrl('git@github.com:user/repo.git')).toBe('github.com/user/repo');
    });

    it('should remove trailing .git', () => {
      expect(normalizeRepoUrl('https://github.com/user/repo.git')).toBe('github.com/user/repo');
    });

    it('should remove trailing slash', () => {
      expect(normalizeRepoUrl('https://github.com/user/repo/')).toBe('github.com/user/repo');
    });

    it('should handle HTTP URL', () => {
      expect(normalizeRepoUrl('http://github.com/user/repo')).toBe('github.com/user/repo');
    });

    it('should be case-insensitive', () => {
      expect(normalizeRepoUrl('HTTPS://GitHub.COM/User/Repo')).toBe('github.com/user/repo');
    });

    it('should return empty string for null/undefined', () => {
      expect(normalizeRepoUrl(null)).toBe('');
      expect(normalizeRepoUrl(undefined)).toBe('');
      expect(normalizeRepoUrl('')).toBe('');
    });
  });

  describe('loadProjects', () => {
    it('should throw when no projects exist in Firebase', async () => {
      mockRef.mockImplementation(() => ({
        once: vi.fn().mockResolvedValue({ val: () => null })
      }));

      await expect(loadProjects()).rejects.toThrow('No projects found in Firebase');
    });
  });
});

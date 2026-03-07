import { describe, it, expect } from 'vitest';
import { ProjectRepository } from '../../shared/dal/project-repository.js';
import { BaseRepository } from '../../shared/dal/base-repository.js';

class StubBase extends BaseRepository {
  constructor() { super('stub'); }
}

class ConcreteProjectRepo extends ProjectRepository {
  constructor() { super(new StubBase()); }
}

describe('ProjectRepository', () => {
  it('should not allow direct instantiation', () => {
    expect(() => new ProjectRepository(new StubBase())).toThrow('ProjectRepository is abstract');
  });

  it('should allow subclass instantiation', () => {
    const repo = new ConcreteProjectRepo();
    expect(repo._repo.backend).toBe('stub');
  });

  describe('abstract methods throw', () => {
    const repo = new ConcreteProjectRepo();

    it('listProjects()', async () => {
      await expect(repo.listProjects()).rejects.toThrow('Not implemented: listProjects()');
    });

    it('getProject()', async () => {
      await expect(repo.getProject('P')).rejects.toThrow('Not implemented: getProject()');
    });

    it('createProject()', async () => {
      await expect(repo.createProject('P', {})).rejects.toThrow('Not implemented: createProject()');
    });

    it('updateProject()', async () => {
      await expect(repo.updateProject('P', {})).rejects.toThrow('Not implemented: updateProject()');
    });

    it('getProjectAbbreviation()', async () => {
      await expect(repo.getProjectAbbreviation('P')).rejects.toThrow('Not implemented: getProjectAbbreviation()');
    });

    it('getProjectScoringSystem()', async () => {
      await expect(repo.getProjectScoringSystem('P')).rejects.toThrow('Not implemented: getProjectScoringSystem()');
    });
  });

  describe('static helpers', () => {
    it('basePath returns /projects', () => {
      expect(ProjectRepository.basePath).toBe('/projects');
    });

    it('buildPath() returns correct path', () => {
      expect(ProjectRepository.buildPath('PlanningGame')).toBe('/projects/PlanningGame');
    });
  });
});

/**
 * @fileoverview RTDB implementation of ProjectRepository.
 *
 * @module shared/dal/rtdb/rtdb-project-repository
 */

import { ProjectRepository } from '../project-repository.js';

export class RtdbProjectRepository extends ProjectRepository {
  /**
   * @param {import('./base-rtdb-repository.js').RtdbBaseRepository} baseRepo
   */
  constructor(baseRepo) {
    super(baseRepo);
  }

  async listProjects() {
    return await this._repo.read(ProjectRepository.basePath) || {};
  }

  async getProject(projectId) {
    return this._repo.read(ProjectRepository.buildPath(projectId));
  }

  async createProject(projectId, data) {
    await this._repo.write(ProjectRepository.buildPath(projectId), data);
  }

  async updateProject(projectId, updates) {
    await this._repo.update(ProjectRepository.buildPath(projectId), updates);
  }

  async getProjectAbbreviation(projectId) {
    const project = await this._repo.read(ProjectRepository.buildPath(projectId));
    return project?.abbreviation || null;
  }

  async getProjectScoringSystem(projectId) {
    const project = await this._repo.read(ProjectRepository.buildPath(projectId));
    return project?.scoringSystem || '1-5';
  }
}

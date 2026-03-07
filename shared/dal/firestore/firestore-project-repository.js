/**
 * @fileoverview Firestore implementation of ProjectRepository.
 *
 * Firestore mapping: collection "projects", doc {projectId}
 *
 * @module shared/dal/firestore/firestore-project-repository
 */

import { ProjectRepository } from '../project-repository.js';

export class FirestoreProjectRepository extends ProjectRepository {
  /**
   * @param {import('./base-firestore-repository.js').FirestoreBaseRepository} baseRepo
   */
  constructor(baseRepo) {
    super(baseRepo);
  }

  async listProjects() {
    return await this._repo._adapter.listDocs('projects') || {};
  }

  async getProject(projectId) {
    return this._repo._adapter.getDoc('projects', projectId);
  }

  async createProject(projectId, data) {
    await this._repo._adapter.setDoc('projects', projectId, data);
  }

  async updateProject(projectId, updates) {
    await this._repo._adapter.updateDoc('projects', projectId, updates);
  }

  async getProjectAbbreviation(projectId) {
    const project = await this._repo._adapter.getDoc('projects', projectId);
    return project?.abbreviation || null;
  }

  async getProjectScoringSystem(projectId) {
    const project = await this._repo._adapter.getDoc('projects', projectId);
    return project?.scoringSystem || '1-5';
  }
}

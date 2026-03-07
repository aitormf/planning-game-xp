/**
 * @fileoverview Dual-write project repository that writes to both primary and secondary backends.
 *
 * The primary backend is authoritative — reads come from it.
 * The secondary backend receives shadow writes; errors are logged but never block.
 *
 * @module shared/dal/dual-write-project-repository
 */

import { ProjectRepository } from './project-repository.js';

export class DualWriteProjectRepository extends ProjectRepository {
  /**
   * @param {ProjectRepository} primary - Authoritative repository (reads + writes)
   * @param {ProjectRepository} secondary - Shadow repository (writes only)
   * @param {Object} [options]
   * @param {Function} [options.onShadowError] - Error handler for secondary failures
   */
  constructor(primary, secondary, options = {}) {
    super(primary._repo);
    this._primary = primary;
    this._secondary = secondary;
    this._onShadowError = options.onShadowError || DualWriteProjectRepository._defaultErrorHandler;
  }

  static _defaultErrorHandler(operation, error) {
    console.error(`[DualWrite] Shadow write failed on ${operation}:`, error.message);
  }

  async _shadowWrite(operation, fn) {
    try {
      await fn();
    } catch (error) {
      this._onShadowError(operation, error);
    }
  }

  async listProjects() {
    return this._primary.listProjects();
  }

  async getProject(projectId) {
    return this._primary.getProject(projectId);
  }

  async createProject(projectId, data) {
    await this._primary.createProject(projectId, data);

    await this._shadowWrite('createProject', () =>
      this._secondary.createProject(projectId, data)
    );
  }

  async updateProject(projectId, updates) {
    await this._primary.updateProject(projectId, updates);

    await this._shadowWrite('updateProject', () =>
      this._secondary.updateProject(projectId, updates)
    );
  }

  async getProjectAbbreviation(projectId) {
    return this._primary.getProjectAbbreviation(projectId);
  }

  async getProjectScoringSystem(projectId) {
    return this._primary.getProjectScoringSystem(projectId);
  }
}

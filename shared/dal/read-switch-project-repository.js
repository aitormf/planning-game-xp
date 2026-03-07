/**
 * @fileoverview Read-switch project repository that reads from Firestore (primary)
 * with optional fallback to RTDB during migration.
 *
 * @module shared/dal/read-switch-project-repository
 */

import { ProjectRepository } from './project-repository.js';

export class ReadSwitchProjectRepository extends ProjectRepository {
  /**
   * @param {ProjectRepository} firestoreRepo - Primary read source
   * @param {ProjectRepository} rtdbRepo - Fallback read source
   * @param {ProjectRepository} writeRepo - Write target (typically DualWrite)
   * @param {Object} [options]
   * @param {boolean} [options.migrationFallback=false] - Enable RTDB fallback reads
   * @param {Function} [options.onFallback] - Called when fallback is triggered
   */
  constructor(firestoreRepo, rtdbRepo, writeRepo, options = {}) {
    super(firestoreRepo._repo);
    this._firestore = firestoreRepo;
    this._rtdb = rtdbRepo;
    this._writer = writeRepo;
    this._migrationFallback = options.migrationFallback || false;
    this._onFallback = options.onFallback || ReadSwitchProjectRepository._defaultFallbackHandler;
  }

  static _defaultFallbackHandler(operation, details) {
    console.warn(`[ReadSwitch] Fallback to RTDB on ${operation}:`, details);
  }

  async listProjects() {
    const result = await this._firestore.listProjects();
    if (result && Object.keys(result).length > 0) return result;

    if (this._migrationFallback) {
      this._onFallback('listProjects', {});
      return this._rtdb.listProjects();
    }
    return result || {};
  }

  async getProject(projectId) {
    const result = await this._firestore.getProject(projectId);
    if (result !== null) return result;

    if (this._migrationFallback) {
      this._onFallback('getProject', { projectId });
      return this._rtdb.getProject(projectId);
    }
    return null;
  }

  async createProject(projectId, data) {
    return this._writer.createProject(projectId, data);
  }

  async updateProject(projectId, updates) {
    return this._writer.updateProject(projectId, updates);
  }

  async getProjectAbbreviation(projectId) {
    const result = await this._firestore.getProjectAbbreviation(projectId);
    if (result !== null) return result;

    if (this._migrationFallback) {
      this._onFallback('getProjectAbbreviation', { projectId });
      return this._rtdb.getProjectAbbreviation(projectId);
    }
    return null;
  }

  async getProjectScoringSystem(projectId) {
    const result = await this._firestore.getProjectScoringSystem(projectId);
    if (result !== '1-5') return result;

    if (this._migrationFallback) {
      this._onFallback('getProjectScoringSystem', { projectId });
      return this._rtdb.getProjectScoringSystem(projectId);
    }
    return result;
  }
}

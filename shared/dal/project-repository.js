/**
 * @fileoverview Project repository interface for CRUD operations on projects.
 *
 * Path pattern: /projects/{projectId}
 *
 * @module shared/dal/project-repository
 */

/**
 * @typedef {Object} ProjectSummary
 * @property {string} id
 * @property {string} name
 * @property {string|null} abbreviation
 * @property {string|null} scoringSystem
 * @property {Array} developers
 * @property {string|null} createdAt
 */

/**
 * @abstract
 */
export class ProjectRepository {
  /**
   * @param {import('./base-repository.js').BaseRepository} baseRepo
   */
  constructor(baseRepo) {
    if (new.target === ProjectRepository) {
      throw new Error('ProjectRepository is abstract and cannot be instantiated directly');
    }
    this._repo = baseRepo;
  }

  /**
   * List all projects.
   * @returns {Promise<Object>} Map of projectId -> projectData
   */
  async listProjects() {
    throw new Error('Not implemented: listProjects()');
  }

  /**
   * Get a single project by ID.
   * @param {string} projectId
   * @returns {Promise<Object|null>} Project data or null
   */
  async getProject(projectId) {
    throw new Error('Not implemented: getProject()');
  }

  /**
   * Create a new project.
   * @param {string} projectId - Project key
   * @param {Object} data - Project data
   * @returns {Promise<void>}
   */
  async createProject(projectId, data) {
    throw new Error('Not implemented: createProject()');
  }

  /**
   * Update an existing project's fields.
   * @param {string} projectId
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateProject(projectId, updates) {
    throw new Error('Not implemented: updateProject()');
  }

  /**
   * Get project abbreviation (used for card ID generation).
   * @param {string} projectId
   * @returns {Promise<string|null>}
   */
  async getProjectAbbreviation(projectId) {
    throw new Error('Not implemented: getProjectAbbreviation()');
  }

  /**
   * Get project scoring system ('1-5' or 'fibonacci').
   * @param {string} projectId
   * @returns {Promise<string>} Defaults to '1-5'
   */
  async getProjectScoringSystem(projectId) {
    throw new Error('Not implemented: getProjectScoringSystem()');
  }

  /** Base RTDB path for all projects. */
  static get basePath() {
    return '/projects';
  }

  /**
   * Build path to a specific project.
   * @param {string} projectId
   * @returns {string}
   */
  static buildPath(projectId) {
    return `/projects/${projectId}`;
  }
}

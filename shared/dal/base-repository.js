/**
 * @fileoverview Abstract base repository defining the low-level data access contract.
 * Concrete implementations (RtdbRepository, FirestoreRepository) must override all methods.
 *
 * @module shared/dal/base-repository
 */

/**
 * @abstract
 */
export class BaseRepository {
  /**
   * @param {string} backend - Backend identifier ('rtdb' or 'firestore')
   */
  constructor(backend) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly');
    }
    this.backend = backend;
  }

  /**
   * Read data at the given path.
   * @param {string} path - Database path (e.g., '/projects/PlanningGame')
   * @returns {Promise<*>} The data at the path, or null if not found
   */
  async read(path) {
    throw new Error(`Not implemented: read() in ${this.backend} backend`);
  }

  /**
   * Write (overwrite) data at the given path.
   * @param {string} path - Database path
   * @param {*} data - Data to write
   * @returns {Promise<void>}
   */
  async write(path, data) {
    throw new Error(`Not implemented: write() in ${this.backend} backend`);
  }

  /**
   * Partial update at the given path. Only specified fields are changed.
   * @param {string} path - Database path
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async update(path, updates) {
    throw new Error(`Not implemented: update() in ${this.backend} backend`);
  }

  /**
   * Push a new child with an auto-generated key.
   * @param {string} path - Parent path
   * @param {*} data - Data for the new child
   * @returns {Promise<string>} The generated key
   */
  async push(path, data) {
    throw new Error(`Not implemented: push() in ${this.backend} backend`);
  }

  /**
   * Remove data at the given path.
   * @param {string} path - Database path
   * @returns {Promise<void>}
   */
  async remove(path) {
    throw new Error(`Not implemented: remove() in ${this.backend} backend`);
  }

  /**
   * Subscribe to real-time changes at the given path.
   * @param {string} path - Database path
   * @param {Function} callback - Called with (data) on each change
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    throw new Error(`Not implemented: subscribe() in ${this.backend} backend`);
  }

  /**
   * Atomic read-modify-write transaction.
   * @param {string} path - Database path
   * @param {Function} updateFn - Function that receives current data and returns new data
   * @returns {Promise<*>} The result of the transaction
   */
  async transaction(path, updateFn) {
    throw new Error(`Not implemented: transaction() in ${this.backend} backend`);
  }

  /**
   * Multi-path atomic update. Writes multiple paths in a single operation.
   * @param {Object} pathUpdates - Object mapping paths to their new values (null to delete)
   * @returns {Promise<void>}
   */
  async multiUpdate(pathUpdates) {
    throw new Error(`Not implemented: multiUpdate() in ${this.backend} backend`);
  }
}

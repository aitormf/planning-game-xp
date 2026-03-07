/**
 * @fileoverview Dual-write card repository that writes to both primary and secondary backends.
 *
 * The primary backend (typically RTDB) is authoritative — reads come from it.
 * The secondary backend (typically Firestore) receives shadow writes.
 * Errors in the secondary backend are logged but never block the primary operation.
 *
 * @module shared/dal/dual-write-card-repository
 */

import { CardRepository } from './card-repository.js';

export class DualWriteCardRepository extends CardRepository {
  /**
   * @param {CardRepository} primary - Authoritative repository (reads + writes)
   * @param {CardRepository} secondary - Shadow repository (writes only)
   * @param {Object} [options]
   * @param {Function} [options.onShadowError] - Error handler for secondary failures
   */
  constructor(primary, secondary, options = {}) {
    // Pass primary's base repo to satisfy CardRepository constructor
    super(primary._repo);
    this._primary = primary;
    this._secondary = secondary;
    this._onShadowError = options.onShadowError || DualWriteCardRepository._defaultErrorHandler;
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

  async listCards(projectId, type, filters = {}) {
    return this._primary.listCards(projectId, type, filters);
  }

  async getCard(projectId, type, firebaseId) {
    return this._primary.getCard(projectId, type, firebaseId);
  }

  async findCardByCardId(projectId, cardId, type) {
    return this._primary.findCardByCardId(projectId, cardId, type);
  }

  async createCard(projectId, type, data) {
    const result = await this._primary.createCard(projectId, type, data);

    await this._shadowWrite('createCard', () =>
      this._secondary.createCard(projectId, type, { ...data, _firebaseId: result.firebaseId })
    );

    return result;
  }

  async updateCard(projectId, type, firebaseId, updates) {
    await this._primary.updateCard(projectId, type, firebaseId, updates);

    await this._shadowWrite('updateCard', () =>
      this._secondary.updateCard(projectId, type, firebaseId, updates)
    );
  }

  async deleteCard(projectId, type, firebaseId, trashMetadata) {
    await this._primary.deleteCard(projectId, type, firebaseId, trashMetadata);

    await this._shadowWrite('deleteCard', () =>
      this._secondary.deleteCard(projectId, type, firebaseId, trashMetadata)
    );
  }

  subscribeToCard(projectId, type, firebaseId, callback) {
    return this._primary.subscribeToCard(projectId, type, firebaseId, callback);
  }
}

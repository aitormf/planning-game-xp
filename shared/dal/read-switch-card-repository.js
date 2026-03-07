/**
 * @fileoverview Read-switch card repository that reads from Firestore (primary)
 * with optional fallback to RTDB during migration.
 *
 * Writes go to both backends (via DualWriteCardRepository or equivalent).
 * Reads go to Firestore first. If migrationFallback is enabled and data is not
 * found in Firestore, falls back to RTDB with a warning log.
 *
 * Once migration is verified complete, set migrationFallback=false (default).
 *
 * @module shared/dal/read-switch-card-repository
 */

import { CardRepository } from './card-repository.js';

export class ReadSwitchCardRepository extends CardRepository {
  /**
   * @param {CardRepository} firestoreRepo - Primary read source (Firestore)
   * @param {CardRepository} rtdbRepo - Fallback read source (RTDB)
   * @param {CardRepository} writeRepo - Write target (typically DualWrite)
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
    this._onFallback = options.onFallback || ReadSwitchCardRepository._defaultFallbackHandler;
  }

  static _defaultFallbackHandler(operation, details) {
    console.warn(`[ReadSwitch] Fallback to RTDB on ${operation}:`, details);
  }

  async listCards(projectId, type, filters = {}) {
    const result = await this._firestore.listCards(projectId, type, filters);
    if (result && Object.keys(result).length > 0) return result;

    if (this._migrationFallback) {
      this._onFallback('listCards', { projectId, type });
      return this._rtdb.listCards(projectId, type, filters);
    }
    return result || {};
  }

  async getCard(projectId, type, firebaseId) {
    const result = await this._firestore.getCard(projectId, type, firebaseId);
    if (result !== null) return result;

    if (this._migrationFallback) {
      this._onFallback('getCard', { projectId, type, firebaseId });
      return this._rtdb.getCard(projectId, type, firebaseId);
    }
    return null;
  }

  async findCardByCardId(projectId, cardId, type) {
    const result = await this._firestore.findCardByCardId(projectId, cardId, type);
    if (result !== null) return result;

    if (this._migrationFallback) {
      this._onFallback('findCardByCardId', { projectId, cardId, type });
      return this._rtdb.findCardByCardId(projectId, cardId, type);
    }
    return null;
  }

  async createCard(projectId, type, data) {
    return this._writer.createCard(projectId, type, data);
  }

  async updateCard(projectId, type, firebaseId, updates) {
    return this._writer.updateCard(projectId, type, firebaseId, updates);
  }

  async deleteCard(projectId, type, firebaseId, trashMetadata) {
    return this._writer.deleteCard(projectId, type, firebaseId, trashMetadata);
  }

  subscribeToCard(projectId, type, firebaseId, callback) {
    return this._firestore.subscribeToCard(projectId, type, firebaseId, callback);
  }
}

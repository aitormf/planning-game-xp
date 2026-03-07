/**
 * @fileoverview Firestore implementation of CardRepository.
 *
 * Firestore collection mapping:
 * RTDB: /cards/{projectId}/{SECTION}_{projectId}/{firebaseId}
 * Firestore: projects/{projectId}/{cardType}/{docId}
 *
 * Where cardType = 'tasks', 'bugs', 'epics', 'proposals', 'sprints', 'qa'
 *
 * @module shared/dal/firestore/firestore-card-repository
 */

import { CardRepository } from '../card-repository.js';
import { SECTION_MAP } from '../../utils.js';

/** Map card type to Firestore subcollection name */
const FIRESTORE_COLLECTION_MAP = {
  task: 'tasks',
  bug: 'bugs',
  epic: 'epics',
  proposal: 'proposals',
  sprint: 'sprints',
  qa: 'qa'
};

export class FirestoreCardRepository extends CardRepository {
  /**
   * @param {import('./base-firestore-repository.js').FirestoreBaseRepository} baseRepo
   */
  constructor(baseRepo) {
    super(baseRepo);
  }

  async listCards(projectId, type, filters = {}) {
    const collectionPath = this._collectionPath(projectId, type);

    if (filters && Object.keys(filters).length > 0) {
      return this._repo._adapter.query(collectionPath, filters);
    }

    const data = await this._repo._adapter.listDocs(collectionPath);
    return data || {};
  }

  async getCard(projectId, type, firebaseId) {
    const collectionPath = this._collectionPath(projectId, type);
    return this._repo._adapter.getDoc(collectionPath, firebaseId);
  }

  async findCardByCardId(projectId, cardId, type) {
    const typesToSearch = type ? [type] : Object.keys(SECTION_MAP);

    for (const t of typesToSearch) {
      const collectionPath = this._collectionPath(projectId, t);
      const results = await this._repo._adapter.query(collectionPath, { cardId });
      const entries = Object.entries(results);
      if (entries.length > 0) {
        const [firebaseId, data] = entries[0];
        return { firebaseId, type: t, data };
      }
    }
    return null;
  }

  async createCard(projectId, type, data) {
    const collectionPath = this._collectionPath(projectId, type);
    const firebaseId = await this._repo._adapter.addDoc(collectionPath, data);
    return { firebaseId, data };
  }

  async updateCard(projectId, type, firebaseId, updates) {
    const collectionPath = this._collectionPath(projectId, type);
    await this._repo._adapter.updateDoc(collectionPath, firebaseId, updates);
  }

  async deleteCard(projectId, type, firebaseId, trashMetadata = {}) {
    const collectionPath = this._collectionPath(projectId, type);
    const cardData = await this._repo._adapter.getDoc(collectionPath, firebaseId);

    if (cardData) {
      const trashCollection = `projects/${projectId}/trash/${FIRESTORE_COLLECTION_MAP[type]}`;
      await this._repo._adapter.setDoc(trashCollection, firebaseId, {
        ...cardData,
        ...trashMetadata
      });
    }

    await this._repo._adapter.deleteDoc(collectionPath, firebaseId);
  }

  subscribeToCard(projectId, type, firebaseId, callback) {
    const collectionPath = this._collectionPath(projectId, type);
    return this._repo._adapter.subscribe(collectionPath, firebaseId, callback);
  }

  /**
   * Build Firestore collection path for a card type.
   * @param {string} projectId
   * @param {string} type
   * @returns {string} e.g., 'projects/PlanningGame/tasks'
   */
  _collectionPath(projectId, type) {
    const subcollection = FIRESTORE_COLLECTION_MAP[type];
    if (!subcollection) {
      throw new Error(`Invalid card type: "${type}"`);
    }
    return `projects/${projectId}/${subcollection}`;
  }
}

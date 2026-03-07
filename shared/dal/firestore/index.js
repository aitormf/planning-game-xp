/**
 * @fileoverview Firestore backend exports.
 * @module shared/dal/firestore
 */

export {
  FirestoreBaseRepository,
  createAdminFirestoreAdapter,
  createClientFirestoreAdapter
} from './base-firestore-repository.js';
export { FirestoreCardRepository } from './firestore-card-repository.js';
export { FirestoreProjectRepository } from './firestore-project-repository.js';

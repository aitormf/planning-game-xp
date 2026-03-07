/**
 * @fileoverview Public API for the Data Access Layer (DAL).
 *
 * The DAL abstracts database operations behind repository interfaces,
 * allowing transparent switching between RTDB and Firestore backends.
 *
 * @module shared/dal
 */

export { BaseRepository } from './base-repository.js';
export { CardRepository } from './card-repository.js';
export { ProjectRepository } from './project-repository.js';
export { CounterService } from './counter-service.js';

export {
  registerCardBackend,
  registerProjectBackend,
  registerCounterBackend,
  createCardRepository,
  createProjectRepository,
  createCounterService,
  createRepositories,
  createDualWriteRepositories,
  createReadSwitchRepositories,
  clearRegisteredBackends
} from './repository-factory.js';

// Dual-write wrappers
export { DualWriteCardRepository } from './dual-write-card-repository.js';
export { DualWriteProjectRepository } from './dual-write-project-repository.js';

// Read-switch wrappers (Firestore primary, RTDB fallback)
export { ReadSwitchCardRepository } from './read-switch-card-repository.js';
export { ReadSwitchProjectRepository } from './read-switch-project-repository.js';

// RTDB backend
export {
  RtdbBaseRepository,
  createAdminAdapter,
  createClientAdapter,
  RtdbCardRepository,
  RtdbProjectRepository,
  RtdbCounterService,
  createAdminCounterAdapter,
  createClientCounterAdapter
} from './rtdb/index.js';

// Firestore backend
export {
  FirestoreBaseRepository,
  createAdminFirestoreAdapter,
  createClientFirestoreAdapter,
  FirestoreCardRepository,
  FirestoreProjectRepository
} from './firestore/index.js';

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
  clearRegisteredBackends
} from './repository-factory.js';

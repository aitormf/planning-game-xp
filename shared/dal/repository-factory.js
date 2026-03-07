/**
 * @fileoverview Factory for creating repository instances based on backend configuration.
 *
 * Usage:
 *   import { createRepositories } from 'shared/dal/repository-factory.js';
 *   const { cards, projects, counters } = createRepositories('rtdb', { db });
 *
 * @module shared/dal/repository-factory
 */

/** @type {Object<string, Function>} Registry of backend constructors for CardRepository */
const _cardBackends = {};

/** @type {Object<string, Function>} Registry of backend constructors for ProjectRepository */
const _projectBackends = {};

/** @type {Object<string, Function>} Registry of backend constructors for CounterService */
const _counterBackends = {};

/**
 * Register a CardRepository implementation for a backend.
 * @param {string} backendName - e.g., 'rtdb', 'firestore'
 * @param {Function} RepositoryClass - Constructor that accepts (options)
 */
export function registerCardBackend(backendName, RepositoryClass) {
  _cardBackends[backendName] = RepositoryClass;
}

/**
 * Register a ProjectRepository implementation for a backend.
 * @param {string} backendName
 * @param {Function} RepositoryClass
 */
export function registerProjectBackend(backendName, RepositoryClass) {
  _projectBackends[backendName] = RepositoryClass;
}

/**
 * Register a CounterService implementation for a backend.
 * @param {string} backendName
 * @param {Function} ServiceClass
 */
export function registerCounterBackend(backendName, ServiceClass) {
  _counterBackends[backendName] = ServiceClass;
}

/**
 * Create a CardRepository for the specified backend.
 * @param {string} backend - 'rtdb' or 'firestore'
 * @param {Object} options - Backend-specific options (db instance, etc.)
 * @returns {import('./card-repository.js').CardRepository}
 */
export function createCardRepository(backend, options = {}) {
  const Constructor = _cardBackends[backend];
  if (!Constructor) {
    throw new Error(
      `No CardRepository registered for backend "${backend}". ` +
      `Available: ${Object.keys(_cardBackends).join(', ') || 'none'}`
    );
  }
  return new Constructor(options);
}

/**
 * Create a ProjectRepository for the specified backend.
 * @param {string} backend
 * @param {Object} options
 * @returns {import('./project-repository.js').ProjectRepository}
 */
export function createProjectRepository(backend, options = {}) {
  const Constructor = _projectBackends[backend];
  if (!Constructor) {
    throw new Error(
      `No ProjectRepository registered for backend "${backend}". ` +
      `Available: ${Object.keys(_projectBackends).join(', ') || 'none'}`
    );
  }
  return new Constructor(options);
}

/**
 * Create a CounterService for the specified backend.
 * @param {string} [backend='firestore'] - Counters default to Firestore
 * @param {Object} options
 * @returns {import('./counter-service.js').CounterService}
 */
export function createCounterService(backend = 'firestore', options = {}) {
  const Constructor = _counterBackends[backend];
  if (!Constructor) {
    throw new Error(
      `No CounterService registered for backend "${backend}". ` +
      `Available: ${Object.keys(_counterBackends).join(', ') || 'none'}`
    );
  }
  return new Constructor(options);
}

/**
 * Create all repositories for a given backend.
 * @param {string} backend - 'rtdb' or 'firestore'
 * @param {Object} options - Backend-specific options
 * @param {string} [counterBackend='firestore'] - Backend for counters
 * @returns {{cards: import('./card-repository.js').CardRepository, projects: import('./project-repository.js').ProjectRepository, counters: import('./counter-service.js').CounterService}}
 */
export function createRepositories(backend, options = {}, counterBackend = 'firestore') {
  return {
    cards: createCardRepository(backend, options),
    projects: createProjectRepository(backend, options),
    counters: createCounterService(counterBackend, options)
  };
}

/**
 * Clear all registered backends (useful for testing).
 */
export function clearRegisteredBackends() {
  Object.keys(_cardBackends).forEach(k => delete _cardBackends[k]);
  Object.keys(_projectBackends).forEach(k => delete _projectBackends[k]);
  Object.keys(_counterBackends).forEach(k => delete _counterBackends[k]);
}

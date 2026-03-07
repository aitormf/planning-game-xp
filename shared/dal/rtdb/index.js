/**
 * @fileoverview RTDB backend exports.
 * @module shared/dal/rtdb
 */

export { RtdbBaseRepository, createAdminAdapter, createClientAdapter } from './base-rtdb-repository.js';
export { RtdbCardRepository } from './rtdb-card-repository.js';
export { RtdbProjectRepository } from './rtdb-project-repository.js';
export { RtdbCounterService, createAdminCounterAdapter, createClientCounterAdapter } from './rtdb-counter-service.js';

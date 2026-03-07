import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerCardBackend,
  registerProjectBackend,
  registerCounterBackend,
  createCardRepository,
  createProjectRepository,
  createCounterService,
  createRepositories,
  createDualWriteRepositories,
  clearRegisteredBackends
} from '../../shared/dal/repository-factory.js';
import { DualWriteCardRepository } from '../../shared/dal/dual-write-card-repository.js';
import { DualWriteProjectRepository } from '../../shared/dal/dual-write-project-repository.js';
import { CardRepository } from '../../shared/dal/card-repository.js';
import { ProjectRepository } from '../../shared/dal/project-repository.js';
import { CounterService } from '../../shared/dal/counter-service.js';
import { BaseRepository } from '../../shared/dal/base-repository.js';

class StubBase extends BaseRepository {
  constructor() { super('stub'); }
}

class StubCardRepo extends CardRepository {
  constructor() { super(new StubBase()); }
}

class StubProjectRepo extends ProjectRepository {
  constructor() { super(new StubBase()); }
}

class StubCounterService extends CounterService {
  constructor() { super(); }
}

describe('repository-factory', () => {
  beforeEach(() => {
    clearRegisteredBackends();
  });

  describe('registerCardBackend / createCardRepository', () => {
    it('should create registered card repository', () => {
      registerCardBackend('stub', StubCardRepo);
      const repo = createCardRepository('stub');
      expect(repo).toBeInstanceOf(CardRepository);
    });

    it('should throw for unregistered backend', () => {
      expect(() => createCardRepository('unknown')).toThrow('No CardRepository registered for backend "unknown"');
    });
  });

  describe('registerProjectBackend / createProjectRepository', () => {
    it('should create registered project repository', () => {
      registerProjectBackend('stub', StubProjectRepo);
      const repo = createProjectRepository('stub');
      expect(repo).toBeInstanceOf(ProjectRepository);
    });

    it('should throw for unregistered backend', () => {
      expect(() => createProjectRepository('nonexistent')).toThrow('No ProjectRepository registered');
    });
  });

  describe('registerCounterBackend / createCounterService', () => {
    it('should create registered counter service', () => {
      registerCounterBackend('stub', StubCounterService);
      const svc = createCounterService('stub');
      expect(svc).toBeInstanceOf(CounterService);
    });

    it('should throw for unregistered backend', () => {
      expect(() => createCounterService('nope')).toThrow('No CounterService registered');
    });
  });

  describe('createRepositories', () => {
    it('should create all repositories at once', () => {
      registerCardBackend('stub', StubCardRepo);
      registerProjectBackend('stub', StubProjectRepo);
      registerCounterBackend('stub', StubCounterService);

      const repos = createRepositories('stub', {}, 'stub');
      expect(repos.cards).toBeInstanceOf(CardRepository);
      expect(repos.projects).toBeInstanceOf(ProjectRepository);
      expect(repos.counters).toBeInstanceOf(CounterService);
    });

    it('should throw if any backend is missing', () => {
      registerCardBackend('stub', StubCardRepo);
      registerProjectBackend('stub', StubProjectRepo);
      // counters not registered

      expect(() => createRepositories('stub', {}, 'stub')).toThrow('No CounterService registered');
    });
  });

  describe('createDualWriteRepositories', () => {
    it('should create dual-write wrappers', () => {
      registerCardBackend('rtdb', StubCardRepo);
      registerProjectBackend('rtdb', StubProjectRepo);
      registerCardBackend('firestore', StubCardRepo);
      registerProjectBackend('firestore', StubProjectRepo);
      registerCounterBackend('firestore', StubCounterService);

      const repos = createDualWriteRepositories(
        { backend: 'rtdb', options: {} },
        { backend: 'firestore', options: {} }
      );
      expect(repos.cards).toBeInstanceOf(DualWriteCardRepository);
      expect(repos.projects).toBeInstanceOf(DualWriteProjectRepository);
      expect(repos.counters).toBeInstanceOf(CounterService);
    });

    it('should throw if primary backend is not registered', () => {
      registerCardBackend('firestore', StubCardRepo);
      registerProjectBackend('firestore', StubProjectRepo);

      expect(() => createDualWriteRepositories(
        { backend: 'rtdb', options: {} },
        { backend: 'firestore', options: {} }
      )).toThrow('No CardRepository registered for backend "rtdb"');
    });
  });

  describe('clearRegisteredBackends', () => {
    it('should remove all registered backends', () => {
      registerCardBackend('stub', StubCardRepo);
      registerProjectBackend('stub', StubProjectRepo);
      registerCounterBackend('stub', StubCounterService);

      clearRegisteredBackends();

      expect(() => createCardRepository('stub')).toThrow('No CardRepository registered');
      expect(() => createProjectRepository('stub')).toThrow('No ProjectRepository registered');
      expect(() => createCounterService('stub')).toThrow('No CounterService registered');
    });
  });
});

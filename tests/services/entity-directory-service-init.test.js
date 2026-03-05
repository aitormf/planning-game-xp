import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn((db, path) => ({ db, path })),
  get: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(() => () => {})
}));

import { entityDirectoryService } from '@/services/entity-directory-service.js';
import { get } from '../../public/firebase-config.js';

const createSnapshot = (value) => ({
  exists: () => value !== null,
  val: () => value
});

describe('entityDirectoryService init refresh', () => {
  beforeEach(() => {
    entityDirectoryService._initialized = false;
    entityDirectoryService._initPromise = null;
    entityDirectoryService._developers.clear();
    entityDirectoryService._stakeholders.clear();
    entityDirectoryService._users.clear();
    get.mockReset();
  });

  it('should refresh data when init was empty and refreshIfEmpty is true', async () => {
    const store = {
      '/users': null,
      '/data/teams': null,
      '/data/developers': null,
      '/data/stakeholders': null,
      '/trash/users': null
    };

    get.mockImplementation(async (refObj) => createSnapshot(store[refObj.path] ?? null));

    await entityDirectoryService.init();
    expect(entityDirectoryService.getDeveloper('dev_001')).toBeNull();

    store['/data/developers'] = {
      dev_001: {
        email: 'user@example.com',
        name: 'User Example'
      }
    };

    await entityDirectoryService.init({ refreshIfEmpty: true });

    expect(entityDirectoryService.getDeveloper('dev_001')?.name).toBe('User Example');
  });
});

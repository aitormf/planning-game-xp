import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase-config
vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn().mockReturnValue('mock-ref'),
  get: vi.fn().mockResolvedValue({ exists: () => false, val: () => null }),
  set: vi.fn().mockResolvedValue(undefined),
  onValue: vi.fn()
}));

vi.mock('../../public/js/utils/project-people-utils.js', () => ({
  normalizeProjectPeople: vi.fn().mockReturnValue([])
}));

describe('EntityDirectoryManager', () => {
  let entityDirectoryService;

  beforeEach(async () => {
    const module = await import('../../public/js/services/entity-directory-service.js');
    entityDirectoryService = module.entityDirectoryService;

    // Populate test data
    entityDirectoryService._developers.clear();
    entityDirectoryService._developersByEmail.clear();
    entityDirectoryService._developersByName.clear();
    entityDirectoryService._stakeholders.clear();
    entityDirectoryService._stakeholdersByEmail.clear();
    entityDirectoryService._stakeholdersByName.clear();
    entityDirectoryService._teams.clear();
    entityDirectoryService._initialized = true;

    entityDirectoryService._developers.set('dev_001', {
      id: 'dev_001',
      email: 'alice@example.com',
      emails: ['alice@example.com'],
      name: 'Alice',
      active: true
    });
    entityDirectoryService._developersByEmail.set('alice@example.com', 'dev_001');

    entityDirectoryService._stakeholders.set('stk_001', {
      id: 'stk_001',
      email: 'bob@example.com',
      name: 'Bob',
      active: true,
      teamId: null
    });
    entityDirectoryService._stakeholdersByEmail.set('bob@example.com', 'stk_001');
  });

  describe('service integration', () => {
    it('should list all developers via service', () => {
      const devs = entityDirectoryService.getAllDevelopers();
      expect(devs).toHaveLength(1);
      expect(devs[0].id).toBe('dev_001');
      expect(devs[0].name).toBe('Alice');
    });

    it('should list all stakeholders via service', () => {
      const stks = entityDirectoryService.getAllStakeholders();
      expect(stks).toHaveLength(1);
      expect(stks[0].id).toBe('stk_001');
      expect(stks[0].name).toBe('Bob');
    });

    it('should generate sequential developer IDs', () => {
      entityDirectoryService._nextDeveloperId = 5;
      const id = entityDirectoryService.generateDeveloperId();
      expect(id).toBe('dev_005');
    });

    it('should generate sequential stakeholder IDs', () => {
      entityDirectoryService._nextStakeholderId = 3;
      const id = entityDirectoryService.generateStakeholderId();
      expect(id).toBe('stk_003');
    });

    it('should register and call change listeners', () => {
      const listener = vi.fn();
      const removeListener = entityDirectoryService.addChangeListener(listener);

      entityDirectoryService._notifyListeners('developers');
      expect(listener).toHaveBeenCalledWith('developers');

      removeListener();
      listener.mockClear();
      entityDirectoryService._notifyListeners('developers');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

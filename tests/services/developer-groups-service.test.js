import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockRef = vi.fn(() => 'mock-ref');

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: (...args) => mockRef(...args),
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
  push: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  databaseFirestore: {},
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  auth: { currentUser: { email: 'testuser@geniova.com' } },
  firebaseConfig: {},
  superAdminEmail: 'superadmin@geniova.com',
}));

describe('DeveloperGroupsService', () => {
  let DeveloperGroupsService;

  const sampleGroups = {
    internal: {
      label: 'Internos',
      developers: ['dev_005', 'dev_001', 'dev_008'],
    },
    external: {
      label: 'Externos',
      developers: ['dev_014', 'dev_004'],
    },
    manager: {
      label: 'Manager',
      developers: ['dev_010'],
    },
  };

  beforeEach(async () => {
    vi.resetModules();

    mockGet.mockReset();
    mockSet.mockReset();
    mockRef.mockReset();
    mockRef.mockReturnValue('mock-ref');

    const module = await import('../../public/js/services/developer-groups-service.js');
    DeveloperGroupsService = module.DeveloperGroupsService;
  });

  describe('loadGroups', () => {
    it('should load groups from /data/developerGroups', async () => {
      mockGet.mockResolvedValueOnce({ exists: () => true, val: () => sampleGroups });

      const service = new DeveloperGroupsService();
      await service.loadGroups();

      expect(mockRef).toHaveBeenCalledWith({}, '/data/developerGroups');
      expect(service.getGroups()).toEqual(sampleGroups);
    });

    it('should handle empty/missing data', async () => {
      mockGet.mockResolvedValueOnce({ exists: () => false, val: () => null });

      const service = new DeveloperGroupsService();
      await service.loadGroups();

      expect(service.getGroups()).toBeNull();
    });

    it('should throw on Firebase error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Firebase error'));

      const service = new DeveloperGroupsService();

      await expect(service.loadGroups()).rejects.toThrow('Firebase error');
    });
  });

  describe('getGroups', () => {
    it('should return loaded groups', async () => {
      mockGet.mockResolvedValueOnce({ exists: () => true, val: () => sampleGroups });

      const service = new DeveloperGroupsService();
      await service.loadGroups();

      const groups = service.getGroups();
      expect(groups).toEqual(sampleGroups);
      expect(groups.internal.developers).toContain('dev_005');
      expect(groups.external.developers).toContain('dev_014');
      expect(groups.manager.developers).toContain('dev_010');
    });

    it('should return null before loading', () => {
      const service = new DeveloperGroupsService();
      expect(service.getGroups()).toBeNull();
    });
  });

  describe('getDeveloperGroup', () => {
    it('should return group for a developer ID', async () => {
      mockGet.mockResolvedValueOnce({ exists: () => true, val: () => sampleGroups });

      const service = new DeveloperGroupsService();
      await service.loadGroups();

      expect(service.getDeveloperGroup('dev_005')).toBe('internal');
      expect(service.getDeveloperGroup('dev_014')).toBe('external');
      expect(service.getDeveloperGroup('dev_010')).toBe('manager');
    });

    it('should return null for unclassified developer', async () => {
      mockGet.mockResolvedValueOnce({ exists: () => true, val: () => sampleGroups });

      const service = new DeveloperGroupsService();
      await service.loadGroups();

      expect(service.getDeveloperGroup('dev_999')).toBeNull();
    });

    it('should return null when groups are not loaded', () => {
      const service = new DeveloperGroupsService();
      expect(service.getDeveloperGroup('dev_005')).toBeNull();
    });
  });

  describe('saveGroups', () => {
    it('should save groups to Firebase', async () => {
      mockSet.mockResolvedValueOnce(undefined);

      const service = new DeveloperGroupsService();
      await service.saveGroups(sampleGroups);

      expect(mockRef).toHaveBeenCalledWith({}, '/data/developerGroups');
      expect(mockSet).toHaveBeenCalledWith('mock-ref', sampleGroups);
    });

    it('should update local cache after saving', async () => {
      mockSet.mockResolvedValueOnce(undefined);

      const service = new DeveloperGroupsService();
      await service.saveGroups(sampleGroups);

      expect(service.getGroups()).toEqual(sampleGroups);
      expect(service.getDeveloperGroup('dev_005')).toBe('internal');
    });

    it('should throw on Firebase write error', async () => {
      mockSet.mockRejectedValueOnce(new Error('Permission denied'));

      const service = new DeveloperGroupsService();

      await expect(service.saveGroups(sampleGroups)).rejects.toThrow('Permission denied');
    });
  });
});

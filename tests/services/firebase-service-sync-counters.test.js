import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks for Firebase Realtime Database
const mockGet = vi.fn();
const mockRef = vi.fn(() => 'mock-ref');

// Mocks for Firestore
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDoc = vi.fn(() => 'mock-doc-ref');

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: (...args) => mockRef(...args),
  get: (...args) => mockGet(...args),
  push: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  databaseFirestore: {},
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  doc: (...args) => mockDoc(...args),
  runTransaction: vi.fn(),
  auth: { currentUser: { email: 'testuser@example.com' } },
  firebaseConfig: {},
  superAdminEmail: 'superadmin@example.com',
}));

vi.mock('../../public/js/utils/email-sanitizer.js', () => ({
  encodeEmailForFirebase: (email) => email.replace(/[@.]/g, '_'),
  decodeEmailFromFirebase: (encoded) => encoded,
  sanitizeEmailForFirebase: (email) => email.replace(/[@.]/g, '_'),
}));

vi.mock('../../public/js/services/permission-service.js', () => ({
  permissionService: {},
}));

vi.mock('../../public/js/services/history-service.js', () => ({
  historyService: {},
}));

vi.mock('../../public/js/services/user-directory-service.js', () => ({
  userDirectoryService: { load: vi.fn() },
}));

vi.mock('../../public/js/services/entity-directory-service.js', () => ({
  entityDirectoryService: {},
}));

vi.mock('../../public/js/services/developer-backlog-service.js', () => ({
  developerBacklogService: {},
}));

vi.mock('../../public/js/utils/developer-normalizer.js', () => ({
  normalizeDeveloperEntry: vi.fn(),
}));

vi.mock('../../public/js/utils/project-people-utils.js', () => ({
  normalizeProjectPeople: vi.fn(),
}));

describe('FirebaseService.syncProjectCounters', () => {
  let FirebaseService;

  beforeEach(async () => {
    vi.resetModules();
    mockGet.mockReset();
    mockRef.mockReset();
    mockGetDoc.mockReset();
    mockSetDoc.mockReset();
    mockDoc.mockReset();
    mockRef.mockReturnValue('mock-ref');
    mockDoc.mockReturnValue('mock-doc-ref');

    const module = await import('../../public/js/services/firebase-service.js');
    FirebaseService = module.FirebaseService;
  });

  const setupMocks = ({ abbreviation, counterValue, cards }) => {
    // Mock getProjectAbbreviation - returns abbreviation from /projects/{projectId}/abbreviation
    mockGet.mockImplementation((refPath) => {
      // First call is for project abbreviation
      if (mockGet.mock.calls.length === 1) {
        return Promise.resolve({
          exists: () => !!abbreviation,
          val: () => abbreviation,
        });
      }
      // Subsequent calls are for cards data
      return Promise.resolve({
        exists: () => !!cards,
        val: () => cards || {},
      });
    });

    // Mock Firestore getDoc for counter
    mockGetDoc.mockResolvedValue({
      exists: () => counterValue !== null,
      data: () => (counterValue !== null ? { lastId: counterValue } : null),
    });
  };

  describe('validation', () => {
    it('should throw error when projectId is not provided', async () => {
      await expect(FirebaseService.syncProjectCounters('')).rejects.toThrow(
        'ProjectId es requerido y debe ser un string válido'
      );
    });

    it('should throw error when projectId is not a string', async () => {
      await expect(FirebaseService.syncProjectCounters(123)).rejects.toThrow(
        'ProjectId es requerido y debe ser un string válido'
      );
    });

    it('should throw error when projectId is null', async () => {
      await expect(FirebaseService.syncProjectCounters(null)).rejects.toThrow(
        'ProjectId es requerido y debe ser un string válido'
      );
    });
  });

  describe('counter already synchronized', () => {
    it('should not update counter when already synchronized', async () => {
      // Counter is at 22, max cardId is also 22
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' }) // abbreviation
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc123': { cardId: 'DSR-TSK-0020' },
            '-abc124': { cardId: 'DSR-TSK-0022' },
            '-abc125': { cardId: 'DSR-TSK-0015' },
          }),
        }) // tasks
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) }) // bugs
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) }) // epics
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) }) // proposals
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) }); // sprints

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 22 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(mockSetDoc).not.toHaveBeenCalled();

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.needsSync).toBe(false);
      expect(tasksResult.currentCounterValue).toBe(22);
      expect(tasksResult.maxIdFound).toBe(22);
    });

    it('should not update counter when counter is higher than max cardId', async () => {
      // Counter is at 30, max cardId is 22
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc123': { cardId: 'DSR-TSK-0022' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 30 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.synced).toBe(0);
      expect(mockSetDoc).not.toHaveBeenCalled();

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.needsSync).toBe(false);
    });
  });

  describe('counter out of sync', () => {
    it('should update counter when behind max cardId', async () => {
      // Counter is at 10, max cardId is 25
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc123': { cardId: 'DSR-TSK-0025' },
            '-abc124': { cardId: 'DSR-TSK-0010' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 10 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        { lastId: 25 },
        { merge: true }
      );

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.needsSync).toBe(true);
      expect(tasksResult.synced).toBe(true);
      expect(tasksResult.newValue).toBe(25);
    });

    it('should update counter when it does not exist (value 0)', async () => {
      // Counter does not exist (treated as 0), max cardId is 15
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc123': { cardId: 'DSR-TSK-0015' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.synced).toBe(1);
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        { lastId: 15 },
        { merge: true }
      );
    });

    it('should sync multiple sections that need update', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0050' },
          }),
        }) // tasks - needs sync
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc2': { cardId: 'DSR-BUG-0030' },
          }),
        }) // bugs - needs sync
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) }) // epics - no cards
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) }) // proposals - no cards
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) }); // sprints - no cards

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 5 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.synced).toBe(2);
      expect(result.needsSync).toBe(2);
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('dryRun mode', () => {
    it('should not update counter in dryRun mode', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc123': { cardId: 'DSR-TSK-0030' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 10 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject', {
        dryRun: true,
      });

      expect(result.action).toBe('dry-run');
      expect(result.needsSync).toBe(1);
      expect(result.synced).toBe(0);
      expect(mockSetDoc).not.toHaveBeenCalled();

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.needsSync).toBe(true);
      expect(tasksResult.synced).toBe(false);
      expect(tasksResult.wouldUpdateTo).toBe(30);
    });

    it('should report correct message in dryRun mode', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0020' },
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc2': { cardId: 'DSR-BUG-0015' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 5 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject', {
        dryRun: true,
      });

      expect(result.message).toContain('Dry-run');
      expect(result.message).toContain('2');
    });
  });

  describe('section without cards', () => {
    it('should handle empty section with no cards', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({ exists: () => false, val: () => null }) // tasks - no cards
        .mockResolvedValueOnce({ exists: () => false, val: () => null }) // bugs
        .mockResolvedValueOnce({ exists: () => false, val: () => null }) // epics
        .mockResolvedValueOnce({ exists: () => false, val: () => null }) // proposals
        .mockResolvedValueOnce({ exists: () => false, val: () => null }); // sprints

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 10 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.needsSync).toBe(0);
      expect(mockSetDoc).not.toHaveBeenCalled();

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.maxIdFound).toBe(0);
      expect(tasksResult.needsSync).toBe(false);
    });

    it('should handle section with only deleted cards', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc123': { cardId: 'DSR-TSK-0050', deletedAt: '2024-01-01' },
            '-abc124': { cardId: 'DSR-TSK-0060', deletedAt: '2024-01-02' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 10 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.synced).toBe(0);
      expect(mockSetDoc).not.toHaveBeenCalled();

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.maxIdFound).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should capture error for individual section and continue with others', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockRejectedValueOnce(new Error('Network error')) // tasks fails
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-BUG-0020' },
          }),
        }) // bugs works
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 5 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result.success).toBe(true);

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.error).toBe('Network error');

      const bugsResult = result.results.find(r => r.section === 'bugs');
      expect(bugsResult.needsSync).toBe(true);
      expect(bugsResult.synced).toBe(true);
    });

    it('should throw error when project has no abbreviation', async () => {
      mockGet.mockResolvedValueOnce({ exists: () => false, val: () => null });

      await expect(
        FirebaseService.syncProjectCounters('NonExistentProject')
      ).rejects.toThrow('no tiene abreviatura configurada');
    });
  });

  describe('custom sections option', () => {
    it('should only sync specified sections', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0050' },
          }),
        }) // tasks
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc2': { cardId: 'DSR-BUG-0030' },
          }),
        }); // bugs

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 5 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject', {
        sections: ['tasks', 'bugs'],
      });

      expect(result.results.length).toBe(2);
      expect(result.results.map(r => r.section)).toEqual(['tasks', 'bugs']);
    });

    it('should handle single section option', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0050' },
          }),
        });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 5 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject', {
        sections: ['tasks'],
      });

      expect(result.results.length).toBe(1);
      expect(result.results[0].section).toBe('tasks');
      expect(result.synced).toBe(1);
    });
  });

  describe('cardId parsing', () => {
    it('should correctly parse cardIds with different formats', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'C4D' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'C4D-TSK-0001' },
            '-abc2': { cardId: 'C4D-TSK-0100' },
            '-abc3': { cardId: 'C4D-TSK-0099' },
            '-abc4': { cardId: 'C4D-TSK-9999' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 50 }),
      });

      const result = await FirebaseService.syncProjectCounters('Cinema4D');

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.maxIdFound).toBe(9999);
    });

    it('should ignore cards without cardId', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0010' },
            '-abc2': { title: 'Card without cardId' }, // No cardId
            '-abc3': { cardId: null }, // Null cardId
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 5 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.maxIdFound).toBe(10);
    });

    it('should ignore cards with non-matching cardId pattern', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0010' },
            '-abc2': { cardId: 'OTHER-TSK-0050' }, // Wrong project prefix
            '-abc3': { cardId: 'DSR-BUG-0030' }, // Wrong section type
            '-abc4': { cardId: 'invalid-format' }, // Invalid format
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 5 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      const tasksResult = result.results.find(r => r.section === 'tasks');
      expect(tasksResult.maxIdFound).toBe(10);
    });
  });

  describe('result structure', () => {
    it('should return correct result structure', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0020' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 10 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');

      expect(result).toHaveProperty('projectId', 'TestProject');
      expect(result).toHaveProperty('projectAbbr', 'DSR');
      expect(result).toHaveProperty('action', 'sync');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('synced');
      expect(result).toHaveProperty('needsSync');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should include correct section result fields', async () => {
      mockGet
        .mockResolvedValueOnce({ exists: () => true, val: () => 'DSR' })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            '-abc1': { cardId: 'DSR-TSK-0020' },
          }),
        })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) })
        .mockResolvedValueOnce({ exists: () => true, val: () => ({}) });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastId: 10 }),
      });

      const result = await FirebaseService.syncProjectCounters('TestProject');
      const tasksResult = result.results.find(r => r.section === 'tasks');

      expect(tasksResult).toHaveProperty('section', 'tasks');
      expect(tasksResult).toHaveProperty('counterKey', 'DSR-TSK');
      expect(tasksResult).toHaveProperty('currentCounterValue', 10);
      expect(tasksResult).toHaveProperty('maxIdFound', 20);
      expect(tasksResult).toHaveProperty('needsSync', true);
      expect(tasksResult).toHaveProperty('synced', true);
      expect(tasksResult).toHaveProperty('newValue', 20);
    });
  });
});

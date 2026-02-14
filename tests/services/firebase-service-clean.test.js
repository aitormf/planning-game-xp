/**
 * Tests for cleanCardBeforeSave() schema-based whitelist
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-config (must be before importing firebase-service)
vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn(),
  push: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  databaseFirestore: {},
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  auth: { currentUser: { email: 'test@test.com' } },
  firebaseConfig: {},
  superAdminEmail: 'admin@test.com'
}));

vi.mock('@/utils/email-sanitizer.js', () => ({
  encodeEmailForFirebase: vi.fn(e => e),
  decodeEmailFromFirebase: vi.fn(e => e),
  sanitizeEmailForFirebase: vi.fn(e => e)
}));

vi.mock('@/services/permission-service.js', () => ({
  permissionService: { canEdit: () => true, getRole: () => 'admin' }
}));

vi.mock('@/services/history-service.js', () => ({
  historyService: { trackChange: vi.fn() }
}));

vi.mock('@/services/user-directory-service.js', () => ({
  userDirectoryService: { resolve: vi.fn() }
}));

vi.mock('@/services/entity-directory-service.js', () => ({
  entityDirectoryService: { resolve: vi.fn() }
}));

vi.mock('@/services/developer-backlog-service.js', () => ({
  developerBacklogService: { addToBacklog: vi.fn(), removeFromBacklog: vi.fn() }
}));

vi.mock('@/utils/developer-normalizer.js', () => ({
  normalizeDeveloperEntry: vi.fn(v => v)
}));

vi.mock('@/utils/project-people-utils.js', () => ({
  normalizeProjectPeople: vi.fn(v => v)
}));

vi.mock('@/constants/app-constants.js', () => ({
  APP_CONSTANTS: { STATUS: {} }
}));

const { FirebaseService: firebaseService } = await import('@/services/firebase-service.js');

describe('cleanCardBeforeSave', () => {

  describe('schema-based whitelist (known card types)', () => {
    it('should keep only PERSISTENT_FIELDS for task-card', () => {
      const card = {
        cardType: 'task-card',
        firebaseId: '-Oabc123',
        cardId: 'PLN-TSK-0001',
        title: 'Test task',
        description: 'A description',
        status: 'In Progress',
        developer: 'dev_001',
        coDeveloper: 'dev_002',
        developerHistory: [{ dev: 'dev_001', date: '2026-01-01' }],
        blockedHistory: [],
        projectId: 'PlanningGame',
        year: 2026,
        // UI-only fields that should be stripped
        statusList: ['To Do', 'In Progress', 'Done'],
        developerList: ['dev_001', 'dev_002'],
        activeTab: 'details',
        expanded: true,
        isEditable: true,
        isSaving: false,
        invalidFields: ['title'],
        canEditPermission: true,
        userEmail: 'user@test.com'
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      // Should keep persistent fields
      expect(result.cardType).toBe('task-card');
      expect(result.firebaseId).toBe('-Oabc123');
      expect(result.cardId).toBe('PLN-TSK-0001');
      expect(result.title).toBe('Test task');
      expect(result.developer).toBe('dev_001');
      expect(result.coDeveloper).toBe('dev_002');
      expect(result.developerHistory).toEqual([{ dev: 'dev_001', date: '2026-01-01' }]);
      expect(result.year).toBe(2026);

      // Should strip UI-only fields
      expect(result.statusList).toBeUndefined();
      expect(result.developerList).toBeUndefined();
      expect(result.activeTab).toBeUndefined();
      expect(result.expanded).toBeUndefined();
      expect(result.isEditable).toBeUndefined();
      expect(result.isSaving).toBeUndefined();
      expect(result.invalidFields).toBeUndefined();
      expect(result.canEditPermission).toBeUndefined();
      expect(result.userEmail).toBeUndefined();
    });

    it('should keep only PERSISTENT_FIELDS for bug-card', () => {
      const card = {
        cardType: 'bug-card',
        firebaseId: '-Odef456',
        cardId: 'PLN-BUG-0001',
        title: 'Test bug',
        status: 'Created',
        priority: 'APPLICATION BLOCKER',
        developer: 'dev_001',
        coDeveloper: 'dev_002',
        bugType: 'Funcional',
        cinemaFile: 'path/to/file.c4d',
        projectId: 'PlanningGame',
        year: 2026,
        // UI-only fields
        statusList: ['Created', 'Assigned'],
        priorityList: ['APPLICATION BLOCKER'],
        bugTypeList: ['Funcional'],
        developerList: ['dev_001'],
        activeTab: 'details',
        expanded: false,
        originalStatus: 'Created',
        acceptanceCriteriaColor: 'green'
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      // Should keep persistent fields
      expect(result.bugType).toBe('Funcional');
      expect(result.cinemaFile).toBe('path/to/file.c4d');
      expect(result.coDeveloper).toBe('dev_002');

      // Should strip UI-only
      expect(result.statusList).toBeUndefined();
      expect(result.priorityList).toBeUndefined();
      expect(result.bugTypeList).toBeUndefined();
      expect(result.activeTab).toBeUndefined();
      expect(result.originalStatus).toBeUndefined();
      expect(result.acceptanceCriteriaColor).toBeUndefined();
    });

    it('should skip undefined values', () => {
      const card = {
        cardType: 'task-card',
        title: 'Test',
        developer: undefined,
        status: 'To Do',
        projectId: 'PlanningGame',
        cardId: 'PLN-TSK-0001'
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      expect(result.title).toBe('Test');
      expect(result).not.toHaveProperty('developer');
    });

    it('should deep-clone values to prevent mutation', () => {
      const notes = [{ text: 'note 1' }, { text: 'note 2' }];
      const card = {
        cardType: 'task-card',
        title: 'Test',
        notes: notes,
        projectId: 'PlanningGame',
        cardId: 'PLN-TSK-0001'
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      expect(result.notes).toEqual(notes);
      expect(result.notes).not.toBe(notes); // Different reference
    });
  });

  describe('legacy fallback (unknown card types)', () => {
    it('should use legacy clean for unknown card type', () => {
      const card = {
        cardType: 'unknown-card',
        title: 'Test',
        statusList: ['A', 'B'],
        expanded: true
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      // Legacy removes statusList and expanded
      expect(result.title).toBe('Test');
      expect(result.statusList).toBeUndefined();
      expect(result.expanded).toBeUndefined();
    });

    it('should use legacy clean when cardType is missing', () => {
      const card = {
        title: 'Test',
        statusList: ['A', 'B']
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      expect(result.title).toBe('Test');
      expect(result.statusList).toBeUndefined();
    });
  });

  describe('schema resolves cleanCardBeforeSave vs getWCProps conflict', () => {
    it('should preserve developerHistory for task-card (was removed by old blacklist)', () => {
      const card = {
        cardType: 'task-card',
        title: 'Test',
        developerHistory: [{ dev: 'dev_001', date: '2026-01-01' }],
        blockedHistory: [{ reason: 'blocked' }],
        projectId: 'PlanningGame',
        cardId: 'PLN-TSK-0001'
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      expect(result.developerHistory).toEqual([{ dev: 'dev_001', date: '2026-01-01' }]);
      expect(result.blockedHistory).toEqual([{ reason: 'blocked' }]);
    });

    it('should preserve developerName for task-card (was removed by old blacklist)', () => {
      const card = {
        cardType: 'task-card',
        title: 'Test',
        developerName: 'John Doe',
        projectId: 'PlanningGame',
        cardId: 'PLN-TSK-0001'
      };

      const result = firebaseService.cleanCardBeforeSave(card);

      expect(result.developerName).toBe('John Doe');
    });
  });
});

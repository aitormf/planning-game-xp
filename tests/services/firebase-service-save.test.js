/**
 * Tests for saveCard() - verifies update() is used for existing cards
 * to prevent data loss when component properties are not fully loaded.
 *
 * Bug: PLN-BUG-0074 - Editing a note on a Done&Validated card caused
 * startDate, endDate and commits to be lost because set() overwrites
 * the entire Firebase node.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSet = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockGet = vi.fn();
const mockRef = vi.fn().mockReturnValue('mock-ref');
const mockPush = vi.fn().mockReturnValue({ key: '-NewFirebaseKey123' });

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: (...args) => mockRef(...args),
  push: (...args) => mockPush(...args),
  set: (...args) => mockSet(...args),
  get: (...args) => mockGet(...args),
  onValue: vi.fn(),
  update: (...args) => mockUpdate(...args),
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
  historyService: { saveHistory: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('@/services/user-directory-service.js', () => ({
  userDirectoryService: { resolve: vi.fn() }
}));

vi.mock('@/services/entity-directory-service.js', () => ({
  entityDirectoryService: {
    resolve: vi.fn(),
    waitForInit: vi.fn().mockResolvedValue(undefined),
    resolveDeveloperId: vi.fn(() => null),
    getDeveloper: vi.fn(() => null),
    getDeveloperDisplayName: vi.fn(() => ''),
    findOrCreateDeveloper: vi.fn().mockResolvedValue(null)
  }
}));

vi.mock('@/services/developer-backlog-service.js', () => ({
  developerBacklogService: {
    addToBacklog: vi.fn(),
    removeFromBacklog: vi.fn(),
    buildCardKey: vi.fn(() => 'PlanningGame_PLN-TSK-0001')
  }
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

const mockDemoModeService = {
  isDemo: vi.fn().mockReturnValue(false),
  maxTasksPerProject: 0,
  maxProjects: 0,
  showLimitReached: vi.fn(),
  showFeatureDisabled: vi.fn(),
};
vi.mock('@/services/demo-mode-service.js', () => ({
  demoModeService: mockDemoModeService,
}));

const { FirebaseService: firebaseService } = await import('@/services/firebase-service.js');

// Mock document events to prevent errors
const originalDispatchEvent = document.dispatchEvent;
beforeEach(() => {
  vi.clearAllMocks();
  document.dispatchEvent = vi.fn();
  // Mock get() to return existing card data for history tracking
  mockGet.mockResolvedValue({
    exists: () => true,
    val: () => ({
      cardType: 'task-card',
      cardId: 'PLN-TSK-0001',
      title: 'Test task',
      status: 'Done&Validated',
      startDate: '2026-02-18T14:00:00',
      endDate: '2026-02-18T17:00:00',
      commits: [{ hash: 'abc123', message: 'feat: test' }]
    })
  });
});

afterEach(() => {
  document.dispatchEvent = originalDispatchEvent;
});

describe('saveCard - update vs set', () => {
  it('should use update() for existing cards to preserve unloaded fields', async () => {
    const existingCard = {
      cardType: 'task-card',
      firebaseId: '-OlkoAAec8dO9b-5-nB-',
      cardId: 'PLN-TSK-0001',
      title: 'Test task',
      status: 'Done&Validated',
      notes: [{ id: '1', content: 'new note', author: 'test@test.com', timestamp: '2026-02-21T08:00:00Z' }],
      group: 'tasks',
      projectId: 'PlanningGame',
      year: 2026
      // NOTE: startDate, endDate, commits are NOT present (not loaded on component)
    };

    await firebaseService.saveCard(existingCard, { silent: true, skipHistory: true });

    // Should use update() NOT set() for existing card
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockSet).not.toHaveBeenCalled();

    // The saved data should NOT include startDate/endDate/commits
    // since they weren't on the component - but update() preserves them in Firebase
    const savedData = mockUpdate.mock.calls[0][1];
    expect(savedData.title).toBe('Test task');
    expect(savedData.notes).toEqual(existingCard.notes);
    expect(savedData).not.toHaveProperty('startDate');
    expect(savedData).not.toHaveProperty('endDate');
    expect(savedData).not.toHaveProperty('commits');
  });

  it('should use set() for new cards', async () => {
    mockPush.mockReturnValue({ key: '-NewKey456' });

    const newCard = {
      cardType: 'task-card',
      // No firebaseId and no id = new card
      title: 'Brand new task',
      status: 'To Do',
      group: 'tasks',
      projectId: 'PlanningGame',
      cardId: 'PLN-TSK-0099',
      year: 2026
    };

    await firebaseService.saveCard(newCard, { silent: true, skipHistory: true });

    // Should use set() for new card
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should preserve fields in Firebase when only notes are updated via update()', async () => {
    // Simulate saving a card where only notes changed (like editing a note)
    const cardWithOnlyNotes = {
      cardType: 'task-card',
      firebaseId: '-ExistingKey789',
      cardId: 'PLN-TSK-0050',
      title: 'Task with commits',
      status: 'Done&Validated',
      developer: 'dev_016',
      notes: [{ id: '1', content: 'edited note', author: 'test@test.com', timestamp: '2026-02-21T08:00:00Z' }],
      group: 'tasks',
      projectId: 'PlanningGame',
      year: 2026
      // startDate, endDate, commits NOT present - they're preserved by update()
    };

    await firebaseService.saveCard(cardWithOnlyNotes, { silent: true, skipHistory: true });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const savedData = mockUpdate.mock.calls[0][1];

    // Fields that ARE present should be saved
    expect(savedData.notes).toBeDefined();
    expect(savedData.developer).toBe('dev_016');

    // Fields that are NOT present should NOT be in the update payload
    // (and thus preserved in Firebase thanks to update() vs set())
    expect(savedData).not.toHaveProperty('startDate');
    expect(savedData).not.toHaveProperty('endDate');
    expect(savedData).not.toHaveProperty('commits');
  });
});

describe('saveCard - demo mode card count limit', () => {
  beforeEach(() => {
    mockDemoModeService.isDemo.mockReturnValue(false);
    mockDemoModeService.maxTasksPerProject = 0;
    mockDemoModeService.showLimitReached.mockClear();
  });

  it('should block new card creation when demo limit is reached', async () => {
    mockDemoModeService.isDemo.mockReturnValue(true);
    mockDemoModeService.maxTasksPerProject = 2;

    // Simulate 2 existing cards in the section
    mockGet.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ '-key1': {}, '-key2': {} }),
    });

    const newCard = {
      cardType: 'task-card',
      title: 'Demo task',
      status: 'To Do',
      group: 'tasks',
      projectId: 'DemoProject',
      cardId: 'DM-TSK-0003',
      year: 2026,
    };

    await firebaseService.saveCard(newCard, { silent: true, skipHistory: true });

    // Should NOT write to Firebase
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockDemoModeService.showLimitReached).toHaveBeenCalledWith('tasks');
  });

  it('should allow new card creation when demo limit is not reached', async () => {
    mockDemoModeService.isDemo.mockReturnValue(true);
    mockDemoModeService.maxTasksPerProject = 5;

    // Simulate 2 existing cards (under limit of 5)
    mockGet
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => ({ '-key1': {}, '-key2': {} }),
      })
      // Second get() call is for history tracking (existing card lookup)
      .mockResolvedValueOnce({
        exists: () => false,
        val: () => null,
      });

    mockPush.mockReturnValue({ key: '-NewDemoKey' });

    const newCard = {
      cardType: 'task-card',
      title: 'Demo task under limit',
      status: 'To Do',
      group: 'tasks',
      projectId: 'DemoProject',
      cardId: 'DM-TSK-0001',
      year: 2026,
    };

    await firebaseService.saveCard(newCard, { silent: true, skipHistory: true });

    // Should write to Firebase
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockDemoModeService.showLimitReached).not.toHaveBeenCalled();
  });

  it('should skip demo check for existing cards (update)', async () => {
    mockDemoModeService.isDemo.mockReturnValue(true);
    mockDemoModeService.maxTasksPerProject = 1;

    const existingCard = {
      cardType: 'task-card',
      firebaseId: '-ExistingKey',
      cardId: 'DM-TSK-0001',
      title: 'Existing demo task',
      status: 'In Progress',
      group: 'tasks',
      projectId: 'DemoProject',
      year: 2026,
    };

    await firebaseService.saveCard(existingCard, { silent: true, skipHistory: true });

    // Should use update() regardless of demo mode (it's an existing card)
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockDemoModeService.showLimitReached).not.toHaveBeenCalled();
  });

  it('should not check demo limits when not in demo mode', async () => {
    mockDemoModeService.isDemo.mockReturnValue(false);
    mockDemoModeService.maxTasksPerProject = 2;

    mockPush.mockReturnValue({ key: '-NewKey' });
    mockGet.mockResolvedValueOnce({ exists: () => false, val: () => null });

    const newCard = {
      cardType: 'task-card',
      title: 'Normal task',
      status: 'To Do',
      group: 'tasks',
      projectId: 'MyProject',
      cardId: 'PRJ-TSK-0001',
      year: 2026,
    };

    await firebaseService.saveCard(newCard, { silent: true, skipHistory: true });

    // Should write without demo check
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockDemoModeService.showLimitReached).not.toHaveBeenCalled();
  });
});

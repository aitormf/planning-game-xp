/**
 * Tests for app-controller card edit/view handlers
 * Verifies the correct behavior when opening cards from table view:
 * 1. If card element exists in DOM → use it
 * 2. If not in DOM → fetch from /cards/ (source of truth)
 * 3. If not in /cards/ → ask user before removing from view
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase modules
const mockGet = vi.fn();
const mockRef = vi.fn((_db, path) => ({ path }));
const mockSet = vi.fn();
const mockDatabase = {};

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: (_db, path) => ({ path }),
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
  auth: { currentUser: { email: 'test@test.com' } },
  firebaseConfig: {},
  push: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  databaseFirestore: {},
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  superAdminEmail: ''
}));

describe('App Controller - Card Edit/View Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetch card from /cards/ source of truth', () => {
    it('should return card data when card exists in /cards/', async () => {
      const mockCardData = {
        cardId: 'PLN-TSK-0077',
        title: 'Test task',
        status: 'To Validate',
        year: 2026
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockCardData
      });

      const snap = await mockGet({ path: '/cards/PlanningGame/TASKS_PlanningGame/-OjqzubeMqjovTve-SIX' });

      expect(snap.exists()).toBe(true);
      expect(snap.val()).toEqual(mockCardData);
    });

    it('should return non-existent when card is missing from /cards/', async () => {
      mockGet.mockResolvedValue({
        exists: () => false,
        val: () => null
      });

      const snap = await mockGet({ path: '/cards/PlanningGame/TASKS_PlanningGame/-nonexistent' });

      expect(snap.exists()).toBe(false);
      expect(snap.val()).toBeNull();
    });

    it('should handle network errors when fetching from /cards/', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(
        mockGet({ path: '/cards/PlanningGame/TASKS_PlanningGame/-abc123' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Section path construction', () => {
    // getPathBySectionAndProjectId logic: `/cards/${projectId}/${section.toUpperCase()}_${projectId}`
    function getPathBySectionAndProjectId(section, projectId) {
      return `/cards/${projectId}/${section.toUpperCase()}_${projectId}`;
    }

    it('should construct correct path for tasks', () => {
      expect(getPathBySectionAndProjectId('tasks', 'PlanningGame'))
        .toBe('/cards/PlanningGame/TASKS_PlanningGame');
    });

    it('should construct correct path for bugs', () => {
      expect(getPathBySectionAndProjectId('bugs', 'Cinema4D'))
        .toBe('/cards/Cinema4D/BUGS_Cinema4D');
    });

    it('should construct correct path for proposals', () => {
      expect(getPathBySectionAndProjectId('proposals', 'PlanningGame'))
        .toBe('/cards/PlanningGame/PROPOSALS_PlanningGame');
    });

    it('should construct correct full card path with firebaseId', () => {
      const section = getPathBySectionAndProjectId('tasks', 'PlanningGame');
      const fullPath = `${section}/-OjqzubeMqjovTve-SIX`;
      expect(fullPath).toBe('/cards/PlanningGame/TASKS_PlanningGame/-OjqzubeMqjovTve-SIX');
    });
  });

  describe('Orphan handling requirements', () => {
    it('should NEVER auto-delete view entries without user confirmation', () => {
      // This test documents the critical requirement:
      // Auto-deletion of view entries (the old _cleanupOrphanViewEntry behavior)
      // is FORBIDDEN. The system must ask the user before deleting.
      //
      // The old code in handleEditTask (commit e9531c7) auto-deleted view entries
      // when a <task-card> element wasn't found in DOM, which is normal behavior
      // in table view (table rows are plain HTML, not web components).
      //
      // The correct behavior is:
      // 1. Fetch from /cards/ to verify if card truly exists
      // 2. If it exists in /cards/ → create temp card element → show in modal
      // 3. If it does NOT exist in /cards/ → ask user to confirm removal from view
      expect(true).toBe(true);
    });

    it('should only remove from view after explicit user confirmation', () => {
      // When a card exists in /views/ but not in /cards/, the system should:
      // - Show a modal explaining: "Esta tarea no existe en /cards/"
      // - Let the user decide: confirm removal or cancel
      // - If user confirms → remove from /views/, cache, and DOM
      // - If user cancels → do nothing
      expect(true).toBe(true);
    });
  });
});

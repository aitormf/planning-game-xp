/**
 * Tests for sync-card-views Cloud Function handler
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleSyncCardViews,
  extractTaskViewFields,
  extractBugViewFields,
  extractProposalViewFields,
  getViewPathForSection
} from '../../functions/handlers/sync-card-views.js';

describe('Sync Card Views Handler', () => {
  let mockDb;
  let mockLogger;
  let mockSet;
  let mockRemove;

  beforeEach(() => {
    mockSet = vi.fn().mockResolvedValue(undefined);
    mockRemove = vi.fn().mockResolvedValue(undefined);
    mockDb = {
      ref: vi.fn().mockReturnValue({
        set: mockSet,
        remove: mockRemove
      })
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
  });

  describe('getViewPathForSection', () => {
    it('should return task-list for tasks section (lowercase)', () => {
      expect(getViewPathForSection('tasks_ProjectA')).toBe('task-list');
      expect(getViewPathForSection('tasks_PlanningGame')).toBe('task-list');
    });

    it('should return task-list for TASKS section (uppercase)', () => {
      expect(getViewPathForSection('TASKS_ProjectA')).toBe('task-list');
      expect(getViewPathForSection('TASKS_PlanningGame')).toBe('task-list');
    });

    it('should return bug-list for bugs section (lowercase)', () => {
      expect(getViewPathForSection('bugs_ProjectA')).toBe('bug-list');
      expect(getViewPathForSection('bugs_Cinema4D')).toBe('bug-list');
    });

    it('should return bug-list for BUGS section (uppercase)', () => {
      expect(getViewPathForSection('BUGS_ProjectA')).toBe('bug-list');
      expect(getViewPathForSection('BUGS_Cinema4D')).toBe('bug-list');
    });

    it('should return proposal-list for proposals section (lowercase)', () => {
      expect(getViewPathForSection('proposals_ProjectA')).toBe('proposal-list');
    });

    it('should return proposal-list for PROPOSALS section (uppercase)', () => {
      expect(getViewPathForSection('PROPOSALS_ProjectA')).toBe('proposal-list');
    });

    it('should return null for other sections (epics, sprints, qa)', () => {
      expect(getViewPathForSection('epics_ProjectA')).toBeNull();
      expect(getViewPathForSection('sprints_ProjectA')).toBeNull();
      expect(getViewPathForSection('qa_ProjectA')).toBeNull();
      expect(getViewPathForSection('EPICS_ProjectA')).toBeNull();
      expect(getViewPathForSection('SPRINTS_ProjectA')).toBeNull();
    });
  });

  describe('extractTaskViewFields', () => {
    it('should extract only essential fields for task table view', () => {
      const fullTask = {
        cardId: 'PLN-TSK-0001',
        title: 'Test task',
        status: 'In Progress',
        description: 'Long description that should not be included',
        acceptanceCriteria: 'Also not included',
        acceptanceCriteriaStructured: [{ given: 'test', when: 'test', then: 'test' }],
        businessPoints: 3,
        devPoints: 2,
        sprint: 'PLN-SPR-0001',
        developer: 'dev_001',
        coDeveloper: 'dev_002',
        validator: 'stk_001',
        coValidator: 'stk_002',
        epic: 'PLN-EPC-0001',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
        spike: true,
        expedited: false,
        blockedByBusiness: false,
        blockedByDevelopment: true,
        notes: [{ text: 'note 1' }, { text: 'note 2' }],
        year: 2026,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        colors: { bg: '#fff' },
        position: 5
      };

      const viewData = extractTaskViewFields(fullTask, 'firebase-key-123');

      // Should include essential fields
      expect(viewData.cardId).toBe('PLN-TSK-0001');
      expect(viewData.title).toBe('Test task');
      expect(viewData.status).toBe('In Progress');
      expect(viewData.businessPoints).toBe(3);
      expect(viewData.devPoints).toBe(2);
      expect(viewData.sprint).toBe('PLN-SPR-0001');
      expect(viewData.developer).toBe('dev_001');
      expect(viewData.coDeveloper).toBe('dev_002');
      expect(viewData.validator).toBe('stk_001');
      expect(viewData.epic).toBe('PLN-EPC-0001');
      expect(viewData.startDate).toBe('2026-01-01');
      expect(viewData.endDate).toBe('2026-01-15');
      expect(viewData.spike).toBe(true);
      expect(viewData.expedited).toBe(false);
      expect(viewData.blockedByBusiness).toBe(false);
      expect(viewData.blockedByDevelopment).toBe(true);
      expect(viewData.notesCount).toBe(2);
      expect(viewData.year).toBe(2026);
      expect(viewData.firebaseId).toBe('firebase-key-123');

      // Should NOT include heavy/unnecessary fields
      expect(viewData.description).toBeUndefined();
      expect(viewData.acceptanceCriteria).toBeUndefined();
      expect(viewData.acceptanceCriteriaStructured).toBeUndefined();
      expect(viewData.notes).toBeUndefined();
      expect(viewData.colors).toBeUndefined();
      expect(viewData.position).toBeUndefined();
    });

    it('should extract relatedTasks with minimal fields and default type', () => {
      const taskWithRelations = {
        cardId: 'PLN-TSK-0050',
        title: 'Task with relations',
        status: 'In Progress',
        relatedTasks: [
          { id: 'PLN-TSK-0040', title: 'Blocker', type: 'blockedBy', projectId: 'PlanningGame' },
          { id: 'PLN-TSK-0045', projectId: 'PlanningGame' }
        ],
        year: 2026
      };

      const viewData = extractTaskViewFields(taskWithRelations, 'key-rel-1');

      expect(viewData.relatedTasks).toEqual([
        { id: 'PLN-TSK-0040', title: 'Blocker', type: 'blockedBy', projectId: 'PlanningGame' },
        { id: 'PLN-TSK-0045', title: 'PLN-TSK-0045', type: 'related', projectId: 'PlanningGame' }
      ]);
    });

    it('should not include relatedTasks when absent', () => {
      const taskWithoutRelations = {
        cardId: 'PLN-TSK-0051',
        title: 'No relations',
        status: 'To Do'
      };

      const viewData = extractTaskViewFields(taskWithoutRelations, 'key-no-rel');

      expect(viewData.relatedTasks).toBeUndefined();
    });

    it('should not include relatedTasks when not an array', () => {
      const taskWithBadRelations = {
        cardId: 'PLN-TSK-0052',
        title: 'Bad relations',
        status: 'To Do',
        relatedTasks: 'not-an-array'
      };

      const viewData = extractTaskViewFields(taskWithBadRelations, 'key-bad-rel');

      expect(viewData.relatedTasks).toBeUndefined();
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalTask = {
        cardId: 'PLN-TSK-0002',
        title: 'Minimal task',
        status: 'To Do'
      };

      const viewData = extractTaskViewFields(minimalTask, 'key-456');

      expect(viewData.cardId).toBe('PLN-TSK-0002');
      expect(viewData.title).toBe('Minimal task');
      expect(viewData.status).toBe('To Do');
      expect(viewData.notesCount).toBe(0);
      expect(viewData.firebaseId).toBe('key-456');
    });

    it('should extract planStatus from implementationPlan', () => {
      const taskWithPlan = {
        cardId: 'PLN-TSK-0060',
        title: 'Task with plan',
        status: 'In Progress',
        implementationPlan: { planStatus: 'in_progress', approach: 'test', steps: [] }
      };

      const viewData = extractTaskViewFields(taskWithPlan, 'key-plan');

      expect(viewData.planStatus).toBe('in_progress');
    });

    it('should not include planStatus when no implementationPlan', () => {
      const taskWithoutPlan = {
        cardId: 'PLN-TSK-0061',
        title: 'No plan',
        status: 'To Do'
      };

      const viewData = extractTaskViewFields(taskWithoutPlan, 'key-noplan');

      expect(viewData.planStatus).toBeUndefined();
    });
  });

  describe('extractBugViewFields', () => {
    it('should extract only essential fields for bug table view', () => {
      const fullBug = {
        cardId: 'PLN-BUG-0001',
        title: 'Test bug',
        status: 'Assigned',
        description: 'Long bug description',
        priority: 'APPLICATION BLOCKER',
        developer: 'dev_001',
        createdBy: 'user@test.com',
        registerDate: '2026-01-01',
        startDate: '2026-01-02',
        endDate: '2026-01-10',
        year: 2026,
        bugType: 'Funcional',
        cinemaFile: 'path/to/file.c4d',
        notes: [{ text: 'note' }]
      };

      const viewData = extractBugViewFields(fullBug, 'bug-key-123');

      // Should include essential fields
      expect(viewData.cardId).toBe('PLN-BUG-0001');
      expect(viewData.title).toBe('Test bug');
      expect(viewData.status).toBe('Assigned');
      expect(viewData.priority).toBe('APPLICATION BLOCKER');
      expect(viewData.developer).toBe('dev_001');
      expect(viewData.createdBy).toBe('user@test.com');
      expect(viewData.registerDate).toBe('2026-01-01');
      expect(viewData.startDate).toBe('2026-01-02');
      expect(viewData.endDate).toBe('2026-01-10');
      expect(viewData.year).toBe(2026);
      expect(viewData.firebaseId).toBe('bug-key-123');

      // Should NOT include heavy fields
      expect(viewData.description).toBeUndefined();
      expect(viewData.bugType).toBeUndefined();
      expect(viewData.cinemaFile).toBeUndefined();
      expect(viewData.notes).toBeUndefined();
    });
  });

  describe('extractProposalViewFields', () => {
    it('should extract only essential fields for proposal table view', () => {
      const fullProposal = {
        cardId: 'PLN-PRP-0001',
        title: 'Test proposal',
        status: 'Pending',
        description: 'Long proposal description',
        businessPoints: 5,
        createdBy: 'user@test.com',
        stakeholder: 'stk_001',
        registerDate: '2026-01-01',
        year: 2026,
        acceptanceCriteria: 'Not included'
      };

      const viewData = extractProposalViewFields(fullProposal, 'prop-key-123');

      // Should include essential fields
      expect(viewData.cardId).toBe('PLN-PRP-0001');
      expect(viewData.title).toBe('Test proposal');
      expect(viewData.status).toBe('Pending');
      expect(viewData.businessPoints).toBe(5);
      expect(viewData.createdBy).toBe('user@test.com');
      expect(viewData.stakeholder).toBe('stk_001');
      expect(viewData.registerDate).toBe('2026-01-01');
      expect(viewData.year).toBe(2026);
      expect(viewData.firebaseId).toBe('prop-key-123');

      // Should NOT include heavy fields
      expect(viewData.description).toBeUndefined();
      expect(viewData.acceptanceCriteria).toBeUndefined();
    });
  });

  describe('handleSyncCardViews', () => {
    describe('card creation', () => {
      it('should create view entry when task is created', async () => {
        const params = {
          projectId: 'PlanningGame',
          section: 'tasks_PlanningGame',
          cardId: '-Oabc123'
        };
        const beforeData = null; // Card didn't exist before
        const afterData = {
          cardId: 'PLN-TSK-0001',
          title: 'New task',
          status: 'To Do',
          year: 2026
        };

        await handleSyncCardViews(params, beforeData, afterData, { db: mockDb, logger: mockLogger });

        expect(mockDb.ref).toHaveBeenCalledWith('/views/task-list/PlanningGame/-Oabc123');
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
          cardId: 'PLN-TSK-0001',
          title: 'New task',
          status: 'To Do',
          firebaseId: '-Oabc123'
        }));
      });

      it('should create view entry when bug is created', async () => {
        const params = {
          projectId: 'Cinema4D',
          section: 'bugs_Cinema4D',
          cardId: '-Odef456'
        };
        const beforeData = null;
        const afterData = {
          cardId: 'C4D-BUG-0001',
          title: 'New bug',
          status: 'Created',
          priority: 'USER EXPERIENCE ISSUE'
        };

        await handleSyncCardViews(params, beforeData, afterData, { db: mockDb, logger: mockLogger });

        expect(mockDb.ref).toHaveBeenCalledWith('/views/bug-list/Cinema4D/-Odef456');
        expect(mockSet).toHaveBeenCalled();
      });

      it('should handle UPPERCASE section names from Firebase', async () => {
        const params = {
          projectId: 'Cinema4D',
          section: 'TASKS_Cinema4D',  // Firebase uses uppercase
          cardId: '-Oghi789'
        };
        const beforeData = null;
        const afterData = {
          cardId: 'C4D-TSK-0001',
          title: 'Task from uppercase section',
          status: 'To Do',
          year: 2026
        };

        await handleSyncCardViews(params, beforeData, afterData, { db: mockDb, logger: mockLogger });

        expect(mockDb.ref).toHaveBeenCalledWith('/views/task-list/Cinema4D/-Oghi789');
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
          cardId: 'C4D-TSK-0001',
          title: 'Task from uppercase section'
        }));
      });
    });

    describe('card update', () => {
      it('should update view entry when task is updated', async () => {
        const params = {
          projectId: 'PlanningGame',
          section: 'tasks_PlanningGame',
          cardId: '-Oabc123'
        };
        const beforeData = {
          cardId: 'PLN-TSK-0001',
          title: 'Old title',
          status: 'To Do'
        };
        const afterData = {
          cardId: 'PLN-TSK-0001',
          title: 'Updated title',
          status: 'In Progress',
          developer: 'dev_001'
        };

        await handleSyncCardViews(params, beforeData, afterData, { db: mockDb, logger: mockLogger });

        expect(mockDb.ref).toHaveBeenCalledWith('/views/task-list/PlanningGame/-Oabc123');
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Updated title',
          status: 'In Progress',
          developer: 'dev_001'
        }));
      });
    });

    describe('card deletion', () => {
      it('should remove view entry when task is deleted', async () => {
        const params = {
          projectId: 'PlanningGame',
          section: 'tasks_PlanningGame',
          cardId: '-Oabc123'
        };
        const beforeData = {
          cardId: 'PLN-TSK-0001',
          title: 'Task to delete',
          status: 'Done'
        };
        const afterData = null; // Card was deleted

        await handleSyncCardViews(params, beforeData, afterData, { db: mockDb, logger: mockLogger });

        expect(mockDb.ref).toHaveBeenCalledWith('/views/task-list/PlanningGame/-Oabc123');
        expect(mockRemove).toHaveBeenCalled();
      });
    });

    describe('ignored sections', () => {
      it('should skip epics (no view needed)', async () => {
        const params = {
          projectId: 'PlanningGame',
          section: 'epics_PlanningGame',
          cardId: '-Oabc123'
        };
        const afterData = { cardId: 'PLN-EPC-0001', title: 'Epic' };

        await handleSyncCardViews(params, null, afterData, { db: mockDb, logger: mockLogger });

        expect(mockDb.ref).not.toHaveBeenCalled();
        expect(mockSet).not.toHaveBeenCalled();
      });

      it('should skip sprints (no view needed)', async () => {
        const params = {
          projectId: 'PlanningGame',
          section: 'sprints_PlanningGame',
          cardId: '-Oabc123'
        };
        const afterData = { cardId: 'PLN-SPR-0001', title: 'Sprint' };

        await handleSyncCardViews(params, null, afterData, { db: mockDb, logger: mockLogger });

        expect(mockDb.ref).not.toHaveBeenCalled();
      });
    });
  });
});

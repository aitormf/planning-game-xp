/**
 * Consistency tests: CF extract functions and frontend _extractViewFields
 * must extract the same fields (source of truth: card-field-schemas.js)
 */
import { describe, it, expect } from 'vitest';
import {
  extractTaskViewFields,
  extractBugViewFields,
  extractProposalViewFields
} from '../../functions/handlers/sync-card-views.js';
import { TASK_SCHEMA, BUG_SCHEMA, PROPOSAL_SCHEMA } from '@/schemas/card-field-schemas.js';

describe('View Fields Consistency (CF vs Schema)', () => {

  describe('Task view fields', () => {
    it('CF extractTaskViewFields should return all fields from TASK_SCHEMA.VIEW_FIELDS', () => {
      const fullTask = {
        cardId: 'PLN-TSK-0001', title: 'Test', status: 'To Do',
        businessPoints: 3, devPoints: 2, sprint: 'PLN-SPR-0001',
        developer: 'dev_001', coDeveloper: 'dev_002',
        validator: 'stk_001', coValidator: 'stk_002',
        epic: 'PLN-EPC-0001',
        startDate: '2026-01-01', endDate: '2026-01-15',
        spike: true, expedited: false,
        blockedByBusiness: false, blockedByDevelopment: true,
        notes: [{ text: 'note' }], year: 2026,
        relatedTasks: [{ id: 'PLN-TSK-0002', type: 'related', projectId: 'PlanningGame' }],
        commits: [{ hash: 'abc123', message: 'feat: something' }],
        pipelineStatus: { prCreated: { date: '2026-02-22', prNumber: 42 } },
        implementationPlan: { planStatus: 'completed' }
      };

      const cfResult = extractTaskViewFields(fullTask, '-Oabc123');
      const cfFields = new Set(Object.keys(cfResult));

      // CF should include all schema VIEW_FIELDS
      for (const field of TASK_SCHEMA.VIEW_FIELDS) {
        expect(cfFields.has(field)).toBe(true);
      }
      // CF also includes notesCount (computed from notes array)
      expect(cfResult.notesCount).toBeDefined();
    });

    it('CF should not include heavy fields', () => {
      const fullTask = {
        cardId: 'PLN-TSK-0001', title: 'Test', status: 'To Do',
        description: 'Long desc', acceptanceCriteria: 'AC',
        acceptanceCriteriaStructured: [{ given: 'g', when: 'w', then: 't' }],
        notes: [{ text: 'note' }]
      };

      const cfResult = extractTaskViewFields(fullTask, '-Oabc123');

      expect(cfResult.description).toBeUndefined();
      expect(cfResult.acceptanceCriteria).toBeUndefined();
      expect(cfResult.acceptanceCriteriaStructured).toBeUndefined();
      expect(cfResult.notes).toBeUndefined();
    });
  });

  describe('Bug view fields', () => {
    it('CF extractBugViewFields should include coDeveloper (fix regression)', () => {
      const fullBug = {
        cardId: 'PLN-BUG-0001', title: 'Bug', status: 'Created',
        priority: 'APPLICATION BLOCKER',
        developer: 'dev_001', coDeveloper: 'dev_002',
        createdBy: 'user@test.com',
        registerDate: '2026-01-01', startDate: '2026-01-02', endDate: '2026-01-10',
        year: 2026
      };

      const cfResult = extractBugViewFields(fullBug, '-Odef456');

      expect(cfResult.coDeveloper).toBe('dev_002');
    });

    it('CF extractBugViewFields should return all fields from BUG_SCHEMA.VIEW_FIELDS', () => {
      const fullBug = {
        cardId: 'PLN-BUG-0001', title: 'Bug', status: 'Created',
        priority: 'USER EXPERIENCE ISSUE',
        developer: 'dev_001', coDeveloper: 'dev_002',
        createdBy: 'user@test.com',
        registerDate: '2026-01-01', startDate: '2026-01-02', endDate: '2026-01-10',
        year: 2026,
        commits: [{ hash: 'abc123', message: 'fix: bug' }],
        pipelineStatus: { prCreated: { date: '2026-02-22', prNumber: 10 } }
      };

      const cfResult = extractBugViewFields(fullBug, '-Odef456');
      const cfFields = new Set(Object.keys(cfResult));

      for (const field of BUG_SCHEMA.VIEW_FIELDS) {
        expect(cfFields.has(field)).toBe(true);
      }
    });
  });

  describe('Proposal view fields', () => {
    it('CF extractProposalViewFields should return all fields from PROPOSAL_SCHEMA.VIEW_FIELDS', () => {
      const fullProposal = {
        cardId: 'PLN-PRP-0001', title: 'Prop', status: 'Pending',
        businessPoints: 5, createdBy: 'user@test.com',
        stakeholder: 'stk_001', registerDate: '2026-01-01', year: 2026
      };

      const cfResult = extractProposalViewFields(fullProposal, '-Oprop123');
      const cfFields = new Set(Object.keys(cfResult));

      for (const field of PROPOSAL_SCHEMA.VIEW_FIELDS) {
        expect(cfFields.has(field)).toBe(true);
      }
    });
  });
});

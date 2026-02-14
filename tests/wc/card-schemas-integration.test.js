/**
 * Integration tests for schema-based getWCProps() across all card types
 * Verifies that schemas correctly exclude UI-only fields
 */
import { describe, it, expect } from 'vitest';
import {
  BUG_SCHEMA,
  PROPOSAL_SCHEMA,
  EPIC_SCHEMA,
  QA_SCHEMA
} from '@/schemas/card-field-schemas.js';

describe('Card Schemas Integration', () => {

  describe('BUG_SCHEMA', () => {
    it('should include all bug-specific data fields', () => {
      const expected = [
        'firebaseId', 'cardId', 'title', 'description', 'notes',
        'status', 'priority', 'developer', 'coDeveloper',
        'registerDate', 'acceptanceCriteria', 'acceptanceCriteriaStructured',
        'bugType', 'attachment', 'repositoryLabel', 'year',
        'cinemaFile', 'exportedFile', 'importedFile',
        'plugin', 'pluginVersion', 'treatmentType',
        'startDate', 'endDate', 'createdBy', 'projectId', 'cardType'
      ];
      const persistent = new Set(BUG_SCHEMA.PERSISTENT_FIELDS);
      const missing = expected.filter(f => !persistent.has(f));
      expect(missing).toEqual([]);
    });

    it('should NOT include BugCard UI-only properties', () => {
      const uiFields = [
        'statusList', 'priorityList', 'developerList', 'bugTypeList',
        'userAuthorizedEmails', 'activeTab', 'expanded', 'selected',
        'acceptanceCriteriaColor', 'descriptionColor', 'notesColor',
        'originalStatus', 'originalFiles', 'invalidFields',
        'isEditable', 'isAnalyzingDescription', 'iaEnabled'
      ];
      for (const field of uiFields) {
        expect(BUG_SCHEMA.PERSISTENT_FIELDS).not.toContain(field);
      }
    });

    it('should include coDeveloper in VIEW_FIELDS (bug fix regression)', () => {
      expect(BUG_SCHEMA.VIEW_FIELDS).toContain('coDeveloper');
    });
  });

  describe('PROPOSAL_SCHEMA', () => {
    it('should include proposal-specific data fields', () => {
      const expected = [
        'firebaseId', 'cardId', 'title', 'description',
        'acceptanceCriteria', 'acceptanceCriteriaStructured',
        'registerDate', 'epic', 'businessPoints',
        'developer', 'stakeholder',
        'descDado', 'descCuando', 'descPara',
        'createdBy', 'projectId', 'cardType'
      ];
      const persistent = new Set(PROPOSAL_SCHEMA.PERSISTENT_FIELDS);
      const missing = expected.filter(f => !persistent.has(f));
      expect(missing).toEqual([]);
    });

    it('should NOT include ProposalCard UI-only properties', () => {
      const uiFields = [
        'epicList', 'developers', 'stakeholders',
        'activeTab', 'expanded', 'selected', 'isEditable',
        'invalidFields', 'isSuperAdmin', '_isConvertingDescription'
      ];
      for (const field of uiFields) {
        expect(PROPOSAL_SCHEMA.PERSISTENT_FIELDS).not.toContain(field);
      }
    });
  });

  describe('EPIC_SCHEMA', () => {
    it('should include epic-specific data fields', () => {
      const expected = [
        'firebaseId', 'cardId', 'title', 'description',
        'objective', 'acceptanceCriteria',
        'year', 'stakeholdersSelected', 'epicRelationsSelected',
        'startDate', 'endDate', 'createdBy', 'projectId', 'cardType'
      ];
      const persistent = new Set(EPIC_SCHEMA.PERSISTENT_FIELDS);
      const missing = expected.filter(f => !persistent.has(f));
      expect(missing).toEqual([]);
    });

    it('should NOT include EpicCard UI-only properties', () => {
      const uiFields = [
        'stakeholders', 'epicRelations',
        'expanded', 'selected', 'isEditable',
        'activeTab', 'user', 'userEmail', 'invalidFields'
      ];
      for (const field of uiFields) {
        expect(EPIC_SCHEMA.PERSISTENT_FIELDS).not.toContain(field);
      }
    });
  });

  describe('QA_SCHEMA', () => {
    it('should include QA-specific data fields', () => {
      const expected = [
        'firebaseId', 'cardId', 'title', 'description',
        'associatedTaskId', 'priority', 'steps', 'status',
        'actualResult', 'expectedResult', 'defectType',
        'attachments', 'suiteId',
        'createdBy', 'projectId', 'cardType'
      ];
      const persistent = new Set(QA_SCHEMA.PERSISTENT_FIELDS);
      const missing = expected.filter(f => !persistent.has(f));
      expect(missing).toEqual([]);
    });

    it('should NOT include QACard UI-only properties', () => {
      const uiFields = [
        'expanded', 'isEditable', 'userEmail'
      ];
      for (const field of uiFields) {
        expect(QA_SCHEMA.PERSISTENT_FIELDS).not.toContain(field);
      }
    });
  });
});

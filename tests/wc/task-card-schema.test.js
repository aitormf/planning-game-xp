/**
 * Tests for TaskCard.getWCProps() schema-based migration
 * Verifies that the schema-based implementation produces the same output
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TASK_SCHEMA } from '@/schemas/card-field-schemas.js';

// Mock Lit
vi.mock('https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm', () => ({
  LitElement: class MockLitElement {
    constructor() { this._properties = {}; }
    static get properties() { return {}; }
    requestUpdate() {}
    connectedCallback() {}
    disconnectedCallback() {}
  },
  html: (strings, ...values) => ({ strings, values }),
  css: (strings, ...values) => ({ strings, values }),
  unsafeCSS: (str) => str
}));

// Mock firebase-config
vi.mock('../../public/firebase-config.js', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  database: {},
  auth: { currentUser: { email: 'test@test.com' } },
  firebaseConfig: {},
  functions: {},
  httpsCallable: vi.fn()
}));

// Mock services
vi.mock('@/services/permission-service.js', () => ({
  permissionService: {
    canEdit: () => true,
    canValidate: () => false,
    isAdmin: () => false,
    getRole: () => 'user'
  }
}));

vi.mock('@/services/user-directory-service.js', () => ({
  userDirectoryService: { resolve: vi.fn() }
}));

vi.mock('@/services/entity-directory-service.js', () => ({
  entityDirectoryService: { resolve: vi.fn(), getEmail: vi.fn() }
}));

vi.mock('@/services/state-transition-service.js', () => ({
  stateTransitionService: { getNextStates: () => [], isValidTransition: () => true }
}));

vi.mock('@/utils/super-admin-check.js', () => ({
  isCurrentUserSuperAdmin: () => false
}));

vi.mock('@/utils/scenario-modal.js', () => ({
  openScenarioModal: vi.fn()
}));

vi.mock('@/utils/priority-utils.js', () => ({
  getPriorityDisplay: vi.fn().mockReturnValue({ label: '', class: '' })
}));

vi.mock('@/config/theme-config.js', () => ({
  KANBAN_STATUS_COLORS_CSS: ''
}));

vi.mock('@/constants/app-constants.js', () => ({
  APP_CONSTANTS: { MAX_NOTES: 50, STATUS: {} }
}));

vi.mock('https://cdn.jsdelivr.net/npm/@manufosela/loading-layer@2.0.1/+esm', () => ({}));

vi.mock('https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm', () => ({
  format: vi.fn(),
  parse: vi.fn(),
  isValid: vi.fn()
}));

vi.mock('@/wc/FirebaseStorageUploader.js', () => ({}));

vi.mock('@/utils/developer-normalizer.js', () => ({
  normalizeDeveloperEntries: vi.fn(v => v),
  normalizeDeveloperEntry: vi.fn(v => v),
  getDeveloperKey: vi.fn(v => v)
}));

describe('TaskCard Schema Integration', () => {

  describe('TASK_SCHEMA.PERSISTENT_FIELDS coverage', () => {
    it('should include all fields that TaskCard.getWCProps() previously returned', () => {
      const previousFields = [
        'firebaseId', 'cardId', 'title', 'description', 'notes',
        'acceptanceCriteria', 'descriptionStructured', 'acceptanceCriteriaStructured',
        'businessPoints', 'devPoints', 'startDate', 'endDate', 'sprint',
        'spike', 'expedited', 'status', 'developer', 'coDeveloper',
        'developerName', 'epic', 'validator', 'coValidator',
        'blockedByBusiness', 'blockedByDevelopment', 'bbbWhy', 'bbbWho',
        'bbdWhy', 'bbdWho', 'group', 'projectId', 'cardType',
        'developerHistory', 'blockedHistory', 'attachment', 'relatedTasks',
        'repositoryLabel', 'year', 'commits', 'validatedAt',
        'reopenCycles', 'reopenCount', 'implementationPlan', 'implementationNotes'
      ];

      const schemaFields = new Set(TASK_SCHEMA.PERSISTENT_FIELDS);
      const missing = previousFields.filter(f => !schemaFields.has(f));
      expect(missing).toEqual([]);
    });

    it('should not include UI-only fields', () => {
      const uiOnlyFields = [
        'statusList', 'developerList', 'activeTab', 'expanded', 'selected',
        'isEditable', 'isSaving', 'invalidFields', 'canEditPermission',
        'userEmail', 'originalStatus', 'user', 'currentViewMode',
        '_permissionsVersion', 'viewMode', 'isYearReadOnly'
      ];

      for (const field of uiOnlyFields) {
        expect(TASK_SCHEMA.PERSISTENT_FIELDS).not.toContain(field);
      }
    });
  });

  describe('TASK_SCHEMA.VIEW_FIELDS coverage', () => {
    it('should match the fields used in table-view-manager._extractViewFields()', () => {
      const expectedViewFields = [
        'firebaseId', 'cardId', 'title', 'status',
        'businessPoints', 'devPoints', 'sprint',
        'developer', 'coDeveloper', 'validator', 'coValidator',
        'epic', 'startDate', 'endDate', 'spike', 'expedited',
        'blockedByBusiness', 'blockedByDevelopment', 'year', 'relatedTasks',
        'notesCount', 'planStatus'
      ];

      expect(new Set(TASK_SCHEMA.VIEW_FIELDS)).toEqual(new Set(expectedViewFields));
    });

    it('VIEW_FIELDS should not include heavy fields', () => {
      const heavyFields = ['description', 'acceptanceCriteria', 'acceptanceCriteriaStructured', 'notes'];
      for (const field of heavyFields) {
        expect(TASK_SCHEMA.VIEW_FIELDS).not.toContain(field);
      }
    });
  });
});

// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock de dependencias externas
vi.mock('https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm', () => ({
  LitElement: class MockLitElement {
    static get properties() { return {}; }
    constructor() {
      this._requestedUpdates = [];
      this.tagName = 'MOCK-ELEMENT';
    }
    requestUpdate() {
      this._requestedUpdates.push(Date.now());
    }
    updated() {}
    connectedCallback() {}
    disconnectedCallback() {}
    dispatchEvent(event) { return true; }
    getAttribute(name) { return null; }
    setAttribute(name, value) {}
  },
  html: (strings, ...values) => ({ strings, values }),
  css: (strings, ...values) => ({ strings, values })
}));

vi.mock('https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm', () => ({
  LitElement: class MockLitElement {
    static get properties() { return {}; }
    constructor() {
      this._requestedUpdates = [];
      this.tagName = 'MOCK-ELEMENT';
    }
    requestUpdate() {
      this._requestedUpdates.push(Date.now());
    }
    updated() {}
    connectedCallback() {}
    disconnectedCallback() {}
    dispatchEvent(event) { return true; }
    getAttribute(name) { return null; }
    setAttribute(name, value) {}
  },
  html: (strings, ...values) => ({ strings, values }),
  css: (strings, ...values) => ({ strings, values }),
  unsafeCSS: (str) => str
}));

vi.mock('https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm', () => ({
  format: vi.fn(() => '01/01/2024'),
  parse: vi.fn(() => new Date(2024, 0, 1)),
  isValid: vi.fn((date) => date instanceof Date && !isNaN(date.getTime()))
}));

vi.mock('../../public/js/utils/service-communicator.js', () => ({
  ServiceCommunicator: {
    requestPermissions: vi.fn(),
    requestCardAction: vi.fn(),
    requestGlobalData: vi.fn()
  }
}));

vi.mock('../../public/js/services/entity-directory-service.js', () => ({
  entityDirectoryService: {
    resolveDeveloperEmail: vi.fn((id) => `${id}@example.com`),
    resolveStakeholderEmail: vi.fn((id) => `${id}@example.com`),
    waitForInit: vi.fn(() => Promise.resolve())
  }
}));

vi.mock('../../public/firebase-config.js', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  database: {},
  auth: { currentUser: null },
  firebaseConfig: {},
  functions: {},
  httpsCallable: vi.fn()
}));

vi.mock('../../public/js/services/permission-service.js', () => ({
  permissionService: {
    canEditCard: vi.fn(() => true),
    canDeleteCard: vi.fn(() => true),
    hasPermission: vi.fn(() => true)
  }
}));

vi.mock('../../public/js/utils/developer-normalizer.js', () => ({
  normalizeDeveloperEntries: vi.fn((entries) => entries),
  normalizeDeveloperEntry: vi.fn((entry) => entry),
  getDeveloperKey: vi.fn((dev) => dev)
}));

vi.mock('../../public/js/constants/app-constants.js', () => ({
  APP_CONSTANTS: {
    TASK_STATUS_ORDER: ['To Do', 'In Progress', 'To Validate', 'Done', 'Done&Validated'],
    BUG_STATUS_ORDER: ['Created', 'Assigned', 'Fixed', 'Verified']
  }
}));

vi.mock('../../public/js/services/user-directory-service.js', () => ({
  userDirectoryService: {
    resolveDisplayName: vi.fn(() => 'Test User'),
    waitForInit: vi.fn(() => Promise.resolve())
  }
}));

vi.mock('../../public/js/utils/super-admin-check.js', () => ({
  isCurrentUserSuperAdmin: vi.fn(() => false)
}));

vi.mock('../../public/js/utils/scenario-modal.js', () => ({
  openScenarioModal: vi.fn()
}));

vi.mock('../../public/js/utils/priority-utils.js', () => ({
  getPriorityDisplay: vi.fn(() => ({ label: 'Medium', color: '#ccc', rank: 50 }))
}));

vi.mock('../../public/js/services/state-transition-service.js', () => ({
  stateTransitionService: {
    getAvailableTransitions: vi.fn(() => []),
    validateTransition: vi.fn(() => ({ valid: true }))
  }
}));

vi.mock('../../public/js/wc/FirebaseStorageUploader.js', () => ({}));
vi.mock('https://cdn.jsdelivr.net/npm/@manufosela/loading-layer@2.0.1/+esm', () => ({}));

vi.mock('../../public/js/wc/task-card-styles.js', () => ({
  TaskCardStyles: []
}));

vi.mock('../../public/js/ui/styles/notes-styles.js', () => ({
  NotesStyles: { strings: [], values: [] }
}));

vi.mock('../../public/js/wc/commits-list-styles.js', () => ({
  CommitsListStyles: { strings: [], values: [] }
}));

vi.mock('../../public/js/config/theme-config.js', () => ({
  KANBAN_STATUS_COLORS_CSS: ''
}));

vi.mock('../../public/js/mixins/notes-manager-mixin.js', () => ({
  NotesManagerMixin: (superClass) => superClass
}));

vi.mock('../../public/js/mixins/commits-display-mixin.js', () => ({
  CommitsDisplayMixin: (superClass) => superClass
}));

// Import after mocks
const { BaseCard } = await import('../../public/js/wc/base-card.js');
const { TaskCard } = await import('../../public/js/wc/TaskCard.js');

// Helper to create a minimal TaskCard instance for testing
function createTaskCard(overrides = {}) {
  const card = new TaskCard();
  card.tagName = 'TASK-CARD';
  card.cardType = 'task-card';
  Object.keys(overrides).forEach(key => {
    card[key] = overrides[key];
  });
  return card;
}

describe('TaskCard Plan tab', () => {

  describe('_getNormalizedPlan()', () => {
    it('should return empty plan when implementationPlan is null', () => {
      const card = createTaskCard({ implementationPlan: null });
      const plan = card._getNormalizedPlan();

      expect(plan).toEqual({
        approach: '',
        steps: [],
        dataModelChanges: '',
        apiChanges: '',
        risks: '',
        outOfScope: '',
        planStatus: 'pending'
      });
    });

    it('should return empty plan when implementationPlan is undefined', () => {
      const card = createTaskCard();
      card.implementationPlan = undefined;
      const plan = card._getNormalizedPlan();

      expect(plan.approach).toBe('');
      expect(plan.steps).toEqual([]);
      expect(plan.planStatus).toBe('pending');
    });

    it('should migrate string legacy to structured object', () => {
      const card = createTaskCard({ implementationPlan: 'Use the new API to fetch data' });
      const plan = card._getNormalizedPlan();

      expect(plan.approach).toBe('Use the new API to fetch data');
      expect(plan.planStatus).toBe('proposed');
      expect(plan.steps).toEqual([]);
      expect(plan.dataModelChanges).toBe('');
    });

    it('should preserve existing object plan', () => {
      const existingPlan = {
        approach: 'Refactor service layer',
        steps: [{ description: 'Step 1', files: 'service.js', status: 'done' }],
        dataModelChanges: 'Add field X',
        apiChanges: 'New endpoint /api/x',
        risks: 'Breaking change',
        outOfScope: 'Migration',
        planStatus: 'validated'
      };
      const card = createTaskCard({ implementationPlan: existingPlan });
      const plan = card._getNormalizedPlan();

      expect(plan.approach).toBe('Refactor service layer');
      expect(plan.steps).toHaveLength(1);
      expect(plan.steps[0].status).toBe('done');
      expect(plan.dataModelChanges).toBe('Add field X');
      expect(plan.apiChanges).toBe('New endpoint /api/x');
      expect(plan.risks).toBe('Breaking change');
      expect(plan.outOfScope).toBe('Migration');
      expect(plan.planStatus).toBe('validated');
    });

    it('should fill missing fields in partial object with defaults', () => {
      const card = createTaskCard({ implementationPlan: { approach: 'Partial plan' } });
      const plan = card._getNormalizedPlan();

      expect(plan.approach).toBe('Partial plan');
      expect(plan.steps).toEqual([]);
      expect(plan.dataModelChanges).toBe('');
      expect(plan.planStatus).toBe('pending');
    });
  });

  describe('_updatePlanField()', () => {
    it('should update a specific field and set implementationPlan as object', () => {
      const card = createTaskCard({ implementationPlan: null });
      card._updatePlanField('approach', 'New approach');

      expect(card.implementationPlan).toBeDefined();
      expect(card.implementationPlan.approach).toBe('New approach');
      expect(card.implementationPlan.planStatus).toBe('pending');
    });

    it('should preserve other fields when updating one', () => {
      const card = createTaskCard({
        implementationPlan: { approach: 'Old approach', risks: 'Some risk', planStatus: 'proposed' }
      });
      card._updatePlanField('risks', 'Updated risk');

      expect(card.implementationPlan.approach).toBe('Old approach');
      expect(card.implementationPlan.risks).toBe('Updated risk');
      expect(card.implementationPlan.planStatus).toBe('proposed');
    });
  });

  describe('_addPlanStep()', () => {
    it('should add a new empty step to null plan', () => {
      const card = createTaskCard({ implementationPlan: null });
      card._addPlanStep();

      expect(card.implementationPlan.steps).toHaveLength(1);
      expect(card.implementationPlan.steps[0]).toEqual({
        description: '',
        files: '',
        status: 'pending'
      });
    });

    it('should add step to existing steps', () => {
      const card = createTaskCard({
        implementationPlan: {
          steps: [{ description: 'Step 1', files: 'a.js', status: 'done' }]
        }
      });
      card._addPlanStep();

      expect(card.implementationPlan.steps).toHaveLength(2);
      expect(card.implementationPlan.steps[1].description).toBe('');
      expect(card.implementationPlan.steps[1].status).toBe('pending');
    });
  });

  describe('_removePlanStep()', () => {
    it('should remove step at given index', () => {
      const card = createTaskCard({
        implementationPlan: {
          steps: [
            { description: 'Step A', files: '', status: 'pending' },
            { description: 'Step B', files: '', status: 'done' },
            { description: 'Step C', files: '', status: 'pending' }
          ]
        }
      });
      card._removePlanStep(1);

      expect(card.implementationPlan.steps).toHaveLength(2);
      expect(card.implementationPlan.steps[0].description).toBe('Step A');
      expect(card.implementationPlan.steps[1].description).toBe('Step C');
    });

    it('should handle removing the only step', () => {
      const card = createTaskCard({
        implementationPlan: {
          steps: [{ description: 'Only step', files: '', status: 'pending' }]
        }
      });
      card._removePlanStep(0);

      expect(card.implementationPlan.steps).toHaveLength(0);
    });
  });

  describe('_updatePlanStep()', () => {
    it('should update a specific field of a step', () => {
      const card = createTaskCard({
        implementationPlan: {
          steps: [
            { description: 'Old description', files: 'file.js', status: 'pending' }
          ]
        }
      });
      card._updatePlanStep(0, 'description', 'New description');

      expect(card.implementationPlan.steps[0].description).toBe('New description');
      expect(card.implementationPlan.steps[0].files).toBe('file.js');
      expect(card.implementationPlan.steps[0].status).toBe('pending');
    });

    it('should update step status', () => {
      const card = createTaskCard({
        implementationPlan: {
          steps: [
            { description: 'Step 1', files: '', status: 'pending' },
            { description: 'Step 2', files: '', status: 'pending' }
          ]
        }
      });
      card._updatePlanStep(1, 'status', 'done');

      expect(card.implementationPlan.steps[0].status).toBe('pending');
      expect(card.implementationPlan.steps[1].status).toBe('done');
    });
  });

  describe('_handlePlanStatusChange()', () => {
    it('should update planStatus from event', () => {
      const card = createTaskCard({ implementationPlan: null });
      const mockEvent = { target: { value: 'validated' } };
      card._handlePlanStatusChange(mockEvent);

      expect(card.implementationPlan.planStatus).toBe('validated');
    });
  });

  describe('getWCProps() persistence fix', () => {
    it('should include implementationPlan in saved props', () => {
      const card = createTaskCard({
        title: 'Test task',
        cardId: 'TST-TSK-0001',
        projectId: 'TestProject',
        implementationPlan: { approach: 'Test approach', planStatus: 'proposed' }
      });
      // Mock methods that getWCProps depends on
      card.getIdForFirebase = () => 'firebase-id-123';
      card._syncStructuredFields = () => {};
      card._getDescriptionStructuredForSave = () => [];
      card._getAcceptanceCriteriaStructuredForSave = () => [];
      card._getSelectedYear = () => 2026;

      const props = card.getWCProps();

      expect(props.implementationPlan).toBeDefined();
      expect(props.implementationPlan.approach).toBe('Test approach');
      expect(props.implementationPlan.planStatus).toBe('proposed');
    });

    it('should include implementationNotes in saved props', () => {
      const card = createTaskCard({
        title: 'Test task',
        cardId: 'TST-TSK-0001',
        projectId: 'TestProject',
        implementationNotes: 'Dev notes here'
      });
      card.getIdForFirebase = () => 'firebase-id-123';
      card._syncStructuredFields = () => {};
      card._getDescriptionStructuredForSave = () => [];
      card._getAcceptanceCriteriaStructuredForSave = () => [];
      card._getSelectedYear = () => 2026;

      const props = card.getWCProps();

      expect(props.implementationNotes).toBe('Dev notes here');
    });

    it('should handle null implementationPlan gracefully in getWCProps', () => {
      const card = createTaskCard({
        title: 'Test task',
        cardId: 'TST-TSK-0001',
        projectId: 'TestProject',
        implementationPlan: null
      });
      card.getIdForFirebase = () => 'firebase-id-123';
      card._syncStructuredFields = () => {};
      card._getDescriptionStructuredForSave = () => [];
      card._getAcceptanceCriteriaStructuredForSave = () => [];
      card._getSelectedYear = () => 2026;

      const props = card.getWCProps();

      // null is cleaned up by the Object.keys filter (null values are removed)
      expect(props.implementationPlan).toBeUndefined();
    });
  });

  describe('implementationPlan property type', () => {
    it('should accept object values for implementationPlan', () => {
      const card = createTaskCard();
      const planObj = { approach: 'Test', steps: [], planStatus: 'pending' };
      card.implementationPlan = planObj;

      expect(card.implementationPlan).toEqual(planObj);
    });

    it('should accept string values for backward compatibility', () => {
      const card = createTaskCard();
      card.implementationPlan = 'Legacy string plan';

      // The property accepts any value; normalization happens in _getNormalizedPlan
      expect(card.implementationPlan).toBe('Legacy string plan');
      const normalized = card._getNormalizedPlan();
      expect(normalized.approach).toBe('Legacy string plan');
      expect(normalized.planStatus).toBe('proposed');
    });
  });
});

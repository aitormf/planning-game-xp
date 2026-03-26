/**
 * Tests for GlobalDataManager - event listener cleanup on reset()
 * PLN-BUG-0099: reset() must clear the eventListeners Set so that
 * _setupEventListeners() can re-register handlers after loadAll()
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase modules
vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
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

describe('GlobalDataManager', () => {
  let GlobalDataManager;
  let manager;
  let addSpy;
  let removeSpy;

  beforeEach(async () => {
    // Reset singleton before each test
    vi.resetModules();
    const module = await import('@/services/global-data-manager.js');
    GlobalDataManager = module.GlobalDataManager;
    GlobalDataManager.instance = null;
    manager = new GlobalDataManager();

    addSpy = vi.spyOn(document, 'addEventListener');
    removeSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    addSpy?.mockRestore();
    removeSpy?.mockRestore();
  });

  describe('reset()', () => {
    it('should clear the eventListeners Set', () => {
      // Simulate listeners registered
      manager.eventListeners.add('request-taskcard-data');
      manager.eventListeners.add('request-bugcard-data');
      expect(manager.eventListeners.size).toBe(2);

      manager.reset();

      expect(manager.eventListeners.size).toBe(0);
    });

    it('should remove document event listeners on reset', () => {
      // Register listeners via _setupEventListeners
      manager._setupEventListeners();
      const registeredCount = manager.eventListeners.size;
      expect(registeredCount).toBeGreaterThan(0);

      manager.reset();

      // After reset, removeEventListener should have been called for each registered listener
      expect(removeSpy).toHaveBeenCalledTimes(registeredCount);
      expect(manager.eventListeners.size).toBe(0);
    });

    it('should allow re-registration of event listeners after reset', () => {
      // First registration
      manager._setupEventListeners();
      const firstCount = addSpy.mock.calls.length;
      expect(firstCount).toBeGreaterThan(0);

      // Reset clears the guard
      manager.reset();
      addSpy.mockClear();

      // Second registration should work (not blocked by guard)
      manager._setupEventListeners();
      const secondCount = addSpy.mock.calls.length;
      expect(secondCount).toBe(firstCount);
    });

    it('should reset isLoaded and loadPromise', () => {
      manager.isLoaded = true;
      manager.loadPromise = Promise.resolve();

      manager.reset();

      expect(manager.isLoaded).toBe(false);
      expect(manager.loadPromise).toBeNull();
    });
  });

  describe('_addEventListenerOnce()', () => {
    it('should not register the same event twice', () => {
      const handler = vi.fn();
      manager._addEventListenerOnce('test-event', handler);
      manager._addEventListenerOnce('test-event', handler);

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(manager.eventListeners.size).toBe(1);
    });
  });

  describe('_setupEventListeners() status list format', () => {
    it('should provide status names when statusLists is an Array (from sortStatusList)', () => {
      const statuses = ['To Do', 'In Progress', 'To Validate', 'Done', 'Done&Validated'];
      manager.complexData.statusLists = { 'task-card': statuses };
      manager.complexData.developerList = [];
      manager.complexData.stakeholders = [];
      manager.complexData.sprintList = {};

      manager._setupEventListeners();

      let receivedStatusList = null;
      const listener = (e) => { receivedStatusList = e.detail.statusList; };
      document.addEventListener('provide-taskcard-data', listener);

      document.dispatchEvent(new CustomEvent('request-taskcard-data', {
        detail: { cardId: 'TEST-001', cardType: 'task-card' }
      }));

      document.removeEventListener('provide-taskcard-data', listener);

      expect(receivedStatusList).toEqual(statuses);
      expect(receivedStatusList).not.toContain('0');
      expect(receivedStatusList).not.toContain('1');
    });

    it('should provide status names when statusLists is an Object (raw Firebase format)', () => {
      const statusObj = { 'To Do': 1, 'In Progress': 2, 'Done': 3 };
      manager.complexData.statusLists = { 'task-card': statusObj };
      manager.complexData.developerList = [];
      manager.complexData.stakeholders = [];
      manager.complexData.sprintList = {};

      manager._setupEventListeners();

      let receivedStatusList = null;
      const listener = (e) => { receivedStatusList = e.detail.statusList; };
      document.addEventListener('provide-taskcard-data', listener);

      document.dispatchEvent(new CustomEvent('request-taskcard-data', {
        detail: { cardId: 'TEST-002', cardType: 'task-card' }
      }));

      document.removeEventListener('provide-taskcard-data', listener);

      expect(receivedStatusList).toEqual(['To Do', 'In Progress', 'Done']);
    });

    it('should provide bug status names when statusLists is an Array', () => {
      const bugStatuses = ['Open', 'In Progress', 'Fixed', 'Closed'];
      manager.complexData.statusLists = { 'bug-card': bugStatuses };
      manager.complexData.developerList = [];
      manager.complexData.bugPriorityList = [];

      manager._setupEventListeners();

      let receivedStatusList = null;
      const listener = (e) => { receivedStatusList = e.detail.statusList; };
      document.addEventListener('provide-bugcard-data', listener);

      document.dispatchEvent(new CustomEvent('request-bugcard-data', {
        detail: { cardId: 'BUG-001', cardType: 'bug-card' }
      }));

      document.removeEventListener('provide-bugcard-data', listener);

      expect(receivedStatusList).toEqual(bugStatuses);
      expect(receivedStatusList).not.toContain('0');
    });
  });
});

/**
 * Tests for TabController - MutationObserver instead of setTimeout
 * PLN-BUG-0099: TabController must NOT use setTimeout for DOM readiness
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock URLUtils
vi.mock('../../public/js/utils/url-utils.js', () => ({
  URLUtils: {
    getSectionFromUrl: vi.fn(() => 'tasks')
  }
}));

describe('TabController', () => {
  let TabController;

  beforeEach(async () => {
    vi.resetModules();
    // Ensure clean DOM
    document.body.innerHTML = '';
    const module = await import('@/controllers/tab-controller.js');
    TabController = module.TabController;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupTabButtons()', () => {
    it('should NOT use setTimeout when tab buttons are not found', () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      const tc = new TabController();

      // No .tablinks in DOM → should NOT call setTimeout
      tc.setupTabButtons();

      const setTimeoutCalls = setTimeoutSpy.mock.calls.filter(
        call => typeof call[0] === 'function'
      );
      // Should use MutationObserver, not setTimeout
      expect(setTimeoutCalls.length).toBe(0);
      setTimeoutSpy.mockRestore();
    });

    it('should attach click listeners when tab buttons exist', () => {
      // Add tab buttons to DOM
      document.body.innerHTML = `
        <button class="tablinks" data-section="tasks">Tasks</button>
        <button class="tablinks" data-section="bugs">Bugs</button>
      `;
      const tc = new TabController();
      const buttons = document.querySelectorAll('.tablinks');
      const addSpy = vi.spyOn(buttons[0], 'addEventListener');

      tc.setupTabButtons();

      // Buttons should have click listeners
      expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('ensureTabButtonUpdate()', () => {
    it('should NOT use setTimeout polling', () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      const tc = new TabController();

      tc.ensureTabButtonUpdate('tasks', 0);

      const pollingCalls = setTimeoutSpy.mock.calls.filter(
        call => typeof call[0] === 'function'
      );
      expect(pollingCalls.length).toBe(0);
      setTimeoutSpy.mockRestore();
    });

    it('should update tab states immediately when target button exists', () => {
      document.body.innerHTML = `
        <button class="tablinks" data-section="tasks">Tasks</button>
        <button class="tablinks" data-section="bugs">Bugs</button>
      `;
      const tc = new TabController();
      tc.ensureTabButtonUpdate('tasks');

      const activeButton = document.querySelector('[data-section="tasks"]');
      expect(activeButton.classList.contains('active')).toBe(true);
    });
  });

  describe('cleanup()', () => {
    it('should disconnect MutationObserver on cleanup', () => {
      const tc = new TabController();
      // If there's an active observer, cleanup should disconnect it
      tc.cleanup();
      // Should not throw and observer should be null
      expect(tc._tabObserver).toBeNull();
    });
  });
});

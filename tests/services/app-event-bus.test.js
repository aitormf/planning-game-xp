import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppEventBus, AppEvents } from '@/services/app-event-bus.js';

describe('AppEventBus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('emit and once', () => {
    it('should emit event and trigger once listener', () => {
      const callback = vi.fn();
      const testDetail = { section: 'tasks', count: 5 };

      AppEventBus.once(AppEvents.TABLE_RENDERED, callback);
      AppEventBus.emit(AppEvents.TABLE_RENDERED, testDetail);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(testDetail);
    });

    it('should only trigger once listener one time', () => {
      const callback = vi.fn();

      AppEventBus.once(AppEvents.CARDS_LOADED, callback);
      AppEventBus.emit(AppEvents.CARDS_LOADED, { first: true });
      AppEventBus.emit(AppEvents.CARDS_LOADED, { second: true });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ first: true });
    });
  });

  describe('on (continuous listener)', () => {
    it('should trigger callback on every emit', () => {
      const callback = vi.fn();

      const unsubscribe = AppEventBus.on(AppEvents.FILTERS_APPLIED, callback);

      AppEventBus.emit(AppEvents.FILTERS_APPLIED, { count: 1 });
      AppEventBus.emit(AppEvents.FILTERS_APPLIED, { count: 2 });
      AppEventBus.emit(AppEvents.FILTERS_APPLIED, { count: 3 });

      expect(callback).toHaveBeenCalledTimes(3);

      // Cleanup
      unsubscribe();
    });

    it('should stop receiving events after unsubscribe', () => {
      const callback = vi.fn();

      const unsubscribe = AppEventBus.on(AppEvents.VIEW_CHANGED, callback);

      AppEventBus.emit(AppEvents.VIEW_CHANGED, { view: 'table' });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      AppEventBus.emit(AppEvents.VIEW_CHANGED, { view: 'kanban' });
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('waitFor', () => {
    it('should resolve promise when event is emitted', async () => {
      const testDetail = { data: 'test', ready: true };

      const waitPromise = AppEventBus.waitFor(AppEvents.GLOBAL_DATA_READY);

      // Emit the event
      AppEventBus.emit(AppEvents.GLOBAL_DATA_READY, testDetail);

      const result = await waitPromise;
      expect(result).toEqual(testDetail);
    });

    it('should reject with timeout error when event does not arrive', async () => {
      const waitPromise = AppEventBus.waitFor(AppEvents.TABLE_RENDERED, 1000);

      // Advance timers past timeout
      vi.advanceTimersByTime(1001);

      await expect(waitPromise).rejects.toThrow('Timeout waiting for event: app:table-rendered (1000ms)');
    });

    it('should clear timeout when event arrives before timeout', async () => {
      const waitPromise = AppEventBus.waitFor(AppEvents.CARDS_RENDERED, 5000);

      // Emit before timeout
      vi.advanceTimersByTime(100);
      AppEventBus.emit(AppEvents.CARDS_RENDERED, { success: true });

      const result = await waitPromise;
      expect(result).toEqual({ success: true });

      // Advance past original timeout - should not throw
      vi.advanceTimersByTime(5000);
    });
  });

  describe('waitForUnless', () => {
    it('should resolve immediately if condition is met', async () => {
      const condition = () => true;

      const result = await AppEventBus.waitForUnless(
        AppEvents.GLOBAL_DATA_READY,
        condition,
        1000
      );

      expect(result).toBeNull();
    });

    it('should wait for event if condition is not met', async () => {
      const condition = () => false;
      const testDetail = { loaded: true };

      const waitPromise = AppEventBus.waitForUnless(
        AppEvents.GLOBAL_DATA_READY,
        condition,
        5000
      );

      AppEventBus.emit(AppEvents.GLOBAL_DATA_READY, testDetail);

      const result = await waitPromise;
      expect(result).toEqual(testDetail);
    });
  });

  describe('waitForAll', () => {
    it('should resolve when all events are emitted', async () => {
      const waitPromise = AppEventBus.waitForAll([
        AppEvents.TABLE_RENDERED,
        AppEvents.FILTERS_READY
      ], 5000);

      AppEventBus.emit(AppEvents.TABLE_RENDERED, { table: true });
      AppEventBus.emit(AppEvents.FILTERS_READY, { filters: true });

      const results = await waitPromise;
      expect(results).toEqual([
        { table: true },
        { filters: true }
      ]);
    });

    it('should reject if any event times out', async () => {
      const waitPromise = AppEventBus.waitForAll([
        AppEvents.TABLE_RENDERED,
        AppEvents.KANBAN_RENDERED
      ], 1000);

      // Only emit one event
      AppEventBus.emit(AppEvents.TABLE_RENDERED, { done: true });

      // Timeout the other
      vi.advanceTimersByTime(1001);

      await expect(waitPromise).rejects.toThrow('Timeout');
    });
  });

  describe('waitForAny', () => {
    it('should resolve with first event that fires', async () => {
      const waitPromise = AppEventBus.waitForAny([
        AppEvents.TABLE_RENDERED,
        AppEvents.KANBAN_RENDERED
      ], 5000);

      AppEventBus.emit(AppEvents.KANBAN_RENDERED, { view: 'kanban' });

      const result = await waitPromise;
      expect(result).toEqual({
        event: AppEvents.KANBAN_RENDERED,
        detail: { view: 'kanban' }
      });
    });

    it('should reject if no events fire within timeout', async () => {
      const waitPromise = AppEventBus.waitForAny([
        AppEvents.TABLE_RENDERED,
        AppEvents.KANBAN_RENDERED
      ], 1000);

      vi.advanceTimersByTime(1001);

      await expect(waitPromise).rejects.toThrow('Timeout waiting for any of');
    });
  });

  describe('AppEvents constants', () => {
    it('should have all expected event types', () => {
      expect(AppEvents.GLOBAL_DATA_READY).toBe('app:global-data-ready');
      expect(AppEvents.CARDS_LOADED).toBe('app:cards-loaded');
      expect(AppEvents.CARDS_RENDERED).toBe('app:cards-rendered');
      expect(AppEvents.VIEW_CHANGED).toBe('app:view-changed');
      expect(AppEvents.TABLE_RENDERED).toBe('app:table-rendered');
      expect(AppEvents.KANBAN_RENDERED).toBe('app:kanban-rendered');
      expect(AppEvents.FILTERS_READY).toBe('app:filters-ready');
      expect(AppEvents.FILTERS_APPLIED).toBe('app:filters-applied');
      expect(AppEvents.COMPONENT_READY).toBe('app:component-ready');
      expect(AppEvents.SECTION_CHANGED).toBe('app:section-changed');
    });
  });
});

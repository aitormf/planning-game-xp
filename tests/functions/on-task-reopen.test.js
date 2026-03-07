/**
 * Tests for onTaskReopen handler
 * Handles time accumulation when tasks are reopened.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDbRef = vi.fn();
const mockDbUpdate = vi.fn();

const mockDb = {
  ref: mockDbRef
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

const { handleTaskReopen, calculateBusinessHours } = await import(
  '../../functions/handlers/on-task-reopen.js'
);

describe('onTaskReopen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbRef.mockReturnValue({
      update: mockDbUpdate.mockResolvedValue()
    });
  });

  describe('guards', () => {
    it('should skip if not tasks section', async () => {
      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'BUGS_Test', cardId: 'card1' },
        { status: 'To Validate' },
        { status: 'Reopened' },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });

    it('should skip if status did not change', async () => {
      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'Reopened' },
        { status: 'Reopened' },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });

    it('should skip non-relevant transitions', async () => {
      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'To Do' },
        { status: 'In Progress' },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });
  });

  describe('on status → Reopened', () => {
    it('should push timeEntry and clear endDate when both startDate and endDate exist', async () => {
      const beforeData = { status: 'Done' };
      const afterData = {
        status: 'Reopened',
        startDate: '2026-03-01T09:00:00Z',
        endDate: '2026-03-03T17:00:00Z'
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        beforeData,
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ action: 'time-entry-saved' });
      expect(mockDbUpdate).toHaveBeenCalledWith({
        timeEntries: [
          { start: '2026-03-01T09:00:00Z', end: '2026-03-03T17:00:00Z' }
        ],
        endDate: null
      });
    });

    it('should skip if no startDate', async () => {
      const afterData = {
        status: 'Reopened',
        endDate: '2026-03-03T17:00:00Z'
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'Done' },
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ action: 'skipped-missing-dates' });
      expect(mockDbUpdate).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should skip if no endDate', async () => {
      const afterData = {
        status: 'Reopened',
        startDate: '2026-03-01T09:00:00Z'
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'Done' },
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ action: 'skipped-missing-dates' });
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });

    it('should accumulate multiple entries when timeEntries already exist', async () => {
      const afterData = {
        status: 'Reopened',
        startDate: '2026-03-05T09:00:00Z',
        endDate: '2026-03-06T17:00:00Z',
        timeEntries: [
          { start: '2026-03-01T09:00:00Z', end: '2026-03-03T17:00:00Z' }
        ]
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'Done&Validated' },
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ action: 'time-entry-saved' });
      expect(mockDbUpdate).toHaveBeenCalledWith({
        timeEntries: [
          { start: '2026-03-01T09:00:00Z', end: '2026-03-03T17:00:00Z' },
          { start: '2026-03-05T09:00:00Z', end: '2026-03-06T17:00:00Z' }
        ],
        endDate: null
      });
    });

    it('should handle edge case: empty timeEntries array', async () => {
      const afterData = {
        status: 'Reopened',
        startDate: '2026-03-01T09:00:00Z',
        endDate: '2026-03-03T17:00:00Z',
        timeEntries: []
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'Done' },
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ action: 'time-entry-saved' });
      expect(mockDbUpdate).toHaveBeenCalledWith({
        timeEntries: [
          { start: '2026-03-01T09:00:00Z', end: '2026-03-03T17:00:00Z' }
        ],
        endDate: null
      });
    });
  });

  describe('on status → To Validate with timeEntries', () => {
    it('should calculate totalEffectiveHours from timeEntries + current period', async () => {
      const afterData = {
        status: 'To Validate',
        startDate: '2026-03-05T09:00:00Z',
        endDate: '2026-03-05T17:00:00Z',
        timeEntries: [
          // Mon Mar 3 9am to Mon Mar 3 5pm = 8 hours
          { start: '2026-03-02T09:00:00Z', end: '2026-03-02T17:00:00Z' }
        ]
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'In Progress', endDate: null },
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ action: 'total-hours-calculated' });
      expect(mockDbUpdate).toHaveBeenCalledWith({
        totalEffectiveHours: expect.any(Number)
      });

      const updateArg = mockDbUpdate.mock.calls[0][0];
      // 8h from entry + 8h from current = 16h
      expect(updateArg.totalEffectiveHours).toBe(16);
    });

    it('should not write totalEffectiveHours when no timeEntries', async () => {
      const afterData = {
        status: 'To Validate',
        startDate: '2026-03-05T09:00:00Z',
        endDate: '2026-03-05T17:00:00Z'
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'In Progress', endDate: null },
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });

    it('should handle empty timeEntries array on To Validate', async () => {
      const afterData = {
        status: 'To Validate',
        startDate: '2026-03-05T09:00:00Z',
        endDate: '2026-03-05T17:00:00Z',
        timeEntries: []
      };

      const result = await handleTaskReopen(
        { projectId: 'Test', section: 'TASKS_Test', cardId: 'card1' },
        { status: 'In Progress', endDate: null },
        afterData,
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });
  });

  describe('calculateBusinessHours', () => {
    it('should return 8 hours for a full workday (Mon 9am-5pm)', () => {
      // Monday March 2, 2026
      const hours = calculateBusinessHours(
        '2026-03-02T09:00:00Z',
        '2026-03-02T17:00:00Z'
      );
      expect(hours).toBe(8);
    });

    it('should return 16 hours for two full workdays', () => {
      // Mon-Tue March 2-3, 2026
      const hours = calculateBusinessHours(
        '2026-03-02T09:00:00Z',
        '2026-03-03T17:00:00Z'
      );
      expect(hours).toBe(16);
    });

    it('should skip weekends', () => {
      // Friday March 6 to Monday March 9, 2026
      const hours = calculateBusinessHours(
        '2026-03-06T09:00:00Z',
        '2026-03-09T17:00:00Z'
      );
      // Fri 8h + Mon 8h = 16h (Sat/Sun skipped)
      expect(hours).toBe(16);
    });

    it('should return 40 hours for a full work week', () => {
      // Mon March 2 to Fri March 6, 2026
      const hours = calculateBusinessHours(
        '2026-03-02T09:00:00Z',
        '2026-03-06T17:00:00Z'
      );
      expect(hours).toBe(40);
    });

    it('should return 0 for same start and end', () => {
      const hours = calculateBusinessHours(
        '2026-03-02T09:00:00Z',
        '2026-03-02T09:00:00Z'
      );
      expect(hours).toBe(0);
    });

    it('should return 0 for weekend-only period', () => {
      // Sat to Sun
      const hours = calculateBusinessHours(
        '2026-03-07T09:00:00Z',
        '2026-03-08T17:00:00Z'
      );
      expect(hours).toBe(0);
    });

    it('should handle partial day (4 hours)', () => {
      // Monday 9am to 1pm
      const hours = calculateBusinessHours(
        '2026-03-02T09:00:00Z',
        '2026-03-02T13:00:00Z'
      );
      expect(hours).toBe(4);
    });

    it('should handle date-only strings (assume full 8h day)', () => {
      // Single day
      const hours = calculateBusinessHours('2026-03-02', '2026-03-02');
      expect(hours).toBe(8);
    });

    it('should handle date-only strings across multiple days', () => {
      // Mon to Tue
      const hours = calculateBusinessHours('2026-03-02', '2026-03-03');
      expect(hours).toBe(16);
    });
  });
});

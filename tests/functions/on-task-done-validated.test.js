/**
 * Tests for onTaskDoneValidated handler
 * Recalculates effectiveHours when task is marked Done&Validated
 * and timestamps are estimated (default times).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDbRef = vi.fn();
const mockDbOnce = vi.fn();
const mockDbUpdate = vi.fn();

const mockDb = {
  ref: mockDbRef
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

const { handleTaskDoneValidated } = await import('../../functions/handlers/on-task-done-validated.js');

describe('onTaskDoneValidated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbRef.mockReturnValue({
      once: mockDbOnce,
      update: mockDbUpdate
    });
    mockDbUpdate.mockResolvedValue();
  });

  const baseParams = { projectId: 'TestProject', section: 'tasks_TestProject', cardId: 'TST-TSK-0001' };

  describe('Guard clauses', () => {
    it('should skip non-task sections', async () => {
      const result = await handleTaskDoneValidated(
        { projectId: 'Test', section: 'bugs_Test', cardId: 'card1' },
        { status: 'To Validate' },
        { status: 'Done&Validated' },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should skip if not transition to Done&Validated', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'In Progress' },
        { status: 'To Validate' },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
    });

    it('should skip if before status was already Done&Validated', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'Done&Validated' },
        { status: 'Done&Validated', effectiveHours: 16 },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
    });

    it('should skip if effectiveHours already set (loop guard)', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        { status: 'Done&Validated', effectiveHours: 16 },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('effectiveHours already set'),
        expect.any(Object)
      );
    });
  });

  describe('Real timestamp detection', () => {
    it('should skip if startDate has real time (not 09:00:00)', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T10:30:00',
          endDate: '2026-03-05T17:00:00',
          devPoints: 3
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('real timestamps'),
        expect.any(Object)
      );
    });

    it('should skip if endDate has real time (not 17:00:00)', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T09:00:00',
          endDate: '2026-03-05T15:45:00',
          devPoints: 3
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('real timestamps'),
        expect.any(Object)
      );
    });

    it('should skip if both have real times', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T11:00:00',
          endDate: '2026-03-05T14:30:00',
          devPoints: 3
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
    });
  });

  describe('Recalculation with estimated timestamps', () => {
    it('should recalculate with scale_1_5 devPoints=3 → 16h', async () => {
      // Mock: project scoringSystem
      mockDbOnce
        .mockResolvedValueOnce({ val: () => '1-5' })
        // Mock: devPointsToHours lookup
        .mockResolvedValueOnce({ val: () => 16 });

      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T09:00:00',
          endDate: '2026-03-05T17:00:00',
          devPoints: 3
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ effectiveHours: 16 });
      expect(mockDbUpdate).toHaveBeenCalledWith({ effectiveHours: 16 });

      // Verify correct Firebase paths
      expect(mockDbRef).toHaveBeenCalledWith('/projects/TestProject/scoringSystem');
      expect(mockDbRef).toHaveBeenCalledWith('/data/devPointsToHours/scale_1_5/3');
    });

    it('should recalculate with fibonacci devPoints=8 → 40h', async () => {
      mockDbOnce
        .mockResolvedValueOnce({ val: () => 'fibonacci' })
        .mockResolvedValueOnce({ val: () => 40 });

      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T09:00:00',
          endDate: '2026-03-05T17:00:00',
          devPoints: 8
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ effectiveHours: 40 });
      expect(mockDbUpdate).toHaveBeenCalledWith({ effectiveHours: 40 });
      expect(mockDbRef).toHaveBeenCalledWith('/data/devPointsToHours/fibonacci/8');
    });

    it('should handle legacy dates without T component as estimated', async () => {
      mockDbOnce
        .mockResolvedValueOnce({ val: () => '1-5' })
        .mockResolvedValueOnce({ val: () => 8 });

      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01',
          endDate: '2026-03-03',
          devPoints: 2
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ effectiveHours: 8 });
      expect(mockDbUpdate).toHaveBeenCalledWith({ effectiveHours: 8 });
    });

    it('should default to scale_1_5 when project has no scoringSystem', async () => {
      mockDbOnce
        .mockResolvedValueOnce({ val: () => null })
        .mockResolvedValueOnce({ val: () => 4 });

      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T09:00:00',
          endDate: '2026-03-05T17:00:00',
          devPoints: 1
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toEqual({ effectiveHours: 4 });
      expect(mockDbRef).toHaveBeenCalledWith('/data/devPointsToHours/scale_1_5/1');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing devPoints gracefully', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T09:00:00',
          endDate: '2026-03-05T17:00:00'
          // no devPoints
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing devPoints'),
        expect.any(Object)
      );
    });

    it('should handle missing startDate', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          endDate: '2026-03-05T17:00:00',
          devPoints: 3
          // no startDate
        },
        { db: mockDb, logger: mockLogger }
      );

      // Missing startDate → treat as estimated (no T component)
      // Should proceed with recalculation
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing dates'),
        expect.any(Object)
      );
    });

    it('should handle missing endDate', async () => {
      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T09:00:00',
          devPoints: 3
          // no endDate
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing dates'),
        expect.any(Object)
      );
    });

    it('should handle no mapping found in devPointsToHours', async () => {
      mockDbOnce
        .mockResolvedValueOnce({ val: () => '1-5' })
        .mockResolvedValueOnce({ val: () => null }); // no mapping

      const result = await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01T09:00:00',
          endDate: '2026-03-05T17:00:00',
          devPoints: 99
        },
        { db: mockDb, logger: mockLogger }
      );

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no mapping found'),
        expect.any(Object)
      );
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });

    it('should use correct scoring key for 1-5 system', async () => {
      mockDbOnce
        .mockResolvedValueOnce({ val: () => '1-5' })
        .mockResolvedValueOnce({ val: () => 24 });

      await handleTaskDoneValidated(
        baseParams,
        { status: 'To Validate' },
        {
          status: 'Done&Validated',
          startDate: '2026-03-01',
          endDate: '2026-03-05',
          devPoints: 4
        },
        { db: mockDb, logger: mockLogger }
      );

      // '1-5' should map to 'scale_1_5' key
      expect(mockDbRef).toHaveBeenCalledWith('/data/devPointsToHours/scale_1_5/4');
    });
  });
});

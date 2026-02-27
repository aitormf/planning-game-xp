import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  queueValidationEmail,
  queueBugFixedEmail,
  readQueue,
  removeFromQueue,
  groupByRecipient,
  groupByProject,
  QUEUE_PATH
} = require('../../functions/handlers/email-queue.js');

describe('email-queue', () => {
  let mockDb;
  let mockPushRef;

  beforeEach(() => {
    mockPushRef = {
      key: '-MockPushKey123',
      set: vi.fn().mockResolvedValue(undefined)
    };

    mockDb = {
      ref: vi.fn().mockReturnValue({
        push: vi.fn().mockReturnValue(mockPushRef),
        once: vi.fn().mockResolvedValue({ val: () => null }),
        update: vi.fn().mockResolvedValue(undefined)
      })
    };
  });

  describe('queueValidationEmail', () => {
    it('should write validation entry to /emailQueue/toValidate', async () => {
      const data = {
        recipientEmail: 'validator@example.com',
        recipientName: 'Validator User',
        cardId: 'C4D-TSK-0042',
        projectId: 'Cinema4D',
        taskTitle: 'Add feature X',
        developerName: 'Dev User',
        acceptanceCriteria: [{ given: 'a', when: 'b', then: 'c' }]
      };

      const key = await queueValidationEmail(mockDb, data);

      expect(key).toBe('-MockPushKey123');
      expect(mockDb.ref).toHaveBeenCalledWith('/emailQueue/toValidate');
      expect(mockPushRef.set).toHaveBeenCalledWith(expect.objectContaining({
        type: 'toValidate',
        recipientEmail: 'validator@example.com',
        recipientName: 'Validator User',
        cardId: 'C4D-TSK-0042',
        projectId: 'Cinema4D',
        taskTitle: 'Add feature X',
        developerName: 'Dev User',
        acceptanceCriteria: [{ given: 'a', when: 'b', then: 'c' }],
        timestamp: expect.any(Number)
      }));
    });

    it('should handle missing optional fields', async () => {
      const data = {
        recipientEmail: 'v@test.com',
        recipientName: 'V',
        cardId: 'TSK-0001',
        projectId: 'TestProj',
        taskTitle: 'Task'
      };

      await queueValidationEmail(mockDb, data);

      expect(mockPushRef.set).toHaveBeenCalledWith(expect.objectContaining({
        developerName: null,
        acceptanceCriteria: []
      }));
    });
  });

  describe('queueBugFixedEmail', () => {
    it('should write bug fixed entry to /emailQueue/bugFixed', async () => {
      const data = {
        recipientEmail: 'creator@example.com',
        cardId: 'C4D-BUG-0015',
        projectId: 'Cinema4D',
        bugTitle: 'Crash on save',
        developerName: 'Fix Dev',
        description: 'App crashes when saving large files'
      };

      const key = await queueBugFixedEmail(mockDb, data);

      expect(key).toBe('-MockPushKey123');
      expect(mockDb.ref).toHaveBeenCalledWith('/emailQueue/bugFixed');
      expect(mockPushRef.set).toHaveBeenCalledWith(expect.objectContaining({
        type: 'bugFixed',
        recipientEmail: 'creator@example.com',
        cardId: 'C4D-BUG-0015',
        projectId: 'Cinema4D',
        bugTitle: 'Crash on save',
        developerName: 'Fix Dev',
        description: 'App crashes when saving large files',
        timestamp: expect.any(Number)
      }));
    });

    it('should handle missing optional fields', async () => {
      const data = {
        recipientEmail: 'c@test.com',
        cardId: 'BUG-0001',
        projectId: 'TestProj',
        bugTitle: 'Bug'
      };

      await queueBugFixedEmail(mockDb, data);

      expect(mockPushRef.set).toHaveBeenCalledWith(expect.objectContaining({
        developerName: null,
        description: ''
      }));
    });
  });

  describe('readQueue', () => {
    it('should return empty array when queue is empty', async () => {
      const result = await readQueue(mockDb, 'toValidate');
      expect(result).toEqual([]);
    });

    it('should return entries with keys when queue has data', async () => {
      const queueData = {
        '-key1': { type: 'toValidate', recipientEmail: 'a@test.com', cardId: 'TSK-1' },
        '-key2': { type: 'toValidate', recipientEmail: 'b@test.com', cardId: 'TSK-2' }
      };

      mockDb.ref.mockReturnValue({
        once: vi.fn().mockResolvedValue({ val: () => queueData })
      });

      const result = await readQueue(mockDb, 'toValidate');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ key: '-key1', data: queueData['-key1'] });
      expect(result[1]).toEqual({ key: '-key2', data: queueData['-key2'] });
    });

    it('should read from correct queue path', async () => {
      await readQueue(mockDb, 'bugFixed');
      expect(mockDb.ref).toHaveBeenCalledWith('/emailQueue/bugFixed');
    });
  });

  describe('removeFromQueue', () => {
    it('should remove entries by setting them to null', async () => {
      const mockRootRef = {
        update: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.ref.mockReturnValue(mockRootRef);

      await removeFromQueue(mockDb, 'toValidate', ['-key1', '-key2']);

      expect(mockDb.ref).toHaveBeenCalledWith();
      expect(mockRootRef.update).toHaveBeenCalledWith({
        '/emailQueue/toValidate/-key1': null,
        '/emailQueue/toValidate/-key2': null
      });
    });

    it('should do nothing when keys array is empty', async () => {
      await removeFromQueue(mockDb, 'toValidate', []);
      // ref() should not be called for root update
      expect(mockDb.ref).not.toHaveBeenCalledWith();
    });

    it('should do nothing when keys is null', async () => {
      await removeFromQueue(mockDb, 'toValidate', null);
      expect(mockDb.ref).not.toHaveBeenCalledWith();
    });
  });

  describe('groupByRecipient', () => {
    it('should group entries by recipientEmail', () => {
      const entries = [
        { key: '-k1', data: { recipientEmail: 'a@test.com', cardId: 'TSK-1' } },
        { key: '-k2', data: { recipientEmail: 'b@test.com', cardId: 'TSK-2' } },
        { key: '-k3', data: { recipientEmail: 'a@test.com', cardId: 'TSK-3' } }
      ];

      const grouped = groupByRecipient(entries);

      expect(grouped.size).toBe(2);
      expect(grouped.get('a@test.com')).toHaveLength(2);
      expect(grouped.get('b@test.com')).toHaveLength(1);
    });

    it('should return empty map for empty entries', () => {
      const grouped = groupByRecipient([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('groupByProject', () => {
    it('should group entries by projectId', () => {
      const entries = [
        { key: '-k1', data: { projectId: 'C4D', cardId: 'TSK-1' } },
        { key: '-k2', data: { projectId: 'NTR', cardId: 'TSK-2' } },
        { key: '-k3', data: { projectId: 'C4D', cardId: 'TSK-3' } }
      ];

      const grouped = groupByProject(entries);

      expect(grouped.size).toBe(2);
      expect(grouped.get('C4D')).toHaveLength(2);
      expect(grouped.get('NTR')).toHaveLength(1);
    });

    it('should return empty map for empty entries', () => {
      const grouped = groupByProject([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('QUEUE_PATH', () => {
    it('should be /emailQueue', () => {
      expect(QUEUE_PATH).toBe('/emailQueue');
    });
  });
});

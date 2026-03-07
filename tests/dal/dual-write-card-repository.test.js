import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualWriteCardRepository } from '../../shared/dal/dual-write-card-repository.js';

function createMockCardRepo(name = 'mock') {
  return {
    _repo: {},
    name,
    listCards: vi.fn().mockResolvedValue({ 'card-1': { title: 'T1' } }),
    getCard: vi.fn().mockResolvedValue({ title: 'T1' }),
    findCardByCardId: vi.fn().mockResolvedValue({ firebaseId: 'fb1', type: 'task', data: {} }),
    createCard: vi.fn().mockResolvedValue({ firebaseId: 'fb-new', data: { title: 'New' } }),
    updateCard: vi.fn().mockResolvedValue(undefined),
    deleteCard: vi.fn().mockResolvedValue(undefined),
    subscribeToCard: vi.fn().mockReturnValue(() => {})
  };
}

describe('DualWriteCardRepository', () => {
  let primary, secondary, dual;

  beforeEach(() => {
    primary = createMockCardRepo('primary');
    secondary = createMockCardRepo('secondary');
    dual = new DualWriteCardRepository(primary, secondary);
  });

  describe('reads delegate to primary only', () => {
    it('listCards reads from primary', async () => {
      const result = await dual.listCards('Proj', 'task', { status: 'To Do' });
      expect(primary.listCards).toHaveBeenCalledWith('Proj', 'task', { status: 'To Do' });
      expect(secondary.listCards).not.toHaveBeenCalled();
      expect(result).toEqual({ 'card-1': { title: 'T1' } });
    });

    it('getCard reads from primary', async () => {
      await dual.getCard('Proj', 'task', 'fb1');
      expect(primary.getCard).toHaveBeenCalledWith('Proj', 'task', 'fb1');
      expect(secondary.getCard).not.toHaveBeenCalled();
    });

    it('findCardByCardId reads from primary', async () => {
      await dual.findCardByCardId('Proj', 'PLN-TSK-0001', 'task');
      expect(primary.findCardByCardId).toHaveBeenCalledWith('Proj', 'PLN-TSK-0001', 'task');
      expect(secondary.findCardByCardId).not.toHaveBeenCalled();
    });

    it('subscribeToCard uses primary', () => {
      const cb = vi.fn();
      dual.subscribeToCard('Proj', 'task', 'fb1', cb);
      expect(primary.subscribeToCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', cb);
      expect(secondary.subscribeToCard).not.toHaveBeenCalled();
    });
  });

  describe('writes go to both backends', () => {
    it('createCard writes to both', async () => {
      const result = await dual.createCard('Proj', 'task', { title: 'New' });
      expect(primary.createCard).toHaveBeenCalledWith('Proj', 'task', { title: 'New' });
      expect(secondary.createCard).toHaveBeenCalledWith('Proj', 'task', { title: 'New', _firebaseId: 'fb-new' });
      expect(result.firebaseId).toBe('fb-new');
    });

    it('updateCard writes to both', async () => {
      await dual.updateCard('Proj', 'task', 'fb1', { status: 'Done' });
      expect(primary.updateCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', { status: 'Done' });
      expect(secondary.updateCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', { status: 'Done' });
    });

    it('deleteCard writes to both', async () => {
      const meta = { deletedAt: '2026-03-08', deletedBy: 'user' };
      await dual.deleteCard('Proj', 'task', 'fb1', meta);
      expect(primary.deleteCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', meta);
      expect(secondary.deleteCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', meta);
    });
  });

  describe('shadow write error handling', () => {
    it('should not throw when secondary fails', async () => {
      secondary.updateCard.mockRejectedValue(new Error('Firestore down'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(dual.updateCard('Proj', 'task', 'fb1', { status: 'Done' }))
        .resolves.toBeUndefined();

      expect(primary.updateCard).toHaveBeenCalled();
    });

    it('should call default error handler on secondary failure', async () => {
      secondary.createCard.mockRejectedValue(new Error('Firestore timeout'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await dual.createCard('Proj', 'task', { title: 'T' });

      expect(errorSpy).toHaveBeenCalledWith(
        '[DualWrite] Shadow write failed on createCard:',
        'Firestore timeout'
      );
    });

    it('should call custom error handler when provided', async () => {
      const customHandler = vi.fn();
      const customDual = new DualWriteCardRepository(primary, secondary, { onShadowError: customHandler });
      secondary.deleteCard.mockRejectedValue(new Error('Network error'));

      await customDual.deleteCard('Proj', 'task', 'fb1');

      expect(customHandler).toHaveBeenCalledWith('deleteCard', expect.any(Error));
    });

    it('should throw when primary fails', async () => {
      primary.updateCard.mockRejectedValue(new Error('RTDB down'));

      await expect(dual.updateCard('Proj', 'task', 'fb1', { status: 'Done' }))
        .rejects.toThrow('RTDB down');
    });
  });
});

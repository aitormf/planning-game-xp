import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadSwitchCardRepository } from '../../shared/dal/read-switch-card-repository.js';

function createMockCardRepo(name, data = {}) {
  return {
    _repo: {},
    name,
    listCards: vi.fn().mockResolvedValue(data.listCards ?? {}),
    getCard: vi.fn().mockResolvedValue(data.getCard ?? null),
    findCardByCardId: vi.fn().mockResolvedValue(data.findCardByCardId ?? null),
    createCard: vi.fn().mockResolvedValue({ firebaseId: 'fb-new', data: {} }),
    updateCard: vi.fn().mockResolvedValue(undefined),
    deleteCard: vi.fn().mockResolvedValue(undefined),
    subscribeToCard: vi.fn().mockReturnValue(() => {})
  };
}

describe('ReadSwitchCardRepository', () => {
  let firestore, rtdb, writer, repo;

  beforeEach(() => {
    firestore = createMockCardRepo('firestore', {
      listCards: { 'card-1': { title: 'T1' } },
      getCard: { title: 'T1' },
      findCardByCardId: { firebaseId: 'fb1', type: 'task', data: {} }
    });
    rtdb = createMockCardRepo('rtdb', {
      listCards: { 'card-rtdb': { title: 'RTDB' } },
      getCard: { title: 'RTDB card' },
      findCardByCardId: { firebaseId: 'fb-rtdb', type: 'task', data: {} }
    });
    writer = createMockCardRepo('writer');
  });

  describe('reads from Firestore (no fallback)', () => {
    beforeEach(() => {
      repo = new ReadSwitchCardRepository(firestore, rtdb, writer);
    });

    it('listCards reads from Firestore', async () => {
      const result = await repo.listCards('Proj', 'task');
      expect(firestore.listCards).toHaveBeenCalledWith('Proj', 'task', {});
      expect(rtdb.listCards).not.toHaveBeenCalled();
      expect(result).toEqual({ 'card-1': { title: 'T1' } });
    });

    it('getCard reads from Firestore', async () => {
      const result = await repo.getCard('Proj', 'task', 'fb1');
      expect(firestore.getCard).toHaveBeenCalled();
      expect(rtdb.getCard).not.toHaveBeenCalled();
      expect(result).toEqual({ title: 'T1' });
    });

    it('findCardByCardId reads from Firestore', async () => {
      const result = await repo.findCardByCardId('Proj', 'PLN-TSK-0001');
      expect(firestore.findCardByCardId).toHaveBeenCalled();
      expect(rtdb.findCardByCardId).not.toHaveBeenCalled();
      expect(result.firebaseId).toBe('fb1');
    });

    it('returns null when Firestore has no data and fallback disabled', async () => {
      firestore.getCard.mockResolvedValue(null);
      const result = await repo.getCard('Proj', 'task', 'missing');
      expect(result).toBeNull();
      expect(rtdb.getCard).not.toHaveBeenCalled();
    });

    it('returns empty object when Firestore has no cards and fallback disabled', async () => {
      firestore.listCards.mockResolvedValue({});
      const result = await repo.listCards('Proj', 'task');
      expect(result).toEqual({});
      expect(rtdb.listCards).not.toHaveBeenCalled();
    });
  });

  describe('reads with migration fallback enabled', () => {
    let onFallback;

    beforeEach(() => {
      onFallback = vi.fn();
      repo = new ReadSwitchCardRepository(firestore, rtdb, writer, {
        migrationFallback: true,
        onFallback
      });
    });

    it('does not fallback when Firestore has data', async () => {
      const result = await repo.getCard('Proj', 'task', 'fb1');
      expect(result).toEqual({ title: 'T1' });
      expect(rtdb.getCard).not.toHaveBeenCalled();
      expect(onFallback).not.toHaveBeenCalled();
    });

    it('falls back to RTDB when Firestore returns null for getCard', async () => {
      firestore.getCard.mockResolvedValue(null);
      const result = await repo.getCard('Proj', 'task', 'fb1');
      expect(result).toEqual({ title: 'RTDB card' });
      expect(rtdb.getCard).toHaveBeenCalledWith('Proj', 'task', 'fb1');
      expect(onFallback).toHaveBeenCalledWith('getCard', { projectId: 'Proj', type: 'task', firebaseId: 'fb1' });
    });

    it('falls back to RTDB when Firestore returns empty for listCards', async () => {
      firestore.listCards.mockResolvedValue({});
      const result = await repo.listCards('Proj', 'task');
      expect(result).toEqual({ 'card-rtdb': { title: 'RTDB' } });
      expect(onFallback).toHaveBeenCalledWith('listCards', { projectId: 'Proj', type: 'task' });
    });

    it('falls back to RTDB for findCardByCardId', async () => {
      firestore.findCardByCardId.mockResolvedValue(null);
      const result = await repo.findCardByCardId('Proj', 'PLN-TSK-0001', 'task');
      expect(result.firebaseId).toBe('fb-rtdb');
      expect(onFallback).toHaveBeenCalledWith('findCardByCardId', expect.objectContaining({ cardId: 'PLN-TSK-0001' }));
    });
  });

  describe('writes delegate to writer', () => {
    beforeEach(() => {
      repo = new ReadSwitchCardRepository(firestore, rtdb, writer);
    });

    it('createCard delegates to writer', async () => {
      await repo.createCard('Proj', 'task', { title: 'New' });
      expect(writer.createCard).toHaveBeenCalledWith('Proj', 'task', { title: 'New' });
      expect(firestore.createCard).not.toHaveBeenCalled();
      expect(rtdb.createCard).not.toHaveBeenCalled();
    });

    it('updateCard delegates to writer', async () => {
      await repo.updateCard('Proj', 'task', 'fb1', { status: 'Done' });
      expect(writer.updateCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', { status: 'Done' });
    });

    it('deleteCard delegates to writer', async () => {
      await repo.deleteCard('Proj', 'task', 'fb1', { deletedBy: 'user' });
      expect(writer.deleteCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', { deletedBy: 'user' });
    });
  });

  describe('subscribeToCard uses Firestore', () => {
    it('subscribes via Firestore repo', () => {
      repo = new ReadSwitchCardRepository(firestore, rtdb, writer);
      const cb = vi.fn();
      repo.subscribeToCard('Proj', 'task', 'fb1', cb);
      expect(firestore.subscribeToCard).toHaveBeenCalledWith('Proj', 'task', 'fb1', cb);
      expect(rtdb.subscribeToCard).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { CardRepository } from '../../shared/dal/card-repository.js';
import { BaseRepository } from '../../shared/dal/base-repository.js';

class StubBase extends BaseRepository {
  constructor() { super('stub'); }
}

class ConcreteCardRepo extends CardRepository {
  constructor() { super(new StubBase()); }
}

describe('CardRepository', () => {
  it('should not allow direct instantiation', () => {
    expect(() => new CardRepository(new StubBase())).toThrow('CardRepository is abstract');
  });

  it('should allow subclass instantiation', () => {
    const repo = new ConcreteCardRepo();
    expect(repo._repo.backend).toBe('stub');
  });

  describe('abstract methods throw', () => {
    const repo = new ConcreteCardRepo();

    it('listCards()', async () => {
      await expect(repo.listCards('P', 'task')).rejects.toThrow('Not implemented: listCards()');
    });

    it('getCard()', async () => {
      await expect(repo.getCard('P', 'task', 'id')).rejects.toThrow('Not implemented: getCard()');
    });

    it('findCardByCardId()', async () => {
      await expect(repo.findCardByCardId('P', 'PLN-TSK-0001')).rejects.toThrow('Not implemented: findCardByCardId()');
    });

    it('createCard()', async () => {
      await expect(repo.createCard('P', 'task', {})).rejects.toThrow('Not implemented: createCard()');
    });

    it('updateCard()', async () => {
      await expect(repo.updateCard('P', 'task', 'id', {})).rejects.toThrow('Not implemented: updateCard()');
    });

    it('deleteCard()', async () => {
      await expect(repo.deleteCard('P', 'task', 'id')).rejects.toThrow('Not implemented: deleteCard()');
    });

    it('subscribeToCard()', () => {
      expect(() => repo.subscribeToCard('P', 'task', 'id', () => {})).toThrow('Not implemented: subscribeToCard()');
    });
  });

  describe('static helpers', () => {
    it('buildPath() returns correct section path', () => {
      expect(CardRepository.buildPath('PlanningGame', 'task'))
        .toBe('/cards/PlanningGame/TASKS_PlanningGame');
    });

    it('buildPath() for bugs', () => {
      expect(CardRepository.buildPath('Cinema4D', 'bug'))
        .toBe('/cards/Cinema4D/BUGS_Cinema4D');
    });

    it('buildCardPath() includes firebaseId', () => {
      expect(CardRepository.buildCardPath('PlanningGame', 'epic', '-abc123'))
        .toBe('/cards/PlanningGame/EPICS_PlanningGame/-abc123');
    });

    it('buildPath() throws for invalid type', () => {
      expect(() => CardRepository.buildPath('P', 'invalid')).toThrow('Invalid section');
    });

    it('validTypes returns all card types', () => {
      const types = CardRepository.validTypes;
      expect(types).toContain('task');
      expect(types).toContain('bug');
      expect(types).toContain('epic');
      expect(types).toContain('sprint');
      expect(types).toContain('proposal');
      expect(types).toContain('qa');
      expect(types).toHaveLength(6);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { BaseRepository } from '../../shared/dal/base-repository.js';

class ConcreteRepo extends BaseRepository {
  constructor() {
    super('test');
  }
}

describe('BaseRepository', () => {
  it('should not allow direct instantiation', () => {
    expect(() => new BaseRepository('test')).toThrow('BaseRepository is abstract');
  });

  it('should allow subclass instantiation', () => {
    const repo = new ConcreteRepo();
    expect(repo.backend).toBe('test');
  });

  it('should throw on read()', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.read('/path')).rejects.toThrow('Not implemented: read()');
  });

  it('should throw on write()', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.write('/path', {})).rejects.toThrow('Not implemented: write()');
  });

  it('should throw on update()', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.update('/path', {})).rejects.toThrow('Not implemented: update()');
  });

  it('should throw on push()', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.push('/path', {})).rejects.toThrow('Not implemented: push()');
  });

  it('should throw on remove()', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.remove('/path')).rejects.toThrow('Not implemented: remove()');
  });

  it('should throw on subscribe()', () => {
    const repo = new ConcreteRepo();
    expect(() => repo.subscribe('/path', () => {})).toThrow('Not implemented: subscribe()');
  });

  it('should throw on transaction()', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.transaction('/path', d => d)).rejects.toThrow('Not implemented: transaction()');
  });

  it('should throw on multiUpdate()', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.multiUpdate({})).rejects.toThrow('Not implemented: multiUpdate()');
  });

  it('should include backend name in error messages', async () => {
    const repo = new ConcreteRepo();
    await expect(repo.read('/x')).rejects.toThrow('test backend');
  });
});

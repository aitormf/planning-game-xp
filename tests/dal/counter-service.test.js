import { describe, it, expect } from 'vitest';
import { CounterService } from '../../shared/dal/counter-service.js';

class ConcreteCounter extends CounterService {
  constructor() { super(); }
}

describe('CounterService', () => {
  it('should not allow direct instantiation', () => {
    expect(() => new CounterService()).toThrow('CounterService is abstract');
  });

  it('should allow subclass instantiation', () => {
    const service = new ConcreteCounter();
    expect(service).toBeInstanceOf(CounterService);
  });

  describe('abstract methods throw', () => {
    const service = new ConcreteCounter();

    it('nextId()', async () => {
      await expect(service.nextId('PLN-TSK')).rejects.toThrow('Not implemented: nextId()');
    });

    it('currentId()', async () => {
      await expect(service.currentId('PLN-TSK')).rejects.toThrow('Not implemented: currentId()');
    });
  });

  describe('static helpers', () => {
    it('buildKey() joins abbreviations', () => {
      expect(CounterService.buildKey('PLN', 'TSK')).toBe('PLN-TSK');
    });

    it('formatId() pads with zeros', () => {
      expect(CounterService.formatId('PLN-TSK', 1)).toBe('PLN-TSK-0001');
      expect(CounterService.formatId('PLN-TSK', 42)).toBe('PLN-TSK-0042');
      expect(CounterService.formatId('PLN-TSK', 9999)).toBe('PLN-TSK-9999');
    });

    it('formatId() supports custom pad length', () => {
      expect(CounterService.formatId('PLN-TSK', 1, 6)).toBe('PLN-TSK-000001');
    });
  });
});

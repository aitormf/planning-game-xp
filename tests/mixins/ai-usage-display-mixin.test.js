/**
 * Tests for AiUsageDisplayMixin
 */
import { describe, it, expect, beforeEach } from 'vitest';

// We test the mixin logic directly without Lit dependency
// by creating a minimal mock class

class MockBase {
  static get properties() { return {}; }
  constructor() {}
}

// Inline the mixin logic for testing (avoid CDN imports in Node)
const AiUsageDisplayMixinLogic = (superClass) => class extends superClass {
  static get properties() {
    return { ...super.properties, aiUsage: { type: Array } };
  }

  constructor() {
    super();
    this.aiUsage = [];
  }

  _getAiUsageArray() {
    return Array.isArray(this.aiUsage) ? this.aiUsage : [];
  }

  _getAiUsageTabLabel() {
    const count = this._getAiUsageArray().length;
    return count > 0 ? `AI Usage (${count})` : 'AI Usage';
  }

  _formatTokenCount(count) {
    if (count === undefined || count === null) return '0';
    return Number(count).toLocaleString('es-ES');
  }

  _formatCost(cost) {
    if (cost === undefined || cost === null) return '$0.00';
    return `$${Number(cost).toFixed(2)}`;
  }

  _formatDuration(minutes) {
    if (!minutes && minutes !== 0) return '-';
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
};

const TestClass = AiUsageDisplayMixinLogic(MockBase);

describe('AiUsageDisplayMixin', () => {
  let instance;

  beforeEach(() => {
    instance = new TestClass();
  });

  describe('_getAiUsageArray', () => {
    it('should return empty array by default', () => {
      expect(instance._getAiUsageArray()).toEqual([]);
    });

    it('should return the array when set', () => {
      instance.aiUsage = [{ sessionId: 'test' }];
      expect(instance._getAiUsageArray()).toHaveLength(1);
    });

    it('should return empty array when aiUsage is not an array', () => {
      instance.aiUsage = 'invalid';
      expect(instance._getAiUsageArray()).toEqual([]);
    });

    it('should return empty array when aiUsage is null', () => {
      instance.aiUsage = null;
      expect(instance._getAiUsageArray()).toEqual([]);
    });
  });

  describe('_getAiUsageTabLabel', () => {
    it('should return "AI Usage" when empty', () => {
      expect(instance._getAiUsageTabLabel()).toBe('AI Usage');
    });

    it('should return "AI Usage (N)" when has entries', () => {
      instance.aiUsage = [{ sessionId: 'a' }, { sessionId: 'b' }];
      expect(instance._getAiUsageTabLabel()).toBe('AI Usage (2)');
    });
  });

  describe('_formatTokenCount', () => {
    it('should return "0" for undefined', () => {
      expect(instance._formatTokenCount(undefined)).toBe('0');
    });

    it('should return "0" for null', () => {
      expect(instance._formatTokenCount(null)).toBe('0');
    });

    it('should format number with locale separator', () => {
      const result = instance._formatTokenCount(50000);
      // es-ES uses dot as thousands separator
      expect(result).toBe('50.000');
    });
  });

  describe('_formatCost', () => {
    it('should return "$0.00" for undefined', () => {
      expect(instance._formatCost(undefined)).toBe('$0.00');
    });

    it('should return "$0.00" for null', () => {
      expect(instance._formatCost(null)).toBe('$0.00');
    });

    it('should format cost with 2 decimals', () => {
      expect(instance._formatCost(1.5)).toBe('$1.50');
    });

    it('should format zero cost', () => {
      expect(instance._formatCost(0)).toBe('$0.00');
    });
  });

  describe('_formatDuration', () => {
    it('should return "-" for undefined', () => {
      expect(instance._formatDuration(undefined)).toBe('-');
    });

    it('should return "-" for null', () => {
      expect(instance._formatDuration(null)).toBe('-');
    });

    it('should return "< 1 min" for values less than 1', () => {
      expect(instance._formatDuration(0.5)).toBe('< 1 min');
    });

    it('should format minutes', () => {
      expect(instance._formatDuration(12)).toBe('12 min');
    });

    it('should format hours and minutes', () => {
      expect(instance._formatDuration(90)).toBe('1h 30m');
    });

    it('should format exact hours', () => {
      expect(instance._formatDuration(120)).toBe('2h');
    });

    it('should handle zero duration', () => {
      expect(instance._formatDuration(0)).toBe('< 1 min');
    });
  });

  describe('properties', () => {
    it('should declare aiUsage property', () => {
      expect(TestClass.properties).toHaveProperty('aiUsage');
      expect(TestClass.properties.aiUsage.type).toBe(Array);
    });
  });
});

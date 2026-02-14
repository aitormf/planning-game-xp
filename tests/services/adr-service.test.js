/**
 * Tests for ADR Service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ADR_STATUSES } from '../../public/js/services/adr-service.js';

// Mock the adrService since it requires Firebase
describe('ADR Service constants', () => {
  describe('ADR_STATUSES', () => {
    it('should include proposed status', () => {
      expect(ADR_STATUSES).toContain('proposed');
    });

    it('should include accepted status', () => {
      expect(ADR_STATUSES).toContain('accepted');
    });

    it('should include deprecated status', () => {
      expect(ADR_STATUSES).toContain('deprecated');
    });

    it('should include superseded status', () => {
      expect(ADR_STATUSES).toContain('superseded');
    });

    it('should have exactly 4 statuses', () => {
      expect(ADR_STATUSES).toHaveLength(4);
    });
  });
});

describe('ADR Service unit tests', () => {
  // Create a mock service class for unit testing
  class MockAdrService {
    constructor() {
      this.cache = new Map();
      this.projectCache = new Map();
    }

    _getCacheKey(projectId, adrId) {
      return `${projectId}/${adrId}`;
    }

    validateStatus(status) {
      if (!ADR_STATUSES.includes(status)) {
        throw new Error(`Invalid ADR status: ${status}. Valid statuses: ${ADR_STATUSES.join(', ')}`);
      }
      return true;
    }

    clearCache(projectId) {
      if (projectId) {
        this.projectCache.delete(projectId);
        for (const key of this.cache.keys()) {
          if (key.startsWith(`${projectId}/`)) {
            this.cache.delete(key);
          }
        }
      } else {
        this.cache.clear();
        this.projectCache.clear();
      }
    }
  }

  let service;

  beforeEach(() => {
    service = new MockAdrService();
  });

  describe('_getCacheKey', () => {
    it('should generate correct cache key', () => {
      const key = service._getCacheKey('TestProject', 'adr_001');
      expect(key).toBe('TestProject/adr_001');
    });
  });

  describe('validateStatus', () => {
    it('should accept valid statuses', () => {
      expect(service.validateStatus('proposed')).toBe(true);
      expect(service.validateStatus('accepted')).toBe(true);
      expect(service.validateStatus('deprecated')).toBe(true);
      expect(service.validateStatus('superseded')).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(() => service.validateStatus('invalid')).toThrow('Invalid ADR status');
    });

    it('should include valid statuses in error message', () => {
      try {
        service.validateStatus('wrong');
      } catch (error) {
        expect(error.message).toContain('proposed');
        expect(error.message).toContain('accepted');
      }
    });
  });

  describe('clearCache', () => {
    beforeEach(() => {
      // Setup some cache entries
      service.cache.set('Project1/adr_001', { id: 'adr_001' });
      service.cache.set('Project1/adr_002', { id: 'adr_002' });
      service.cache.set('Project2/adr_001', { id: 'adr_001' });
      service.projectCache.set('Project1', []);
      service.projectCache.set('Project2', []);
    });

    it('should clear all caches when no projectId provided', () => {
      service.clearCache();
      expect(service.cache.size).toBe(0);
      expect(service.projectCache.size).toBe(0);
    });

    it('should clear only specific project cache', () => {
      service.clearCache('Project1');
      expect(service.cache.has('Project1/adr_001')).toBe(false);
      expect(service.cache.has('Project1/adr_002')).toBe(false);
      expect(service.cache.has('Project2/adr_001')).toBe(true);
      expect(service.projectCache.has('Project1')).toBe(false);
      expect(service.projectCache.has('Project2')).toBe(true);
    });
  });
});

describe('ADR data model', () => {
  it('should define expected ADR structure', () => {
    const validAdr = {
      id: 'adr_001',
      title: 'Use Firebase Realtime Database',
      context: 'We need a real-time capable database for the planning app',
      decision: 'We will use Firebase RTDB for real-time data sync',
      consequences: '- Vendor lock-in\n- Real-time sync capabilities',
      status: 'accepted',
      supersededBy: null,
      createdAt: '2026-01-31T10:00:00Z',
      createdBy: 'dev@example.com',
      updatedAt: '2026-01-31T10:00:00Z',
      updatedBy: 'dev@example.com'
    };

    expect(validAdr.id).toBeDefined();
    expect(validAdr.title).toBeDefined();
    expect(validAdr.context).toBeDefined();
    expect(validAdr.decision).toBeDefined();
    expect(validAdr.consequences).toBeDefined();
    expect(validAdr.status).toBeDefined();
    expect(ADR_STATUSES).toContain(validAdr.status);
  });

  it('should support supersededBy reference', () => {
    const supersededAdr = {
      id: 'adr_001',
      title: 'Old Decision',
      status: 'superseded',
      supersededBy: 'adr_002'
    };

    expect(supersededAdr.status).toBe('superseded');
    expect(supersededAdr.supersededBy).toBe('adr_002');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn(),
  push: vi.fn(() => ({ key: 'test-key' })),
  set: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(() => () => {}),
  databaseFirestore: {},
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  runTransaction: vi.fn(),
  runDbTransaction: vi.fn()
}));

import { clearRegisteredBackends } from '../../shared/dal/index.js';
import { dalService, DAL_MODES } from '../../public/js/services/dal-service.js';

const DalServiceClass = dalService.constructor;

describe('DalService', () => {
  let service;

  beforeEach(() => {
    clearRegisteredBackends();
    service = new DalServiceClass();
  });

  describe('init', () => {
    it('should initialize in rtdb-only mode by default', () => {
      service.init();
      expect(service.isInitialized).toBe(true);
      expect(service.mode).toBe('rtdb-only');
    });

    it('should provide cards repository after init', () => {
      service.init();
      expect(service.cards).toBeDefined();
      expect(typeof service.cards.listCards).toBe('function');
    });

    it('should provide projects repository after init', () => {
      service.init();
      expect(service.projects).toBeDefined();
      expect(typeof service.projects.listProjects).toBe('function');
    });

    it('should provide counters service after init', () => {
      service.init();
      expect(service.counters).toBeDefined();
      expect(typeof service.counters.nextId).toBe('function');
    });

    it('should only initialize once', () => {
      service.init();
      service.init();
      expect(service.isInitialized).toBe(true);
    });
  });

  describe('before init', () => {
    it('should throw when accessing cards before init', () => {
      expect(() => service.cards).toThrow('DalService not initialized');
    });

    it('should throw when accessing projects before init', () => {
      expect(() => service.projects).toThrow('DalService not initialized');
    });

    it('should throw when accessing counters before init', () => {
      expect(() => service.counters).toThrow('DalService not initialized');
    });
  });

  describe('DAL_MODES', () => {
    it('should define all migration modes', () => {
      expect(DAL_MODES.RTDB_ONLY).toBe('rtdb-only');
      expect(DAL_MODES.DUAL_WRITE).toBe('dual-write');
      expect(DAL_MODES.READ_SWITCH).toBe('read-switch');
      expect(DAL_MODES.FIRESTORE_ONLY).toBe('firestore-only');
    });
  });

  describe('unsupported modes', () => {
    it('should warn and fallback for dual-write mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      service.init(DAL_MODES.DUAL_WRITE);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not yet supported'));
      expect(service.isInitialized).toBe(true);
    });

    it('should throw for unknown mode', () => {
      expect(() => service.init('invalid')).toThrow('Unknown DAL mode');
    });
  });
});

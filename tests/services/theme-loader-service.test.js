/**
 * Tests for ThemeLoaderService
 *
 * Covers: RTDB reading, static JSON fallback, real-time updates,
 * saveConfig, branding, features, and config flattening.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// --- Hoisted mocks (must be declared before vi.mock factories) ---
const {
  mockGet, mockSet, mockRef, mockOnValue,
  mockDatabase, mockOnValueCallback, mockSnapshot,
  mockFetch, mockApplyTheme,
} = vi.hoisted(() => {
  const mockOnValueCallback = { current: null };
  const mockSnapshot = { current: null };
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockRef = vi.fn((_db, path) => ({ path }));
  const mockOnValue = vi.fn((refObj, callback) => {
    mockOnValueCallback.current = callback;
    if (mockSnapshot.current) {
      callback(mockSnapshot.current);
    }
    return vi.fn(); // unsubscribe function
  });
  const mockDatabase = {};
  const mockFetch = vi.fn();
  const mockApplyTheme = vi.fn();
  return {
    mockGet, mockSet, mockRef, mockOnValue,
    mockDatabase, mockOnValueCallback, mockSnapshot,
    mockFetch, mockApplyTheme,
  };
});

vi.mock('@/../firebase-config.js', () => ({
  database: mockDatabase,
  ref: (...args) => mockRef(...args),
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
  onValue: (...args) => mockOnValue(...args),
}));

vi.mock('@/services/theme-manager-service.js', () => ({
  ThemeManagerService: {
    applyTheme: (...args) => mockApplyTheme(...args),
  },
}));

// --- Fetch mock ---
global.fetch = mockFetch;

import { ThemeLoaderService } from '@/services/theme-loader-service.js';

const SAMPLE_CONFIG = {
  tokens: {
    brand: { primary: '#4a9eff', primaryHover: '#3a8eef' },
    status: { todo: '#449bd3', inProgress: '#cce500' },
  },
  branding: {
    appName: 'Test App',
    logo: '/images/test.png',
    primaryColor: '#4a9eff',
  },
  features: { darkMode: true },
};

function createSnapshot(data) {
  return {
    exists: () => data !== null && data !== undefined,
    val: () => data,
  };
}

function resetLoader() {
  ThemeLoaderService.config = null;
  ThemeLoaderService.configLoadedAt = null;
  ThemeLoaderService.loading = null;
  if (ThemeLoaderService._unsubscribe) {
    ThemeLoaderService._unsubscribe();
    ThemeLoaderService._unsubscribe = null;
  }
  ThemeLoaderService._rtdbListenerActive = false;
  mockOnValueCallback.current = null;
  mockSnapshot.current = null;
}

describe('ThemeLoaderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLoader();
    document.documentElement.style.cssText = '';
    document.title = '';
  });

  afterEach(() => {
    resetLoader();
  });

  describe('loadConfig - RTDB source', () => {
    it('should read config from RTDB when data exists', async () => {
      mockGet.mockResolvedValue(createSnapshot(SAMPLE_CONFIG));

      const config = await ThemeLoaderService.loadConfig();

      expect(mockRef).toHaveBeenCalledWith(mockDatabase, '/config/theme');
      expect(config).toEqual(SAMPLE_CONFIG);
    });

    it('should fall back to static JSON when RTDB has no data', async () => {
      mockGet.mockResolvedValue(createSnapshot(null));
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SAMPLE_CONFIG),
      });

      const config = await ThemeLoaderService.loadConfig();

      expect(mockFetch).toHaveBeenCalledWith('/theme-config.json');
      expect(config).toEqual(SAMPLE_CONFIG);
    });

    it('should fall back to static JSON when RTDB read fails', async () => {
      mockGet.mockRejectedValue(new Error('RTDB unavailable'));
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SAMPLE_CONFIG),
      });

      const config = await ThemeLoaderService.loadConfig();

      expect(config).toEqual(SAMPLE_CONFIG);
    });

    it('should return null when both RTDB and static fail', async () => {
      mockGet.mockRejectedValue(new Error('RTDB unavailable'));
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      const config = await ThemeLoaderService.loadConfig();

      expect(config).toBeNull();
    });
  });

  describe('real-time listener', () => {
    it('should set up onValue listener after initial load', async () => {
      mockGet.mockResolvedValue(createSnapshot(SAMPLE_CONFIG));

      await ThemeLoaderService.loadAndApply();

      expect(mockOnValue).toHaveBeenCalled();
      const refArg = mockOnValue.mock.calls[0][0];
      expect(refArg.path).toBe('/config/theme');
    });

    it('should update config when RTDB data changes', async () => {
      mockGet.mockResolvedValue(createSnapshot(SAMPLE_CONFIG));
      await ThemeLoaderService.loadAndApply();

      // Simulate RTDB change
      const updatedConfig = {
        ...SAMPLE_CONFIG,
        branding: { ...SAMPLE_CONFIG.branding, appName: 'Updated App' },
      };
      mockOnValueCallback.current(createSnapshot(updatedConfig));

      expect(ThemeLoaderService.config).toEqual(updatedConfig);
    });

    it('should not set up duplicate listeners on multiple loadAndApply calls', async () => {
      mockGet.mockResolvedValue(createSnapshot(SAMPLE_CONFIG));

      await ThemeLoaderService.loadAndApply();
      await ThemeLoaderService.loadAndApply();

      // onValue should only be called once
      expect(mockOnValue).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveConfig', () => {
    it('should write config to RTDB', async () => {
      mockSet.mockResolvedValue(undefined);

      await ThemeLoaderService.saveConfig(SAMPLE_CONFIG);

      expect(mockRef).toHaveBeenCalledWith(mockDatabase, '/config/theme');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/config/theme' }),
        SAMPLE_CONFIG
      );
    });

    it('should update local config after save', async () => {
      mockSet.mockResolvedValue(undefined);

      await ThemeLoaderService.saveConfig(SAMPLE_CONFIG);

      expect(ThemeLoaderService.config).toEqual(SAMPLE_CONFIG);
    });

    it('should throw when RTDB write fails', async () => {
      mockSet.mockRejectedValue(new Error('Permission denied'));

      await expect(ThemeLoaderService.saveConfig(SAMPLE_CONFIG))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('token flattening', () => {
    it('should flatten nested tokens to CSS custom properties', () => {
      const tokens = {
        brand: { primary: '#4a9eff', primaryHover: '#3a8eef' },
      };

      const result = ThemeLoaderService.flattenTokens(tokens);

      expect(result['--brand-primary']).toBe('#4a9eff');
      expect(result['--brand-primary-hover']).toBe('#3a8eef');
    });

    it('should handle empty tokens gracefully', () => {
      expect(ThemeLoaderService.flattenTokens(null)).toEqual({});
      expect(ThemeLoaderService.flattenTokens(undefined)).toEqual({});
    });
  });

  describe('branding and features', () => {
    beforeEach(async () => {
      mockGet.mockResolvedValue(createSnapshot(SAMPLE_CONFIG));
      await ThemeLoaderService.loadConfig();
    });

    it('should return branding info', () => {
      const branding = ThemeLoaderService.getBranding();
      expect(branding.appName).toBe('Test App');
      expect(branding.logo).toBe('/images/test.png');
    });

    it('should return features with defaults', () => {
      const features = ThemeLoaderService.getFeatures();
      expect(features.darkMode).toBe(true);
    });

    it('should check feature flags', () => {
      expect(ThemeLoaderService.isFeatureEnabled('darkMode')).toBe(true);
      expect(ThemeLoaderService.isFeatureEnabled('nonExistent')).toBe(false);
    });

    it('should return null branding when no config', () => {
      ThemeLoaderService.config = null;
      expect(ThemeLoaderService.getBranding()).toBeNull();
    });
  });

  describe('applyConfig', () => {
    it('should apply tokens to :root', () => {
      ThemeLoaderService.applyConfig(SAMPLE_CONFIG);

      const primary = document.documentElement.style.getPropertyValue('--brand-primary');
      expect(primary).toBe('#4a9eff');
    });

    it('should apply branding (document title)', () => {
      ThemeLoaderService.applyConfig(SAMPLE_CONFIG);
      expect(document.title).toBe('Test App');
    });

    it('should handle null config gracefully', () => {
      expect(() => ThemeLoaderService.applyConfig(null)).not.toThrow();
    });
  });

  describe('getConfigValue', () => {
    beforeEach(async () => {
      mockGet.mockResolvedValue(createSnapshot(SAMPLE_CONFIG));
      await ThemeLoaderService.loadConfig();
    });

    it('should get nested config value by dot path', () => {
      expect(ThemeLoaderService.getConfigValue('branding.appName')).toBe('Test App');
      expect(ThemeLoaderService.getConfigValue('tokens.brand.primary')).toBe('#4a9eff');
    });

    it('should return undefined for missing path', () => {
      expect(ThemeLoaderService.getConfigValue('nonexistent.path')).toBeUndefined();
    });
  });
});

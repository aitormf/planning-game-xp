/**
 * Tests for ThemeManagerService
 *
 * Covers: theme switching, persistence, system preference detection,
 * CSS token application, event dispatching, and toggle behavior.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AllTokens before importing service
vi.mock('@/ui/styles/tokens/index.js', () => ({
  AllTokens: { cssText: ':root { --brand-primary: #4a9eff; }' }
}));

import { ThemeManagerService as manager } from '@/services/theme-manager-service.js';

/**
 * Creates a functional localStorage mock that actually stores data.
 * The global setup.js provides vi.fn() stubs that don't persist values,
 * so we need a real implementation for persistence tests.
 */
function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => store.has(key) ? store.get(key) : null),
    setItem: vi.fn((key, value) => store.set(key, String(value))),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
  };
}

function resetManager() {
  // Replace global localStorage with a functional mock
  global.localStorage = createLocalStorageMock();

  // Reset singleton internal state
  manager.currentTheme = 'light';
  manager.customTokens = {};
  manager.registeredThemes = new Map();
  manager.initialized = false;

  // Clear DOM state
  document.documentElement.style.cssText = '';
  document.documentElement.classList.remove('light-theme', 'dark-theme');
  const existingStyle = document.getElementById('pgxp-design-tokens');
  if (existingStyle) existingStyle.remove();
}

describe('ThemeManagerService', () => {
  beforeEach(() => {
    resetManager();
  });

  describe('initialization', () => {
    it('should start with light theme by default', () => {
      manager.init();
      expect(manager.getCurrentTheme()).toBe('light');
    });

    it('should apply stored theme preference on init', () => {
      // Use the manager's own method to set stored theme
      manager.setStoredTheme('dark');
      manager.init();
      expect(manager.getCurrentTheme()).toBe('dark');
      expect(manager.isDarkMode()).toBe(true);
    });

    it('should inject global design tokens on init', () => {
      manager.init();
      const styleEl = document.getElementById('pgxp-design-tokens');
      expect(styleEl).not.toBeNull();
      expect(styleEl.textContent).toContain('--brand-primary');
    });

    it('should not inject tokens twice', () => {
      manager.init();
      // Manually reset initialized flag but keep the style tag
      manager.initialized = false;
      manager.registeredThemes = new Map();
      manager.init();
      const styles = document.querySelectorAll('#pgxp-design-tokens');
      expect(styles.length).toBe(1);
    });

    it('should not re-initialize if already initialized', () => {
      manager.init();
      const spy = vi.spyOn(manager, 'registerBuiltInThemes');
      manager.init(); // second call should be no-op
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('theme switching', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should switch to dark theme', () => {
      manager.applyTheme('dark');
      expect(manager.getCurrentTheme()).toBe('dark');
      expect(manager.isDarkMode()).toBe(true);
    });

    it('should switch back to light theme', () => {
      manager.applyTheme('dark');
      manager.applyTheme('light');
      expect(manager.getCurrentTheme()).toBe('light');
      expect(manager.isDarkMode()).toBe(false);
    });

    it('should apply dark-theme CSS class to documentElement', () => {
      manager.applyTheme('dark');
      expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
      expect(document.documentElement.classList.contains('light-theme')).toBe(false);
    });

    it('should apply light-theme CSS class to documentElement', () => {
      manager.applyTheme('dark');
      manager.applyTheme('light');
      expect(document.documentElement.classList.contains('light-theme')).toBe(true);
      expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    });

    it('should fall back to light for unknown theme', () => {
      manager.applyTheme('neon-pink');
      expect(manager.getCurrentTheme()).toBe('light');
    });
  });

  describe('toggle', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should toggle from light to dark', () => {
      const result = manager.toggleDarkMode();
      expect(result).toBe('dark');
      expect(manager.isDarkMode()).toBe(true);
    });

    it('should toggle from dark to light', () => {
      manager.applyTheme('dark');
      const result = manager.toggleDarkMode();
      expect(result).toBe('light');
      expect(manager.isDarkMode()).toBe(false);
    });

    it('should persist toggled theme', () => {
      manager.toggleDarkMode();
      expect(manager.getStoredTheme()).toBe('dark');

      manager.toggleDarkMode();
      expect(manager.getStoredTheme()).toBe('light');
    });
  });

  describe('persistence', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should store theme on apply', () => {
      manager.applyTheme('dark');
      expect(manager.getStoredTheme()).toBe('dark');
    });

    it('should retrieve stored theme', () => {
      manager.setStoredTheme('dark');
      expect(manager.getStoredTheme()).toBe('dark');
    });

    it('should return null when no stored theme', () => {
      manager.clearStoredTheme();
      expect(manager.getStoredTheme()).toBeNull();
    });

    it('should clear stored theme', () => {
      manager.applyTheme('dark');
      manager.clearStoredTheme();
      expect(manager.getStoredTheme()).toBeNull();
    });
  });

  describe('CSS token application', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should apply dark theme tokens to :root', () => {
      manager.applyTheme('dark');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      expect(bgPrimary).toBe('#0f172a');
    });

    it('should apply dark text tokens to :root', () => {
      manager.applyTheme('dark');
      const textPrimary = document.documentElement.style.getPropertyValue('--text-primary');
      expect(textPrimary).toBe('#f8fafc');
    });

    it('should remove dark tokens when switching to light', () => {
      manager.applyTheme('dark');
      manager.applyTheme('light');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      expect(bgPrimary).toBe('');
    });

    it('should apply custom token overrides', () => {
      manager.applyTheme('light', { '--brand-primary': '#ff0000' });
      const brand = document.documentElement.style.getPropertyValue('--brand-primary');
      expect(brand).toBe('#ff0000');
    });
  });

  describe('events', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should dispatch theme-change event on theme switch', () => {
      const handler = vi.fn();
      document.addEventListener('theme-change', handler);

      manager.applyTheme('dark');

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.theme).toBe('dark');
      expect(detail.isDark).toBe(true);

      document.removeEventListener('theme-change', handler);
    });

    it('should dispatch event with isDark=false for light theme', () => {
      manager.applyTheme('dark');

      const handler = vi.fn();
      document.addEventListener('theme-change', handler);

      manager.applyTheme('light');

      const detail = handler.mock.calls[0][0].detail;
      expect(detail.theme).toBe('light');
      expect(detail.isDark).toBe(false);

      document.removeEventListener('theme-change', handler);
    });
  });

  describe('system preference detection', () => {
    it('should detect dark system preference when no stored theme', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
      }));

      manager.init();
      expect(manager.isDarkMode()).toBe(true);

      window.matchMedia = originalMatchMedia;
    });

    it('should use stored theme over system preference', () => {
      // Store light preference before init
      manager.setStoredTheme('light');

      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
      }));

      manager.init();
      // Stored 'light' should override system dark preference
      expect(manager.isDarkMode()).toBe(false);
      expect(manager.getCurrentTheme()).toBe('light');

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('registered themes', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should list available themes', () => {
      const themes = manager.getAvailableThemes();
      expect(themes).toContain('light');
      expect(themes).toContain('dark');
    });

    it('should allow registering custom themes', () => {
      manager.registerTheme('ocean', { '--bg-primary': '#001f3f' });
      const themes = manager.getAvailableThemes();
      expect(themes).toContain('ocean');
    });

    it('should apply registered custom theme', () => {
      manager.registerTheme('ocean', { '--bg-primary': '#001f3f' });
      manager.applyTheme('ocean');
      expect(manager.getCurrentTheme()).toBe('ocean');
      const bg = document.documentElement.style.getPropertyValue('--bg-primary');
      expect(bg).toBe('#001f3f');
    });
  });

  describe('dark theme contrast requirements', () => {
    beforeEach(() => {
      manager.init();
      manager.applyTheme('dark');
    });

    it('should have light text on dark background', () => {
      const textPrimary = document.documentElement.style.getPropertyValue('--text-primary');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      expect(isLightColor(textPrimary)).toBe(true);
      expect(isLightColor(bgPrimary)).toBe(false);
    });

    it('should have sufficient border visibility on dark bg', () => {
      const borderDefault = document.documentElement.style.getPropertyValue('--border-default');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      expect(hexLuminance(borderDefault)).toBeGreaterThan(hexLuminance(bgPrimary));
    });

    it('should have card bg different from page bg', () => {
      const cardBg = document.documentElement.style.getPropertyValue('--card-bg');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      expect(cardBg).not.toBe(bgPrimary);
    });

    it('should have input bg distinguishable from page bg', () => {
      const inputBg = document.documentElement.style.getPropertyValue('--input-bg');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      expect(inputBg).not.toBe(bgPrimary);
    });

    it('should meet WCAG AA minimum contrast ratio for text', () => {
      const textPrimary = document.documentElement.style.getPropertyValue('--text-primary');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      const ratio = contrastRatio(textPrimary, bgPrimary);
      // WCAG AA requires >= 4.5 for normal text
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA contrast for secondary text', () => {
      const textSecondary = document.documentElement.style.getPropertyValue('--text-secondary');
      const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary');
      const ratio = contrastRatio(textSecondary, bgPrimary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

// -- Contrast helpers --

function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  hex = hex.trim().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.substring(0, 2), 16) / 255,
    g: parseInt(hex.substring(2, 4), 16) / 255,
    b: parseInt(hex.substring(4, 6), 16) / 255,
  };
}

function hexLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const linearize = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function isLightColor(hex) {
  return hexLuminance(hex) > 0.5;
}

/**
 * Theme Manager Service
 *
 * Manages application theming, allowing runtime theme switching
 * and persistence of user theme preferences.
 *
 * Available themes:
 * - 'light' (default)
 * - 'dark'
 * - Custom themes loaded from configuration
 *
 * Usage:
 * ```js
 * import { ThemeManagerService } from './services/theme-manager-service.js';
 *
 * // Apply a theme
 * ThemeManagerService.applyTheme('dark');
 *
 * // Apply custom token overrides
 * ThemeManagerService.applyTheme('light', {
 *   '--brand-primary': '#ff5722',
 *   '--brand-secondary': '#9c27b0'
 * });
 *
 * // Get current theme
 * const theme = ThemeManagerService.getCurrentTheme();
 * ```
 */

import { AllTokens } from '../ui/styles/tokens/index.js';

const STORAGE_KEY = 'pgxp-theme';
const DEFAULT_THEME = 'light';

class ThemeManager {
  constructor() {
    this.currentTheme = DEFAULT_THEME;
    this.customTokens = {};
    this.registeredThemes = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the theme manager
   * Loads stored theme preference and applies it
   */
  init() {
    if (this.initialized) {
      return;
    }

    // Inject design system tokens globally
    this.injectGlobalTokens();

    this.registerBuiltInThemes();
    const storedTheme = this.getStoredTheme();

    if (storedTheme) {
      this.applyTheme(storedTheme);
    } else {
      this.detectSystemPreference();
    }

    this.listenToSystemPreferenceChanges();
    this.initialized = true;
  }

  /**
   * Inject design system tokens into the document head
   * This makes all tokens available globally via :root
   */
  injectGlobalTokens() {
    const styleId = 'pgxp-design-tokens';

    // Avoid duplicate injection
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = AllTokens.cssText;
    document.head.appendChild(style);
  }

  /**
   * Register built-in themes
   */
  registerBuiltInThemes() {
    this.registerTheme('light', {});

    this.registerTheme('dark', {
      '--color-gray-0': '#1a1a2e',
      '--color-gray-50': '#16213e',
      '--color-gray-100': '#1f2937',
      '--color-gray-200': '#374151',
      '--color-gray-300': '#4b5563',
      '--color-gray-400': '#6b7280',
      '--color-gray-500': '#9ca3af',
      '--color-gray-600': '#d1d5db',
      '--color-gray-700': '#e5e7eb',
      '--color-gray-800': '#f3f4f6',
      '--color-gray-900': '#f9fafb',
      '--color-gray-1000': '#ffffff',
      '--bg-primary': '#1a1a2e',
      '--bg-secondary': '#16213e',
      '--bg-tertiary': '#1f2937',
      '--bg-muted': '#374151',
      '--bg-subtle': '#0f0f1a',
      '--bg-inverse': '#f9fafb',
      '--text-primary': '#f9fafb',
      '--text-secondary': '#e5e7eb',
      '--text-muted': '#9ca3af',
      '--text-placeholder': '#6b7280',
      '--text-disabled': '#4b5563',
      '--text-inverse': '#1a1a2e',
      '--border-default': '#4b5563',
      '--border-subtle': '#374151',
      '--border-strong': '#6b7280',
      '--card-bg': '#16213e',
      '--card-shadow': '0 4px 8px rgba(0, 0, 0, 0.4)',
      '--modal-bg': '#1a1a2e',
      '--modal-shadow': '0 8px 32px rgba(0, 0, 0, 0.6)',
      '--input-bg': '#1f2937',
      '--input-border': '#4b5563',
      '--dropdown-bg': '#16213e',
      '--dropdown-border': '#374151',
      '--dropdown-item-hover-bg': 'rgba(255, 255, 255, 0.05)',
      '--table-header-bg': '#1f2937',
      '--table-row-bg': '#1a1a2e',
      '--table-row-alt-bg': '#16213e',
      '--sidebar-bg': '#0f0f1a',
      '--header-bg': '#1a1a2e',
      '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 2px 4px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 4px 8px rgba(0, 0, 0, 0.5)',
      '--shadow-xl': '0 8px 16px rgba(0, 0, 0, 0.6)',
      // Status feedback colors
      '--status-error-bg': 'rgba(220, 53, 69, 0.2)',
      '--status-error-text': '#f5a6ae',
      '--status-error-border': 'rgba(220, 53, 69, 0.3)',
      '--status-success-bg': 'rgba(40, 167, 69, 0.2)',
      '--status-success-text': '#6dd98c',
      '--status-success-border': 'rgba(40, 167, 69, 0.3)',
      '--status-info-bg': 'rgba(0, 123, 255, 0.2)',
      '--status-info-text': '#8ec8ff',
      '--status-info-border': 'rgba(0, 123, 255, 0.3)',
      '--status-warning-bg': 'rgba(255, 193, 7, 0.2)',
      '--status-warning-text': '#ffe082',
      '--status-warning-border': 'rgba(255, 193, 7, 0.3)',
      // Semantic colors
      '--color-error': '#f87171',
      '--color-success': '#4ade80',
      '--color-info': '#60a5fa',
      '--color-warning': '#fbbf24',
      // Interactive states
      '--hover-overlay': 'rgba(255, 255, 255, 0.04)',
      '--active-overlay': 'rgba(255, 255, 255, 0.08)',
      '--focus-ring': '0 0 0 3px rgba(74, 158, 255, 0.4)',
      // Border
      '--border-default': '#4b5563',
      '--border-subtle': '#374151',
      '--border-strong': '#6b7280',
      // Card
      '--card-bg-hover': '#1f2937',
      '--card-border-color': '#374151',
      '--card-shadow-hover': '0 6px 12px rgba(74, 158, 255, 0.2)',
      // Modal
      '--modal-overlay-bg': 'rgba(0, 0, 0, 0.8)',
      '--modal-footer-bg': '#16213e',
      // Table
      '--table-border': '#374151',
      '--table-row-hover-bg': '#16213e',
      // Header & Tab
      '--header-border': '#374151',
      '--tab-bg': '#1f2937',
      '--tab-bg-active': '#1a1a2e',
      // Progress
      '--progress-track-bg': 'rgba(255, 255, 255, 0.1)',
      // MultiSelect component (@manufosela/multi-select)
      '--multi-select-bg': '#1f2937',
      '--multi-select-dropdown-bg': '#16213e',
      '--multi-select-text-color': '#f9fafb',
      '--multi-select-border-color': '#4b5563',
      '--multi-select-border-hover': '#6b7280',
      '--multi-select-arrow-color': '#9ca3af',
      '--multi-select-placeholder-color': '#6b7280',
      '--multi-select-option-hover-bg': 'rgba(255, 255, 255, 0.08)',
      '--multi-select-option-selected-bg': '#374151',
      '--multi-select-shadow': '0 2px 4px rgba(0, 0, 0, 0.4)',
    });
  }

  /**
   * Register a custom theme
   * @param {string} name - Theme name
   * @param {Object} tokens - Token overrides
   */
  registerTheme(name, tokens) {
    this.registeredThemes.set(name, tokens);
  }

  /**
   * Apply a theme by name with optional custom token overrides
   * @param {string} themeName - Theme to apply ('light', 'dark', or custom)
   * @param {Object} customTokens - Additional token overrides
   */
  applyTheme(themeName, customTokens = {}) {
    const themeTokens = this.registeredThemes.get(themeName);

    if (!themeTokens && themeName !== 'light') {
      console.warn(`Theme '${themeName}' not found, falling back to 'light'`);
      themeName = 'light';
    }

    // Remove previous theme tokens from :root before applying new ones
    const previousTokens = this.registeredThemes.get(this.currentTheme);
    if (previousTokens) {
      this.removeTokensFromRoot(previousTokens);
    }

    this.currentTheme = themeName;
    this.customTokens = customTokens;

    const allTokens = {
      ...this.registeredThemes.get(themeName),
      ...customTokens,
    };

    this.applyTokensToRoot(allTokens);
    this.applyThemeClass(themeName);
    this.setStoredTheme(themeName);
    this.dispatchThemeChangeEvent(themeName);
  }

  /**
   * Apply theme class to document root for CSS-based theming
   * @param {string} themeName - Theme name
   */
  applyThemeClass(themeName) {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${themeName}-theme`);
  }

  /**
   * Apply token overrides to :root
   * @param {Object} tokens - Token key-value pairs
   */
  applyTokensToRoot(tokens) {
    const root = document.documentElement;

    for (const [property, value] of Object.entries(tokens)) {
      root.style.setProperty(property, value);
    }
  }

  /**
   * Remove specific token overrides from :root
   * @param {Object} tokens - Token key-value pairs to remove
   */
  removeTokensFromRoot(tokens) {
    const root = document.documentElement;

    for (const property of Object.keys(tokens)) {
      root.style.removeProperty(property);
    }
  }

  /**
   * Remove all custom tokens from :root
   */
  clearCustomTokens() {
    const root = document.documentElement;

    const allTokens = {
      ...this.registeredThemes.get(this.currentTheme),
      ...this.customTokens,
    };

    for (const property of Object.keys(allTokens)) {
      root.style.removeProperty(property);
    }
  }

  /**
   * Detect system color scheme preference
   */
  detectSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.applyTheme('dark');
    } else {
      this.applyTheme('light');
    }
  }

  /**
   * Listen for system preference changes
   */
  listenToSystemPreferenceChanges() {
    if (!window.matchMedia) {
      return;
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (!this.getStoredTheme()) {
        this.applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Get the currently applied theme name
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   * @returns {boolean} True if dark mode is active
   */
  isDarkMode() {
    return this.currentTheme === 'dark';
  }

  /**
   * Toggle between light and dark themes
   * @returns {string} The new theme name
   */
  toggleDarkMode() {
    const newTheme = this.isDarkMode() ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return newTheme;
  }

  /**
   * Get stored theme preference from localStorage
   * @returns {string|null} Stored theme name or null
   */
  getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Store theme preference in localStorage
   * @param {string} themeName - Theme name to store
   */
  setStoredTheme(themeName) {
    try {
      localStorage.setItem(STORAGE_KEY, themeName);
    } catch {
      console.warn('Failed to save theme preference to localStorage');
    }
  }

  /**
   * Clear stored theme preference
   */
  clearStoredTheme() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }

  /**
   * Dispatch custom event when theme changes
   * @param {string} themeName - New theme name
   */
  dispatchThemeChangeEvent(themeName) {
    const event = new CustomEvent('theme-change', {
      bubbles: true,
      composed: true,
      detail: {
        theme: themeName,
        isDark: themeName === 'dark',
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Get all registered theme names
   * @returns {string[]} Array of theme names
   */
  getAvailableThemes() {
    return Array.from(this.registeredThemes.keys());
  }

  /**
   * Get token value for current theme
   * @param {string} tokenName - CSS custom property name
   * @returns {string} Token value
   */
  getTokenValue(tokenName) {
    return getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  }
}

export const ThemeManagerService = new ThemeManager();

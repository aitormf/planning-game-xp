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
import { DarkThemeValues } from '../ui/styles/themes/dark-theme.js';

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
    this.registerTheme('dark', DarkThemeValues);
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

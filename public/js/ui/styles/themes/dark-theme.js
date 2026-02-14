import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

/**
 * Dark Theme Token Overrides
 *
 * This theme inverts the color scheme for dark mode support.
 * It overrides semantic tokens while preserving brand colors.
 *
 * Usage with ThemeManagerService:
 * ```js
 * import { ThemeManagerService } from '../services/theme-manager-service.js';
 * ThemeManagerService.applyTheme('dark');
 * ```
 *
 * Usage as Lit styles (for components that need dark variants):
 * ```js
 * import { DarkThemeTokens } from './themes/dark-theme.js';
 * static styles = [ThemeVariables, DarkThemeTokens, ownStyles];
 * ```
 */

/**
 * Dark theme token overrides for Lit components
 * Use with :host([theme="dark"]) or media query
 */
export const DarkThemeTokens = css`
  :host([theme="dark"]),
  :host-context([data-theme="dark"]) {
    /* ==================== INVERTED COLOR PALETTE ==================== */
    --color-gray-0: #1a1a2e;
    --color-gray-50: #16213e;
    --color-gray-100: #1f2937;
    --color-gray-200: #374151;
    --color-gray-300: #4b5563;
    --color-gray-400: #6b7280;
    --color-gray-500: #9ca3af;
    --color-gray-600: #d1d5db;
    --color-gray-700: #e5e7eb;
    --color-gray-800: #f3f4f6;
    --color-gray-900: #f9fafb;
    --color-gray-1000: #ffffff;

    /* ==================== BACKGROUND COLORS ==================== */
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --bg-tertiary: #1f2937;
    --bg-muted: #374151;
    --bg-subtle: #0f0f1a;
    --bg-inverse: #f9fafb;

    /* ==================== TEXT COLORS ==================== */
    --text-primary: #f9fafb;
    --text-secondary: #e5e7eb;
    --text-muted: #9ca3af;
    --text-placeholder: #6b7280;
    --text-disabled: #4b5563;
    --text-inverse: #1a1a2e;

    /* ==================== BORDER COLORS ==================== */
    --border-default: #4b5563;
    --border-subtle: #374151;
    --border-strong: #6b7280;

    /* ==================== SHADOWS (more pronounced) ==================== */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.5);
    --shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.6);
    --shadow-2xl: 0 12px 24px rgba(0, 0, 0, 0.7);

    /* ==================== COMPONENT OVERRIDES ==================== */

    /* Card */
    --card-bg: #16213e;
    --card-bg-hover: #1f2937;
    --card-border-color: #374151;
    --card-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    --card-shadow-hover: 0 6px 12px rgba(74, 158, 255, 0.2);

    /* Modal */
    --modal-bg: #1a1a2e;
    --modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    --modal-overlay-bg: rgba(0, 0, 0, 0.8);
    --modal-header-bg: var(--brand-primary);
    --modal-footer-bg: #16213e;

    /* Input */
    --input-bg: #1f2937;
    --input-border: #4b5563;

    /* Dropdown */
    --dropdown-bg: #16213e;
    --dropdown-border: #374151;
    --dropdown-item-hover-bg: rgba(255, 255, 255, 0.05);

    /* Table */
    --table-border: #374151;
    --table-header-bg: #1f2937;
    --table-row-bg: #1a1a2e;
    --table-row-hover-bg: #16213e;
    --table-row-alt-bg: #16213e;

    /* Sidebar */
    --sidebar-bg: #0f0f1a;

    /* Header */
    --header-bg: #1a1a2e;
    --header-border: #374151;

    /* Tab */
    --tab-bg: #1f2937;
    --tab-bg-active: #1a1a2e;

    /* Tooltip */
    --tooltip-bg: #f9fafb;
    --tooltip-text: #1a1a2e;

    /* Interactive states */
    --hover-overlay: rgba(255, 255, 255, 0.04);
    --active-overlay: rgba(255, 255, 255, 0.08);
    --focus-ring: 0 0 0 3px rgba(74, 158, 255, 0.4);

    /* Status colors (feedback messages) */
    --status-error-bg: rgba(220, 53, 69, 0.2);
    --status-error-text: #f5a6ae;
    --status-error-border: rgba(220, 53, 69, 0.3);
    --status-success-bg: rgba(40, 167, 69, 0.2);
    --status-success-text: #6dd98c;
    --status-success-border: rgba(40, 167, 69, 0.3);
    --status-info-bg: rgba(0, 123, 255, 0.2);
    --status-info-text: #8ec8ff;
    --status-info-border: rgba(0, 123, 255, 0.3);
    --status-warning-bg: rgba(255, 193, 7, 0.2);
    --status-warning-text: #ffe082;
    --status-warning-border: rgba(255, 193, 7, 0.3);

    /* Semantic colors */
    --color-error: #f87171;
    --color-success: #4ade80;
    --color-info: #60a5fa;
    --color-warning: #fbbf24;

    /* Progress bar */
    --progress-track-bg: rgba(255, 255, 255, 0.1);

    /* MultiSelect component (@manufosela/multi-select) */
    --multi-select-bg: #1f2937;
    --multi-select-dropdown-bg: #16213e;
    --multi-select-text-color: #f9fafb;
    --multi-select-border-color: #4b5563;
    --multi-select-border-hover: #6b7280;
    --multi-select-arrow-color: #9ca3af;
    --multi-select-placeholder-color: #6b7280;
    --multi-select-option-hover-bg: rgba(255, 255, 255, 0.08);
    --multi-select-option-selected-bg: #374151;
    --multi-select-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }
`;

/**
 * Dark theme as plain object for ThemeManagerService
 * These values are applied to :root when dark theme is selected
 */
export const DarkThemeValues = {
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
  '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
  '--shadow-md': '0 2px 4px rgba(0, 0, 0, 0.4)',
  '--shadow-lg': '0 4px 8px rgba(0, 0, 0, 0.5)',
  '--shadow-xl': '0 8px 16px rgba(0, 0, 0, 0.6)',
  '--shadow-2xl': '0 12px 24px rgba(0, 0, 0, 0.7)',
  '--card-bg': '#16213e',
  '--card-bg-hover': '#1f2937',
  '--card-border-color': '#374151',
  '--card-shadow': '0 4px 8px rgba(0, 0, 0, 0.4)',
  '--card-shadow-hover': '0 6px 12px rgba(74, 158, 255, 0.2)',
  '--modal-bg': '#1a1a2e',
  '--modal-shadow': '0 8px 32px rgba(0, 0, 0, 0.6)',
  '--modal-overlay-bg': 'rgba(0, 0, 0, 0.8)',
  '--modal-footer-bg': '#16213e',
  '--input-bg': '#1f2937',
  '--input-border': '#4b5563',
  '--dropdown-bg': '#16213e',
  '--dropdown-border': '#374151',
  '--dropdown-item-hover-bg': 'rgba(255, 255, 255, 0.05)',
  '--table-border': '#374151',
  '--table-header-bg': '#1f2937',
  '--table-row-bg': '#1a1a2e',
  '--table-row-hover-bg': '#16213e',
  '--table-row-alt-bg': '#16213e',
  '--sidebar-bg': '#0f0f1a',
  '--header-bg': '#1a1a2e',
  '--header-border': '#374151',
  '--tab-bg': '#1f2937',
  '--tab-bg-active': '#1a1a2e',
  '--tooltip-bg': '#f9fafb',
  '--tooltip-text': '#1a1a2e',
  '--hover-overlay': 'rgba(255, 255, 255, 0.04)',
  '--active-overlay': 'rgba(255, 255, 255, 0.08)',
  '--focus-ring': '0 0 0 3px rgba(74, 158, 255, 0.4)',
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
  '--color-error': '#f87171',
  '--color-success': '#4ade80',
  '--color-info': '#60a5fa',
  '--color-warning': '#fbbf24',
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
};

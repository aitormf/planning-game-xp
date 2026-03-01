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
  :host-context([data-theme="dark"]),
  :host-context(.dark-theme) {
    /* ==================== INVERTED COLOR PALETTE ==================== */
    --color-gray-0: #0f172a;
    --color-gray-50: #1e293b;
    --color-gray-100: #1e293b;
    --color-gray-200: #334155;
    --color-gray-300: #475569;
    --color-gray-400: #64748b;
    --color-gray-500: #94a3b8;
    --color-gray-600: #cbd5e1;
    --color-gray-700: #e2e8f0;
    --color-gray-800: #f1f5f9;
    --color-gray-900: #f8fafc;
    --color-gray-1000: #ffffff;

    /* ==================== BACKGROUND COLORS ==================== */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --bg-muted: #475569;
    --bg-subtle: #020617;
    --bg-inverse: #f8fafc;

    /* ==================== TEXT COLORS ==================== */
    --text-primary: #f8fafc;
    --text-secondary: #e2e8f0;
    --text-muted: #94a3b8;
    --text-placeholder: #64748b;
    --text-disabled: #475569;
    --text-inverse: #0f172a;

    /* ==================== BORDER COLORS ==================== */
    --border-default: #475569;
    --border-subtle: #334155;
    --border-strong: #64748b;

    /* ==================== SHADOWS (more pronounced) ==================== */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.5);
    --shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.6);
    --shadow-2xl: 0 12px 24px rgba(0, 0, 0, 0.7);

    /* ==================== COMPONENT OVERRIDES ==================== */

    /* Card */
    --card-bg: #1e293b;
    --card-bg-hover: #334155;
    --card-border-color: #334155;
    --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    --card-shadow-hover: 0 4px 8px rgba(99, 102, 241, 0.15);

    /* Modal */
    --modal-bg: #0f172a;
    --modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    --modal-overlay-bg: rgba(0, 0, 0, 0.7);
    --modal-header-bg: var(--brand-primary);
    --modal-footer-bg: #1e293b;

    /* Input */
    --input-bg: #1e293b;
    --input-border: #475569;

    /* Dropdown */
    --dropdown-bg: #1e293b;
    --dropdown-border: #334155;
    --dropdown-item-hover-bg: rgba(255, 255, 255, 0.05);

    /* Table */
    --table-border: #334155;
    --table-header-bg: #1e293b;
    --table-row-bg: #0f172a;
    --table-row-hover-bg: #1e293b;
    --table-row-alt-bg: #1e293b;

    /* Sidebar */
    --sidebar-bg: #020617;

    /* Header */
    --header-bg: #0f172a;
    --header-border: #334155;

    /* Tab */
    --tab-bg: #1e293b;
    --tab-bg-active: #0f172a;

    /* Tooltip */
    --tooltip-bg: #f8fafc;
    --tooltip-text: #0f172a;

    /* Interactive states */
    --hover-overlay: rgba(255, 255, 255, 0.04);
    --active-overlay: rgba(255, 255, 255, 0.08);
    --focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.4);

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
    --multi-select-bg: #1e293b;
    --multi-select-dropdown-bg: #1e293b;
    --multi-select-text-color: #f8fafc;
    --multi-select-border-color: #475569;
    --multi-select-border-hover: #64748b;
    --multi-select-arrow-color: #94a3b8;
    --multi-select-placeholder-color: #64748b;
    --multi-select-option-hover-bg: rgba(255, 255, 255, 0.08);
    --multi-select-option-selected-bg: #334155;
    --multi-select-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
  }
`;

/**
 * Dark theme as plain object for ThemeManagerService
 * These values are applied to :root when dark theme is selected
 */
export const DarkThemeValues = {
  '--color-gray-0': '#0f172a',
  '--color-gray-50': '#1e293b',
  '--color-gray-100': '#1e293b',
  '--color-gray-200': '#334155',
  '--color-gray-300': '#475569',
  '--color-gray-400': '#64748b',
  '--color-gray-500': '#94a3b8',
  '--color-gray-600': '#cbd5e1',
  '--color-gray-700': '#e2e8f0',
  '--color-gray-800': '#f1f5f9',
  '--color-gray-900': '#f8fafc',
  '--color-gray-1000': '#ffffff',
  '--bg-primary': '#0f172a',
  '--bg-secondary': '#1e293b',
  '--bg-tertiary': '#334155',
  '--bg-muted': '#475569',
  '--bg-subtle': '#020617',
  '--bg-inverse': '#f8fafc',
  '--text-primary': '#f8fafc',
  '--text-secondary': '#e2e8f0',
  '--text-muted': '#94a3b8',
  '--text-placeholder': '#64748b',
  '--text-disabled': '#475569',
  '--text-inverse': '#0f172a',
  '--border-default': '#475569',
  '--border-subtle': '#334155',
  '--border-strong': '#64748b',
  '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
  '--shadow-md': '0 2px 4px rgba(0, 0, 0, 0.35)',
  '--shadow-lg': '0 4px 8px rgba(0, 0, 0, 0.4)',
  '--shadow-xl': '0 8px 16px rgba(0, 0, 0, 0.5)',
  '--shadow-2xl': '0 12px 24px rgba(0, 0, 0, 0.6)',
  '--card-bg': '#1e293b',
  '--card-bg-hover': '#334155',
  '--card-border-color': '#334155',
  '--card-shadow': '0 1px 3px rgba(0, 0, 0, 0.3)',
  '--card-shadow-hover': '0 4px 8px rgba(99, 102, 241, 0.15)',
  '--modal-bg': '#0f172a',
  '--modal-shadow': '0 8px 32px rgba(0, 0, 0, 0.5)',
  '--modal-overlay-bg': 'rgba(0, 0, 0, 0.7)',
  '--modal-footer-bg': '#1e293b',
  '--input-bg': '#1e293b',
  '--input-border': '#475569',
  '--dropdown-bg': '#1e293b',
  '--dropdown-border': '#334155',
  '--dropdown-item-hover-bg': 'rgba(255, 255, 255, 0.05)',
  '--table-border': '#334155',
  '--table-header-bg': '#1e293b',
  '--table-row-bg': '#0f172a',
  '--table-row-hover-bg': '#1e293b',
  '--table-row-alt-bg': '#1e293b',
  '--sidebar-bg': '#020617',
  '--header-bg': '#0f172a',
  '--header-border': '#334155',
  '--tab-bg': '#1e293b',
  '--tab-bg-active': '#0f172a',
  '--tooltip-bg': '#f8fafc',
  '--tooltip-text': '#0f172a',
  '--hover-overlay': 'rgba(255, 255, 255, 0.04)',
  '--active-overlay': 'rgba(255, 255, 255, 0.08)',
  '--focus-ring': '0 0 0 3px rgba(99, 102, 241, 0.4)',
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
  '--multi-select-bg': '#1e293b',
  '--multi-select-dropdown-bg': '#1e293b',
  '--multi-select-text-color': '#f8fafc',
  '--multi-select-border-color': '#475569',
  '--multi-select-border-hover': '#64748b',
  '--multi-select-arrow-color': '#94a3b8',
  '--multi-select-placeholder-color': '#64748b',
  '--multi-select-option-hover-bg': 'rgba(255, 255, 255, 0.08)',
  '--multi-select-option-selected-bg': '#334155',
  '--multi-select-shadow': '0 2px 4px rgba(0, 0, 0, 0.35)',
};

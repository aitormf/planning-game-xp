import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

/**
 * Semantic Tokens - Meaningful design tokens
 * These reference primitive tokens and provide semantic meaning.
 * Use these in components for consistent theming support.
 */
export const SemanticTokens = css`
  :host, :root {
    /* ==================== BRAND COLORS ==================== */
    --brand-primary: var(--color-blue-500);
    --brand-primary-hover: var(--color-blue-600);
    --brand-primary-active: var(--color-blue-700);
    --brand-secondary: var(--color-pink-500);
    --brand-secondary-hover: var(--color-pink-600);
    --brand-secondary-active: var(--color-pink-700);

    /* ==================== FUNCTIONAL COLORS ==================== */
    --color-success: var(--color-green-500);
    --color-success-hover: var(--color-green-600);
    --color-success-light: var(--color-green-50);
    --color-success-dark: var(--color-green-700);

    --color-warning: var(--color-orange-500);
    --color-warning-hover: var(--color-orange-700);
    --color-warning-light: var(--color-orange-50);
    --color-warning-dark: var(--color-orange-800);

    --color-error: var(--color-red-500);
    --color-error-hover: var(--color-red-600);
    --color-error-light: var(--color-red-50);
    --color-error-dark: var(--color-red-700);

    --color-info: var(--color-cyan-500);
    --color-info-hover: var(--color-cyan-600);
    --color-info-light: var(--color-cyan-50);
    --color-info-dark: var(--color-cyan-700);

    /* ==================== BACKGROUND COLORS ==================== */
    --bg-primary: var(--color-gray-0);
    --bg-secondary: var(--color-gray-100);
    --bg-tertiary: var(--color-gray-200);
    --bg-muted: var(--color-gray-300);
    --bg-subtle: var(--color-gray-50);
    --bg-inverse: var(--color-gray-900);

    /* ==================== TEXT COLORS ==================== */
    --text-primary: var(--color-gray-900);
    --text-secondary: var(--color-gray-800);
    --text-muted: var(--color-gray-600);
    --text-placeholder: var(--color-gray-500);
    --text-disabled: var(--color-gray-400);
    --text-inverse: var(--color-gray-0);

    /* ==================== BORDER COLORS ==================== */
    --border-default: var(--color-gray-400);
    --border-subtle: var(--color-gray-300);
    --border-strong: var(--color-gray-500);
    --border-focus: var(--brand-primary);
    --border-error: var(--color-error);

    /* ==================== CARD STATUS COLORS ==================== */
    --status-todo: #94a3b8;
    --status-todo-text: #ffffff;
    --status-in-progress: #3b82f6;
    --status-in-progress-text: #ffffff;
    --status-to-validate: #f59e0b;
    --status-to-validate-text: #ffffff;
    --status-done: #10b981;
    --status-done-text: #ffffff;
    --status-blocked: #f43f5e;
    --status-blocked-text: #ffffff;
    --status-expedited: #8b5cf6;
    --status-expedited-text: #ffffff;

    /* ==================== BADGE COLORS ==================== */
    --badge-success-bg: var(--color-success);
    --badge-success-hover: var(--color-success-hover);
    --badge-warning-bg: var(--color-warning);
    --badge-warning-hover: var(--color-warning-hover);
    --badge-error-bg: var(--color-error);
    --badge-error-hover: var(--color-error-hover);
    --badge-info-bg: var(--color-info);
    --badge-info-hover: var(--color-info-hover);
    --badge-neutral-bg: var(--color-gray-700);
    --badge-neutral-hover: var(--color-gray-800);

    /* ==================== TAB COLORS ==================== */
    --tab-description-color: var(--color-pink-500);
    --tab-acceptance-criteria-color: var(--color-blue-500);
    --tab-notes-color: var(--color-orange-500);

    /* ==================== SEMANTIC SPACING ==================== */
    --spacing-xs: var(--space-1);
    --spacing-sm: var(--space-2);
    --spacing-md: var(--space-3);
    --spacing-lg: var(--space-4);
    --spacing-xl: var(--space-5);
    --spacing-2xl: var(--space-6);

    /* ==================== SEMANTIC TYPOGRAPHY ==================== */
    --text-xs: var(--font-size-xs);
    --text-sm: var(--font-size-sm);
    --text-base: var(--font-size-base);
    --text-lg: var(--font-size-lg);
    --text-xl: var(--font-size-xl);
    --text-2xl: var(--font-size-2xl);
    --text-3xl: var(--font-size-3xl);

    /* ==================== SEMANTIC TRANSITIONS ==================== */
    --transition-fast: var(--duration-fast) var(--easing-default);
    --transition-normal: var(--duration-normal) var(--easing-default);
    --transition-slow: var(--duration-slow) var(--easing-default);

    /* ==================== INTERACTIVE STATES ==================== */
    --focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.3);
    --focus-ring-error: 0 0 0 3px rgba(244, 63, 94, 0.3);
    --hover-overlay: rgba(0, 0, 0, 0.04);
    --active-overlay: rgba(0, 0, 0, 0.08);
    --disabled-opacity: 0.5;
  }
`;

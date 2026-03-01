import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { AllTokens } from './tokens/index.js';
import { DarkThemeTokens } from './themes/dark-theme.js';

/**
 * Theme Variables
 *
 * This module exports the complete design system tokens.
 * It imports from the layered token system (primitives → semantic → components)
 * and adds backward-compatible aliases for existing code.
 *
 * Migration path:
 * - Old code using --primary-color should migrate to --brand-primary
 * - Old code using --secondary-color should migrate to --brand-secondary
 * - See mapping below for all aliases
 */

/**
 * Backward-compatible aliases mapping old variable names to new tokens.
 * These will be deprecated in a future version.
 */
const BackwardCompatibleAliases = css`
  :host {
    /* ==================== LEGACY ALIASES (DEPRECATED) ==================== */
    /* Main colors - use --brand-* instead */
    --primary-color: var(--brand-primary);
    --primary-hover: var(--brand-primary-hover);
    --secondary-color: var(--brand-secondary);
    --accent-color: var(--color-success);
    --warning-color: var(--color-warning);
    --danger-color: var(--color-error);
    --danger-hover: var(--color-error-hover);

    /* Status colors - use --status-* instead */
    --status-todo: var(--status-todo);
    --status-inprogress: var(--status-in-progress);
    --status-tovalidate: var(--status-to-validate);
    --status-done: var(--status-done);
    --status-blocked: var(--status-blocked);
    --status-expedited: var(--status-expedited);

    /* Badge colors - use --badge-*-bg instead */
    --badge-success: var(--badge-success-bg);
    --badge-success-hover: var(--color-success-hover);
    --badge-warning: var(--badge-warning-bg);
    --badge-warning-hover: var(--color-warning-hover);
    --badge-danger: var(--badge-error-bg);
    --badge-danger-hover: var(--color-error-hover);
    --badge-info: var(--badge-info-bg);
    --badge-info-hover: var(--color-info-hover);
    --badge-neutral: var(--badge-neutral-bg);
    --badge-neutral-hover: var(--badge-neutral-hover);

    /* Background colors - use --bg-* instead */
    --bg-white: var(--bg-primary);
    --bg-light: var(--bg-secondary);
    --bg-muted: var(--bg-muted);
    --bg-border: var(--border-default);
    --bg-gray: var(--bg-tertiary);
    --bg-dark: var(--bg-muted);

    /* Text colors - already using semantic names */
    --text-white: var(--text-inverse);

    /* Tab colors - use --tab-*-color instead */
    --description-color: var(--tab-description-color);
    --acceptanceCriteria-color: var(--tab-acceptance-criteria-color);
    --notes-color: var(--tab-notes-color);

    /* Shadows - use new shadow scale */
    --shadow-hover: var(--card-shadow-hover);
    --shadow-heavy: 0 2px 4px rgba(0, 0, 0, 0.3);

    /* Z-index - use new scale */
    --z-index-base: var(--z-above);
    --z-index-elevated: 2;
    --z-index-high: 3;
    --z-index-top: var(--z-dropdown);

    /* Font sizes - use --text-* or --font-size-* */
    --font-size-xxl: var(--font-size-2xl);
    --font-size-xxxl: var(--font-size-3xl);

    /* Transitions - use new format */
    --transition-fast: 0.2s;
    --transition-normal: 0.3s;
  }
`;

/**
 * Complete theme variables combining all tokens and backward-compatible aliases.
 */
export const ThemeVariables = css`
  ${AllTokens}
  ${BackwardCompatibleAliases}
  ${DarkThemeTokens}
`;

/**
 * Re-export individual token layers for advanced usage
 */
export { AllTokens } from './tokens/index.js';
export { PrimitiveTokens, SemanticTokens, ComponentTokens } from './tokens/index.js';

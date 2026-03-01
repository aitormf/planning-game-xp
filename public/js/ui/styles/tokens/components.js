import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

/**
 * Component Tokens - Component-specific design tokens
 * These provide defaults for specific UI components.
 * Components can override these locally if needed.
 */
export const ComponentTokens = css`
  :host, :root {
    /* ==================== CARD TOKENS ==================== */
    --card-bg: var(--bg-primary);
    --card-bg-hover: var(--bg-subtle);
    --card-border-color: var(--border-default);
    --card-border-radius: var(--radius-lg);
    --card-shadow: var(--shadow-sm);
    --card-shadow-hover: var(--shadow-md);
    --card-padding: var(--spacing-md);
    --card-width: 320px;
    --card-min-height: 180px;
    --card-height-task: 260px;
    --card-height-bug: 275px;

    /* Card header */
    --card-header-bg: var(--brand-primary);
    --card-header-text: var(--text-inverse);
    --card-header-height: 32px;
    --card-header-padding: var(--spacing-sm) var(--spacing-md);

    /* Card content */
    --card-content-padding: var(--spacing-md);
    --card-title-color: var(--text-primary);
    --card-title-size: var(--text-base);
    --card-description-color: var(--text-secondary);
    --card-description-size: var(--text-sm);

    /* ==================== BUTTON TOKENS ==================== */
    --btn-border-radius: var(--radius-md);
    --btn-padding-x: var(--spacing-md);
    --btn-padding-y: var(--spacing-sm);
    --btn-font-size: var(--text-sm);
    --btn-font-weight: var(--font-weight-medium);
    --btn-transition: var(--transition-fast);

    /* Primary button */
    --btn-primary-bg: var(--brand-primary);
    --btn-primary-text: var(--text-inverse);
    --btn-primary-hover-bg: var(--brand-primary-hover);
    --btn-primary-active-bg: var(--brand-primary-active);

    /* Secondary button */
    --btn-secondary-bg: var(--bg-muted);
    --btn-secondary-text: var(--text-primary);
    --btn-secondary-hover-bg: var(--bg-tertiary);
    --btn-secondary-border: var(--border-default);

    /* Danger button */
    --btn-danger-bg: var(--color-error);
    --btn-danger-text: var(--text-inverse);
    --btn-danger-hover-bg: var(--color-error-hover);

    /* Success button */
    --btn-success-bg: var(--color-success);
    --btn-success-text: var(--text-inverse);
    --btn-success-hover-bg: var(--color-success-hover);

    /* ==================== INPUT TOKENS ==================== */
    --input-bg: var(--bg-primary);
    --input-text: var(--text-primary);
    --input-placeholder: var(--text-placeholder);
    --input-border: var(--border-default);
    --input-border-focus: var(--border-focus);
    --input-border-error: var(--border-error);
    --input-border-radius: var(--radius-md);
    --input-padding: var(--spacing-sm) var(--spacing-md);
    --input-font-size: var(--text-base);
    --input-focus-ring: var(--focus-ring);

    /* ==================== SELECT TOKENS ==================== */
    --select-bg: var(--input-bg);
    --select-text: var(--input-text);
    --select-border: var(--input-border);
    --select-border-radius: var(--input-border-radius);
    --select-padding: var(--input-padding);
    --select-arrow-color: var(--text-muted);

    /* ==================== MODAL TOKENS ==================== */
    --modal-bg: var(--bg-primary);
    --modal-text: var(--text-primary);
    --modal-border-radius: var(--radius-xl);
    --modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    --modal-overlay-bg: rgba(0, 0, 0, 0.4);
    --modal-max-width: 80vw;
    --modal-max-height: 80vh;
    --modal-padding: var(--spacing-lg);
    --modal-body-padding: 0;

    /* Modal header */
    --modal-header-bg: var(--brand-primary);
    --modal-header-text: var(--text-inverse);
    --modal-header-padding: var(--spacing-md);

    /* Modal footer */
    --modal-footer-bg: var(--bg-secondary);
    --modal-footer-padding: var(--spacing-md);
    --modal-footer-border: var(--border-subtle);

    /* ==================== NOTIFICATION TOKENS ==================== */
    --notification-border-radius: var(--radius-md);
    --notification-shadow: var(--shadow-lg);
    --notification-padding: var(--spacing-md);
    --notification-min-width: 300px;
    --notification-max-width: 400px;

    --notification-success-bg: var(--color-success);
    --notification-success-text: var(--text-inverse);
    --notification-error-bg: var(--color-error);
    --notification-error-text: var(--text-inverse);
    --notification-warning-bg: var(--color-warning);
    --notification-warning-text: var(--text-primary);
    --notification-info-bg: var(--color-info);
    --notification-info-text: var(--text-inverse);

    /* ==================== TAB TOKENS ==================== */
    --tab-bg: var(--bg-secondary);
    --tab-bg-active: var(--bg-primary);
    --tab-text: var(--text-secondary);
    --tab-text-active: var(--text-primary);
    --tab-border-radius: var(--radius-md);
    --tab-padding: var(--spacing-sm) var(--spacing-md);
    --tab-indicator-height: 3px;

    /* ==================== TOOLTIP TOKENS ==================== */
    --tooltip-bg: var(--bg-inverse);
    --tooltip-text: var(--text-inverse);
    --tooltip-border-radius: var(--radius-sm);
    --tooltip-padding: var(--spacing-xs) var(--spacing-sm);
    --tooltip-font-size: var(--text-sm);
    --tooltip-shadow: var(--shadow-lg);

    /* ==================== BADGE TOKENS ==================== */
    --badge-border-radius: var(--radius-full);
    --badge-padding: var(--spacing-xs) var(--spacing-sm);
    --badge-font-size: var(--text-xs);
    --badge-font-weight: var(--font-weight-medium);

    /* ==================== DROPDOWN TOKENS ==================== */
    --dropdown-bg: var(--bg-primary);
    --dropdown-border: var(--border-subtle);
    --dropdown-border-radius: var(--radius-md);
    --dropdown-shadow: var(--shadow-lg);
    --dropdown-item-padding: var(--spacing-sm) var(--spacing-md);
    --dropdown-item-hover-bg: var(--hover-overlay);

    /* ==================== TABLE TOKENS ==================== */
    --table-border: var(--border-subtle);
    --table-header-bg: var(--bg-secondary);
    --table-header-text: var(--text-primary);
    --table-row-bg: var(--bg-primary);
    --table-row-hover-bg: var(--bg-subtle);
    --table-row-alt-bg: var(--bg-secondary);
    --table-cell-padding: var(--spacing-sm) var(--spacing-md);

    /* ==================== SIDEBAR TOKENS ==================== */
    --sidebar-bg: var(--bg-secondary);
    --sidebar-text: var(--text-primary);
    --sidebar-width: 250px;
    --sidebar-item-padding: var(--spacing-sm) var(--spacing-md);
    --sidebar-item-hover-bg: var(--hover-overlay);
    --sidebar-item-active-bg: var(--brand-primary);
    --sidebar-item-active-text: var(--text-inverse);

    /* ==================== HEADER TOKENS ==================== */
    --header-bg: var(--bg-primary);
    --header-text: var(--text-primary);
    --header-height: 60px;
    --header-shadow: var(--shadow-sm);
    --header-border: var(--border-subtle);

    /* ==================== LOADER TOKENS ==================== */
    --loader-color: var(--brand-primary);
    --loader-bg: rgba(0, 0, 0, 0.1);
    --loader-size: 40px;
    --loader-border-width: 4px;

    /* ==================== PROGRESS TOKENS ==================== */
    --progress-bg: var(--bg-muted);
    --progress-fill: var(--brand-primary);
    --progress-height: 8px;
    --progress-border-radius: var(--radius-full);

    /* ==================== AVATAR TOKENS ==================== */
    --avatar-bg: var(--bg-muted);
    --avatar-text: var(--text-primary);
    --avatar-border: var(--border-default);
    --avatar-size-sm: 32px;
    --avatar-size-md: 40px;
    --avatar-size-lg: 56px;
  }
`;

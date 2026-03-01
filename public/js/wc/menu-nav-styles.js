import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const MenuNavStyles = css`
  :host {
    display: block;
    position: relative;
  }

  nav {
    display: flex;
    gap: 2px;
    position: relative;
    padding: 0 1.5rem;
    background: var(--bg-primary, #ffffff);
    height: 2.5rem;
    align-items: center;
    border-bottom: 1px solid var(--border-subtle, #e2e8f0);
  }

  ::slotted(a) {
    text-decoration: none;
    color: var(--text-muted, #64748b);
    padding: 0.35rem 0.75rem !important;
    position: relative;
    font-size: 0.85rem;
    font-weight: 500;
    transition: color 0.15s ease, background-color 0.15s ease;
    border-radius: 6px;
  }

  ::slotted(a:hover) {
    color: var(--text-primary, #0f172a);
    background: var(--bg-secondary, #f1f5f9);
  }

  ::slotted(a[active]) {
    font-weight: 600;
    color: var(--brand-primary, #6366f1);
    background: rgba(99, 102, 241, 0.08);
  }

  ::slotted(a.hidden) {
    display: none;
  }

  .nav-indicator {
    position: absolute;
    height: 2px;
    background-color: var(--brand-primary, #6366f1);
    transition: all 0.2s ease-in-out;
    width: 0;
  }

  .nav-indicator.top {
    top: 0;
  }

  .nav-indicator.bottom {
    bottom: 0;
  }
`;
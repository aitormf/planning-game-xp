/**
 * Styles for Global Config List component
 */
import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const GlobalConfigListStyles = css`
  :host {
    display: block;
    font-family: var(--font-family-base, 'Segoe UI', system-ui, sans-serif);
  }

  .config-list-container {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  @media (max-width: 768px) {
    .config-list-container {
      grid-template-columns: 1fr;
    }
  }

  .sidebar {
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 8px;
    padding: 1rem;
    position: sticky;
    top: 1rem;
    height: fit-content;
  }

  .sidebar-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .type-tabs {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .type-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.8rem;
    border: none;
    border-radius: 6px;
    background: transparent;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
    text-align: left;
  }

  .type-tab:hover {
    background: var(--bg-tertiary, #e9ecef);
  }

  .type-tab.active {
    background: var(--brand-primary, #6366f1);
    color: white;
  }

  .type-count {
    margin-left: auto;
    font-size: 0.75rem;
    background: rgba(0, 0, 0, 0.1);
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
  }

  .type-tab.active .type-count {
    background: rgba(255, 255, 255, 0.2);
  }

  .main-content {
    min-height: 400px;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--border-default, #e5e7eb);
  }

  .content-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .content-actions {
    display: flex;
    gap: 0.5rem;
  }

  .filter-select {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 4px;
    background: var(--input-bg, white);
    color: var(--text-primary, inherit);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn-new {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background: var(--brand-primary, #6366f1);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-new:hover {
    background: var(--brand-primary-hover, #4f46e5);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary, #666);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-text {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
    color: var(--text-secondary, #666);
  }

  .category-stats {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .category-stat {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background: var(--bg-secondary, #f8f9fa);
  }
`;

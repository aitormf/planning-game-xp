import { css } from 'https://unpkg.com/lit@2.8.0/index.js?module';

export const unifiedFiltersStyles = css`
  :host {
    display: block;
    font-family: inherit;
    width: 100%;
    position: relative;
    z-index: 100;
  }

  .filters-wrapper {
    width: 100%;
    position: relative;
    z-index: 100;
  }

  details {
    border: 1px solid var(--input-border, #dee2e6);
    border-radius: 6px;
    background: var(--bg-secondary, #f8f9fa);
    overflow: visible;
    margin-bottom: 0.5rem;
    position: relative;
    z-index: 100;
  }

  summary {
    cursor: pointer;
    padding: 0.65rem 0.85rem;
    font-weight: 600;
    color: var(--text-primary, #344050);
    list-style: none;
    outline: none;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    border-bottom: 1px solid var(--border-color, #e9ecef);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .chevron {
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid var(--text-primary, #344050);
    transition: transform 0.2s ease;
  }

  details[open] .chevron {
    transform: rotate(90deg);
  }

  .results-count {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    margin-left: auto;
    font-weight: normal;
  }

  .filters-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.85rem;
    position: relative;
    z-index: 100;
    background: var(--bg-primary, white);
    border-radius: 0 0 6px 6px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 150px;
    position: relative;
    z-index: 100;
  }

  .filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary, #495057);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  multi-select {
    --ms-border-color: var(--input-border, #ced4da);
    --ms-border-radius: 4px;
    --ms-font-size: 0.85rem;
    --ms-dropdown-max-height: 250px;
    --ms-tag-bg: var(--bg-tertiary, #e9ecef);
    --ms-tag-color: var(--text-primary, #495057);
    min-width: 150px;
    position: relative;
    z-index: 100;
  }

  .actions-container {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    border-top: 1px solid var(--border-color, #e9ecef);
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 0 0 6px 6px;
  }

  .clear-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    border: 1px solid var(--input-border, #dee2e6);
    border-radius: 4px;
    background: var(--bg-primary, white);
    color: var(--text-primary, #495057);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .clear-btn:hover {
    background: var(--bg-tertiary, #e9ecef);
    border-color: var(--input-border, #ced4da);
  }

  .active-filters-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-on-primary, #fff);
    background: #0d6efd;
    border-radius: 9px;
    margin-left: 0.5rem;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: var(--text-muted, #6c757d);
    font-size: 0.85rem;
  }

  .loading::after {
    content: '';
    width: 16px;
    height: 16px;
    margin-left: 0.5rem;
    border: 2px solid var(--border-color, #dee2e6);
    border-top-color: var(--color-blue-500, #0d6efd);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

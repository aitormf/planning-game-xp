import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const HoursReportTabStyles = css`
  :host {
    display: block;
    font-family: var(--font-family-base, 'Segoe UI', system-ui, sans-serif);
  }

  .hours-report-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Filters */
  .filters-row {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted, #666);
  }

  .filter-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 0.9rem;
    background: var(--bg-primary, #fff);
    color: var(--text-primary, #333);
  }

  .btn-generate {
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    background: var(--primary-color, #4a90d9);
    color: #fff;
    transition: opacity 0.2s;
  }

  .btn-generate:hover {
    opacity: 0.85;
  }

  .btn-generate:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Loading */
  .loading-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem;
    justify-content: center;
    color: var(--text-muted, #666);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-color, #ddd);
    border-top-color: var(--primary-color, #4a90d9);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Table */
  .report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    margin-top: 1rem;
  }

  .report-table th,
  .report-table td {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    text-align: center;
    white-space: nowrap;
  }

  .report-table th {
    background: var(--bg-tertiary, #f0f0f0);
    font-weight: 700;
    color: var(--text-primary, #333);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .report-table td:first-child,
  .report-table th:first-child {
    text-align: left;
    min-width: 160px;
  }

  .report-table td:nth-child(2),
  .report-table th:nth-child(2) {
    text-align: left;
    min-width: 120px;
  }

  /* Group header row */
  .group-header td {
    background: var(--primary-color, #4a90d9);
    color: #fff;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Category rows */
  .row-development td:nth-child(2) {
    color: var(--status-in-progress, #2196F3);
    font-weight: 600;
  }

  .row-maintenance td:nth-child(2) {
    color: var(--status-blocked, #f44336);
    font-weight: 600;
  }

  /* Subtotal rows */
  .subtotal-row td {
    background: var(--bg-secondary, #f8f8f8);
    font-weight: 700;
    border-top: 2px solid var(--border-color, #ddd);
  }

  /* Grand total rows */
  .grand-total-row td {
    background: var(--bg-tertiary, #e8e8e8);
    font-weight: 800;
    font-size: 0.9rem;
    border-top: 3px solid var(--text-primary, #333);
  }

  /* Zero values dimmed */
  .zero-value {
    color: var(--text-muted, #999);
    opacity: 0.5;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted, #666);
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  /* Dark theme */
  :host-context(.dark-theme) .filter-input {
    background: var(--bg-secondary, #2a2a2a);
    border-color: var(--border-color, #444);
    color: var(--text-primary, #eee);
  }

  :host-context(.dark-theme) .report-table th {
    background: var(--bg-tertiary, #333);
  }

  :host-context(.dark-theme) .subtotal-row td {
    background: var(--bg-secondary, #2a2a2a);
  }

  :host-context(.dark-theme) .grand-total-row td {
    background: var(--bg-tertiary, #333);
  }
`;

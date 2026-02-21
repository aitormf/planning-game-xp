/**
 * Shared styles for commits list display in TaskCard and BugCard
 */

import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const CommitsListStyles = css`
  .commits-panel {
    padding: 0.5rem;
  }

  .commits-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .commits-table thead th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--border-default, #dee2e6);
    color: var(--text-secondary, #666);
    font-weight: 600;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .commit-row td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border-default, #eee);
    vertical-align: top;
  }

  .commit-row:last-child td {
    border-bottom: none;
  }

  .commit-row:hover td {
    background: var(--surface-secondary, #f8f9fa);
  }

  .commit-hash {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--color-blue-600, #2563eb);
    background: var(--surface-tertiary, #e5e5e5);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    white-space: nowrap;
  }

  .commit-message {
    color: var(--text-primary, #333);
    word-break: break-word;
  }

  .commit-author {
    font-size: 0.85rem;
    color: var(--text-secondary, #666);
    white-space: nowrap;
  }

  .commit-date {
    font-size: 0.85rem;
    color: var(--text-secondary, #666);
    white-space: nowrap;
  }

  .no-commits {
    text-align: center;
    padding: 1.5rem;
    color: var(--text-secondary, #666);
    font-style: italic;
  }

  .commits-count-badge {
    background: var(--color-blue-500, #4a9eff);
    color: white;
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    margin-left: 0.3rem;
  }
`;

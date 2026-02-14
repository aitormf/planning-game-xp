/**
 * Shared styles for commits list display in TaskCard and BugCard
 */

import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const CommitsListStyles = css`
  .commits-panel {
    padding: 0.5rem;
  }

  .commits-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .commit-item {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: var(--surface-secondary, #f5f5f5);
    border-radius: 4px;
    border-left: 3px solid var(--color-blue-500, #4a9eff);
  }

  .commit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    gap: 0.5rem;
  }

  .commit-hash {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--color-blue-600, #2563eb);
    background: var(--surface-tertiary, #e5e5e5);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
  }

  .commit-date {
    font-size: 0.8rem;
    color: var(--text-secondary, #666);
  }

  .commit-message {
    font-size: 0.9rem;
    color: var(--text-primary, #333);
    margin-bottom: 0.25rem;
    word-break: break-word;
  }

  .commit-author {
    font-size: 0.8rem;
    color: var(--text-secondary, #666);
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

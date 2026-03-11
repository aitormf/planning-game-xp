/**
 * Styles for Guidelines Manager component
 */
import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const GuidelinesManagerStyles = css`
  :host {
    display: block;
    font-family: var(--font-family-base, 'Segoe UI', system-ui, sans-serif);
  }

  .guidelines-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--border-default, #e5e7eb);
  }

  .header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--brand-primary, #6366f1);
    color: var(--text-on-primary, #fff);
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-primary:hover {
    background: var(--brand-primary-hover, #4f46e5);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--bg-secondary, #f8f9fa);
    color: var(--text-primary, #333);
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-secondary:hover {
    background: var(--bg-tertiary, #e9ecef);
  }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background: transparent;
    color: var(--color-error, #dc3545);
    border: 1px solid var(--color-error, #dc3545);
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-danger:hover {
    background: var(--color-error, #dc3545);
    color: var(--text-on-primary, #fff);
  }

  .btn-sm {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }

  /* Guidelines Table */
  .guidelines-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .guidelines-table th,
  .guidelines-table td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--border-default, #e5e7eb);
    text-align: left;
  }

  .guidelines-table th {
    background: var(--bg-secondary, #f8f9fa);
    font-weight: 600;
    color: var(--text-secondary, #666);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .guidelines-table tr {
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .guidelines-table tr:hover {
    background: var(--bg-tertiary, #f1f3f5);
  }

  .guidelines-table tr.active {
    background: var(--brand-primary-light, #eef2ff);
  }

  .badge {
    display: inline-block;
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    background: var(--bg-tertiary, #e9ecef);
    color: var(--text-secondary, #666);
  }

  .badge-version {
    background: var(--brand-primary, #6366f1);
    color: var(--text-on-primary, #fff);
  }

  .badge-category {
    background: var(--bg-tertiary, #e9ecef);
  }

  /* Editor Panel */
  .editor-panel {
    margin-top: 1.5rem;
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 8px;
    overflow: hidden;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary, #f8f9fa);
    border-bottom: 1px solid var(--border-default, #e5e7eb);
  }

  .editor-header h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary, #333);
  }

  .editor-actions {
    display: flex;
    gap: 0.5rem;
  }

  .editor-body {
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary, #666);
    margin-bottom: 0.3rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-row-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .form-row,
    .form-row-3 {
      grid-template-columns: 1fr;
    }
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 6px;
    font-size: 0.9rem;
    background: var(--input-bg, white);
    color: var(--text-primary, #333);
    box-sizing: border-box;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--brand-primary, #6366f1);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  .form-textarea {
    width: 100%;
    min-height: 300px;
    padding: 0.75rem;
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 6px;
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    background: var(--input-bg, white);
    color: var(--text-primary, #333);
    resize: vertical;
    box-sizing: border-box;
  }

  .form-textarea:focus {
    outline: none;
    border-color: var(--brand-primary, #6366f1);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  .editor-meta {
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--border-default, #e5e7eb);
    background: var(--bg-secondary, #f8f9fa);
    font-size: 0.8rem;
    color: var(--text-secondary, #666);
  }

  /* History Panel */
  .history-panel {
    margin-top: 1rem;
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 8px;
    overflow: hidden;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 1rem;
    background: var(--bg-secondary, #f8f9fa);
    border-bottom: 1px solid var(--border-default, #e5e7eb);
    cursor: pointer;
  }

  .history-header h4 {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-primary, #333);
  }

  .history-toggle {
    font-size: 0.8rem;
    color: var(--text-secondary, #666);
  }

  .history-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .history-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border-default, #e5e7eb);
    font-size: 0.85rem;
  }

  .history-entry:last-child {
    border-bottom: none;
  }

  .history-entry:hover {
    background: var(--bg-tertiary, #f1f3f5);
  }

  .history-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .history-action {
    font-weight: 600;
    text-transform: capitalize;
    color: var(--text-primary, #333);
  }

  .history-meta {
    font-size: 0.8rem;
    color: var(--text-secondary, #666);
  }

  .history-version {
    font-size: 0.75rem;
    color: var(--brand-primary, #6366f1);
  }

  /* Create Form */
  .create-form {
    margin-top: 1.5rem;
    border: 2px dashed var(--border-default, #e5e7eb);
    border-radius: 8px;
    padding: 1.5rem;
    background: var(--bg-secondary, #f8f9fa);
  }

  .create-form h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: var(--text-primary, #333);
  }

  .create-form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  /* Loading & Empty States */
  .loading {
    display: flex;
    justify-content: center;
    padding: 2rem;
    color: var(--text-secondary, #666);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary, #666);
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  /* Filter */
  .filter-select {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 4px;
    background: var(--input-bg, white);
    color: var(--text-primary, inherit);
    font-size: 0.85rem;
    cursor: pointer;
  }
`;

/**
 * Styles for EntityDirectoryManager component
 */
import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const EntityDirectoryManagerStyles = css`
  :host {
    display: block;
    font-family: var(--font-family-base, 'Segoe UI', system-ui, sans-serif);
  }

  .entity-manager-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1rem;
  }

  .entity-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .entity-count {
    font-size: 0.85rem;
    color: var(--text-secondary, #666);
  }

  .btn {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.2s, opacity 0.2s;
  }

  .btn:hover {
    opacity: 0.85;
  }

  .btn-primary {
    background: var(--brand-primary, #3b82f6);
    color: white;
  }

  .btn-danger {
    background: var(--color-error, #ef4444);
    color: white;
  }

  .btn-secondary {
    background: var(--bg-tertiary, #e5e7eb);
    color: var(--text-primary, #333);
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  /* Table */
  .entity-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .entity-table th,
  .entity-table td {
    padding: 0.6rem 0.8rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .entity-table th {
    background: var(--bg-secondary, #f9fafb);
    color: var(--text-secondary, #666);
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .entity-table tr:hover {
    background: var(--bg-hover, #f3f4f6);
  }

  .entity-table .col-id {
    width: 90px;
    font-family: monospace;
    font-size: 0.82rem;
    color: var(--text-secondary, #666);
  }

  .entity-table .col-actions {
    width: 100px;
    text-align: right;
  }

  .actions-cell {
    display: flex;
    gap: 0.3rem;
    justify-content: flex-end;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .badge-active {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #16a34a);
  }

  .badge-inactive {
    background: var(--bg-tertiary, #f3f4f6);
    color: var(--text-tertiary, #9ca3af);
  }

  .badge-pending {
    background: var(--color-warning-bg, #fef3c7);
    color: var(--color-warning, #d97706);
  }

  .badge-count {
    background: var(--brand-primary-bg, #dbeafe);
    color: var(--brand-primary, #3b82f6);
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  /* Inline form */
  .entity-form {
    background: var(--bg-secondary, #f9fafb);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .form-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin: 0 0 0.75rem 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-group label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary, #666);
  }

  .form-group input,
  .form-group select {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 0.85rem;
    background: var(--input-bg, white);
    color: var(--text-primary, inherit);
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--brand-primary, #3b82f6);
    box-shadow: 0 0 0 2px var(--brand-primary-bg, #dbeafe);
  }

  .form-checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .form-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  /* Loading & empty states */
  .loading-message,
  .empty-message {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary, #666);
    font-size: 0.9rem;
  }

  .loading-message::after {
    content: '...';
    animation: dots 1.5s steps(4, end) infinite;
  }

  @keyframes dots {
    0%, 20% { content: ''; }
    40% { content: '.'; }
    60% { content: '..'; }
    80%, 100% { content: '...'; }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .entity-table {
      font-size: 0.82rem;
    }

    .entity-table th,
    .entity-table td {
      padding: 0.4rem 0.5rem;
    }
  }
`;

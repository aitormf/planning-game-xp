import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const BugTheme = css`
  :host {
    /* Colores específicos para bugs */
    --brand-secondary: var(--color-blue-500, #6366f1);
    --description-color: var(--color-pink-500, #10b981);
    --acceptanceCriteria-color: var(--color-blue-400, #818cf8);
    --notes-color: var(--color-orange-500, #f59e0b);
  }

  /* Estilos específicos de bug cards */
  .card-container {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-md);
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    border: 1px solid var(--bg-border);
  }

  .card-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: 0;
    margin: 0 var(--spacing-sm);
  }

  .card-group span {
    font-weight: bold;
    color: var(--brand-secondary, var(--primary-color));
  }

  .bugcard-table {
    margin: 0 var(--spacing-sm);
  }

  .bugcard-table span {
    font-weight: bold;
    color: var(--brand-secondary, var(--primary-color));
  }

  .card-header span {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.3rem;
    border-radius: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }

  /* Layout natural para vista compacta - sin posicionamiento absoluto */
  :host(:not([expanded])) .card-header {
    /* Usar layout natural del BaseCard */
    position: static;
  }

  :host(:not([expanded])) .card-group {
    /* Usar layout natural */
    position: static;
    width: auto;
  }

  :host(:not([expanded])) .bugcard-table {
    /* Usar layout natural */
    position: static;
    width: 100%;
  }

  /* Estilos expandidos específicos */
  :host([expanded]) .card-extra {
    display: grid;
    grid-template-columns: 19% 19% 19% 19% 7% auto;
    gap: var(--spacing-sm);
    align-items: end;
    margin-bottom: var(--spacing-md);
  }

  :host([expanded]) .uploader-group {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* Estilos para indicadores de adjuntos y acciones */
  .card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .card-actions button {
    margin: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-sm);
    padding: 2px;
    border-radius: 2px;
    transition: background-color 0.2s;
  }

  .card-actions button:hover {
    background: var(--active-overlay, rgba(0,0,0,0.1));
  }

  .attachment-indicator {
    font-size: var(--font-size-sm);
    opacity: 0.7;
    color: var(--text-secondary);
  }

  /* Priority badge styles */
  .card-footer span {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .card-footer .low {
    background: var(--color-green-100, #dcfce7);
    color: var(--color-green-800, #166534);
  }

  .card-footer .medium {
    background: var(--color-orange-100, #fef3c7);
    color: var(--color-orange-800, #92400e);
  }

  .card-footer .high {
    background: var(--color-red-100, #ffe4e6);
    color: var(--color-red-800, #9f1239);
  }

  .card-footer .critical {
    background: var(--color-red-500, #f43f5e);
    color: var(--text-inverse, white);
  }

  /* Status badge styles */
  .card-footer .created {
    background: var(--color-gray-200, #e2e8f0);
    color: var(--color-gray-600, #475569);
  }

  .card-footer .open {
    background: var(--color-blue-100, #e0e7ff);
    color: var(--color-blue-800, #3730a3);
  }

  .card-footer .inprogress {
    background: var(--status-in-progress, #3b82f6);
    color: var(--status-in-progress-text, #ffffff);
  }

  .card-footer .fixed {
    background: var(--status-done, #10b981);
    color: var(--status-done-text, #ffffff);
  }

  .card-footer .verified {
    background: var(--color-green-200, #bbf7d0);
    color: var(--color-green-800, #166534);
  }

  .card-footer .closed {
    background: var(--color-gray-500, #64748b);
    color: var(--text-inverse, white);
  }
`;
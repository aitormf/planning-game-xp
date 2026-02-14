import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const BugTheme = css`
  :host {
    /* Colores específicos para bugs */
    --geniova-color: #4a9eff;
    --description-color: #4caf50;
    --acceptanceCriteria-color: #2196f3;
    --notes-color: #ff9800;
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
    color: var(--geniova-color, var(--primary-color));
  }

  .bugcard-table {
    margin: 0 var(--spacing-sm);
  }

  .bugcard-table span {
    font-weight: bold;
    color: var(--geniova-color, var(--primary-color));
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
    background: rgba(0,0,0,0.1);
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
    background: #d4edda;
    color: #155724;
  }

  .card-footer .medium {
    background: #fff3cd;
    color: #856404;
  }

  .card-footer .high {
    background: #f8d7da;
    color: #721c24;
  }

  .card-footer .critical {
    background: #dc3545;
    color: white;
  }

  /* Status badge styles */
  .card-footer .created {
    background: #e9ecef;
    color: #495057;
  }

  .card-footer .open {
    background: #cce5ff;
    color: #004085;
  }

  .card-footer .inprogress {
    background: #cce500;
    color: #004085;
  }

  .card-footer .fixed {
    background: #d4edda;
    color: #155724;
  }

  .card-footer .verified {
    background: #c3e6cb;
    color: #155724;
  }

  .card-footer .closed {
    background: #6c757d;
    color: white;
  }
`;
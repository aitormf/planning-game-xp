import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const StoryTheme = css`
  :host {
    /* Colores específicos para stories */
    --description-color: var(--color-green-500, #4caf50);
    --acceptanceCriteria-color: var(--color-info, #2196f3);
    --notes-color: var(--color-orange-500, #ff9800);
    
    display: block;
    margin: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-heavy);
    cursor: pointer;
    transition: transform var(--transition-fast);
  }

  :host(:hover) {
    transform: translateY(-2px);
    box-shadow: var(--card-shadow-hover, 0 4px 8px rgba(236,62,149,0.3));
  }

  .card-header {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: space-between;
    align-items: flex-start;
    flex-grow: 1;
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-md);
  }
`;
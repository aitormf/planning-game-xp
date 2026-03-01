import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const BaseTabStyles = css`
  /* Tabs base */
  .tabs {
    display: flex;
    gap: var(--spacing-sm);
    margin: var(--spacing-sm) 0;
  }

  .tab-button {
    background: var(--bg-gray);
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    padding: var(--spacing-sm) 1.2rem;
    cursor: pointer;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .tab-button.active {
    background: var(--primary-color);
    color: var(--text-white);
    border-bottom: 2px solid var(--secondary-color);
  }

  .tab-button:hover {
    background: var(--color-gray-700);
  }

  .tab-content {
    background: var(--bg-white);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    padding: var(--spacing-md);
    min-height: 80px;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
    border: 2px solid var(--description-color);
  }

  .tab-content textarea {
    width: 100%;
    height: 180px;
    font-size: var(--font-size-xl);
    border: 0;
  }

  .tab-content textarea:focus {
    outline: none;
  }

  /* Estilos de tabs específicos por tipo */
  .description, .retrospective {
    background-color: var(--description-color);
  }

  .ta-description, .ta-retrospective {
    border: 2px solid var(--description-color);
  }

  .acceptancecriteria {
    background-color: var(--acceptanceCriteria-color);
  }

  .ta-acceptanceCriteria {
    border: 2px solid var(--acceptanceCriteria-color);
  }

  .notes {
    background-color: var(--notes-color);
  }

  .ta-notes {
    border: 2px solid var(--notes-color);
    background: var(--bg-primary);
  }

  .ta-attachment {
    border: 2px solid var(--color-pink-700);
  }

  .ta-relatedTasks {
    border: 2px solid var(--color-gray-600);
  }

  .ta-history {
    border: 2px solid var(--color-orange-800);
  }

  /* Tab panels - hidden by default */
  .tab-panel {
    display: none;
  }

  /* Show panels based on active tab class */
  .tab-content.ta-description .description-panel,
  .tab-content.ta-acceptanceCriteria .acceptance-criteria-panel,
  .tab-content.ta-notes .notes-panel,
  .tab-content.ta-attachment .attachment-panel,
  .tab-content.ta-relatedTasks .related-tasks-panel,
  .tab-content.ta-history .history-panel {
    display: block;
  }

  /* Estilos expandidos para tabs */
  :host([expanded]) .tabs {
    display: flex;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-md);
    border-bottom: 1px solid var(--bg-dark);
    background: var(--bg-dark);
    margin-bottom: 0;
    position: relative;
    top: 3px;
  }

  :host([expanded]) .tab-button {
    padding: 0.75rem var(--spacing-lg);
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: var(--font-size-base);
    font-weight: 500;
    margin-bottom: -1px;
    transition: all var(--transition-fast) ease;
  }

  :host([expanded]) .tab-button:hover {
    background: var(--hover-overlay);
  }

  :host([expanded]) .tab-button.active {
    background: var(--bg-white);
    border-width: 3px;
    border-bottom: none;
    color: var(--text-primary);
    font-weight: 700;
  }

  /* Tab activo con borde de su color */
  :host([expanded]) .tab-button.active.description,
  :host([expanded]) .tab-button.active.retrospective {
    border-color: var(--description-color);
  }

  :host([expanded]) .tab-button.active.acceptance-criteria {
    border-color: var(--acceptanceCriteria-color);
  }

  :host([expanded]) .tab-button.active.notes {
    border-color: var(--notes-color);
  }

  :host([expanded]) .tab-button.active.attachment {
    border-color: var(--color-pink-700);
  }

  :host([expanded]) .tab-button.active.related-tasks {
    border-color: var(--color-gray-600);
  }

  :host([expanded]) .tab-button.active.history {
    border-color: var(--color-orange-800);
  }

  :host([expanded]) .tab-content {
    padding: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md);
    background: var(--bg-dark);
    border-radius: var(--radius-lg);
    margin: 0 1rem;
    height: 200px;
    overflow: scroll;
  }

  :host([expanded]) .tab-content textarea {
    width: 100%;
    min-height: 180px;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 0;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    resize: vertical;
    height: 180px;
  }
`;
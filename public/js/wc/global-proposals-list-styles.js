import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const GlobalProposalsListStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  :host {
    display: block;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--border-default);
  }

  .header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-primary);
  }

  .mode-indicator {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .mode-indicator.edit {
    background: var(--status-success-bg);
    color: var(--status-success-text);
  }

  .mode-indicator.view {
    background: var(--bg-secondary);
    color: var(--text-muted);
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3rem;
    color: var(--text-muted);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-muted);
  }

  .proposals-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--bg-primary);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--card-shadow, 0 2px 4px rgba(0,0,0,0.1));
  }

  .table-header {
    display: grid;
    grid-template-columns: 50px 1fr 150px 150px 80px 120px 150px 40px;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 2px solid var(--border-default);
  }

  .table-header.no-handle {
    grid-template-columns: 50px 1fr 150px 150px 80px 120px 150px;
  }

  .table-body {
    max-height: 70vh;
    overflow-y: auto;
  }

  .proposal-row {
    display: grid;
    grid-template-columns: 50px 1fr 150px 150px 80px 120px 150px 40px;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-subtle);
    align-items: center;
    transition: background-color 0.15s ease;
  }

  .proposal-row.no-handle {
    grid-template-columns: 50px 1fr 150px 150px 80px 120px 150px;
  }

  .proposal-row:hover {
    background: var(--bg-secondary);
  }

  .proposal-row.dragging {
    opacity: 0.5;
    background: var(--color-blue-50, #e3f2fd);
  }

  .proposal-row.drag-over {
    border-top: 3px solid #2196f3;
    background: rgba(33, 150, 243, 0.05);
  }

  .col-order {
    font-weight: 600;
    color: var(--text-muted);
    text-align: center;
  }

  .col-title {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-title.clickable {
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .col-title.clickable:hover {
    color: var(--brand-primary);
    text-decoration: underline;
  }

  .col-project {
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .col-epic {
    color: var(--text-muted);
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-points {
    text-align: center;
    font-weight: 600;
    color: var(--brand-primary);
  }

  .col-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    text-align: center;
    white-space: nowrap;
  }

  .col-status.propuesta { background: var(--status-warning-bg); color: var(--status-warning-text); }
  .col-status.en-revision { background: var(--status-info-bg); color: var(--status-info-text); }
  .col-status.aprobada { background: var(--status-success-bg); color: var(--status-success-text); }
  .col-status.rechazada { background: var(--status-error-bg); color: var(--status-error-text); }
  .col-status.en-desarrollo { background: rgba(156, 39, 176, 0.15); color: #ce93d8; }
  .col-status.implementada { background: var(--status-success-bg); color: var(--status-success-text); }
  .col-status.descartada { background: var(--bg-muted); color: var(--text-muted); }

  .col-creator {
    color: var(--text-muted);
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-handle {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .drag-handle {
    cursor: grab;
    color: var(--text-disabled);
    font-size: 1.25rem;
    padding: 0.25rem;
    user-select: none;
  }

  .drag-handle:hover {
    color: var(--text-muted);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .last-updated {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: right;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab {
    padding: 0.75rem 1.5rem;
    border: none;
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px 4px 0 0;
    transition: all 0.2s ease;
  }

  .tab:hover {
    background: var(--bg-tertiary);
  }

  .tab.active {
    background: var(--brand-primary);
    color: var(--text-inverse);
  }

  /* Project view */
  .projects-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .project-section {
    background: var(--bg-primary);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--card-shadow, 0 2px 4px rgba(0,0,0,0.1));
  }

  .project-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-secondary);
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--border-default);
    transition: background 0.2s ease;
  }

  .project-header:hover {
    background: var(--bg-tertiary);
  }

  .collapse-icon {
    font-size: 0.75rem;
    color: var(--text-muted);
    width: 1rem;
    text-align: center;
  }

  .project-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 1rem;
  }

  .project-count {
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .project-table {
    padding: 0;
  }

  /* Team view (similar to project view) */
  .teams-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .team-section {
    background: var(--bg-primary);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--card-shadow, 0 2px 4px rgba(0,0,0,0.1));
  }

  .team-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--status-success-bg);
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--status-success-border);
    transition: background 0.2s ease;
  }

  .team-header:hover {
    background: var(--active-overlay);
  }

  .team-name {
    font-weight: 600;
    color: var(--status-success-text);
    font-size: 1rem;
  }

  .team-count {
    color: var(--status-success-text);
    font-size: 0.875rem;
  }

  .team-table {
    padding: 0;
  }

  /* No-project grid (for by-project view) */
  .table-header.no-project,
  .proposal-row.no-project {
    grid-template-columns: 50px 1fr 150px 80px 120px 150px;
  }

  @media (max-width: 1200px) {
    .table-header,
    .proposal-row {
      grid-template-columns: 40px 1fr 120px 100px 60px 100px 120px 40px;
      font-size: 0.875rem;
    }

    .table-header.no-handle,
    .proposal-row.no-handle {
      grid-template-columns: 40px 1fr 120px 100px 60px 100px 120px;
    }

    .table-header.no-project,
    .proposal-row.no-project {
      grid-template-columns: 40px 1fr 100px 60px 100px 120px;
    }
  }

  @media (max-width: 900px) {
    .table-header,
    .proposal-row {
      grid-template-columns: 40px 1fr 100px 80px 40px;
      font-size: 0.8rem;
    }

    .table-header.no-handle,
    .proposal-row.no-handle {
      grid-template-columns: 40px 1fr 100px 80px;
    }

    .table-header.no-project,
    .proposal-row.no-project {
      grid-template-columns: 40px 1fr 60px 80px;
    }

    .col-epic,
    .col-creator {
      display: none;
    }
  }
`;

export default GlobalProposalsListStyles;

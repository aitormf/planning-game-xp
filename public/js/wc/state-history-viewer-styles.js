import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const StateHistoryViewerStyles = css`
  :host {
    display: block;
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Modal Overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Modal Container */
  .modal-container {
    background: var(--bg-primary);
    border-radius: 12px;
    box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.3));
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Modal Header */
  .modal-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-default);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .header-icon {
    font-size: 1.4rem;
  }

  .card-id {
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 10px;
    border-radius: 4px;
    margin-right: 12px;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Card Title Bar */
  .card-title-bar {
    padding: 10px 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-default);
    font-size: 0.9rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Tabs */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-secondary);
  }

  .tab {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text-muted);
    transition: all 0.2s;
    position: relative;
  }

  .tab:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .tab.active {
    color: var(--brand-primary, #667eea);
    font-weight: 600;
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* Modal Content */
  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    min-height: 300px;
  }

  /* Loading State */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-muted);
    gap: 12px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-default);
    border-top-color: var(--brand-primary, #667eea);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
  }

  .empty-state.success {
    color: var(--color-success, #28a745);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    display: block;
  }

  .empty-state p {
    margin: 0;
    margin-bottom: 8px;
  }

  .hint, .empty-hint {
    font-size: 0.85rem;
    color: var(--text-disabled);
  }

  /* Timeline Tab */
  .timeline-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .first-in-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--status-info-bg);
    border-radius: 8px;
    border-left: 4px solid var(--color-info);
  }

  .first-in-progress .label {
    color: var(--text-primary);
    font-weight: 500;
  }

  .first-in-progress .value {
    font-weight: 600;
    color: var(--color-info, #007bff);
  }

  .badge {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge.immutable {
    background: var(--status-warning-bg);
    color: var(--status-warning-text);
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    padding-left: 24px;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--border-default);
  }

  .timeline-item {
    position: relative;
    padding: 12px 0;
    padding-left: 24px;
  }

  .timeline-marker {
    position: absolute;
    left: -20px;
    top: 16px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .timeline-content {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 12px 16px;
  }

  .transition-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .status-badge {
    color: white;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .arrow {
    color: var(--text-muted);
    font-size: 1.2rem;
  }

  .transition-meta {
    display: flex;
    gap: 16px;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .timestamp {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .timestamp::before {
    content: '📅';
    font-size: 0.9rem;
  }

  .user {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .user::before {
    content: '👤';
    font-size: 0.9rem;
  }

  .duration {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--border-subtle);
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  .duration-label {
    color: var(--text-muted);
  }

  .duration-value {
    font-weight: 600;
    color: var(--color-info, #007bff);
  }

  /* Metrics Tab */
  .metrics-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .metric-card {
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .metric-card.highlight {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .metric-card.highlight .metric-hint {
    color: rgba(255, 255, 255, 0.8);
  }

  .metric-icon {
    font-size: 1.8rem;
  }

  .metric-content {
    flex: 1;
  }

  .metric-value {
    font-size: 1.4rem;
    font-weight: 700;
  }

  .metric-label {
    font-size: 0.85rem;
    color: var(--text-primary);
    margin-top: 4px;
  }

  .metric-card.highlight .metric-label {
    color: rgba(255, 255, 255, 0.9);
  }

  .metric-hint {
    font-size: 0.75rem;
    color: var(--text-disabled);
    margin-top: 4px;
  }

  .metrics-container h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-default);
  }

  .status-times {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .status-time-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-time-row .status-badge {
    min-width: 100px;
    text-align: center;
  }

  .time-bar-container {
    flex: 1;
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
  }

  .time-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .time-value {
    min-width: 80px;
    text-align: right;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  /* Cycles Tab */
  .cycles-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .cycles-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    border-radius: 12px;
    color: white;
  }

  .cycles-count {
    font-size: 3rem;
    font-weight: 700;
  }

  .cycles-label {
    font-size: 1.1rem;
    font-weight: 500;
  }

  .cycles-container h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-default);
  }

  .rejections-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rejection-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: var(--status-error-bg);
    border-radius: 8px;
    border-left: 4px solid var(--color-error, #dc3545);
  }

  .rejection-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-error, #dc3545);
    min-width: 40px;
  }

  .rejection-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rejection-date,
  .rejection-by,
  .rejection-duration {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .rejection-content .icon {
    font-size: 1rem;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .modal-container {
      width: 95%;
      max-height: 95vh;
      margin: 10px;
    }

    .modal-header {
      padding: 12px 16px;
    }

    .modal-header h2 {
      font-size: 1rem;
    }

    .tabs {
      flex-wrap: wrap;
    }

    .tab {
      padding: 10px 12px;
      font-size: 0.85rem;
    }

    .modal-content {
      padding: 16px;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .first-in-progress {
      flex-wrap: wrap;
    }

    .transition-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .arrow {
      transform: rotate(90deg);
    }
  }
`;

import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const sprintPointsChartStyles = css`
  :host {
    display: block;
    padding: 1rem;
    background: var(--card-bg, white);
    border-radius: 8px;
    box-shadow: var(--card-shadow, 0 2px 4px rgba(0,0,0,0.1));
  }

  .chart-container {
    position: relative;
    margin-bottom: 1rem;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .chart-title {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--text-primary, #333);
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .toggle-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--input-border, #dee2e6);
    background: var(--bg-primary, #fff);
    color: var(--text-muted, #666);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: var(--bg-secondary, #f8f9fa);
  }

  .toggle-btn.active {
    background: #2196F3;
    color: var(--text-on-primary, #fff);
    border-color: #2196F3;
  }

  .chart-content {
    display: flex;
    gap: 2rem;
  }

  .stats-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 8px;
    min-width: 200px;
    width: 400px;
  }

  .stats-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width:300px;
  }

  .stats-section h4 {
    margin: 0;
    color: var(--text-primary, #333);
    font-size: 1rem;
    border-bottom: 1px solid var(--border-color, #dee2e6);
    padding-bottom: 0.5rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    cursor: help;
  }

  .stat-label {
    color: var(--text-muted, #666);
  }

  .stat-value {
    font-weight: 500;
    color: var(--text-primary, #333);
  }

  .stat-group {
    padding: 0.5rem;
    border-radius: 4px;
    position: relative;
  }

  .stat-group:hover .tooltip {
    display: block;
  }

  .tooltip {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    width: max-content;
    max-width: 300px;
    z-index: 1000;
    margin-bottom: 0.5rem;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
  }

  .stat-title {
    font-weight: bold;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    color: var(--text-muted, #666);
  }

  .business {
    background: rgba(54, 162, 235, 0.1);
  }

  .development {
    background: rgba(255, 99, 132, 0.1);
  }

  .business .stat-value {
    color: #36a2eb;
  }

  .development .stat-value {
    color: #ff6384;
  }
`;
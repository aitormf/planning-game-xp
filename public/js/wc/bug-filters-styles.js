import { css } from 'https://unpkg.com/lit@2.8.0/index.js?module';

export const bugFiltersStyles = css`
  :host {
    display: block;
    font-family: inherit;
    width: 100%;
    position: relative;
    z-index: 100;
  }

  .filters-wrapper {
    width: 100%;
    position: relative;
    z-index: 100;
  }

  details {
    border: 1px solid var(--input-border, #dee2e6);
    border-radius: 6px;
    background: var(--bg-secondary, #f8f9fa);
    overflow: visible;
    margin-bottom: 0.5rem;
    position: relative;
    z-index: 100;
  }

  summary {
    cursor: pointer;
    padding: 0.65rem 0.85rem;
    font-weight: 600;
    color: var(--text-primary, #344050);
    list-style: none;
    outline: none;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    border-bottom: 1px solid var(--border-color, #e9ecef);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .chevron {
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid var(--text-primary, #344050);
    transition: transform 0.2s ease;
  }

  details[open] summary .chevron {
    transform: rotate(90deg);
  }

  .summary-title {
    font-size: 0.95rem;
  }

  .filters-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.75rem 0.85rem;
    background: var(--bg-secondary, #f8f9fa);
    margin-bottom: 0.75rem;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 200px;
    flex: 1;
  }

  .filter-label {
    font-size: 0.9em;
    font-weight: 500;
    color: var(--text-primary, #495057);
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-icon {
    cursor: help;
    color: var(--text-muted, #6c757d);
    font-size: 0.8em;
    transition: color 0.2s;
  }

  .info-icon:hover {
    color: var(--color-blue-500, #007bff);
  }

  .tooltip {
    position: relative;
    display: inline-block;
  }

  .tooltip .tooltiptext {
    visibility: hidden;
    width: 300px;
    background-color: var(--tooltip-bg, #333);
    color: var(--tooltip-text, #fff);
    text-align: left;
    border-radius: 6px;
    padding: 10px;
    position: absolute;
    z-index: 1001;
    bottom: 125%;
    left: 50%;
    margin-left: -150px;
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 0.85em;
    line-height: 1.4;
    box-shadow: var(--shadow-lg, 0 4px 8px rgba(0,0,0,0.3));
  }

  .tooltip .tooltiptext::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--tooltip-bg, #333) transparent transparent transparent;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
    opacity: 1;
  }

  multi-select {
    width: 100%;
    min-width: 200px;
  }

  .controls-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    margin-left: auto;
    min-width: 120px;
  }

  .results-counter {
    font-size: 0.9em;
    color: var(--text-primary, #495057);
    font-weight: 500;
    padding: 6px 10px;
    background: var(--bg-primary, white);
    border-radius: 4px;
    border: 1px solid var(--input-border, #dee2e6);
    text-align: center;
    min-width: 100px;
  }

  .clear-button {
    padding: 6px 10px;
    background: var(--color-error, #f43f5e);
    color: var(--text-inverse, white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 500;
    transition: background-color 0.2s;
    min-width: 100px;
  }

  .clear-button:hover {
    background: var(--color-error-hover, #e11d48);
  }

  .clear-button:disabled {
    background: var(--text-muted, #999);
    cursor: not-allowed;
  }

  .migrate-button {
    padding: 6px 10px;
    background: var(--color-info, #3b82f6);
    color: var(--text-inverse, white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 500;
    transition: background-color 0.2s;
    min-width: 100px;
    white-space: nowrap;
  }

  .migrate-button:hover {
    background: var(--color-info-hover, #2563eb);
  }

  .migrate-button:disabled {
    background: var(--text-muted, #999);
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .filters-container {
      flex-direction: column;
    }

    .controls-section {
      margin-left: 0;
      flex-direction: row;
      width: 100%;
      justify-content: space-between;
    }

    .filter-group {
      width: 100%;
    }

    .tooltip .tooltiptext {
      width: 250px;
      margin-left: -125px;
    }
  }
`;

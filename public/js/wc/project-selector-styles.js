import { css } from 'https://unpkg.com/lit@2.8.0/index.js?module';

export const projectSelectorStyles = css`
  :host {
    display: block;
    position: relative;
    margin-bottom: 2rem;
  }

  .selector-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 1rem;
    border-radius: 8px;
    transition: all 0.2s ease;
    background: var(--bg-secondary, #f8f9fa);
    border: 2px solid var(--border-color, #e9ecef);
    box-shadow: var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.05));
    flex-grow: 1;
    min-width: 280px;
  }

  .selector:hover {
    background: var(--bg-primary, #fff);
    border-color: var(--color-blue-500, #4a9eff);
    box-shadow: 0 4px 8px rgba(74, 158, 255, 0.1);
  }

  .selected-value {
    font-size: 1.8em;
    font-weight: bold;
    margin: 0;
    color: var(--text-primary, #2c3e50);
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  }

  .arrow {
    font-size: 1em;
    color: #4a9eff;
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }

  .arrow.open {
    transform: rotate(180deg);
  }

  .options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-primary, white);
    border: 2px solid var(--border-color, #e9ecef);
    border-radius: 8px;
    box-shadow: var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.1));
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    margin-top: 0.5rem;
  }

  .option {
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1.1em;
    border-bottom: 1px solid var(--border-color, #f1f3f5);
    color: var(--text-primary, inherit);
  }

  .option:last-child {
    border-bottom: none;
  }

  .option:hover {
    background-color: var(--bg-secondary, #f8f9fa);
    color: var(--color-blue-500, #4a9eff);
  }

  .option.selected {
    background-color: var(--color-blue-50, #e7f5ff);
    color: var(--color-blue-500, #4a9eff);
    font-weight: bold;
  }
`;
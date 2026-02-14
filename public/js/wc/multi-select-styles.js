import { css } from 'https://unpkg.com/lit@2.8.0/index.js?module';

export const multiSelectStyles = css`
  :host {
    display: block;
    font-family: inherit;
  }

  .multi-select {
    position: relative;
    width: 100%;
    min-width: 200px;
  }

  .select-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--input-bg, white);
    border: 1px solid var(--input-border, #dee2e6);
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
  }

  .selected-values {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-primary, #495057);
  }

  .select-arrow {
    margin-left: 8px;
    font-size: 0.8em;
    color: var(--text-muted, #6c757d);
    transition: transform 0.2s;
  }

  .multi-select.open .select-arrow {
    transform: rotate(180deg);
  }

  .options-container {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-primary, white);
    border: 1px solid var(--input-border, #dee2e6);
    border-radius: 4px;
    margin-top: 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
    box-shadow: var(--shadow-md, 0 2px 4px rgba(0,0,0,0.1));
  }

  .multi-select.open .options-container {
    display: block;
  }

  .option {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .option:hover {
    background-color: var(--bg-secondary, #f8f9fa);
  }

  .option.selected {
    background-color: var(--bg-tertiary, #e9ecef);
  }

  .option input[type="checkbox"] {
    margin-right: 8px;
  }

  .option span {
    flex: 1;
  }
`;
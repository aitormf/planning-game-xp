import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { ThemeVariables, BaseCardStyles, BaseTabStyles } from '../ui/styles/index.js';

const QACardSpecificStyles = css`
  :host {
    background: var(--card-bg);
    box-shadow: var(--card-shadow);
    border-radius: 8px;
    display: block;
    margin: 0.5rem;
  }
  :host(:not([expanded])) {
    max-width: 300px;
    width: 300px;
    min-height: 10rem;
  }
  :host([expanded]) {
    width: 100%;
    max-width: 100%;
  }
  .expanded-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .field-group-row {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  label {
    font-weight: bold;
    margin-bottom: 0.2rem;
  }
  input, textarea, select {
    width: 100%;
    padding: 0.4rem;
    border: 1px solid var(--input-border);
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
    background: var(--input-bg);
    color: var(--text-primary);
  }
  textarea {
    min-height: 60px;
    resize: vertical;
  }
  .card-footer {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
  }
  .card-header {
    padding: 1rem;
  }
  .save-button {
    background: var(--brand-primary, #6366f1);
    color: var(--text-inverse, white);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1em;
    transition: background 0.2s;
  }
  .save-button:disabled {
    background: var(--text-disabled);
    cursor: not-allowed;
  }
  .attachments {
    margin-top: 0.5rem;
  }
  .attachment-list {
    margin: 0.5rem 0 0 0;
    padding: 0;
    list-style: none;
  }
  .attachment-list li {
    font-size: 0.95em;
    margin-bottom: 0.2rem;
  }
  .delete-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    color: var(--color-error, #f43f5e);
    margin-left: 0.5rem;
    padding: 0;
  }
  .delete-button:hover {
    color: var(--color-error-hover, #e11d48);
  }
  .copy-link-button {
    background: transparent;
    border: none;
    box-shadow: none;
    color: inherit;
    font-size: 1.3em;
    cursor: pointer;
    padding: 0;
    margin: 0;
    margin-right: 0.5rem;
    transition: background 0.2s;
  }
  .copy-link-button:focus {
    outline: 2px solid var(--brand-primary, #6366f1);
  }
  .copy-link-button:hover {
    background: rgba(0,0,0,0.05);
  }
  .attachment-indicator {
    font-size: 1.2em;
    margin-right: 0.3em;
    color: var(--brand-primary, #6366f1);
    cursor: help;
  }
`;

export const QACardStyles = [
  ThemeVariables,
  BaseCardStyles,
  BaseTabStyles,
  QACardSpecificStyles
];
import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const ProjectFormStyles = css`
  :host {
    display: block;
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  /* Tabbed form styles */
  .tabbed-form {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  color-tabs {
    --tab-min-width: 80px;
    width: 100%;
  }

  .tab-content {
    padding: 1rem;
    height: 45dvh;
    width: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .stacked {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: var(--secundary-color, #333);
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--brand-secondary, #007bff);
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--brand-secondary, #007bff);
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }

  .stakeholder-input {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .stakeholder-input input {
    flex: 1;
  }

  .stakeholder-input button {
    padding: 0.75rem 1rem;
    background-color: var(--brand-secondary, #007bff);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .stakeholder-input button:hover {
    background-color: #0056b3;
  }

  .stakeholder-input button:disabled {
    background-color: var(--text-disabled);
    cursor: not-allowed;
  }

  .developer-input {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .developer-input input {
    flex: 1;
  }

  .developer-input button {
    padding: 0.75rem 1rem;
    background-color: var(--brand-secondary, #007bff);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .developer-input button:hover {
    background-color: #0056b3;
  }

  .developer-input button:disabled {
    background-color: var(--text-disabled);
    cursor: not-allowed;
  }

  .developers-list {
    margin-top: 1rem;
  }

  .developer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: var(--bg-secondary);
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }

  .developer-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .developer-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--secundary-color, #333);
  }

  .developer-email {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .remove-developer {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .remove-developer:hover {
    background: #c82333;
  }

  .empty-developers {
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
    padding: 1rem;
    background-color: var(--bg-secondary);
    border-radius: 6px;
  }

  .stakeholders-list {
    margin-top: 1rem;
  }

  .stakeholder-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: var(--bg-secondary);
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }

  .stakeholder-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stakeholder-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--secundary-color, #333);
  }

  .stakeholder-email {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .remove-stakeholder {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .remove-stakeholder:hover {
    background: #c82333;
  }

  .empty-stakeholders {
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
    padding: 1rem;
    background-color: var(--bg-secondary);
    border-radius: 6px;
  }

  .required {
    color: #dc3545;
  }

  .helper-text {
    margin-top: 0.35rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .helper-text.warning {
    color: #a94442;
  }

  .error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  input.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }

  .edit-mode-notice {
    background-color: #e7f3ff;
    border: 1px solid #007bff;
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .edit-mode-notice p {
    margin: 0;
    color: #004085;
    font-size: 0.9rem;
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .checkbox-group label {
    margin: 0;
    font-weight: normal;
    color: var(--secundary-color, #333);
    cursor: pointer;
  }

  /* Global config selectors */
  .config-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    padding: 0.75rem;
    background: var(--bg-color, #f9f9f9);
  }

  .config-option {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .config-option:hover {
    background-color: var(--hover-bg, #e9ecef);
  }

  .config-option input[type="checkbox"] {
    width: auto;
    margin-top: 0.2rem;
  }

  .config-name {
    font-weight: 500;
    color: var(--primary-color, #333);
  }

  .config-desc {
    display: block;
    font-size: 0.85rem;
    color: var(--muted-color, #666);
    margin-top: 0.25rem;
  }

  .no-options {
    color: var(--muted-color, #999);
    font-style: italic;
    padding: 0.5rem 0;
  }

  .danger-zone {
    margin-top: 0;
    border: 2px solid var(--color-error);
    border-radius: 8px;
    padding: 1rem;
    background-color: var(--bg-secondary);
  }

  .danger-zone h3 {
    color: var(--color-error);
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }

  .danger-zone .warning-text {
    color: #721c24;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .delete-button {
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .delete-button:hover {
    background-color: #c82333;
  }

  .delete-confirmation {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f5c6cb;
    border: 1px solid #f1b0b7;
    border-radius: 6px;
  }

  .delete-confirmation input {
    margin-top: 0.5rem;
  }

  .final-delete-button {
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    font-weight: bold;
    margin-top: 1rem;
  }

  .final-delete-button:disabled {
    background-color: var(--text-muted);
    cursor: not-allowed;
  }

  .final-delete-button:not(:disabled):hover {
    background-color: #a02834;
  }

  /* Entity selection section styles */
  .entity-add-section {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .entity-add-section select {
    flex: 1;
    min-width: 200px;
  }

  .add-btn {
    padding: 0.75rem 1rem;
    background-color: var(--brand-secondary, #007bff);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .add-btn:hover {
    background-color: #0056b3;
  }

  .add-btn:disabled {
    background-color: var(--text-disabled);
    cursor: not-allowed;
  }

  .create-new-btn {
    padding: 0.75rem 1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .create-new-btn:hover {
    background-color: #218838;
  }

  .create-entity-form {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background-color: #e8f5e9;
    border: 1px solid #c8e6c9;
    border-radius: 8px;
  }

  .form-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .form-row input {
    flex: 1;
    min-width: 150px;
  }

  .create-btn {
    padding: 0.75rem 1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .create-btn:hover {
    background-color: #218838;
  }

  .create-btn:disabled {
    background-color: var(--text-disabled);
    cursor: not-allowed;
  }

  .developer-id,
  .stakeholder-id {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: monospace;
    background-color: var(--bg-tertiary);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    font-style: italic;
  }

  /* Repository section styles */
  .repo-single-section {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .repo-single-section input {
    flex: 1;
  }

  .add-repo-btn {
    padding: 0.75rem 1rem;
    background-color: var(--text-muted);
    color: var(--text-inverse);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .add-repo-btn:hover {
    background-color: var(--text-secondary);
  }

  .repositories-list {
    margin-bottom: 0.75rem;
  }

  .repository-item {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .repository-item.default-repo {
    border-color: var(--brand-secondary, #007bff);
    background-color: #e7f3ff;
  }

  .repo-fields {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .repo-url-input {
    flex: 2;
    min-width: 200px;
  }

  .repo-label-input {
    flex: 1;
    min-width: 100px;
    max-width: 150px;
  }

  .default-badge {
    background-color: var(--brand-secondary, #007bff);
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    white-space: nowrap;
  }

  .remove-repo-btn {
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-repo-btn:hover {
    background-color: #c82333;
  }

  .add-another-repo-btn {
    padding: 0.5rem 1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .add-another-repo-btn:hover {
    background-color: #218838;
  }

  /* Archive zone styles */
  .archive-zone {
    margin-top: 0;
    margin-bottom: 1.5rem;
    border: 2px solid var(--text-muted);
    border-radius: 8px;
    padding: 1rem;
    background-color: var(--bg-secondary);
  }

  .archive-zone h3 {
    color: var(--text-secondary);
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }

  .archive-zone .archive-info {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .archive-zone ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .archive-zone li {
    margin-bottom: 0.25rem;
  }

  .archive-button {
    background-color: var(--text-muted);
    color: var(--text-inverse);
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .archive-button:hover {
    background-color: var(--text-secondary);
  }

  .unarchive-button {
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .unarchive-button:hover {
    background-color: #218838;
  }

  /* ========================== */
  /* Apps Permissions Tab Styles */
  /* ========================== */

  .apps-permissions-info {
    background: #f0f4ff;
    border: 1px solid #c5d5ff;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
  }

  .apps-permissions-info p {
    margin: 0;
    color: #4a5568;
    font-size: 0.9rem;
  }

  .permission-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .permission-section > label {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .permission-section > .helper-text {
    margin-top: 0;
    margin-bottom: 0.75rem;
  }

  .permission-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .permission-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-default);
    border-radius: 6px;
  }

  .permission-email {
    font-size: 0.9rem;
    color: var(--text-primary);
    word-break: break-all;
  }

  .remove-permission-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    background: #fee2e2;
    color: #dc3545;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    line-height: 1;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .remove-permission-btn:hover {
    background: #dc3545;
    color: white;
  }

  .empty-permission {
    padding: 0.75rem;
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
    font-size: 0.9rem;
    background: var(--bg-primary);
    border: 1px dashed var(--border-default);
    border-radius: 6px;
  }

  .add-permission-form {
    display: flex;
    gap: 0.5rem;
  }

  .permission-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    font-size: 0.9rem;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  .permission-input:focus {
    outline: none;
    border-color: #6c5ce7;
    box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.15);
  }

  .permission-select {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    font-size: 0.9rem;
    background: var(--input-bg);
    color: var(--text-primary);
    cursor: pointer;
  }

  .permission-select:focus {
    outline: none;
    border-color: #6c5ce7;
    box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.15);
  }

  .warning-text {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #856404;
    background: #fff3cd;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border: 1px solid #ffc107;
  }

  .info-text {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #0c5460;
    background: #d1ecf1;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border: 1px solid #bee5eb;
  }

  .add-permission-btn {
    padding: 0.5rem 1rem;
    background: #6c5ce7;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
    transition: background 0.2s;
  }

  .add-permission-btn:hover:not(:disabled) {
    background: #5b4cdb;
  }

  .add-permission-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .roles-info-box {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #e8f4fd;
    border: 1px solid #bee5eb;
    border-radius: 8px;
  }

  .roles-info-box h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    color: #0c5460;
  }

  .roles-info-box ul {
    margin: 0;
    padding: 0 0 0 1.25rem;
    font-size: 0.85rem;
    color: #0c5460;
    line-height: 1.6;
  }

  .roles-info-box .roles-note {
    margin: 0.75rem 0 0 0;
    font-size: 0.85rem;
    font-weight: 500;
    color: #856404;
  }

  .roles-info-box li {
    margin-bottom: 0.25rem;
  }

  .roles-info-box li:last-child {
    margin-bottom: 0;
  }

  /* Business Context section */
  .business-context-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview-toggle {
    background: none;
    border: 1px solid var(--border-default);
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    font-size: 0.85em;
    color: var(--text-muted);
  }

  .preview-toggle:hover {
    background: var(--bg-tertiary);
  }

  .markdown-preview {
    border: 1px solid var(--input-border);
    border-radius: 4px;
    padding: 12px;
    min-height: 200px;
    background: var(--bg-subtle);
    font-size: 0.9em;
    line-height: 1.6;
    overflow-y: auto;
    max-height: 400px;
    color: var(--text-primary);
  }

  .markdown-preview h1,
  .markdown-preview h2,
  .markdown-preview h3 {
    margin-top: 0.5em;
  }

  .markdown-preview code {
    background: var(--bg-tertiary);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
  }

  .markdown-preview pre {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
  }

  .markdown-preview ul,
  .markdown-preview ol {
    padding-left: 20px;
  }

  /* Responsive for permissions */
  @media (max-width: 480px) {
    .add-permission-form {
      flex-direction: column;
    }

    .add-permission-btn {
      width: 100%;
    }
  }
`;

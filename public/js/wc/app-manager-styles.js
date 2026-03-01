import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const AppManagerStyles = css`
  :host {
    display: block;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin: 1rem 0;
  }

  .app-layout {
    display: flex;
    gap: 2rem;
    min-height: 400px;
  }

  .upload-column {
    flex: 0 0 25%;
    min-width: 280px;
  }

  .files-column {
    flex: 1;
    min-width: 0;
  }

  .app-section {
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1.4rem;
    font-weight: bold;
    color: var(--text-primary, #333);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--brand-secondary, #ec3e95);
  }

  .upload-area {
    background: var(--bg-primary);
    border: 2px dashed var(--brand-secondary, #ec3e95);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    margin-bottom: 2rem;
  }

  /* Hide file display elements from firebase uploader */
  .upload-column firebase-storage-uploader .delete-file-btn,
  .upload-column firebase-storage-uploader .uploaded-file,
  .upload-column firebase-storage-uploader .file-display,
  .upload-column firebase-storage-uploader .file-preview,
  .upload-column firebase-storage-uploader .icon,
  .upload-column firebase-storage-uploader .thumbnail-wrapper {
    display: none !important;
  }

  .upload-description {
    color: var(--text-muted);
    margin-bottom: 1rem;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .upload-description.error {
    color: var(--color-error, #dc3545);
    background: var(--status-error-bg, #f8d7da);
    border: 1px solid var(--status-error-border, #f5c6cb);
    border-radius: 4px;
    padding: 0.75rem;
    font-weight: 500;
  }

  .files-list {
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 1rem;
    box-shadow: var(--shadow-sm);
  }

  .download-stats {
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
  }

  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stats-header h4 {
    margin: 0 0 0.25rem 0;
  }

  .stats-header p {
    margin: 0;
    color: var(--text-secondary);
  }

  .stats-actions .secondary-button {
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-default);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
  }

  .stats-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
    margin-bottom: 1rem;
  }

  .stats-filters label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  .stats-filters select,
  .stats-filters input {
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .view-toggle button {
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    border: 1px solid var(--input-border);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
  }

  .view-toggle button.active {
    background: var(--brand-primary, #6366f1);
    color: var(--text-inverse, white);
    border-color: var(--brand-primary, #6366f1);
  }

  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .stats-table th,
  .stats-table td {
    border-bottom: 1px solid var(--border-subtle);
    padding: 0.4rem 0.5rem;
    text-align: left;
    color: var(--text-primary);
  }

  .stats-chart {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .chart-row {
    display: grid;
    grid-template-columns: 90px 1fr 40px;
    gap: 0.5rem;
    align-items: center;
  }

  .chart-bar {
    position: relative;
    height: 10px;
    background: var(--bg-tertiary);
    border-radius: 999px;
    overflow: hidden;
  }

  .chart-bar span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--brand-primary, #6366f1), var(--brand-primary-hover, #4f46e5));
  }

  .chart-label,
  .chart-value {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .stats-empty {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .files-list h4 {
    margin: 0 0 1rem 0;
    color: var(--text-primary, #333);
    font-size: 1.2rem;
  }

  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    margin-bottom: 0.5rem;
    background: var(--bg-secondary);
    transition: background-color 0.2s ease;
  }

  .file-item:hover {
    background: var(--bg-tertiary);
  }

  .file-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .file-name {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .file-meta {
    font-size: 0.85rem;
    color: var(--text-muted);
    display: flex;
    gap: 1rem;
  }

  .file-actions {
    display: flex;
    gap: 0.5rem;
  }

  .download-btn {
    padding: 0.5rem 1rem;
    background: var(--brand-secondary, #ec3e95);
    color: var(--text-inverse, white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: background-color 0.2s ease;
  }

  .download-btn:hover {
    background: var(--brand-secondary, #10b981);
  }

  .share-btn {
    padding: 0.5rem 1rem;
    background: var(--brand-primary, #6366f1);
    color: var(--text-inverse, white);
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: background-color var(--transition-fast, 0.2s) ease;
  }

  .share-btn:hover {
    background: var(--brand-primary-hover, #4f46e5);
  }

  .delete-btn {
    padding: 0.5rem 1rem;
    background: var(--color-error, #d9534f);
    color: var(--text-inverse, white);
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color var(--transition-fast, 0.2s) ease;
  }

  .delete-btn:hover {
    background: var(--color-error-hover, #c9302c);
  }

  .app-access-info,
  .app-access-locked {
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 2rem;
    background: var(--bg-primary);
    text-align: center;
    color: var(--text-secondary);
  }

  .app-access-info .spinner {
    margin: 0 auto 0.75rem auto;
  }

  .app-access-locked h3 {
    margin-bottom: 0.75rem;
    color: var(--color-error, #f43f5e);
  }

  .app-access-locked p {
    margin-bottom: 0.25rem;
    color: var(--text-secondary);
  }

  .no-files {
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
    padding: 2rem;
    background: var(--bg-secondary);
    border-radius: 6px;
    border: 1px dashed var(--border-default);
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }

  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-default, #f3f3f3);
    border-top: 2px solid var(--brand-secondary, #ec3e95);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .app-layout {
      flex-direction: column;
      gap: 1rem;
    }

    .upload-column,
    .files-column {
      flex: 1;
      min-width: auto;
    }

    .upload-area {
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .file-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .file-actions {
      justify-content: stretch;
    }

    .file-actions button {
      flex: 1;
    }
  }

  .error-message {
    background: var(--status-error-bg, #f8d7da);
    color: var(--color-error, #721c24);
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
    border: 1px solid var(--status-error-border, #f5c6cb);
  }

  .success-message {
    background: var(--status-success-bg, #d4edda);
    color: var(--color-success, #155724);
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
    border: 1px solid var(--status-success-border, #c3e6cb);
  }

  /* Upload metadata form styles */
  .upload-metadata-form {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .upload-metadata-form .form-row {
    margin-bottom: 1rem;
  }

  .upload-metadata-form .form-label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .upload-metadata-form .form-select,
  .upload-metadata-form .form-textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--input-border);
    border-radius: 6px;
    font-size: 0.9rem;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  .upload-metadata-form .form-select:focus,
  .upload-metadata-form .form-textarea:focus {
    outline: none;
    border-color: var(--brand-secondary, #ec3e95);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  .upload-metadata-form .form-textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .upload-notice {
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--status-warning-bg, #fff3cd);
    border: 1px solid var(--color-warning, #ffc107);
    border-radius: 6px;
    color: var(--color-warning, #856404);
    font-size: 0.85rem;
    text-align: left;
  }

  /* App badges */
  .app-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm, 4px);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .badge-release {
    background: var(--color-success, #4caf50);
    color: var(--text-inverse, #fff);
  }

  .badge-beta {
    background: var(--color-warning, #ff9800);
    color: var(--text-primary, #333);
  }

  .badge-admin {
    background: var(--status-expedited, #8b5cf6);
    color: var(--text-inverse, #fff);
  }

  .badge-pending {
    background: var(--badge-neutral, #6c757d);
    color: var(--text-inverse, #fff);
  }

  .badge-deprecated {
    background: var(--badge-danger, #d9534f);
    color: var(--text-inverse, #fff);
  }

  .badge-recommended {
    background: linear-gradient(135deg, var(--color-success, #4caf50) 0%, var(--badge-info, #17a2b8) 100%);
    color: var(--text-inverse, #fff);
    font-weight: 700;
  }

  .file-item.recommended {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.2) 100%);
    border: 2px solid var(--color-success, #4caf50);
  }

  .app-badge.small {
    padding: 0.1rem 0.35rem;
    font-size: 0.65rem;
  }

  /* App card with status */
  .file-item.deprecated {
    opacity: 0.6;
    background: rgba(217, 83, 79, 0.15);
    border-color: var(--badge-danger, #d9534f);
  }

  .file-item.pending {
    background: rgba(255, 152, 0, 0.15);
    border-color: var(--color-warning, #ff9800);
  }

  .file-badges {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  /* Changelog display */
  .changelog-preview {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: pre-wrap;
    max-height: 60px;
    overflow: hidden;
    position: relative;
  }

  .changelog-preview.expanded {
    max-height: none;
  }

  .changelog-preview::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(transparent, var(--bg-secondary));
  }

  .changelog-preview.expanded::after {
    display: none;
  }

  /* Admin action buttons */
  .approve-btn {
    padding: 0.5rem 1rem;
    background: var(--color-success, #4caf50);
    color: var(--text-inverse, white);
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color var(--transition-fast, 0.2s) ease;
  }

  .approve-btn:hover {
    background: var(--color-success-hover, #43a047);
  }

  .deprecate-btn {
    padding: 0.5rem 1rem;
    background: var(--color-warning, #ff9800);
    color: var(--text-primary, #333);
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color var(--transition-fast, 0.2s) ease;
  }

  .deprecate-btn:hover {
    background: var(--color-warning-hover, #f57c00);
  }

  .restore-btn {
    padding: 0.5rem 1rem;
    background: var(--color-info, #17a2b8);
    color: var(--text-inverse, white);
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color var(--transition-fast, 0.2s) ease;
  }

  .restore-btn:hover {
    background: var(--color-info-hover, #138496);
  }

  .edit-btn {
    padding: 0.5rem 1rem;
    background: var(--badge-neutral, #6c757d);
    color: var(--text-inverse, white);
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color var(--transition-fast, 0.2s) ease;
  }

  .edit-btn:hover {
    background: var(--badge-neutral-hover, #5a6268);
  }

  /* Upload overlay styles */
  .upload-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--modal-overlay-bg, rgba(0, 0, 0, 0.6));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .upload-overlay-content {
    background: var(--modal-bg);
    padding: 2rem 3rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: var(--modal-shadow);
  }

  .upload-overlay-content p {
    margin: 1rem 0 0 0;
    font-size: 1.1rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .spinner.large {
    width: 48px;
    height: 48px;
    border-width: 4px;
    margin: 0 auto;
  }

  /* Required label and error styles */
  .required-label {
    color: var(--color-error, #dc3545);
    font-weight: 600;
    font-size: 0.85em;
  }

  .input-error {
    border-color: var(--color-error, #dc3545) !important;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2) !important;
  }

  .input-error:focus {
    border-color: var(--color-error, #dc3545) !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25) !important;
  }

  /* Uploader wrapper */
  .uploader-wrapper {
    position: relative;
  }

  .uploader-wrapper.disabled {
    pointer-events: none;
    opacity: 0.6;
  }

  /* Selected file info */
  .selected-file-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-success-light, #e8f5e9);
    border: 1px solid var(--color-success-border, #c8e6c9);
    border-radius: 6px;
    margin-top: 0.75rem;
  }

  .selected-file-info .file-icon {
    font-size: 1.2rem;
  }

  .selected-file-info .file-name {
    font-weight: 500;
    color: var(--color-success-dark, #2e7d32);
    word-break: break-all;
  }

  .selected-file-info .file-size {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .upload-btn {
    display: block;
    width: 100%;
    padding: 0.75rem 1.5rem;
    margin-top: 0.75rem;
    background: linear-gradient(135deg, var(--color-success, #28a745) 0%, var(--color-success, #20c997) 100%);
    color: var(--text-inverse, white);
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .upload-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--color-success-hover, #218838) 0%, var(--color-success-hover, #1aa179) 100%);
    transform: translateY(-1px);
  }

  .upload-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* ===================== */
  /* Read-only mode styles */
  /* ===================== */

  .app-layout.readonly-mode {
    max-width: 900px;
    margin: 0 auto;
  }

  .app-layout.readonly-mode .files-column.full-width {
    flex: 1;
    width: 100%;
  }

  /* App group container */
  .app-group {
    margin-bottom: 1.5rem;
  }

  /* Recommended version - highlighted card */
  .recommended-app {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.15) 100%);
    border: 2px solid var(--color-success, #4caf50);
    border-radius: var(--radius-lg, 12px);
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25);
  }

  .recommended-header {
    background: linear-gradient(135deg, var(--color-success, #4caf50) 0%, var(--badge-info, #17a2b8) 100%);
    padding: 0.5rem 1rem;
  }

  .recommended-label {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-inverse, #fff);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .recommended-content {
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .app-main-info {
    flex: 1;
    min-width: 200px;
  }

  .app-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .app-icon {
    font-size: 1.5rem;
  }

  .app-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .app-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .app-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* Info button */
  .info-btn {
    padding: 0.5rem 1rem;
    background: var(--text-muted);
    color: var(--text-inverse);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .info-btn:hover {
    background: var(--text-secondary);
  }

  .info-btn.small {
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
  }

  /* Download button primary */
  .download-btn.primary {
    padding: 0.5rem 1.25rem;
    background: linear-gradient(135deg, var(--brand-primary, #6366f1) 0%, var(--brand-primary-hover, #4f46e5) 100%);
    font-size: 0.95rem;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .download-btn.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .download-btn.small {
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
  }

  /* Older versions section */
  .older-versions {
    margin-top: 0.75rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    overflow: hidden;
  }

  .older-versions-header {
    padding: 0.6rem 1rem;
    background: var(--bg-tertiary);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .older-versions-header::-webkit-details-marker {
    display: none;
  }

  .older-versions-header::before {
    content: '▶ ';
    font-size: 0.7em;
    margin-right: 0.3rem;
    transition: transform 0.2s;
    display: inline-block;
  }

  details[open] .older-versions-header::before {
    transform: rotate(90deg);
  }

  .older-versions-header:hover {
    background: var(--bg-muted);
  }

  .older-versions-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .older-version-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--border-subtle);
    gap: 1rem;
  }

  .older-version-item:last-child {
    border-bottom: none;
  }

  .older-version-item:hover {
    background: var(--bg-primary);
  }

  .version-info {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }

  .version-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .version-date,
  .version-size {
    color: var(--text-muted);
  }

  .version-actions {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  /* Changelog modal - native dialog styling */
  dialog.changelog-modal {
    border: none;
    border-radius: 12px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.3));
  }

  dialog.changelog-modal::backdrop {
    background: var(--modal-overlay-bg, rgba(0, 0, 0, 0.5));
  }

  .changelog-modal-content {
    display: flex;
    flex-direction: column;
  }

  .changelog-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, var(--brand-primary, #6366f1) 0%, var(--brand-primary-hover, #4f46e5) 100%);
    color: var(--text-inverse, white);
  }

  .changelog-modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .changelog-modal-header .close-btn {
    background: none;
    border: none;
    color: var(--text-inverse, white);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    opacity: 0.8;
  }

  .changelog-modal-header .close-btn:hover {
    opacity: 1;
  }

  .changelog-modal-body {
    padding: 1.25rem;
  }

  .app-details {
    background: var(--bg-secondary);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .app-details p {
    margin: 0.35rem 0;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .changelog-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text-primary);
  }

  .changelog-text {
    background: var(--bg-primary);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;
  }

  .changelog-modal-footer {
    padding: 1rem 1.25rem;
    background: var(--bg-secondary);
    display: flex;
    justify-content: flex-end;
  }

  .changelog-modal-footer .download-btn {
    padding: 0.5rem 1.25rem;
  }

  /* Access info loading state */
  .app-access-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
  }

  .app-access-info .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  /* ===================== */
  /* App Type Blocks       */
  /* ===================== */

  .app-type-block {
    margin-bottom: 1.5rem;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .app-type-block .block-header {
    padding: 0.6rem 1rem;
    font-weight: 700;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .app-type-block .block-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Release block - green theme */
  .release-block {
    border: 2px solid var(--color-success, #4caf50);
    background: var(--bg-primary, #fff);
  }

  .release-block .block-header {
    background: linear-gradient(135deg, var(--color-success, #4caf50) 0%, var(--color-success, #66bb6a) 100%);
    color: var(--text-inverse, #fff);
  }

  /* Beta block - orange theme */
  .beta-block {
    border: 2px solid var(--color-warning, #ff9800);
    background: var(--bg-primary, #fff);
  }

  .beta-block .block-header {
    background: linear-gradient(135deg, var(--color-warning, #ff9800) 0%, var(--color-warning, #ffa726) 100%);
    color: var(--text-primary, #333);
  }

  /* Admin block - purple theme */
  .admin-block {
    border: 2px solid var(--status-expedited, #8b5cf6);
    background: var(--bg-primary, #fff);
  }

  .admin-block .block-header {
    background: linear-gradient(135deg, var(--status-expedited, #8b5cf6) 0%, var(--status-expedited, #a78bfa) 100%);
    color: var(--text-inverse, #fff);
  }

  /* Latest version card inside blocks */
  .latest-version {
    padding: 1rem 1.25rem;
    background: var(--bg-subtle);
  }

  .latest-version.recommended {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.12) 100%);
  }

  .recommended-badge,
  .latest-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .recommended-badge {
    background: linear-gradient(135deg, var(--color-success, #4caf50) 0%, var(--badge-info, #17a2b8) 100%);
    color: var(--text-inverse, #fff);
  }

  .latest-badge {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .version-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .version-main-info {
    flex: 1;
    min-width: 200px;
  }

  .version-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .version-title .app-icon {
    font-size: 1.3rem;
  }

  .version-title .app-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    word-break: break-word;
  }

  .version-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  /* Other versions inside blocks */
  .other-versions {
    border-top: 1px solid var(--border-subtle);
  }

  .other-versions-header {
    padding: 0.6rem 1rem;
    background: var(--bg-tertiary);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .other-versions-header::-webkit-details-marker {
    display: none;
  }

  .other-versions-header::before {
    content: '▶ ';
    font-size: 0.7em;
    margin-right: 0.3rem;
    transition: transform 0.2s;
    display: inline-block;
  }

  details[open] > .other-versions-header::before {
    transform: rotate(90deg);
  }

  .other-versions-header:hover {
    background: var(--bg-muted);
  }

  .other-versions-list {
    max-height: 200px;
    overflow-y: auto;
    background: var(--bg-primary);
  }

  .other-version-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--border-subtle);
    gap: 1rem;
  }

  .other-version-item:last-child {
    border-bottom: none;
  }

  .other-version-item:hover {
    background: var(--bg-secondary);
  }

  .other-version-item .version-info {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    font-size: 0.85rem;
    flex: 1;
    min-width: 0;
  }

  .other-version-item .version-name {
    font-weight: 500;
    color: var(--text-primary);
    word-break: break-word;
  }

  .other-version-item .version-date,
  .other-version-item .version-size {
    color: var(--text-muted);
    white-space: nowrap;
  }

  .other-version-item .version-actions {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  /* Download count badge */
  .download-count {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    background: var(--status-info-bg, #e3f2fd);
    color: var(--color-info, #1565c0);
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .download-count.clickable {
    cursor: pointer;
    transition: all 0.2s;
  }

  .download-count.clickable:hover {
    background: var(--status-info-border, #bbdefb);
    transform: scale(1.05);
  }

  .download-count.small {
    padding: 0.15rem 0.4rem;
    font-size: 0.75rem;
  }

  /* Responsive for type blocks */
  @media (max-width: 600px) {
    .version-content {
      flex-direction: column;
      align-items: stretch;
    }

    .version-actions {
      justify-content: stretch;
    }

    .version-actions button {
      flex: 1;
    }

    .other-version-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .other-version-item .version-actions {
      justify-content: flex-end;
    }
  }
`;

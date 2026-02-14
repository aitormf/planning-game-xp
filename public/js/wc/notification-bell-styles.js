import { css } from 'https://unpkg.com/lit@3/index.js?module';

export const NotificationBellStyles = css`
  :host {
    display: inline-block;
    position: relative;
    cursor: pointer;
    margin-right: 1rem;
  }

  .bell-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    transition: background-color 0.2s ease;
  }

  .bell-container:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .bell-icon {
    width: 24px;
    height: 24px;
    fill: white;
  }

  .badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: #dc3545;
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    border-radius: 50%;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding: 0 3px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .notification-modal {
    position: absolute;
    top: 100%;
    right: 0;
    width: 380px;
    max-width: 90vw;
    background: var(--bg-primary, white);
    border-radius: 8px;
    box-shadow: var(--shadow-lg, 0 4px 20px rgba(0, 0, 0, 0.15));
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    margin-top: 8px;
    max-height: 500px;
    display: flex;
    flex-direction: column;
  }

  .notification-modal.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .modal-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #e9ecef);
    background-color: var(--bg-secondary, #f8f9fa);
    border-radius: 8px 8px 0 0;
  }

  .modal-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary, #343a40);
  }

  .notification-list {
    flex: 1;
    overflow-y: auto;
    max-height: 300px;
  }

  .notification-item {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #e9ecef);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .notification-item:hover {
    background-color: var(--bg-secondary, #f8f9fa);
  }

  .notification-item:last-child {
    border-bottom: none;
  }

  .notification-item.unread {
    background-color: var(--color-blue-50, #e7f3ff);
    border-left: 4px solid var(--color-blue-500, #007bff);
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.25rem;
    gap: 0.5rem;
  }

  .notification-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary, #343a40);
    flex: 1;
  }

  .notification-link {
    font-size: 1rem;
    text-decoration: none;
    color: var(--color-blue-500, #007bff);
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
    line-height: 1;
  }

  .notification-link:hover {
    background-color: rgba(0, 123, 255, 0.1);
    color: var(--color-blue-600, #0056b3);
  }

  .notification-message {
    font-size: 0.85rem;
    color: var(--text-muted, #6c757d);
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .notification-time {
    font-size: 0.75rem;
    color: var(--text-disabled, #adb5bd);
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--text-muted, #6c757d);
    font-style: italic;
  }

  .notification-actions {
    padding: 1rem;
    border-top: 1px solid var(--border-color, #e9ecef);
    background-color: var(--bg-secondary, #f8f9fa);
    border-radius: 0 0 8px 8px;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .action-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--input-border, #dee2e6);
    background: var(--bg-primary, white);
    color: var(--text-muted, #6c757d);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }

  .action-button:hover {
    background-color: var(--bg-tertiary, #e9ecef);
    border-color: var(--input-border, #adb5bd);
  }

  .action-button.primary {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }

  .action-button.primary:hover {
    background-color: #0056b3;
    border-color: #0056b3;
  }
`;
import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const SlideNotificationStyles = css`
  :host {
    --width: 300px;
    --notification-bg: #17a2b8;
    --notification-color: white;
    --text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);

    position: fixed;
    bottom: 20px;
    right: calc(-20px - var(--width));
    width: var(--width);
    min-height: 80px;
    background-color: var(--notification-bg) !important;
    color: var(--notification-color) !important;
    border-radius: 8px;
    border-left: 4px solid rgba(255, 255, 255, 0.3);
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-size: 1rem;
    font-weight: 500;
    opacity: 0;
    transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
    transform: translateX(0);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  :host(.visible) {
    opacity: 1;
    transform: translateX(-320px);
  }

  .title {
    color: var(--notification-color) !important;
    font-weight: 600 !important;
    margin-bottom: 0.25rem;
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .message {
    color: var(--notification-color) !important;
    font-weight: 600 !important;
    text-shadow: var(--text-shadow) !important;
  }

  .icon {
    font-size: 1.2em;
    flex-shrink: 0;
    color: var(--notification-color) !important;
  }
`;
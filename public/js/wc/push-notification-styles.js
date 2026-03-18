export const PushNotificationStyles = `
  :host {
    display: block;
    position: fixed;
    top: 0;
    left: 50%;
    transform: translate(-50%, -100%);
    z-index: 1000;
    transition: transform 0.3s ease-in-out;
    will-change: transform;
  }
  .notification {
    background: var(--bg-primary, white);
    padding: 1rem;
    border-radius: 8px;
    box-shadow: var(--shadow-lg, 0 2px 10px rgba(0,0,0,0.1));
    max-width: 400px;
    width: 100%;
    color: var(--text-primary, inherit);
  }
  .notification.show {
    transform: translate(-50%, 20px);
  }
`;
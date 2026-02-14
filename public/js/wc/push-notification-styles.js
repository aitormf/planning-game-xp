export const PushNotificationStyles = `
  :host {
    display: block;
    position: fixed;
    top: -100%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    transition: top 0.3s ease-in-out;
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
    top: 20px;
  }
`;
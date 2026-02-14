import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const MenuNavStyles = css`
  :host {
    display: block;
    position: relative;
  }

  nav {
    display: flex;
    gap: 16px;
    position: relative;
    border-bottom: 2px solid transparent;
    padding: 0 2rem;
    background: var(--brand-secondary, #ec3e95);
    height: 2rem;
    align-items: center;
  }

  ::slotted(a) {
    text-decoration: none;
    color: #fff;
    padding: 0.3rem 1rem !important;
    position: relative;
    font-size: 16px;
    transition: color 0.3s, font-weight 0.3s;
    font-weight: normal;
  }

  ::slotted(a:hover) {
    color: #000;
  }

  ::slotted(a[active]) {
    font-weight: bold;
    color: #000;
  }

  ::slotted(a.hidden) {
    display: none;
  }

  .nav-indicator {
    position: absolute;
    height: 2px;
    background-color: #fff;
    transition: all 0.3s ease-in-out;
    width: 0;
  }

  .nav-indicator.top {
    top: 0;
  }

  .nav-indicator.bottom {
    bottom: 0;
  }
`;
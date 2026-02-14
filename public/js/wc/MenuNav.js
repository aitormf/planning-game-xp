import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { MenuNavStyles } from './menu-nav-styles.js';

export class MenuNav extends LitElement {
  static get properties() {
    return {
      activeElement: { type: Object }
    };
  }

  constructor() {
    super();
    this.activeElement = null;
  }

  static get styles() {
    return MenuNavStyles;
  }

  firstUpdated() {
    this.updateNavLinks();
    this.markActiveLinkByURL();
  }

  updateNavLinks() {
    this.navLinks = this.shadowRoot.querySelector('slot').assignedElements();
    this.indicatorTop = this.shadowRoot.querySelector('.nav-indicator.top');
    this.indicatorBottom = this.shadowRoot.querySelector('.nav-indicator.bottom');

    const currentPath = window.location.pathname;

    if (currentPath === '/') {
      this.navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Show only Projects and Dashboard when no project selected, hide Admin Project
        link.classList.toggle('hidden', href !== '/' && href !== '/dashboard/');
      });
    } else {
      this.navLinks.forEach(link => link.classList.remove('hidden'));
    }

    this.navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = link.href; // Navegación normal en MPA
      });

      link.addEventListener('mouseenter', (event) => this.moveIndicators(event.target));
      link.addEventListener('mouseleave', () => this.resetIndicators());
    });
  }

  markActiveLinkByURL() {
    const path = new URL(window.location).pathname;
    const matchingLink = this.navLinks.find(link => link.getAttribute('href').includes(path));
    this.setActiveLink(this.navLinks[0]);
    if (matchingLink) {
      this.setActiveLink(matchingLink);
    }
  }

  moveIndicators(target) {
    if (!target) return;

    const { offsetLeft, offsetWidth } = target;
    const navPaddingLeft = parseInt(getComputedStyle(this.shadowRoot.querySelector('nav')).paddingLeft, 10) || 0;
    const offsetLeftFix = offsetLeft - navPaddingLeft;

    this.indicatorTop.style.width = `${offsetWidth}px`;
    this.indicatorTop.style.transform = `translateX(${offsetLeftFix}px)`;

    this.indicatorBottom.style.width = `${offsetWidth}px`;
    this.indicatorBottom.style.transform = `translateX(${offsetLeftFix}px)`;
  }

  resetIndicators() {
    if (this.activeElement) {
      this.moveIndicators(this.activeElement);
    }
  }

  setActiveLink(link) {
    this.activeElement = link;
    this.navLinks.forEach(l => l.removeAttribute('active'));
    link.setAttribute('active', '');
    this.moveIndicators(link);
  }

  render() {
    return html`
      <nav>
        <slot></slot>
        <div class="nav-indicator top"></div>
        <div class="nav-indicator bottom"></div>
      </nav>
    `;
  }
}

customElements.define('menu-nav', MenuNav);

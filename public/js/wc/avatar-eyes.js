/**
 * <avatar-eyes> Web Component
 *
 * Attributes:
 *   mode       — "light" (default) | "dark"
 *   no-track   — present to disable mouse tracking
 *   size       — CSS size value (default "280px")
 *
 * Examples:
 *   <avatar-eyes></avatar-eyes>
 *   <avatar-eyes mode="dark"></avatar-eyes>
 *   <avatar-eyes mode="light" no-track></avatar-eyes>
 *   <avatar-eyes mode="dark" size="120px"></avatar-eyes>
 */
class AvatarEyes extends HTMLElement {
  static get observedAttributes() {
    return ['mode', 'no-track', 'size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._pupils = [];
    this._animId = null;
    this._mouseX = 0;
    this._mouseY = 0;
    this._onMouseMove = this._onMouseMove.bind(this);
  }

  connectedCallback() {
    this._render();
    this._cachePupils();
    if (!this.hasAttribute('no-track')) this._startTracking();
  }

  disconnectedCallback() {
    this._stopTracking();
  }

  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'mode' || name === 'size') {
      this._render();
      this._cachePupils();
      if (!this.hasAttribute('no-track')) this._startTracking();
    }
    if (name === 'no-track') {
      this.hasAttribute('no-track') ? this._stopTracking() : this._startTracking();
    }
  }

  /* ---- tracking ---- */

  _onMouseMove(e) {
    this._mouseX = e.clientX;
    this._mouseY = e.clientY;
  }

  _startTracking() {
    this._stopTracking();
    document.addEventListener('mousemove', this._onMouseMove);
    this._animId = requestAnimationFrame(() => this._tick());
  }

  _stopTracking() {
    document.removeEventListener('mousemove', this._onMouseMove);
    if (this._animId) cancelAnimationFrame(this._animId);
    this._animId = null;
    // Reset pupils to base position
    this._pupils.forEach(p => {
      p.currentX = 0;
      p.currentY = 0;
      p.pupil.setAttribute('cx', p.baseCx);
      p.pupil.setAttribute('cy', p.baseCy);
      p.glint.setAttribute('cx', p.baseCx + p.glintOffsetX);
      p.glint.setAttribute('cy', p.baseCy + p.glintOffsetY);
    });
  }

  _tick() {
    const svg = this.shadowRoot.querySelector('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;

    this._pupils.forEach(p => {
      const svgMX = (this._mouseX - rect.left) * scaleX;
      const svgMY = (this._mouseY - rect.top) * scaleY;
      const dx = svgMX - p.baseCx;
      const dy = svgMY - p.baseCy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let offsetX = 0, offsetY = 0;
      if (dist > 1) {
        const factor = Math.min(1, dist / 250);
        offsetX = (dx / dist) * p.maxX * factor;
        offsetY = (dy / dist) * p.maxY * factor;
      }

      p.currentX += (offsetX - p.currentX) * 0.12;
      p.currentY += (offsetY - p.currentY) * 0.12;

      p.pupil.setAttribute('cx', p.baseCx + p.currentX);
      p.pupil.setAttribute('cy', p.baseCy + p.currentY);
      p.glint.setAttribute('cx', p.baseCx + p.currentX + p.glintOffsetX);
      p.glint.setAttribute('cy', p.baseCy + p.currentY + p.glintOffsetY);
    });

    this._animId = requestAnimationFrame(() => this._tick());
  }

  /* ---- rendering ---- */

  _cachePupils() {
    this._pupils = [];
    this.shadowRoot.querySelectorAll('.pupil-group').forEach(g => {
      const baseCx = parseFloat(g.dataset.cx);
      const baseCy = parseFloat(g.dataset.cy);
      const pupil = g.querySelector('.pupil');
      const glint = g.querySelector('.glint');
      this._pupils.push({
        pupil, glint, baseCx, baseCy,
        maxX: parseFloat(g.dataset.maxX),
        maxY: parseFloat(g.dataset.maxY),
        glintOffsetX: parseFloat(glint.getAttribute('cx')) - baseCx,
        glintOffsetY: parseFloat(glint.getAttribute('cy')) - baseCy,
        currentX: 0, currentY: 0
      });
    });
  }

  _render() {
    const dark = this.getAttribute('mode') === 'dark';
    const size = this.getAttribute('size') || '280px';
    const noTrack = this.hasAttribute('no-track');

    // Animation keyframes for the idle (no-track) version
    const idleAnim = noTrack ? `
      <animateTransform
        attributeName="transform" type="translate" dur="20s" repeatCount="indefinite"
        keyTimes="0;0.80;0.82;0.85;0.87;0.90;0.92;0.95;0.97;1"
        values="0,0;0,0;35,0;35,0;-30,22;-30,22;30,22;30,22;0,0;0,0"
        calcMode="spline"
        keySplines="0 0 1 1;0.25 0.1 0.25 1;0 0 1 1;0.25 0.1 0.25 1;0 0 1 1;0.25 0.1 0.25 1;0 0 1 1;0.25 0.1 0.25 1;0 0 1 1"/>` : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; line-height: 0; }
        svg { width: ${size}; height: ${size}; display: block; }
      </style>
      <svg viewBox="0 0 400 400">
        <defs>
          <clipPath id="clip">
            <circle cx="200" cy="200" r="200"/>
          </clipPath>
        </defs>
        <g clip-path="url(#clip)">
          ${dark ? this._darkBg() : this._lightBg()}
          ${dark ? this._darkEyes() : this._lightEyes()}
          <!-- Pupils -->
          <g>${idleAnim}
            ${dark ? this._darkPupils() : this._lightPupils()}
          </g>
          ${dark ? this._darkOverlay() : this._lightOverlay()}
        </g>
        <circle cx="200" cy="200" r="198" fill="none"
                stroke="${dark ? '#2a2a2a' : '#cccccc'}" stroke-width="4"/>
      </svg>`;
  }

  /* ---- SVG fragments ---- */

  _lightBg() {
    return `<rect width="400" height="400" fill="#1a1a2e"/>`;
  }
  _darkBg() {
    return `<rect width="400" height="400" fill="#f5f5f0"/>`;
  }

  _lightEyes() {
    return `
      <path d="M 18 160 L 195 160 Q 195 265 106 265 Q 18 265 18 160 Z"
            fill="#e8e4dd" stroke="#cccccc" stroke-width="7" stroke-linejoin="round"/>
      <path d="M 205 160 L 382 160 Q 382 265 293 265 Q 205 265 205 160 Z"
            fill="#e8e4dd" stroke="#cccccc" stroke-width="7" stroke-linejoin="round"/>`;
  }
  _darkEyes() {
    return `
      <path d="M 18 160 L 195 160 Q 195 265 106 265 Q 18 265 18 160 Z"
            fill="#fff" stroke="#2a2a2a" stroke-width="7" stroke-linejoin="round"/>
      <path d="M 205 160 L 382 160 Q 382 265 293 265 Q 205 265 205 160 Z"
            fill="#fff" stroke="#2a2a2a" stroke-width="7" stroke-linejoin="round"/>`;
  }

  _lightPupils() {
    return `
      <g class="pupil-group" data-cx="125" data-cy="215" data-max-x="35" data-max-y="20">
        <circle class="pupil" cx="125" cy="215" r="20" fill="#2a2a2a"/>
        <circle class="glint" cx="119" cy="208" r="5" fill="#fff" opacity="0.3"/>
      </g>
      <g class="pupil-group" data-cx="312" data-cy="215" data-max-x="35" data-max-y="20">
        <circle class="pupil" cx="312" cy="215" r="20" fill="#2a2a2a"/>
        <circle class="glint" cx="306" cy="208" r="5" fill="#fff" opacity="0.3"/>
      </g>`;
  }
  _darkPupils() {
    return `
      <g class="pupil-group" data-cx="106" data-cy="210" data-max-x="35" data-max-y="20">
        <circle class="pupil" cx="106" cy="210" r="20" fill="#2a2a2a"/>
        <circle class="glint" cx="99" cy="202" r="6" fill="#fff" opacity="0.7"/>
      </g>
      <g class="pupil-group" data-cx="293" data-cy="210" data-max-x="35" data-max-y="20">
        <circle class="pupil" cx="293" cy="210" r="20" fill="#2a2a2a"/>
        <circle class="glint" cx="286" cy="202" r="6" fill="#fff" opacity="0.7"/>
      </g>`;
  }

  _lightOverlay() {
    return `
      <!-- Eyelids -->
      <path d="M 14 156 L 199 156 L 199 210 Q 106 182 14 210 Z" fill="#1a1a2e"/>
      <path d="M 22 208 Q 106 180 192 208" fill="none" stroke="#888" stroke-width="4" stroke-linecap="round"/>
      <path d="M 201 156 L 386 156 L 386 210 Q 293 182 201 210 Z" fill="#1a1a2e"/>
      <path d="M 208 208 Q 293 180 378 208" fill="none" stroke="#888" stroke-width="4" stroke-linecap="round"/>
      <!-- Lightbulb OFF -->
      <g transform="translate(200,95)">
        <path d="M-12 6Q-14-12 0-22Q14-12 12 6Z" fill="#2a2a3e" stroke="#666" stroke-width="2.5"/>
        <path d="M-3 0L0-10L3 0" fill="none" stroke="#444" stroke-width="1.5"/>
        <rect x="-8" y="6" width="16" height="9" rx="2" fill="#444" stroke="#666" stroke-width="2"/>
        <line x1="-8" y1="10" x2="8" y2="10" stroke="#555" stroke-width="1.5"/>
      </g>`;
  }
  _darkOverlay() {
    return `
      <!-- Smile -->
      <path d="M 145 290 Q 200 310 255 290" fill="none" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>
      <!-- Lightbulb ON -->
      <g transform="translate(200,95)">
        <circle cx="0" cy="0" r="35" fill="#ffdd44" opacity="0.2"/>
        <circle cx="0" cy="0" r="22" fill="#ffdd44" opacity="0.3"/>
        <path d="M-12 6Q-14-12 0-22Q14-12 12 6Z" fill="#fff8cc" stroke="#2a2a2a" stroke-width="2.5"/>
        <path d="M-3 0L0-10L3 0" fill="none" stroke="#e8a000" stroke-width="1.5"/>
        <rect x="-8" y="6" width="16" height="9" rx="2" fill="#aaa" stroke="#2a2a2a" stroke-width="2"/>
        <line x1="-8" y1="10" x2="8" y2="10" stroke="#2a2a2a" stroke-width="1.5"/>
        <line x1="0" y1="-32" x2="0" y2="-26" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
        <line x1="20" y1="-20" x2="16" y2="-16" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
        <line x1="-20" y1="-20" x2="-16" y2="-16" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="-2" x2="18" y2="-1" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
        <line x1="-24" y1="-2" x2="-18" y2="-1" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="12" x2="14" y2="9" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
        <line x1="-18" y1="12" x2="-14" y2="9" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
      </g>`;
  }
}

customElements.define('avatar-eyes', AvatarEyes);

export { AvatarEyes };

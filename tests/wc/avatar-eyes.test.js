// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('AvatarEyes web component', () => {
  beforeEach(() => {
    // Reset custom element registry issues by clearing DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should be importable without errors', async () => {
    // Import the module - since it uses customElements.define,
    // we verify it doesn't throw
    await expect(import('../../public/js/wc/avatar-eyes.js')).resolves.toBeDefined();
  });

  it('should export AvatarEyes class', async () => {
    const mod = await import('../../public/js/wc/avatar-eyes.js');
    expect(mod.AvatarEyes).toBeDefined();
    expect(typeof mod.AvatarEyes).toBe('function');
  });

  it('should have observedAttributes for mode, no-track, and size', async () => {
    const { AvatarEyes } = await import('../../public/js/wc/avatar-eyes.js');
    expect(AvatarEyes.observedAttributes).toEqual(['mode', 'no-track', 'size']);
  });

  it('should register as avatar-eyes custom element', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    expect(el.constructor.name).toBe('AvatarEyes');
  });

  it('should render SVG in shadow DOM when connected', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    document.body.append(el);
    expect(el.shadowRoot).toBeDefined();
    expect(el.shadowRoot.innerHTML).toContain('<svg');
    expect(el.shadowRoot.innerHTML).toContain('viewBox="0 0 400 400"');
  });

  it('should render light mode by default', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    document.body.append(el);
    // Light mode has dark background (#1a1a2e)
    expect(el.shadowRoot.innerHTML).toContain('#1a1a2e');
    // Light mode has lightbulb OFF (no glow circles)
    expect(el.shadowRoot.innerHTML).not.toContain('Smile');
  });

  it('should render dark mode when mode="dark"', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    el.setAttribute('mode', 'dark');
    document.body.append(el);
    // Dark mode has light background (#f5f5f0)
    expect(el.shadowRoot.innerHTML).toContain('#f5f5f0');
    // Dark mode has smile
    expect(el.shadowRoot.innerHTML).toContain('Smile');
  });

  it('should use custom size when specified', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    el.setAttribute('size', '120px');
    document.body.append(el);
    expect(el.shadowRoot.innerHTML).toContain('120px');
  });

  it('should include idle animation when no-track is set', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    el.setAttribute('no-track', '');
    document.body.append(el);
    expect(el.shadowRoot.innerHTML).toContain('animateTransform');
  });

  it('should NOT include idle animation when tracking is enabled (default)', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    document.body.append(el);
    expect(el.shadowRoot.innerHTML).not.toContain('animateTransform');
  });

  it('should have pupil groups with data attributes', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    document.body.append(el);
    const groups = el.shadowRoot.querySelectorAll('.pupil-group');
    expect(groups.length).toBe(2); // Two eyes
    groups.forEach(g => {
      expect(g.dataset.cx).toBeDefined();
      expect(g.dataset.cy).toBeDefined();
      expect(g.dataset.maxX).toBeDefined();
      expect(g.dataset.maxY).toBeDefined();
    });
  });

  it('should clean up event listeners on disconnect', async () => {
    await import('../../public/js/wc/avatar-eyes.js');
    const el = document.createElement('avatar-eyes');
    document.body.append(el);
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    el.remove();
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe('ThemeToggle integration with avatar-eyes', () => {
  it('should import ThemeToggle without errors', async () => {
    // Mock lit and ThemeManagerService for ThemeToggle
    vi.mock('lit', () => ({
      LitElement: class {
        static get properties() { return {}; }
        constructor() {}
        connectedCallback() {}
        disconnectedCallback() {}
      },
      html: (strings, ...values) => ({ strings, values }),
      css: (strings, ...values) => ({ strings, values })
    }));
    vi.mock('../../public/js/services/theme-manager-service.js', () => ({
      ThemeManagerService: {
        isDarkMode: vi.fn(() => false),
        toggleDarkMode: vi.fn()
      }
    }));

    const mod = await import('../../public/js/wc/ThemeToggle.js');
    expect(mod.ThemeToggle).toBeDefined();
  });
});

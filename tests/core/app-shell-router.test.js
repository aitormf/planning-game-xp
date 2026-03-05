import { describe, expect, it } from 'vitest';
import { extractShellParts, resolvePartialUrl } from '@/core/app-shell-router.js';

describe('extractShellParts', () => {
  it('should extract subnav and main HTML and collect scripts', () => {
    const html = `
      <div data-subnav>
        <div id="subnav">Subnav</div>
        <script>window.__subnav = true;</script>
      </div>
      <div data-main>
        <div id="main">Main</div>
        <script type="module">window.__main = true;</script>
      </div>
    `;

    const result = extractShellParts(html);

    expect(result.subnavHtml).toContain('id="subnav"');
    expect(result.mainHtml).toContain('id="main"');
    expect(result.subnavHtml).not.toContain('<script');
    expect(result.mainHtml).not.toContain('<script');
    expect(result.scripts).toHaveLength(2);
  });
});

describe('resolvePartialUrl', () => {
  it('should match routes regardless of trailing slashes', () => {
    const routes = {
      '/adminproject/': '/partials/adminproject',
      '/projects': '/partials/projects'
    };

    expect(resolvePartialUrl(routes, '/adminproject')).toBe('/partials/adminproject');
    expect(resolvePartialUrl(routes, '/projects/')).toBe('/partials/projects');
  });

  it('should resolve route config objects', () => {
    const routes = {
      '/dashboard/': { partial: '/partials/dashboard', cache: false }
    };

    expect(resolvePartialUrl(routes, '/dashboard')).toBe('/partials/dashboard');
  });

  it('should return empty string when no route matches', () => {
    const routes = {
      '/adminproject/': '/partials/adminproject'
    };

    expect(resolvePartialUrl(routes, '/dashboard')).toBe('');
  });
});

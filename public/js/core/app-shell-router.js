const DEFAULT_SHELL_CONFIG = {
  subnavSelector: '[data-subnav]',
  mainSelector: '[data-main]',
  subnavContainerId: 'subNavContainer',
  mainContainerId: 'mainContainer',
  scriptMarker: 'data-shell-script'
};

export function normalizeRoutePath(pathname) {
  const value = (pathname || '/').toString();
  const cleaned = value.split('?')[0].split('#')[0];
  const trimmed = cleaned.replace(/\/$/, '');
  return trimmed || '/';
}

export function resolvePartialUrl(routes, pathname) {
  if (!routes || typeof routes !== 'object') return '';
  const normalizedPath = normalizeRoutePath(pathname);

  for (const [route, partial] of Object.entries(routes)) {
    if (!route || !partial) continue;
    const routeConfig = normalizeRouteEntry(partial);
    if (!routeConfig) continue;
    if (normalizeRoutePath(route) === normalizedPath) {
      return routeConfig.partialUrl;
    }
  }

  return '';
}

function normalizeRouteEntry(entry) {
  if (typeof entry === 'string') {
    return { partialUrl: entry, cache: true };
  }
  if (!entry || typeof entry !== 'object') return null;

  const partialUrl = entry.partial || entry.partialUrl;
  if (!partialUrl) return null;
  return { partialUrl, cache: entry.cache !== false };
}

export function extractShellParts(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  const fragment = template.content;
  const scripts = Array.from(fragment.querySelectorAll('script'));
  scripts.forEach(script => script.remove());

  const stylesheets = Array.from(fragment.querySelectorAll('link[rel="stylesheet"], style'));
  stylesheets.forEach(node => node.remove());

  const subnavNode = fragment.querySelector(DEFAULT_SHELL_CONFIG.subnavSelector);
  const mainNode = fragment.querySelector(DEFAULT_SHELL_CONFIG.mainSelector);

  return {
    subnavHtml: subnavNode ? subnavNode.innerHTML : '',
    mainHtml: mainNode ? mainNode.innerHTML : '',
    scripts,
    stylesheets
  };
}

function buildRoutesMap(routes) {
  const map = new Map();
  if (!routes || typeof routes !== 'object') return map;

  Object.entries(routes).forEach(([route, partial]) => {
    if (!route || !partial) return;
    const config = normalizeRouteEntry(partial);
    if (!config) return;
    const normalizedRoute = normalizeRoutePath(route);
    map.set(normalizedRoute, config);
  });

  return map;
}

function copyScriptAttributes(target, source) {
  Array.from(source.attributes).forEach(attr => {
    target.setAttribute(attr.name, attr.value);
  });
}

function executeScript(script, markerAttr) {
  return new Promise((resolve, reject) => {
    const newScript = document.createElement('script');
    copyScriptAttributes(newScript, script);
    newScript.setAttribute(markerAttr, 'true');

    const isModule = newScript.getAttribute('type') === 'module';
    const hasSrc = Boolean(script.src);
    let timeoutId = null;
    let settled = false;

    const cleanup = () => {
      newScript.removeEventListener('load', onLoad);
      newScript.removeEventListener('error', onError);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    const finalize = (fn) => () => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };
    const onLoad = finalize(() => resolve());
    const onError = finalize(() => reject(new Error(`Failed to load script: ${script.src || 'inline script'}`)));

    if (hasSrc || isModule) {
      newScript.addEventListener('load', onLoad);
      newScript.addEventListener('error', onError);
    }

    if (script.textContent && !hasSrc) {
      newScript.textContent = script.textContent;
    }

    document.body.appendChild(newScript);
    if (!hasSrc && !isModule) {
      settled = true;
      cleanup();
      resolve();
      return;
    }

    if (!hasSrc && isModule) {
      // Inline module scripts execute once their imports resolve (already cached).
      // Resolve on next animation frame instead of a 2s timeout.
      requestAnimationFrame(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      });
    }
  });
}

export class AppShellRouter {
  constructor({ route, partialUrl, routes } = {}) {
    this.route = route || '';
    this.partialUrl = partialUrl || '';
    this.routes = routes || null;
    this.routesMap = buildRoutesMap(routes);
    this.subnavContainer = document.getElementById(DEFAULT_SHELL_CONFIG.subnavContainerId);
    this.mainContainer = document.getElementById(DEFAULT_SHELL_CONFIG.mainContainerId);
    this._cache = new Map();
    this._activeLoad = null;
    this._onPopState = this._onPopState.bind(this);
  }

  canHandle(url) {
    const target = typeof url === 'string' ? new URL(url, window.location.origin) : url;
    if (this.routesMap.size) {
      return this.routesMap.has(normalizeRoutePath(target.pathname));
    }
    if (!this.route) return false;
    return normalizeRoutePath(target.pathname) === normalizeRoutePath(this.route);
  }

  async init() {
    if (!this.subnavContainer || !this.mainContainer) {
      console.error('[AppShellRouter] Missing shell containers.');
      return;
    }

    const initialRoute = this._getRouteConfigForPath(window.location.pathname);
    if (!initialRoute) {
      console.error('[AppShellRouter] Missing partial URL.');
      return;
    }

    window.addEventListener('popstate', this._onPopState);
    await this.load(initialRoute.partialUrl, initialRoute.cache);
  }

  async navigate(url) {
    const target = new URL(url, window.location.origin);
    const routeConfig = this._getRouteConfigForPath(target.pathname);
    if (!routeConfig || !this.canHandle(target)) {
      window.location.href = target.toString();
      return;
    }

    history.pushState({}, '', target.toString());
    await this.load(routeConfig.partialUrl, routeConfig.cache);
  }

  async load(partialUrl, cacheEnabled = true) {
    try {
      const normalizedPartial = this._normalizePartialUrl(partialUrl);
      if (this._activeLoad) {
        this._activeLoad.abort();
      }
      const controller = new AbortController();
      this._activeLoad = controller;

      let html = cacheEnabled ? this._cache.get(normalizedPartial) : null;
      if (!html) {
        const _tFetch = performance.now();
        const response = await fetch(normalizedPartial, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load partial: ${response.status}`);
        }
        html = await response.text();
        console.warn(`⏱ Router fetch partial (${normalizedPartial}): ${(performance.now() - _tFetch).toFixed(0)}ms | ${(html.length/1024).toFixed(0)}KB`);
        if (cacheEnabled) {
          this._cache.set(normalizedPartial, html);
        }
      }

      const { subnavHtml, mainHtml, scripts, stylesheets } = extractShellParts(html);

      this._injectStylesheets(stylesheets);
      this.subnavContainer.innerHTML = subnavHtml;
      this.mainContainer.innerHTML = mainHtml;

      // Show initial tab immediately to prevent blank screen while scripts load
      this._showDefaultTabContent();

      this._clearShellScripts();
      console.warn(`⏱ Router executing scripts: ${performance.now().toFixed(0)}ms`);
      await this._executeScripts(scripts);
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      console.warn(`⏱ Router dispatching astro:page-load: ${performance.now().toFixed(0)}ms`);
      document.dispatchEvent(new Event('astro:page-load'));
      if (this._activeLoad === controller) {
        this._activeLoad = null;
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[AppShellRouter] Failed to load partial.', error);
      if (this.mainContainer) {
        this.mainContainer.innerHTML = '<p class="error-message">No se pudo cargar la pagina.</p>';
      }
    }
  }

  destroy() {
    window.removeEventListener('popstate', this._onPopState);
    this._clearShellScripts();
    document.querySelectorAll('[data-shell-style]').forEach(el => el.remove());
  }

  async _executeScripts(scripts) {
    for (const script of scripts) {
      try {
        await executeScript(script, DEFAULT_SHELL_CONFIG.scriptMarker);
      } catch (error) {
        console.error('[AppShellRouter] Script load failed.', error);
      }
    }
  }

  _clearShellScripts() {
    document.querySelectorAll(`script[${DEFAULT_SHELL_CONFIG.scriptMarker}]`).forEach(script => {
      script.remove();
    });
  }

  _injectStylesheets(stylesheets) {
    document.querySelectorAll('[data-shell-style]').forEach(el => el.remove());
    for (const node of stylesheets) {
      const clone = node.cloneNode(true);
      clone.setAttribute('data-shell-style', '');
      document.head.append(clone);
    }
  }

  _showDefaultTabContent() {
    const hash = window.location.hash.replace('#', '');
    const section = hash || 'tasks';
    const tabContent = this.mainContainer.querySelector(`#${section}TabContent`);
    if (tabContent) {
      tabContent.style.display = 'block';
    }
  }

  _normalizePartialUrl(partialUrl) {
    if (partialUrl.endsWith('/')) return partialUrl;
    return `${partialUrl}/`;
  }

  _getRouteConfigForPath(pathname) {
    if (this.routesMap.size) {
      const match = this.routesMap.get(normalizeRoutePath(pathname));
      return match ? { ...match } : null;
    }
    if (!this.partialUrl) return null;
    return { partialUrl: this.partialUrl, cache: true };
  }

  async _onPopState() {
    if (!this.canHandle(window.location)) return;
    const routeConfig = this._getRouteConfigForPath(window.location.pathname);
    if (!routeConfig) return;
    await this.load(routeConfig.partialUrl, routeConfig.cache);
  }
}

export function initAppShellRouterFromDataset() {
  const routesRaw = document.body.dataset.shellRoutes || '';
  let routes = null;
  if (routesRaw) {
    try {
      const parsed = JSON.parse(routesRaw);
      if (parsed && typeof parsed === 'object') {
        routes = parsed;
      }
    } catch (error) {
      console.warn('[AppShellRouter] Failed to parse shell routes dataset.', error);
    }
  }

  if (routes) {
    const router = new AppShellRouter({ routes });
    router.init();
    return router;
  }

  const route = document.body.dataset.shellRoute || '';
  const partialUrl = document.body.dataset.shellPartial || '';

  if (!route || !partialUrl) return null;

  const router = new AppShellRouter({ route, partialUrl });
  router.init();
  return router;
}

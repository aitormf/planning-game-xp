export class LitElement extends HTMLElement {
  constructor() {
    super();
  }

  get updateComplete() {
    return Promise.resolve();
  }

  connectedCallback() {}
  disconnectedCallback() {}
  requestUpdate() {}
}

export const html = (strings, ...values) => ({ strings, values });
export const css = (strings, ...values) => ({ strings, values });

export class UIUtils {
  static createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  static replaceElementPreservingPosition(oldElement, newElement) {
    oldElement.parentNode.replaceChild(newElement, oldElement);
    return newElement;
  }

  static clearContainer(container) {
    const newContainer = container.cloneNode(false);
    return this.replaceElementPreservingPosition(container, newContainer);
  }

  // Formatea fechas ISO a yyyy-mm-dd; si no es válida, devuelve cadena vacía
  static formatDate(value) {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  /**
   * Formats a date/timestamp into a friendly Spanish format.
   * e.g. "20 feb 2026, 14:30"
   * If the value has no time component (date-only), omits the time.
   * Returns empty string for falsy or invalid values.
   */
  static formatDateFriendly(value, { forceTime = false } = {}) {
    if (!value) return '';
    let date = null;
    let hasTime = false;

    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
        hasTime = false;
      } else {
        date = new Date(value);
        hasTime = /T\d{2}:\d{2}/.test(value);
      }
    } else {
      date = new Date(value);
    }

    if (!date || Number.isNaN(date.getTime())) return '';

    const shouldIncludeTime = forceTime || hasTime;
    const options = { day: 'numeric', month: 'short', year: 'numeric' };

    if (shouldIncludeTime) {
      return date.toLocaleString('es-ES', {
        ...options,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    return date.toLocaleDateString('es-ES', options);
  }
}

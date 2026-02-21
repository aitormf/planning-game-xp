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
  static formatDateFriendly(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const hasTime = typeof value === 'string' && /T\d{2}:\d{2}/.test(value);

    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    if (hasTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }
    return date.toLocaleDateString('es-ES', options);
  }
}

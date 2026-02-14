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
}

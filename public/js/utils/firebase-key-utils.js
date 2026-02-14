export const toFirebaseKey = (value = '') =>
  String(value).replace(/[.#$/\[\]]/g, '_');

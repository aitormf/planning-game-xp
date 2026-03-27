/**
 * Utility functions for generating timestamps with time components.
 *
 * Dates are stored as YYYY-MM-DDTHH:mm:ss where:
 * - If the input already has a time component (T separator), it is preserved
 * - If the input is date-only (YYYY-MM-DD), the current client time is appended
 * - A Date object always uses its actual time
 *
 * No fake default times (09:00 / 17:00) — timestamps must be real.
 *
 * UI date inputs use datetime-local via extractDateTimeLocal().
 * Backward compatible: old YYYY-MM-DD values still work everywhere.
 */

/**
 * Generate a timestamp string with time component.
 * Always uses real time — never fabricates a default time.
 * @param {Date|string} [date=new Date()] - Date object, YYYY-MM-DD, or YYYY-MM-DDTHH:mm string
 * @returns {string} Formatted as YYYY-MM-DDTHH:mm:ss
 */
export function generateTimestamp(date = new Date()) {
  // If the string already includes a time part (from datetime-local input), preserve it
  if (typeof date === 'string' && date.includes('T')) {
    // If timestamp has UTC indicator (Z) or timezone offset, convert to local time
    // so all stored timestamps are consistently in local time without timezone suffix
    if (_hasTimezone(date)) {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return `${_formatDate(dateObj)}T${_formatTime(dateObj)}`;
      }
    }
    const datePart = date.split('T')[0];
    const timePart = date.split('T')[1];
    // datetime-local gives HH:mm, normalize to HH:mm:ss
    const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
    return `${datePart}T${normalizedTime}`;
  }

  // Date object (or anything that's not a string) → use its actual time
  if (typeof date !== 'string') {
    const d = date instanceof Date ? date : new Date(date);
    return `${_formatDate(d)}T${_formatTime(d)}`;
  }

  // Date-only string (YYYY-MM-DD) → append current time
  const dateObj = _parseDate(date);
  const now = new Date();
  return `${_formatDate(dateObj)}T${_formatTime(now)}`;
}

/**
 * Extract the date part (YYYY-MM-DD) from a timestamp or plain date string.
 * Backward compatible with old YYYY-MM-DD values (no T separator).
 * @param {string|null|undefined} timestamp
 * @returns {string} YYYY-MM-DD or empty string
 */
export function extractDatePart(timestamp) {
  if (!timestamp) return '';
  return timestamp.split('T')[0];
}

/**
 * Extract a value suitable for <input type="datetime-local"> from a timestamp.
 * Returns YYYY-MM-DDTHH:mm format.
 * For date-only values (no T separator), appends current time.
 * @param {string|null|undefined} timestamp
 * @returns {string} YYYY-MM-DDTHH:mm or empty string
 */
export function extractDateTimeLocal(timestamp) {
  if (!timestamp) return '';
  if (!timestamp.includes('T')) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${timestamp}T${h}:${m}`;
  }
  // If timestamp has UTC indicator (Z) or timezone offset, convert to local time
  // datetime-local inputs work in local time, so UTC must be converted
  if (_hasTimezone(timestamp)) {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d}T${h}:${min}`;
    }
  }
  return timestamp.substring(0, 16); // YYYY-MM-DDTHH:mm
}

/**
 * Check if a date corresponds to today.
 * @param {Date|string} date - Date object or date string
 * @returns {boolean}
 */
export function isToday(date) {
  const dateObj = typeof date === 'string' ? _parseDate(date) : date;
  const today = new Date();
  return dateObj.getFullYear() === today.getFullYear()
    && dateObj.getMonth() === today.getMonth()
    && dateObj.getDate() === today.getDate();
}

/**
 * Format a Date object as YYYY-MM-DD.
 * Drop-in replacement for getFormatedDate / _getTodayFormatted in card components.
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function formatDateOnly(date) {
  return _formatDate(date);
}

// --- Private helpers ---

function _formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function _formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function _parseDate(str) {
  const datePart = str.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function _hasTimezone(str) {
  if (str.endsWith('Z')) return true;
  // Check for +HH:mm or -HH:mm offset after the time part (position 19+)
  const offsetMatch = str.match(/[+-]\d{2}:\d{2}$/);
  return offsetMatch !== null && str.indexOf(offsetMatch[0]) > 10;
}

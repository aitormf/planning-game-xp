/**
 * Utility functions for generating timestamps with time components.
 *
 * Dates are stored as YYYY-MM-DDTHH:mm:ss where:
 * - If the date is today → actual client time is used
 * - If the date is in the past → 09:00:00 (start) or 17:00:00 (end)
 *
 * UI date inputs continue showing only YYYY-MM-DD via extractDatePart().
 * Backward compatible: old YYYY-MM-DD values still work everywhere.
 */

const DEFAULT_START_TIME = '09:00:00';
const DEFAULT_END_TIME = '17:00:00';

/**
 * Generate a timestamp string with time component.
 * @param {Date|string} [date=new Date()] - Date object or YYYY-MM-DD string
 * @param {'start'|'end'} [context='start'] - Context for default time on past dates
 * @returns {string} Formatted as YYYY-MM-DDTHH:mm:ss
 */
export function generateTimestamp(date = new Date(), context = 'start') {
  const dateObj = typeof date === 'string' ? _parseDate(date) : date;
  const datePart = _formatDate(dateObj);

  if (isToday(dateObj)) {
    const now = new Date();
    const timePart = _formatTime(now);
    return `${datePart}T${timePart}`;
  }

  const defaultTime = context === 'end' ? DEFAULT_END_TIME : DEFAULT_START_TIME;
  return `${datePart}T${defaultTime}`;
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

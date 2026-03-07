/**
 * Handler for onTaskReopen Cloud Function
 * Manages time accumulation when tasks are reopened.
 *
 * On status → "Reopened":
 *   - Archives current work period (startDate→endDate) into timeEntries array
 *   - Clears endDate for the new work period
 *
 * On status → "To Validate" (when timeEntries exists):
 *   - Calculates totalEffectiveHours from all periods + current active period
 *   - Uses business hours: 8h/day, Mon-Fri
 */

const HOURS_PER_WORKDAY = 8;

/**
 * Calculate business hours between two dates.
 * Counts 8h per weekday (Mon-Fri), skips weekends.
 * For date-only strings (no time component), assumes full 8h workday per date.
 * @param {string} startStr - ISO date string
 * @param {string} endStr - ISO date string
 * @returns {number} Business hours
 */
function calculateBusinessHours(startStr, endStr) {
  const isDateOnly = str => !str.includes('T');

  if (isDateOnly(startStr) && isDateOnly(endStr)) {
    return calculateBusinessHoursDateOnly(startStr, endStr);
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (end <= start) return 0;

  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);

  // If within the same day
  if (isSameDay(start, end)) {
    return isWeekday(start) ? Math.round(diffHours * 100) / 100 : 0;
  }

  // Multi-day: count full workdays between, plus partial first/last days
  let hours = 0;
  const current = new Date(start);

  // First partial day: hours from start to end of that day (cap at 8h)
  if (isWeekday(current)) {
    const endOfDay = new Date(current);
    endOfDay.setUTCHours(17, 0, 0, 0);
    const firstDayHours = Math.min(
      (endOfDay - current) / (1000 * 60 * 60),
      HOURS_PER_WORKDAY
    );
    hours += Math.max(0, firstDayHours);
  }

  // Move to next day
  current.setUTCDate(current.getUTCDate() + 1);
  current.setUTCHours(9, 0, 0, 0);

  // Full days in between
  while (!isSameDay(current, end) && current < end) {
    if (isWeekday(current)) {
      hours += HOURS_PER_WORKDAY;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Last partial day: hours from start of day to end time (cap at 8h)
  if (isSameDay(current, end) && isWeekday(end)) {
    const startOfDay = new Date(end);
    startOfDay.setUTCHours(9, 0, 0, 0);
    const lastDayHours = Math.min(
      (end - startOfDay) / (1000 * 60 * 60),
      HOURS_PER_WORKDAY
    );
    hours += Math.max(0, lastDayHours);
  }

  return Math.round(hours * 100) / 100;
}

/**
 * Calculate business hours for date-only strings.
 * Each weekday counts as 8h. Inclusive of both start and end dates.
 */
function calculateBusinessHoursDateOnly(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00Z');
  const end = new Date(endStr + 'T00:00:00Z');

  if (end < start) return 0;

  let hours = 0;
  const current = new Date(start);
  while (current <= end) {
    if (isWeekday(current)) {
      hours += HOURS_PER_WORKDAY;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return hours;
}

function isWeekday(date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function isSameDay(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Main handler for task reopen time accumulation
 * @param {Object} params - { projectId, section, cardId }
 * @param {Object} beforeData - Card data before the change
 * @param {Object} afterData - Card data after the change
 * @param {Object} deps - Dependencies { db, logger }
 * @returns {Object|null} - Result or null if no action needed
 */
async function handleTaskReopen(params, beforeData, afterData, deps) {
  const { projectId, section, cardId } = params;
  const { db, logger } = deps;

  // Only process tasks
  if (!section.toLowerCase().startsWith('tasks_')) {
    return null;
  }

  const beforeStatus = beforeData?.status;
  const afterStatus = afterData?.status;

  // Skip if status didn't change
  if (beforeStatus === afterStatus) {
    return null;
  }

  const cardPath = `/cards/${projectId}/${section}/${cardId}`;

  // Handle transition TO "Reopened"
  if (afterStatus === 'Reopened') {
    return handleReopenedTransition(cardPath, afterData, { db, logger, projectId, cardId });
  }

  // Handle transition TO "To Validate" with existing timeEntries
  if (afterStatus === 'To Validate') {
    return handleToValidateWithTimeEntries(cardPath, afterData, { db, logger, projectId, cardId });
  }

  return null;
}

/**
 * Archive the current work period into timeEntries and clear endDate.
 */
async function handleReopenedTransition(cardPath, afterData, { db, logger, projectId, cardId }) {
  const { startDate, endDate } = afterData;

  if (!startDate || !endDate) {
    logger.warn('onTaskReopen: Missing startDate or endDate, skipping time entry', {
      projectId,
      cardId,
      startDate: startDate || 'missing',
      endDate: endDate || 'missing'
    });
    return { action: 'skipped-missing-dates' };
  }

  const existingEntries = Array.isArray(afterData.timeEntries)
    ? afterData.timeEntries
    : [];

  const newEntries = [...existingEntries, { start: startDate, end: endDate }];

  await db.ref(cardPath).update({
    timeEntries: newEntries,
    endDate: null
  });

  logger.info('onTaskReopen: Time entry saved on reopen', {
    projectId,
    cardId,
    entriesCount: newEntries.length
  });

  return { action: 'time-entry-saved' };
}

/**
 * Calculate totalEffectiveHours when moving to "To Validate" with accumulated timeEntries.
 */
async function handleToValidateWithTimeEntries(cardPath, afterData, { db, logger, projectId, cardId }) {
  const timeEntries = afterData.timeEntries;

  if (!Array.isArray(timeEntries) || timeEntries.length === 0) {
    return null;
  }

  let totalHours = 0;

  // Sum hours from all archived periods
  for (const entry of timeEntries) {
    if (entry.start && entry.end) {
      totalHours += calculateBusinessHours(entry.start, entry.end);
    }
  }

  // Add current active period (startDate → endDate)
  if (afterData.startDate && afterData.endDate) {
    totalHours += calculateBusinessHours(afterData.startDate, afterData.endDate);
  }

  totalHours = Math.round(totalHours * 100) / 100;

  await db.ref(cardPath).update({
    totalEffectiveHours: totalHours
  });

  logger.info('onTaskReopen: Total effective hours calculated', {
    projectId,
    cardId,
    totalEffectiveHours: totalHours,
    periodsCount: timeEntries.length + 1
  });

  return { action: 'total-hours-calculated' };
}

module.exports = {
  handleTaskReopen,
  calculateBusinessHours
};

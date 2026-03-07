/**
 * Handler for onTaskDoneValidated Cloud Function
 * Recalculates effectiveHours when a task transitions to Done&Validated,
 * ONLY if both startDate and endDate have estimated (default) timestamps.
 *
 * Estimated timestamps use:
 * - startDate: T09:00:00 (DEFAULT_START_TIME)
 * - endDate: T17:00:00 (DEFAULT_END_TIME)
 * - Legacy dates without T component are also treated as estimated
 *
 * effectiveHours is looked up from /data/devPointsToHours/{scoringKey}/{devPoints}
 */

const DEFAULT_START_TIME = '09:00:00';
const DEFAULT_END_TIME = '17:00:00';

/**
 * Check if a timestamp is estimated (uses default time or has no time component).
 * @param {string} timestamp - Date string
 * @param {'start'|'end'} context - Whether this is a start or end date
 * @returns {boolean} true if estimated
 */
function isEstimatedTimestamp(timestamp, context) {
  if (!timestamp.includes('T')) return true;
  const timePart = timestamp.split('T')[1];
  const defaultTime = context === 'end' ? DEFAULT_END_TIME : DEFAULT_START_TIME;
  return timePart === defaultTime || timePart.startsWith(defaultTime);
}

/**
 * Convert scoring system name to Firebase key.
 * '1-5' → 'scale_1_5', 'fibonacci' → 'fibonacci'
 * @param {string} scoringSystem
 * @returns {string}
 */
function scoringSystemToKey(scoringSystem) {
  if (scoringSystem === 'fibonacci') return 'fibonacci';
  return 'scale_1_5';
}

/**
 * Main handler for task Done&Validated effectiveHours recalculation.
 * @param {Object} params - { projectId, section, cardId }
 * @param {Object} beforeData - Card data before the change
 * @param {Object} afterData - Card data after the change
 * @param {Object} deps - Dependencies { db, logger }
 * @returns {Object|null}
 */
async function handleTaskDoneValidated(params, beforeData, afterData, deps) {
  const { projectId, section, cardId } = params;
  const { db, logger } = deps;

  // Only process tasks
  if (!section.toLowerCase().startsWith('tasks_')) {
    return null;
  }

  const beforeStatus = beforeData?.status;
  const afterStatus = afterData?.status;

  // Only trigger on transition TO Done&Validated
  if (afterStatus !== 'Done&Validated' || beforeStatus === 'Done&Validated') {
    return null;
  }

  // Guard: if effectiveHours already set, skip (prevent infinite loop)
  if (afterData.effectiveHours) {
    logger.info('onTaskDoneValidated: effectiveHours already set, skipping', {
      projectId, cardId, effectiveHours: afterData.effectiveHours
    });
    return null;
  }

  const { startDate, endDate, devPoints } = afterData;

  // Guard: missing dates
  if (!startDate || !endDate) {
    logger.warn('onTaskDoneValidated: missing dates, skipping', {
      projectId, cardId, startDate, endDate
    });
    return null;
  }

  // Guard: missing devPoints
  if (!devPoints) {
    logger.warn('onTaskDoneValidated: missing devPoints, skipping', {
      projectId, cardId
    });
    return null;
  }

  // Check if both timestamps are estimated
  const startEstimated = isEstimatedTimestamp(startDate, 'start');
  const endEstimated = isEstimatedTimestamp(endDate, 'end');

  if (!startEstimated || !endEstimated) {
    logger.info('onTaskDoneValidated: real timestamps detected, skipping recalculation', {
      projectId, cardId, startDate, endDate, startEstimated, endEstimated
    });
    return null;
  }

  // Read project scoring system
  const scoringSnap = await db.ref(`/projects/${projectId}/scoringSystem`).once('value');
  const scoringSystem = scoringSnap.val() || '1-5';
  const scoringKey = scoringSystemToKey(scoringSystem);

  // Read hours mapping
  const hoursSnap = await db.ref(`/data/devPointsToHours/${scoringKey}/${devPoints}`).once('value');
  const hours = hoursSnap.val();

  if (!hours) {
    logger.warn('onTaskDoneValidated: no mapping found for devPoints', {
      projectId, cardId, scoringKey, devPoints
    });
    return null;
  }

  // Write effectiveHours to the card
  const cardPath = `/cards/${projectId}/${section}/${cardId}`;
  await db.ref(cardPath).update({ effectiveHours: hours });

  logger.info('onTaskDoneValidated: effectiveHours recalculated', {
    projectId, cardId, scoringKey, devPoints, effectiveHours: hours
  });

  return { effectiveHours: hours };
}

module.exports = { handleTaskDoneValidated };

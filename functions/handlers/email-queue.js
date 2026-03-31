/**
 * Email Queue - RTDB-based email notification queue
 *
 * Instead of sending emails immediately on card status changes,
 * notifications are queued in /emailQueue/{type}/{pushId} and
 * processed by the hourly digest function.
 *
 * Queue structure:
 * /emailQueue/toValidate/{pushId}: task validation requests
 * /emailQueue/bugFixed/{pushId}: bug fix notifications
 */

const QUEUE_PATH = '/emailQueue';

/**
 * Add a task validation notification to the email queue
 * @param {Object} db - Firebase RTDB instance
 * @param {Object} data - Queue entry data
 * @param {string} data.recipientEmail - Recipient email address
 * @param {string} data.recipientName - Recipient display name
 * @param {string} data.cardId - Card ID (e.g. "C4D-TSK-0042")
 * @param {string} data.projectId - Project ID
 * @param {string} data.taskTitle - Task title
 * @param {string} data.developerName - Developer who completed the task
 * @param {Array} data.acceptanceCriteria - Structured acceptance criteria
 * @returns {Promise<string>} Queue entry key
 */
async function queueValidationEmail(db, data) {
  const ref = db.ref(`${QUEUE_PATH}/toValidate`).push();
  await ref.set({
    type: 'toValidate',
    recipientEmail: data.recipientEmail,
    recipientName: data.recipientName,
    cardId: data.cardId,
    projectId: data.projectId,
    taskTitle: data.taskTitle,
    developerName: data.developerName || null,
    acceptanceCriteria: data.acceptanceCriteria || [],
    timestamp: Date.now()
  });
  return ref.key;
}

/**
 * Add a bug fix notification to the email queue
 * @param {Object} db - Firebase RTDB instance
 * @param {Object} data - Queue entry data
 * @param {string} data.recipientEmail - Recipient email address
 * @param {string} data.cardId - Card ID (e.g. "C4D-BUG-0015")
 * @param {string} data.projectId - Project ID
 * @param {string} data.bugTitle - Bug title
 * @param {string} data.developerName - Developer who fixed the bug
 * @param {string} data.description - Bug description
 * @returns {Promise<string>} Queue entry key
 */
async function queueBugFixedEmail(db, data) {
  const ref = db.ref(`${QUEUE_PATH}/bugFixed`).push();
  await ref.set({
    type: 'bugFixed',
    recipientEmail: data.recipientEmail,
    cardId: data.cardId,
    projectId: data.projectId,
    bugTitle: data.bugTitle,
    developerName: data.developerName || null,
    description: data.description || '',
    timestamp: Date.now()
  });
  return ref.key;
}

/**
 * Read all pending queue entries of a given type
 * @param {Object} db - Firebase RTDB instance
 * @param {string} type - Queue type ('toValidate' or 'bugFixed')
 * @returns {Promise<Array<{key: string, data: Object}>>} Pending entries
 */
async function readQueue(db, type) {
  const snapshot = await db.ref(`${QUEUE_PATH}/${type}`).once('value');
  const val = snapshot.val();
  if (!val) return [];

  return Object.entries(val).map(([key, data]) => ({ key, data }));
}

/**
 * Remove processed entries from the queue
 * @param {Object} db - Firebase RTDB instance
 * @param {string} type - Queue type ('toValidate' or 'bugFixed')
 * @param {string[]} keys - Array of entry keys to remove
 * @returns {Promise<void>}
 */
async function removeFromQueue(db, type, keys) {
  if (!keys || keys.length === 0) return;

  const updates = {};
  for (const key of keys) {
    updates[`${QUEUE_PATH}/${type}/${key}`] = null;
  }
  await db.ref().update(updates);
}

/**
 * Group queue entries by recipient email
 * @param {Array<{key: string, data: Object}>} entries - Queue entries
 * @returns {Map<string, Array<Object>>} Entries grouped by recipientEmail
 */
function groupByRecipient(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const email = entry.data.recipientEmail;
    if (!groups.has(email)) {
      groups.set(email, []);
    }
    groups.get(email).push(entry);
  }

  return groups;
}

/**
 * Group entries by project within a recipient's list
 * @param {Array<{key: string, data: Object}>} entries - Entries for one recipient
 * @returns {Map<string, Array<Object>>} Entries grouped by projectId
 */
function groupByProject(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const projectId = entry.data.projectId;
    if (!groups.has(projectId)) {
      groups.set(projectId, []);
    }
    groups.get(projectId).push(entry);
  }

  return groups;
}

/**
 * Add a validation revert notification to the email queue.
 * Sent when a Cloud Function reverts an invalid status transition.
 * @param {Object} db - Firebase RTDB instance
 * @param {Object} data - Queue entry data
 * @param {string} data.recipientEmail - Developer/codeveloper email
 * @param {string} data.cardId - Card ID
 * @param {string} data.projectId - Project ID
 * @param {string} data.taskTitle - Task title
 * @param {string} data.attemptedStatus - Status that was attempted
 * @param {string} data.revertedToStatus - Status it was reverted to
 * @param {string} data.reason - Why the transition was rejected
 * @param {string[]} [data.missingFields] - Missing fields if applicable
 * @returns {Promise<string>} Queue entry key
 */
async function queueRevertEmail(db, data) {
  const ref = db.ref(`${QUEUE_PATH}/validationRevert`).push();
  await ref.set({
    type: 'validationRevert',
    recipientEmail: data.recipientEmail,
    cardId: data.cardId,
    projectId: data.projectId,
    taskTitle: data.taskTitle || '',
    attemptedStatus: data.attemptedStatus,
    revertedToStatus: data.revertedToStatus,
    reason: data.reason,
    missingFields: data.missingFields || [],
    timestamp: Date.now()
  });
  return ref.key;
}

module.exports = {
  QUEUE_PATH,
  queueValidationEmail,
  queueBugFixedEmail,
  queueRevertEmail,
  readQueue,
  removeFromQueue,
  groupByRecipient,
  groupByProject
};

/**
 * Handler for demo user cleanup Cloud Function.
 * Removes inactive demo users and their data after 7 days of inactivity.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { encodeEmailForFirebase } = require('../shared/email-utils.cjs');

/**
 * Cleanup inactive demo users and their data.
 * Only runs when DEMO_MODE=true.
 *
 * Criteria: users with role=demo claim whose lastSignInTime > 7 days ago.
 * Removes: Auth account, project data (/projects/Demo_*), cards, appPerms, claimsLog.
 *
 * @param {object} deps - { db, auth, logger, demoMode }
 * @returns {Promise<object>} Cleanup results
 */
async function handleDemoCleanup(deps) {
  const { db, auth, logger, demoMode } = deps;

  if (!demoMode) {
    logger.info('cleanupDemoUsers: DEMO_MODE is off, skipping');
    return { skipped: true, reason: 'DEMO_MODE is off' };
  }

  const INACTIVE_DAYS = 7;
  const cutoff = Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000;
  const deleted = [];
  const kept = [];

  try {
    // List all users (Firebase Auth paginates at 1000)
    let nextPageToken;
    const allUsers = [];
    do {
      const listResult = await auth.listUsers(1000, nextPageToken);
      allUsers.push(...listResult.users);
      nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    for (const userRecord of allUsers) {
      // Only process demo users
      const claims = userRecord.customClaims || {};
      if (claims.role !== 'demo') continue;

      const lastActive = userRecord.metadata.lastSignInTime
        ? new Date(userRecord.metadata.lastSignInTime).getTime()
        : new Date(userRecord.metadata.creationTime).getTime();

      if (lastActive > cutoff) {
        kept.push(userRecord.email);
        continue;
      }

      // User is inactive — delete their data
      const email = userRecord.email || '';
      const userPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const projectId = `Demo_${userPrefix}`;
      const encodedEmail = encodeEmailForFirebase(email.toLowerCase());

      logger.info(`cleanupDemoUsers: Deleting inactive demo user ${email}`, {
        uid: userRecord.uid,
        lastActive: new Date(lastActive).toISOString(),
        projectId,
      });

      // Delete RTDB data (project, cards, appPerms, claimsLog)
      const deletions = {};
      deletions[`/projects/${projectId}`] = null;
      deletions[`/cards/${projectId}`] = null;
      deletions[`/data/appPerms/${encodedEmail}`] = null;
      deletions[`/userClaimsLog/${userRecord.uid}`] = null;
      deletions[`/history/${projectId}`] = null;
      deletions[`/notifications/${userRecord.uid}`] = null;
      await db.ref().update(deletions);

      // Delete Firebase Auth account
      await auth.deleteUser(userRecord.uid);

      deleted.push({ email, uid: userRecord.uid, projectId });
    }

    logger.info(`cleanupDemoUsers: Done. Deleted ${deleted.length}, kept ${kept.length}`, {
      deleted: deleted.map(d => d.email),
      kept,
    });

    return { deleted: deleted.length, kept: kept.length, details: deleted };
  } catch (error) {
    logger.error('cleanupDemoUsers: Error during cleanup', error);
    throw error;
  }
}

module.exports = { handleDemoCleanup };

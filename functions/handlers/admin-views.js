/**
 * Admin Views handler.
 * Re-syncs all /views entries from /cards data.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Handle the resyncAllViews callable function.
 * Re-generates all /views entries from /cards data.
 * Useful when view extraction logic changes (e.g., new fields like notesCount).
 *
 * @param {object} request - Firebase callable request
 * @param {object} deps - Injected dependencies
 * @param {object} deps.db - Firebase RTDB reference
 * @param {object} deps.logger - Logger instance
 * @param {Function} deps.handleSyncCardViews - Card views sync handler
 * @returns {Promise<object>}
 */
async function handleResyncAllViews(request, deps) {
  const { db, logger, handleSyncCardViews } = deps;

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const callerClaims = request.auth.token;
  const superAdminEmail = process.env.PUBLIC_SUPER_ADMIN_EMAIL || '';
  const isSuperAdmin = request.auth.token.email === superAdminEmail;
  const isAppAdmin = callerClaims.isAppAdmin === true;

  if (!isSuperAdmin && !isAppAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can resync views.');
  }

  const cardsSnap = await db.ref('/cards').once('value');
  if (!cardsSnap.exists()) {
    return { success: true, message: 'No cards found', stats: {} };
  }

  const cardsData = cardsSnap.val();
  const stats = { tasks: 0, bugs: 0, proposals: 0, projects: 0 };

  for (const [projectId, projectData] of Object.entries(cardsData)) {
    if (!projectData || typeof projectData !== 'object') continue;
    stats.projects++;

    for (const [sectionName, sectionData] of Object.entries(projectData)) {
      if (!sectionData || typeof sectionData !== 'object') continue;

      const sectionLower = sectionName.toLowerCase();
      let viewType = null;
      if (sectionLower.startsWith('tasks_')) viewType = 'task-list';
      else if (sectionLower.startsWith('bugs_')) viewType = 'bug-list';
      else if (sectionLower.startsWith('proposals_')) viewType = 'proposal-list';
      else continue;

      for (const [cardId, cardData] of Object.entries(sectionData)) {
        if (!cardData || typeof cardData !== 'object') continue;
        if (cardData.deletedAt) continue;

        // Use the same handler to build view data
        await handleSyncCardViews(
          { projectId, section: sectionName, cardId },
          null,
          cardData,
          { db, logger }
        );

        if (viewType === 'task-list') stats.tasks++;
        else if (viewType === 'bug-list') stats.bugs++;
        else if (viewType === 'proposals') stats.proposals++;
      }
    }
  }

  logger.info('resyncAllViews completed', stats);
  return { success: true, stats };
}

module.exports = {
  handleResyncAllViews,
};

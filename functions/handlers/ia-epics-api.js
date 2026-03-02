/**
 * IA Epics API handler.
 * HTTP endpoint to get epics for a project, used by IA for automatic epic assignment.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

/**
 * Handle the getProjectEpics HTTP request.
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {object} deps - Injected dependencies
 * @param {object} deps.db - Firebase RTDB reference (from getDatabase())
 * @param {object} deps.logger - Logger instance
 * @param {string} deps.apiKeyValue - Expected API key value
 * @returns {Promise<void>}
 */
async function handleGetProjectEpics(req, res, deps) {
  const { db, logger, apiKeyValue } = deps;

  try {
    // Allow GET and POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
    }

    // Validate API Key
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey || !apiKeyValue || apiKey !== apiKeyValue) {
      logger.warn('getProjectEpics: Invalid or missing API key', { ip: req.ip });
      return res.status(401).json({ error: 'Unauthorized. Invalid API key.' });
    }

    // Get projectId from query or body
    const projectId = req.query.projectId || req.body?.projectId;
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Optional filters
    const yearFilter = req.query.year || req.body?.year;
    const includeAll = (req.query.includeAll || req.body?.includeAll) === 'true';

    // Verify project exists
    const projectSnap = await db.ref(`/projects/${projectId}`).once('value');
    if (!projectSnap.exists()) {
      return res.status(404).json({ error: `Project "${projectId}" not found` });
    }

    // Get epics from Firebase
    const epicsPath = `/cards/${projectId}/EPICS_${projectId}`;
    const epicsSnap = await db.ref(epicsPath).once('value');
    const epicsData = epicsSnap.val() || {};

    // Process and filter epics
    const epics = [];
    Object.entries(epicsData).forEach(([firebaseId, epic]) => {
      // Skip deleted epics
      if (epic.deletedAt) return;

      // Apply year filter if specified
      if (yearFilter) {
        const targetYear = Number(yearFilter);
        if (epic.year) {
          if (Number(epic.year) !== targetYear) return;
        } else if (!includeAll) {
          // Skip epics without year unless includeAll is true
          return;
        }
      }

      epics.push({
        cardId: epic.cardId || firebaseId,
        firebaseId,
        title: epic.title || '',
        description: epic.description || '',
        epicType: epic.epicType || 'default',
        year: epic.year || null,
        status: epic.status || '',
        startDate: epic.startDate || '',
        endDate: epic.endDate || '',
        businessPoints: epic.businessPoints || 0,
        devPoints: epic.devPoints || 0
      });
    });

    // Sort by title for consistency
    epics.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    logger.info('getProjectEpics: Epics retrieved', {
      projectId,
      count: epics.length,
      yearFilter: yearFilter || 'none'
    });

    res.json({
      success: true,
      projectId,
      count: epics.length,
      epics
    });

  } catch (error) {
    logger.error('getProjectEpics: Error retrieving epics', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = {
  handleGetProjectEpics,
};

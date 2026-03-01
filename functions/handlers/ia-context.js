/**
 * IA Context handler.
 * Provides one-time token endpoint to deliver task/bug context for IA tooling.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildBranchName, getRepositoryForTask } = require('../shared/card-utils.cjs');

/**
 * Cached global agents file content.
 * @type {string|null}
 */
let cachedGlobalAgents = null;

/**
 * Load and cache global agents file content.
 * @param {object} [logger=console] - Logger instance
 * @returns {string}
 */
function getGlobalAgentsContent(logger = console) {
  if (cachedGlobalAgents !== null) return cachedGlobalAgents;
  try {
    const candidatePaths = [
      path.join(__dirname, "..", "..", "AGENTS.md"),
      path.join(__dirname, "..", "AGENTS.md")
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        cachedGlobalAgents = fs.readFileSync(p, "utf8");
        break;
      }
    }
    if (cachedGlobalAgents === null) {
      cachedGlobalAgents = "";
    }
  } catch (error_) {
    logger.warn('Could not load global agents file', { error: error_.message });
    cachedGlobalAgents = "";
  }
  return cachedGlobalAgents;
}

/**
 * Extract token from request path or query.
 * @param {object} req - HTTP request
 * @returns {string}
 */
function extractTokenFromRequest(req) {
  // NOSONAR - simple non-capturing patterns for trimming slashes
  const tokenFromPath = (req.path || '').replace(/^\/+/, '').replace(/\/+$/, '').split('/').pop();
  return (req.query.token || tokenFromPath || '').toString().trim();
}

/**
 * Find IA link in available databases.
 * @param {string} token
 * @param {object} primaryDb - Primary RTDB instance
 * @param {object|null} secondaryDb - Optional secondary RTDB instance
 * @returns {Promise<{ linkRef: object|null, snap: object|null, dbUsed: object|null }>}
 */
async function findIaLinkInDatabases(token, primaryDb, secondaryDb) {
  const dbCandidates = [primaryDb].concat(secondaryDb ? [secondaryDb] : []);

  for (const db of dbCandidates) {
    const candidateRef = db.ref(`/ia/links/${token}`);
    const candidateSnap = await candidateRef.once('value');
    if (candidateSnap.exists()) {
      return { linkRef: candidateRef, snap: candidateSnap, dbUsed: db };
    }
  }

  return { linkRef: null, snap: null, dbUsed: null };
}

/**
 * Build IA context payload from project and card data (task or bug).
 * @param {string} token
 * @param {string} projectId
 * @param {string} cardId
 * @param {object} project
 * @param {object} card
 * @param {object} linkData
 * @param {boolean} [isBug=false]
 * @param {object} [logger=console] - Logger for getGlobalAgentsContent
 * @returns {object}
 */
function buildIaContextPayload(token, projectId, cardId, project, card, linkData, isBug = false, logger = console) {
  const branchName = buildBranchName(cardId, card.title || card.cardId || card.id || '');
  const selectedRepo = getRepositoryForTask(project, card);

  const basePayload = {
    token,
    projectId,
    cardType: isBug ? 'bug' : 'task',
    branchName,
    repository: selectedRepo.url,
    repositoryLabel: selectedRepo.label,
    expiresAt: linkData.expiresAt || null,
    agents: {
      global: getGlobalAgentsContent(logger),
      project: project.businessContext || ''
    },
    project: {
      name: project.name || projectId,
      description: project.description || '',
      languages: Array.isArray(project.languages) ? project.languages : [],
      frameworks: Array.isArray(project.frameworks) ? project.frameworks : [],
      repoUrl: project.repoUrl || project.repositoryUrl || '',
      iaEnabled: Boolean(project.iaEnabled)
    },
    metadata: {
      createdBy: linkData.createdBy || null,
      createdAt: linkData.createdAt || null,
      used: false
    }
  };

  if (isBug) {
    // Bug-specific fields
    basePayload.bugId = cardId;
    basePayload.bug = {
      title: card.title || '',
      description: card.description || '',
      acceptanceCriteria: card.acceptanceCriteria || '',
      acceptanceCriteriaStructured: card.acceptanceCriteriaStructured || null,
      notes: card.notes || '',
      developer: card.developer || '',
      status: card.status || '',
      priority: card.priority || '',
      bugType: card.bugType || 'default',
      registerDate: card.registerDate || '',
      startDate: card.startDate || '',
      endDate: card.endDate || ''
    };
  } else {
    // Task-specific fields
    basePayload.taskId = cardId;
    basePayload.task = {
      title: card.title || '',
      description: card.description || card.descriptionStructured || '',
      descriptionStructured: card.descriptionStructured || null,
      acceptanceCriteria: card.acceptanceCriteria || '',
      acceptanceCriteriaStructured: card.acceptanceCriteriaStructured || null,
      notes: card.notes || '',
      sprint: card.sprint || '',
      epic: card.epic || '',
      developer: card.developer || '',
      validator: card.validator || '',
      status: card.status || '',
      expedited: Boolean(card.expedited),
      businessPoints: card.businessPoints || '',
      devPoints: card.devPoints || ''
    };
  }

  return basePayload;
}

/**
 * Handle the getIaContext HTTP request.
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {object} deps - Injected dependencies
 * @param {object} deps.primaryDb - Primary RTDB instance
 * @param {object|null} deps.secondaryDb - Secondary RTDB instance
 * @param {object} deps.logger - Logger instance
 * @param {boolean} deps.iaEnabled - Whether IA is globally enabled
 * @returns {Promise<void>}
 */
async function handleGetIaContext(req, res, deps) {
  const { primaryDb, secondaryDb, logger, iaEnabled } = deps;

  try {
    if (!iaEnabled) {
      return res.status(503).json({ error: 'IA no disponible globalmente' });
    }

    const token = extractTokenFromRequest(req);
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const { linkRef, snap, dbUsed } = await findIaLinkInDatabases(token, primaryDb, secondaryDb);
    if (!snap || !linkRef || !dbUsed) {
      return res.status(410).json({ error: 'Token inválido o consumido' });
    }

    const linkData = snap.val() || {};
    const now = Date.now();

    if (linkData.used) {
      return res.status(410).json({ error: 'Token ya usado' });
    }

    if (linkData.expiresAt && now > linkData.expiresAt) {
      await linkRef.update({ used: true, usedAt: now, expired: true });
      return res.status(410).json({ error: 'Token expirado' });
    }

    const { projectId, taskId, bugId, cardType } = linkData;
    const cardId = taskId || bugId;
    const isBug = cardType === 'bug' || !!bugId;

    if (!projectId || !cardId) {
      return res.status(400).json({ error: 'Token incompleto' });
    }

    const projectSnap = await dbUsed.ref(`/projects/${projectId}`).once('value');
    if (!projectSnap.exists()) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    const project = projectSnap.val() || {};

    // Determine path based on card type
    const cardPath = isBug
      ? `/cards/${projectId}/BUGS_${projectId}/${cardId}`
      : `/cards/${projectId}/TASKS_${projectId}/${cardId}`;
    const cardSnap = await dbUsed.ref(cardPath).once('value');
    if (!cardSnap.exists()) {
      return res.status(404).json({ error: isBug ? 'Bug no encontrado' : 'Tarea no encontrada' });
    }
    const card = cardSnap.val() || {};

    const payload = buildIaContextPayload(token, projectId, cardId, project, card, linkData, isBug, logger);

    await linkRef.update({
      used: true,
      usedAt: now,
      usedIp: req.ip || null,
      lastStatus: 'delivered'
    });

    res.json(payload);
  } catch (error) {
    logger.error('Error in getIaContext:', error);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = {
  handleGetIaContext,
  // Exported for testing
  extractTokenFromRequest,
  findIaLinkInDatabases,
  buildIaContextPayload,
  getGlobalAgentsContent,
};

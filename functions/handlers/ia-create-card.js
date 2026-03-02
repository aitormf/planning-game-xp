/**
 * IA Create Card handler.
 * HTTP endpoint for programmatic card creation (Claude, scripts, etc.).
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { generateCardId } = require('../shared/card-utils.cjs');

/**
 * Validate create card request.
 * @param {object} data - Request body
 * @returns {string[]} Array of validation error messages (empty if valid)
 */
function validateCreateCardRequest(data) {
  const errors = [];

  if (!data.projectId || typeof data.projectId !== 'string') {
    errors.push('projectId is required and must be a string');
  }

  if (!data.type || !['task', 'bug'].includes(data.type)) {
    errors.push('type is required and must be "task" or "bug"');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('title is required and must be a non-empty string');
  }

  return errors;
}

/**
 * Build task card data structure.
 * @param {object} data - Request data
 * @param {string} cardId - Generated card ID
 * @param {string} firebaseId - Firebase push key
 * @param {string} createdBy - Creator email
 * @returns {object} Task card data
 */
function buildTaskCardData(data, cardId, firebaseId, createdBy) {
  const now = new Date().toISOString();

  // Build descriptionStructured from role/goal/benefit if provided
  let descriptionStructured = data.descriptionStructured || null;
  if (!descriptionStructured && (data.role || data.goal || data.benefit)) {
    descriptionStructured = {
      role: data.role || '',
      goal: data.goal || '',
      benefit: data.benefit || ''
    };
  }

  return {
    // Required fields
    cardId,
    id: firebaseId,
    firebaseId,
    cardType: 'task-card',
    group: 'tasks',
    section: 'tasks',
    projectId: data.projectId,
    title: data.title.trim(),
    createdBy,
    status: data.status || 'To Do',

    // Description: structured format preferred
    description: data.description || '', // Legacy field
    descriptionStructured,
    notes: data.notes || '',
    sprint: data.sprint || '',
    epic: data.epic || '',
    developer: data.developer || '',
    validator: data.validator || '',
    businessPoints: data.businessPoints || 0,
    devPoints: data.devPoints || 0,
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    desiredDate: data.desiredDate || '',
    year: data.year || new Date().getFullYear(),
    expedited: Boolean(data.expedited),
    blockedByBusiness: Boolean(data.blockedByBusiness),
    blockedByDevelopment: Boolean(data.blockedByDevelopment),
    acceptanceCriteria: data.acceptanceCriteria || '',
    acceptanceCriteriaStructured: data.acceptanceCriteriaStructured || [],
    repositoryLabel: data.repositoryLabel || '',
    coDeveloper: data.coDeveloper || '',

    // Metadata
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Build bug card data structure.
 * @param {object} data - Request data
 * @param {string} cardId - Generated card ID
 * @param {string} firebaseId - Firebase push key
 * @param {string} createdBy - Creator email
 * @returns {object} Bug card data
 */
function buildBugCardData(data, cardId, firebaseId, createdBy) {
  const now = new Date().toISOString();

  // Build descriptionStructured from role/goal/benefit if provided
  let descriptionStructured = data.descriptionStructured || null;
  if (!descriptionStructured && (data.role || data.goal || data.benefit)) {
    descriptionStructured = {
      role: data.role || '',
      goal: data.goal || '',
      benefit: data.benefit || ''
    };
  }

  return {
    // Required fields
    cardId,
    id: firebaseId,
    firebaseId,
    cardType: 'bug-card',
    group: 'bugs',
    section: 'bugs',
    projectId: data.projectId,
    title: data.title.trim(),
    createdBy,
    status: data.status || 'Created',
    priority: data.priority || 'Not Evaluated',

    // Description: structured format preferred
    description: data.description || '', // Legacy field
    descriptionStructured,
    notes: data.notes || '',
    sprint: data.sprint || '',
    developer: data.developer || '',
    bugType: data.bugType || 'default',
    registerDate: data.registerDate || now.split('T')[0],
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    year: data.year || new Date().getFullYear(),
    acceptanceCriteria: data.acceptanceCriteria || '',
    acceptanceCriteriaStructured: data.acceptanceCriteriaStructured || [],

    // C4D specific fields (optional)
    cinemaFile: data.cinemaFile || '',
    exportedFile: data.exportedFile || '',
    importedFile: data.importedFile || '',
    plugin: data.plugin || '',
    pluginVersion: data.pluginVersion || '',
    treatmentType: data.treatmentType || '',

    // Metadata
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Handle the createCard HTTP request.
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {object} deps - Injected dependencies
 * @param {object} deps.db - Firebase RTDB reference (from getDatabase())
 * @param {object} deps.firestore - Firestore instance
 * @param {object} deps.logger - Logger instance
 * @param {string} deps.apiKeyValue - Expected API key value
 * @returns {Promise<void>}
 */
async function handleCreateCard(req, res, deps) {
  const { db, firestore, logger, apiKeyValue } = deps;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Validate API Key
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey || !apiKeyValue || apiKey !== apiKeyValue) {
      logger.warn('createCard: Invalid or missing API key', { ip: req.ip });
      return res.status(401).json({ error: 'Unauthorized. Invalid API key.' });
    }

    // Parse body
    const data = req.body || {};

    // Validate required fields
    const validationErrors = validateCreateCardRequest(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Verify project exists
    const projectSnap = await db.ref(`/projects/${data.projectId}`).once('value');
    if (!projectSnap.exists()) {
      return res.status(404).json({ error: `Project "${data.projectId}" not found` });
    }

    // Determine section based on type
    const sectionPath = data.type === 'task'
      ? `TASKS_${data.projectId}`
      : `BUGS_${data.projectId}`;

    // Generate card ID
    const section = data.type === 'task' ? 'tasks' : 'bugs';
    const cardId = await generateCardId(data.projectId, section, firestore);

    // Generate Firebase ID
    const cardPath = `/cards/${data.projectId}/${sectionPath}`;
    const newCardRef = db.ref(cardPath).push();
    const firebaseId = newCardRef.key;

    // Build card data
    const createdBy = data.createdBy || process.env.PUBLIC_DEFAULT_API_EMAIL || 'api@example.com';
    const cardData = data.type === 'task'
      ? buildTaskCardData(data, cardId, firebaseId, createdBy)
      : buildBugCardData(data, cardId, firebaseId, createdBy);

    // Save to Firebase
    await newCardRef.set(cardData);

    logger.info('createCard: Card created successfully', {
      cardId,
      firebaseId,
      type: data.type,
      projectId: data.projectId
    });

    res.status(201).json({
      success: true,
      cardId,
      firebaseId,
      path: `${cardPath}/${firebaseId}`,
      type: data.type,
      title: cardData.title
    });

  } catch (error) {
    logger.error('createCard: Error creating card', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = {
  handleCreateCard,
  // Exported for testing
  validateCreateCardRequest,
  buildTaskCardData,
  buildBugCardData,
};

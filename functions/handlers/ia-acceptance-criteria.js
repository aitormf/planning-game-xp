/**
 * IA Acceptance Criteria handler.
 * Generates acceptance criteria for tasks using OpenAI.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');
const { callOpenAI } = require('../shared/openai-client.cjs');
const { buildAcceptanceText, buildUserStoryText } = require('../shared/card-utils.cjs');

/**
 * Validate generateAcceptanceCriteria request parameters.
 * @param {object} request - Firebase callable request
 * @returns {{ projectId: string, taskId: string, taskPayload: object|null, force: boolean }}
 * @throws {HttpsError}
 */
function validateAcceptanceCriteriaRequest(request) {
  const payload = request.data || {};
  const projectId = typeof payload.projectId === 'string' ? payload.projectId.trim() : '';
  const taskId = typeof payload.taskId === 'string' ? payload.taskId.trim() : '';
  const taskPayload = payload.task && typeof payload.task === 'object' ? payload.task : null;
  const force = Boolean(payload.force);

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para generar criterios con IA.');
  }
  if (!projectId || (!taskId && !taskPayload)) {
    throw new HttpsError('invalid-argument', 'Faltan projectId o taskId.');
  }

  return { projectId, taskId, taskPayload, force };
}

/**
 * Fetch task data from Firebase or payload.
 * @param {object} db - Firebase RTDB reference
 * @param {string} projectId
 * @param {string} taskId
 * @param {object|null} taskPayload
 * @returns {Promise<{ task: object, taskPath: string|null }>}
 * @throws {HttpsError}
 */
async function fetchTaskForAcceptanceCriteria(db, projectId, taskId, taskPayload) {
  const projectSnap = await db.ref(`/projects/${projectId}`).once('value');
  if (!projectSnap.exists()) {
    throw new HttpsError('not-found', 'Proyecto no encontrado.');
  }

  let task = null;
  let taskPath = null;

  if (taskId) {
    taskPath = `/cards/${projectId}/TASKS_${projectId}/${taskId}`;
    const taskSnap = await db.ref(taskPath).once('value');
    if (!taskSnap.exists()) {
      throw new HttpsError('not-found', 'Tarea no encontrada.');
    }
    task = taskSnap.val() || {};
  } else {
    task = taskPayload || {};
  }

  return { task, taskPath };
}

/**
 * Check if task has existing acceptance criteria.
 * @param {object} task
 * @returns {boolean}
 */
function hasExistingAcceptanceCriteria(task) {
  const existing = Array.isArray(task.acceptanceCriteriaStructured) ? task.acceptanceCriteriaStructured : [];
  return existing.some((scenario) =>
    (scenario?.given || '').trim() || (scenario?.when || '').trim() || (scenario?.then || '').trim()
  );
}

/**
 * Call OpenAI API to generate acceptance criteria.
 * @param {string} apiKey
 * @param {string} title
 * @param {string} userStory
 * @param {string} notes
 * @returns {Promise<object>} Raw OpenAI response
 */
async function callOpenAIForAcceptanceCriteria(apiKey, title, userStory, notes) {
  const systemPrompt = [
    'Eres un analista QA que redacta criterios de aceptación en español.',
    'IMPORTANTE: Devuelve SOLO JSON válido con esta estructura exacta:',
    '{"scenarios":[{"given":"texto en español","when":"texto en español","then":"texto en español"}]}',
    'Las claves JSON DEBEN ser exactamente: "given", "when", "then" (en minúsculas, en inglés).',
    'El contenido de cada campo debe estar en español usando Dado/Cuando/Entonces.',
    'Genera entre 1 y 5 escenarios claros y verificables.'
  ].join(' ');

  const userPrompt = [
    `Título: ${title}`,
    `Historia de usuario:\n${userStory || 'Sin descripción'}`,
    notes ? `Notas:\n${notes}` : ''
  ].filter(Boolean).join('\n\n');

  return callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    temperature: 0.2,
    errorContext: 'generating acceptance criteria',
    errorMessage: 'No se pudo generar Acceptance Criteria con IA.'
  });
}

/**
 * Parse and validate OpenAI response for acceptance criteria.
 *
 * CONTRACT:
 * - Response must be valid JSON
 * - Must have "scenarios" array
 * - Each scenario MUST have keys: "given", "when", "then" (lowercase English)
 * - Each field must be a non-empty string
 *
 * NOTE: This function is also used by ia-bug-analysis.js for bug acceptance criteria.
 *
 * @param {object} aiData - Raw response from OpenAI API
 * @param {object} [logger=console] - Logger instance
 * @returns {Array} Array of validated scenario objects
 * @throws {HttpsError} If response doesn't match the expected contract
 */
function parseAcceptanceCriteriaResponse(aiData, logger = console) {
  const content = aiData?.choices?.[0]?.message?.content || '';

  // Validate: response must not be empty
  if (!content) {
    logger.error('Empty OpenAI response', { aiData });
    throw new HttpsError('internal', 'La IA devolvió una respuesta vacía.');
  }

  // Validate: must be valid JSON
  let parsed = null;
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    logger.error('Invalid JSON from OpenAI', { content, error: parseError.message });
    throw new HttpsError('internal', 'La IA devolvió JSON inválido.');
  }

  // Validate: must have "scenarios" array
  if (!parsed || !Array.isArray(parsed.scenarios)) {
    logger.error('Missing scenarios array', { parsed });
    throw new HttpsError('internal', 'La IA no devolvió el array "scenarios" esperado.');
  }

  // Validate: scenarios array must not be empty
  if (parsed.scenarios.length === 0) {
    logger.error('Empty scenarios array', { parsed });
    throw new HttpsError('failed-precondition', 'La IA devolvió un array de escenarios vacío.');
  }

  // Validate each scenario strictly
  const validationErrors = [];
  const scenarios = [];

  parsed.scenarios.forEach((scenario, index) => {
    const scenarioErrors = [];

    // Check for required keys (must be lowercase English)
    if (typeof scenario?.given !== 'string') {
      scenarioErrors.push(`scenario[${index}]: missing or invalid "given" key`);
    }
    if (typeof scenario?.when !== 'string') {
      scenarioErrors.push(`scenario[${index}]: missing or invalid "when" key`);
    }
    if (typeof scenario?.then !== 'string') {
      scenarioErrors.push(`scenario[${index}]: missing or invalid "then" key`);
    }

    // Check for Spanish keys (contract violation)
    if (scenario?.Dado !== undefined || scenario?.Cuando !== undefined || scenario?.Entonces !== undefined) {
      scenarioErrors.push(`scenario[${index}]: uses Spanish keys (Dado/Cuando/Entonces) instead of required English keys (given/when/then)`);
    }

    if (scenarioErrors.length > 0) {
      validationErrors.push(...scenarioErrors);
    } else {
      // Extract and validate content
      const given = scenario.given.toString().trim();
      const when = scenario.when.toString().trim();
      const then = scenario.then.toString().trim(); // NOSONAR - Gherkin scenario field

      // At least one field must have content
      if (!given && !when && !then) {
        validationErrors.push(`scenario[${index}]: all fields are empty`);
      } else {
        scenarios.push({ given, when, then, raw: '' });
      }
    }
  });

  // If there are validation errors, log them and throw
  if (validationErrors.length > 0) {
    logger.error('Scenario validation failed', {
      errors: validationErrors,
      rawScenarios: JSON.stringify(parsed.scenarios).substring(0, 500)
    });
    throw new HttpsError(
      'internal',
      `La IA devolvió escenarios con formato incorrecto: ${validationErrors[0]}`
    );
  }

  // Final check: must have at least one valid scenario
  if (scenarios.length === 0) {
    logger.error('No valid scenarios after validation');
    throw new HttpsError('failed-precondition', 'La IA no devolvió escenarios válidos.');
  }

  return scenarios;
}

/**
 * Handle the generateAcceptanceCriteria callable function.
 * @param {object} request - Firebase callable request
 * @param {object} deps - Injected dependencies
 * @param {object} deps.db - Firebase RTDB reference
 * @param {object} deps.logger - Logger instance
 * @param {string} deps.apiKey - OpenAI API key
 * @returns {Promise<object>}
 */
async function handleGenerateAcceptanceCriteria(request, deps) {
  const { db, logger, apiKey } = deps;
  const { projectId, taskId, taskPayload, force } = validateAcceptanceCriteriaRequest(request);

  const { task, taskPath } = await fetchTaskForAcceptanceCriteria(db, projectId, taskId, taskPayload);

  const existing = Array.isArray(task.acceptanceCriteriaStructured) ? task.acceptanceCriteriaStructured : [];
  if (!force && hasExistingAcceptanceCriteria(task)) {
    return {
      status: 'skipped',
      acceptanceCriteriaStructured: existing,
      acceptanceCriteria: task.acceptanceCriteria || buildAcceptanceText(existing)
    };
  }

  const userStory = buildUserStoryText(task);
  const notes = (task.notes || '').toString();
  const title = (task.title || task.cardId || task.id || '').toString();

  const aiData = await callOpenAIForAcceptanceCriteria(apiKey, title, userStory, notes);
  const scenarios = parseAcceptanceCriteriaResponse(aiData, logger);

  const acceptanceText = buildAcceptanceText(scenarios);
  if (taskPath) {
    await db.ref(taskPath).update({
      acceptanceCriteriaStructured: scenarios,
      acceptanceCriteria: acceptanceText
    });
  }

  return {
    status: 'ok',
    acceptanceCriteriaStructured: scenarios,
    acceptanceCriteria: acceptanceText
  };
}

module.exports = {
  handleGenerateAcceptanceCriteria,
  // Exported for shared use (bug analysis uses parseAcceptanceCriteriaResponse)
  parseAcceptanceCriteriaResponse,
  // Exported for testing
  validateAcceptanceCriteriaRequest,
  fetchTaskForAcceptanceCriteria,
  hasExistingAcceptanceCriteria,
  callOpenAIForAcceptanceCriteria,
};

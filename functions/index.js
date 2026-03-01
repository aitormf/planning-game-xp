/**
 * Firebase Functions for PlanningGameXP
 * 
 * Weekly Task Summary Email Function
 * Sends weekly task summaries every Monday to project team members
 */

const functions = require("firebase-functions/v1");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const {onValueCreated, onValueUpdated, onValueWritten} = require("firebase-functions/v2/database");
const admin = require("firebase-admin");
const {initializeApp} = require("firebase-admin/app");
const {getDatabase} = require("firebase-admin/database");
const {getMessaging} = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");
const {defineSecret} = require("firebase-functions/params");
const axios = require("axios");
const fs = require("node:fs");
const path = require("node:path");

const { handleCardToValidate } = require("./handlers/on-card-to-validate");
const { handleBugFixed } = require("./handlers/on-bug-fixed");
const { handleHourlyDigest } = require("./handlers/hourly-validation-digest");
const { handleTaskStatusValidation } = require("./handlers/on-task-status-validation");
const { handleSyncCardViews } = require("./handlers/sync-card-views");
const { handlePortalBugResolved } = require("./handlers/on-portal-bug-resolved");
const { extractKeywords, findBestEpicMatch } = require("./helpers/epic-inference");

// Shared utilities (extracted from this file)
const { encodeEmailForFirebase, decodeEmailFromFirebase, normalizeEmail, normalizeGmailEmail, extractEmails, resolveEmail, resolveName } = require('./shared/email-utils.cjs');
const { buildAcceptanceText, buildUserStoryText, buildBranchName, getAbbrId, generateCardId, getRepositoryForTask, hasActiveProject } = require('./shared/card-utils.cjs');
const { isEmailPreAuthorized, generateNextId } = require('./shared/auth-utils.cjs');

// Handlers (extracted from this file)
const { handlePushNotification } = require('./handlers/push-notification');
const { handleDemoCleanup } = require('./handlers/demo-cleanup');
const { handleRequestEmailAccess, handleProvisionDemoData, handleSetEncodedEmailClaim } = require('./handlers/auth-provisioning');
const { handleWeeklyEmail } = require('./handlers/weekly-email');
const { getMsalConfig: _getMsalConfig, getGraphAccessToken: _getGraphAccessToken, sendEmail: _sendEmail } = require('./shared/ms-graph.cjs');

// Demo mode: when DEMO_MODE=true, all new users are auto-allowed with role=demo.
// Read from process.env first, then fall back to reading functions/.env directly
// (Firebase CLI may not inject .env vars during module analysis phase).
function readDemoMode() {
  const envVal = (process.env.DEMO_MODE || '').toString().trim().toLowerCase();
  if (envVal === 'true') return true;
  if (envVal) return false;
  // Fallback: read from functions/.env file directly
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const match = envContent.match(/^DEMO_MODE\s*=\s*(.+)$/m);
    if (match) return match[1].trim().toLowerCase() === 'true';
  } catch (_) { /* .env not found, not demo mode */ }
  return false;
}
const DEMO_MODE = readDemoMode();

// normalizeEmail, extractEmails → shared/email-utils.cjs

// Initialize Firebase Admin
initializeApp();

const firestore = admin.firestore();

// Primary RTDB (default project / env)
const primaryDb = getDatabase();

// Optional secondary RTDB (e.g., tests) via env var IA_SECONDARY_DATABASE_URL
let secondaryDb = null;
const secondaryDbUrl = process.env.IA_SECONDARY_DATABASE_URL || process.env.SECONDARY_DATABASE_URL;
if (secondaryDbUrl) {
  try {
    const secondaryApp = admin.initializeApp({databaseURL: secondaryDbUrl}, 'secondary');
    secondaryDb = getDatabase(secondaryApp);
  } catch (err) {
    logger.error('Failed to init secondary RTDB', { error: err });
  }
}

const ACCOUNT_REQUESTS_COLLECTION = 'accountRequests';
const ALLOWED_SIGNUP_EMAIL_DOMAINS = (process.env.PUBLIC_ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map(d => d.trim())
  .filter(Boolean);

// Define secrets for Azure AD / IA configuration (skipped in DEMO_MODE)
let msClientId, msClientSecret, msTenantId, msFromEmail, msAlertEmail;
let IA_GLOBAL_ENABLE, IA_API_KEY, CREATE_CARD_API_KEY;
if (!DEMO_MODE) {
  msClientId = defineSecret("MS_CLIENT_ID");
  msClientSecret = defineSecret("MS_CLIENT_SECRET");
  msTenantId = defineSecret("MS_TENANT_ID");
  msFromEmail = defineSecret("MS_FROM_EMAIL");
  msAlertEmail = defineSecret("MS_ALERT_EMAIL");
  IA_GLOBAL_ENABLE = defineSecret("IA_GLOBAL_ENABLE");
  IA_API_KEY = defineSecret("IA_API_KEY");
  CREATE_CARD_API_KEY = defineSecret("CREATE_CARD_API_KEY");
}

let cachedGlobalAgents = null;
function getGlobalAgentsContent() {
  if (cachedGlobalAgents !== null) return cachedGlobalAgents;
  try {
    const candidatePaths = [
      path.join(__dirname, "..", "AGENTS.md"),
      path.join(__dirname, "AGENTS.md")
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

// buildAcceptanceText, buildUserStoryText → shared/card-utils.cjs

// getMsalConfig, getGraphAccessToken, sendEmail → shared/ms-graph.cjs
// Thin wrappers that resolve secrets and inject deps.

function getGraphAccessToken() {
  return _getGraphAccessToken({
    msClientId: msClientId.value(),
    msClientSecret: msClientSecret.value(),
    msTenantId: msTenantId.value(),
    logger
  });
}

function sendEmail(accessToken, toEmails, subject, htmlContent) {
  return _sendEmail(accessToken, toEmails, subject, htmlContent, {
    msFromEmail: msFromEmail.value(),
    msAlertEmail: msAlertEmail.value(),
    logger
  });
}

// generateEmailTemplate, analyzeTasks, analyzeAllPendingTasks, addTaskToUserMap,
// processTasksForUserMap, buildUserTaskMap, generateConsolidatedEmailTemplate,
// notifyAdminMissingConfiguration, hasReportableIssues, sendTeamSummaryEmail,
// sendStakeholderValidationEmail, processProjectForWeeklySummary,
// sendWeeklyTaskSummaryLegacy, sendWeeklyTaskSummaryPerUser,
// sendWeeklyTaskSummary -> handlers/weekly-email.js

/**
 * Scheduled function - runs every Monday at 9:00 AM in European region
 * Skipped in DEMO_MODE (no Microsoft secrets available)
 */
if (!DEMO_MODE) {

// weeklyTaskSummary, testWeeklyTaskSummary -> handlers/weekly-email.js
const weeklyEmailDeps = () => ({
  db: getDatabase(),
  logger,
  getGraphAccessToken,
  sendEmail
});

exports.weeklyTaskSummary = onSchedule({
  schedule: "0 9 * * 1", // Every Monday at 9:00 AM
  timeZone: "Europe/Madrid",
  region: "europe-west1",
  secrets: [msClientId, msClientSecret, msTenantId, msFromEmail, msAlertEmail]
}, async (event) => {
  return handleWeeklyEmail(weeklyEmailDeps());
});

exports.testWeeklyTaskSummary = onRequest({
  region: "europe-west1",
  secrets: [msClientId, msClientSecret, msTenantId, msFromEmail, msAlertEmail]
}, async (req, res) => {
  try {
    const filterEmail = req.query.email || null;
    if (filterEmail) {
      logger.info(`Test triggered with email filter: ${filterEmail}`);
    }
    const result = await handleWeeklyEmail(weeklyEmailDeps(), filterEmail);
    res.json(result);
  } catch (error) {
    logger.error('Error in test function:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Scheduled function - runs every hour to send consolidated digest emails
 * Replaces immediate per-card emails with hourly batched summaries.
 */
exports.hourlyValidationDigest = onSchedule({
  schedule: "0 * * * *", // Every hour at minute 0
  timeZone: "Europe/Madrid",
  region: "europe-west1",
  secrets: [msClientId, msClientSecret, msTenantId, msFromEmail, msAlertEmail]
}, async (event) => {
  const db = getDatabase();
  return handleHourlyDigest({
    db,
    getAccessToken: getGraphAccessToken,
    sendEmail,
    logger
  });
});

/**
 * HTTP trigger for manual testing of the hourly digest
 * Supports optional ?email=user@example.com parameter to filter and only send to that email
 */
exports.testHourlyDigest = onRequest({
  region: "europe-west1",
  secrets: [msClientId, msClientSecret, msTenantId, msFromEmail, msAlertEmail]
}, async (req, res) => {
  try {
    const filterEmail = req.query.email || null;
    if (filterEmail) {
      logger.info(`Hourly digest test triggered with email filter: ${filterEmail}`);
    }
    const db = getDatabase();
    const result = await handleHourlyDigest({
      db,
      getAccessToken: getGraphAccessToken,
      sendEmail,
      logger
    }, filterEmail);
    res.json(result);
  } catch (error) {
    logger.error('Error in hourly digest test function:', error);
    res.status(500).json({ error: error.message });
  }
});
} // end if (!DEMO_MODE) — email functions

// ============================================================================
// DEMO CLEANUP - Remove inactive demo users and their data
// ============================================================================

// cleanupInactiveDemoUsers → handlers/demo-cleanup.js
const demoCleanupDeps = () => ({ db: admin.database(), auth: admin.auth(), logger, demoMode: DEMO_MODE });

exports.cleanupDemoUsers = onSchedule({
  schedule: '0 3 * * *',
  timeZone: 'Europe/Madrid',
  region: 'europe-west1',
}, async () => handleDemoCleanup(demoCleanupDeps()));

exports.testCleanupDemoUsers = onRequest({
  region: 'europe-west1',
}, async (req, res) => {
  try {
    const result = await handleDemoCleanup(demoCleanupDeps());
    res.json(result);
  } catch (error) {
    logger.error('Error in testCleanupDemoUsers:', error);
    res.status(500).json({ error: error.message });
  }
});

// sendPushNotification → handlers/push-notification.js
exports.sendPushNotification = onValueCreated({
  ref: "/notifications/{userId}/{notificationId}",
  region: "europe-west1",
}, async (event) => {
  return handlePushNotification(
    event.params,
    event.data.val(),
    { db: getDatabase(), messaging: getMessaging(), logger }
  );
});

// encodeEmailForFirebase, normalizeGmailEmail → shared/email-utils.cjs
// isEmailPreAuthorized, generateNextId → shared/auth-utils.cjs
// hasActiveProject → shared/card-utils.cjs

// requestEmailAccess → handlers/auth-provisioning.js
exports.requestEmailAccess = functions.region('europe-west1').https.onCall(async (data, context) => {
  return handleRequestEmailAccess(data, {
    admin, firestore, logger, DEMO_MODE, ALLOWED_SIGNUP_EMAIL_DOMAINS, ACCOUNT_REQUESTS_COLLECTION
  });
});

// provisionDemoData, setEncodedEmailClaim → handlers/auth-provisioning.js
const provisionDemoData = (email, encodedEmail) =>
  handleProvisionDemoData(email, encodedEmail, { db: admin.database(), logger });

exports.setEncodedEmailClaim = functions.region('europe-west1').auth.user().onCreate(async (user) => {
  return handleSetEncodedEmailClaim(user, {
    admin, db: admin.database(), logger, DEMO_MODE, provisionDemoData
  });
});

/**
 * Validate generateAcceptanceCriteria request parameters
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
 * Verify IA availability and get API key
 */
function getIaApiKey() {
  const globalIaEnabled = (IA_GLOBAL_ENABLE.value() || '').toString().trim().toLowerCase() !== 'false';
  if (!globalIaEnabled) {
    throw new HttpsError('failed-precondition', 'IA no disponible globalmente.');
  }

  const apiKey = IA_API_KEY.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'IA API key no configurada.');
  }

  return apiKey;
}

/**
 * Fetch task data from Firebase or payload
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
 * Check if task has existing acceptance criteria
 */
function hasExistingAcceptanceCriteria(task) {
  const existing = Array.isArray(task.acceptanceCriteriaStructured) ? task.acceptanceCriteriaStructured : [];
  return existing.some((scenario) =>
    (scenario?.given || '').trim() || (scenario?.when || '').trim() || (scenario?.then || '').trim()
  );
}

/**
 * Call OpenAI API to generate acceptance criteria
 */
async function callOpenAIForAcceptanceCriteria(apiKey, title, userStory, notes) {
  // Clear contract: JSON keys MUST be "given", "when", "then" (lowercase English)
  // Content should be in Spanish but keys are always English
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Error generating acceptance criteria', { status: response.status, errorBody });
    throw new HttpsError('internal', 'No se pudo generar Acceptance Criteria con IA.');
  }

  return response.json();
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
 * @param {Object} aiData - Raw response from OpenAI API
 * @returns {Array} Array of validated scenario objects
 * @throws {HttpsError} If response doesn't match the expected contract
 */
function parseAcceptanceCriteriaResponse(aiData) {
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

// ============================================================================
// IA + API functions — skipped in DEMO_MODE (no secrets available)
// ============================================================================
if (!DEMO_MODE) {

/**
 * Generate acceptance criteria for a task using IA.
 */
exports.generateAcceptanceCriteria = onCall({
  region: "europe-west1",
  secrets: [IA_API_KEY, IA_GLOBAL_ENABLE]
}, async (request) => {
  const { projectId, taskId, taskPayload, force } = validateAcceptanceCriteriaRequest(request);
  const apiKey = getIaApiKey();
  const db = primaryDb;

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
  const scenarios = parseAcceptanceCriteriaResponse(aiData);

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
});

// ============================================================================
// BUG DESCRIPTION ANALYSIS AND ACCEPTANCE CRITERIA
// ============================================================================

/**
 * Call OpenAI API to analyze bug description clarity
 */
async function callOpenAIForBugAnalysis(apiKey, title, description) {
  const systemPrompt = [
    'Eres un analista QA experto. Analiza la descripción de un bug y determina si tiene suficiente contexto.',
    'IMPORTANTE: Devuelve SOLO JSON válido con esta estructura exacta:',
    '{"needsClarification": true/false, "questions": [{"question": "pregunta", "placeholder": "ejemplo"}], "reasoning": "explicación"}',
    '',
    'Evalúa si la descripción incluye:',
    '- Pasos para reproducir el bug (claros y específicos)',
    '- Comportamiento esperado vs comportamiento actual',
    '- Contexto suficiente (dónde ocurre, en qué condiciones)',
    '',
    'Si falta información crítica, genera entre 1 y 4 preguntas específicas.',
    'Si la descripción es clara y completa, devuelve needsClarification: false y questions: [].',
    'Las preguntas deben ser en español y enfocadas en lo esencial.'
  ].join('\n');

  const userPrompt = [
    `Título del bug: ${title || 'Sin título'}`,
    `Descripción: ${description || 'Sin descripción'}`
  ].join('\n\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Error analyzing bug description', { status: response.status, errorBody });
    throw new HttpsError('internal', 'No se pudo analizar la descripción del bug.');
  }

  return response.json();
}

/**
 * Parse and validate bug analysis response from OpenAI
 */
function parseBugAnalysisResponse(aiData) {
  const content = aiData?.choices?.[0]?.message?.content || '';

  if (!content) {
    logger.error('Empty OpenAI response for bug analysis', { aiData });
    throw new HttpsError('internal', 'La IA devolvió una respuesta vacía.');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    logger.error('Invalid JSON from OpenAI for bug analysis', { content, error: parseError.message });
    throw new HttpsError('internal', 'La IA devolvió JSON inválido.');
  }

  // Validate structure
  if (typeof parsed.needsClarification !== 'boolean') {
    logger.error('Missing needsClarification field', { parsed });
    throw new HttpsError('internal', 'La IA no devolvió el campo "needsClarification" esperado.');
  }

  // Validate questions array if clarification is needed
  if (parsed.needsClarification) {
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      logger.error('needsClarification is true but no questions provided', { parsed });
      throw new HttpsError('internal', 'La IA indicó que necesita clarificación pero no proporcionó preguntas.');
    }

    // Validate each question
    const validQuestions = parsed.questions.filter(q =>
      q && typeof q.question === 'string' && q.question.trim().length > 0
    ).map(q => ({
      question: q.question.trim(),
      placeholder: (q.placeholder || '').trim()
    }));

    if (validQuestions.length === 0) {
      logger.error('No valid questions in response', { parsed });
      throw new HttpsError('internal', 'La IA no proporcionó preguntas válidas.');
    }

    return {
      needsClarification: true,
      questions: validQuestions,
      reasoning: (parsed.reasoning || '').trim()
    };
  }

  return {
    needsClarification: false,
    questions: [],
    reasoning: (parsed.reasoning || '').trim()
  };
}

/**
 * Call OpenAI API to generate acceptance criteria for bugs
 */
async function callOpenAIForBugAcceptanceCriteria(apiKey, title, description, notes) {
  const systemPrompt = [
    'Eres un analista QA que redacta criterios de aceptación para BUGS en español.',
    'IMPORTANTE: Devuelve SOLO JSON válido con esta estructura exacta:',
    '{"scenarios":[{"given":"contexto/precondición","when":"acción relacionada con el bug","then":"comportamiento correcto esperado"}]}',
    'Las claves JSON DEBEN ser exactamente: "given", "when", "then" (en minúsculas, en inglés).',
    '',
    'Para bugs, los escenarios deben verificar:',
    '- Que el bug ya no se reproduce bajo las condiciones reportadas',
    '- Que la funcionalidad afectada funciona correctamente',
    '- Casos edge o variaciones relacionadas',
    '',
    'El contenido debe estar en español.',
    'Genera entre 1 y 5 escenarios claros y verificables.'
  ].join('\n');

  const userPrompt = [
    `Título del bug: ${title || 'Sin título'}`,
    `Descripción del bug:\n${description || 'Sin descripción'}`,
    notes ? `Notas adicionales:\n${notes}` : ''
  ].filter(Boolean).join('\n\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Error generating bug acceptance criteria', { status: response.status, errorBody });
    throw new HttpsError('internal', 'No se pudo generar Acceptance Criteria para el bug.');
  }

  return response.json();
}

/**
 * Analyze bug description and generate acceptance criteria.
 *
 * Flow:
 * 1. If description is clear -> generate acceptance criteria directly
 * 2. If description is ambiguous -> return questions for clarification
 * 3. If force=true -> skip analysis and generate acceptance criteria anyway
 */
exports.analyzeBugDescription = onCall({
  region: "europe-west1",
  secrets: [IA_API_KEY, IA_GLOBAL_ENABLE]
}, async (request) => {
  // Validate global IA is enabled
  const globalIaEnabled = (IA_GLOBAL_ENABLE.value() || '').toString().trim().toLowerCase() !== 'false';
  if (!globalIaEnabled) {
    throw new HttpsError('failed-precondition', 'La IA no está habilitada globalmente.');
  }

  // Validate request data
  const data = request.data || {};
  const { projectId, bugId, bug, force, skipAnalysis } = data;

  if (!bug || typeof bug !== 'object') {
    throw new HttpsError('invalid-argument', 'Se requiere el objeto bug con title y description.');
  }

  const title = (bug.title || '').trim();
  const description = (bug.description || '').trim();
  const notes = (bug.notes || '').toString().trim();

  if (!title && !description) {
    throw new HttpsError('invalid-argument', 'El bug debe tener al menos título o descripción.');
  }

  const apiKey = getIaApiKey();

  // Step 1: Analyze description (unless force or skipAnalysis)
  if (!force && !skipAnalysis) {
    try {
      const analysisData = await callOpenAIForBugAnalysis(apiKey, title, description);
      const analysis = parseBugAnalysisResponse(analysisData);

      if (analysis.needsClarification) {
        logger.info('Bug description needs clarification', {
          projectId,
          bugId,
          questionsCount: analysis.questions.length
        });
        return {
          status: 'needs_clarification',
          questions: analysis.questions,
          reasoning: analysis.reasoning
        };
      }
    } catch (analysisError) {
      // If analysis fails, log and continue to generate acceptance criteria anyway
      logger.warn('Bug analysis failed, proceeding to generate acceptance criteria', {
        error: analysisError.message
      });
    }
  }

  // Step 2: Generate acceptance criteria
  const aiData = await callOpenAIForBugAcceptanceCriteria(apiKey, title, description, notes);
  const scenarios = parseAcceptanceCriteriaResponse(aiData);
  const acceptanceText = buildAcceptanceText(scenarios);

  // Step 3: Save to database if bugId and projectId provided
  if (projectId && bugId) {
    const db = primaryDb;
    const bugPath = `/cards/${projectId}/BUGS_${projectId}/${bugId}`;
    try {
      await db.ref(bugPath).update({
        acceptanceCriteriaStructured: scenarios,
        acceptanceCriteria: acceptanceText
      });
      logger.info('Bug acceptance criteria saved', { projectId, bugId });
    } catch (saveError) {
      logger.warn('Failed to save bug acceptance criteria to database', {
        error: saveError.message,
        projectId,
        bugId
      });
      // Don't throw - still return the generated criteria
    }
  }

  return {
    status: 'ok',
    acceptanceCriteriaStructured: scenarios,
    acceptanceCriteria: acceptanceText
  };
});

/**
 * Extract token from request path or query
 */
function extractTokenFromRequest(req) {
  // NOSONAR - simple non-capturing patterns for trimming slashes
  const tokenFromPath = (req.path || '').replace(/^\/+/, '').replace(/\/+$/, '').split('/').pop();
  return (req.query.token || tokenFromPath || '').toString().trim();
}

/**
 * Find IA link in available databases
 */
async function findIaLinkInDatabases(token) {
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

// getRepositoryForTask → shared/card-utils.cjs

/**
 * Build IA context payload from project and card data (task or bug)
 */
function buildIaContextPayload(token, projectId, cardId, project, card, linkData, isBug = false) {
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
      global: getGlobalAgentsContent(),
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
 * One-time token endpoint to deliver task context for IA tooling.
 * Path: /api/ia/context/{token} or ?token=
 * No auth; uses strong token + expiry (15 min suggested on creation).
 */
exports.getIaContext = onRequest({
  region: "europe-west1",
  cors: true,
  secrets: [IA_GLOBAL_ENABLE]
}, async (req, res) => {
  try {
    const globalIaEnabled = (IA_GLOBAL_ENABLE.value() || '').toString().trim().toLowerCase() !== 'false';
    if (!globalIaEnabled) {
      return res.status(503).json({ error: 'IA no disponible globalmente' });
    }

    const token = extractTokenFromRequest(req);
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const { linkRef, snap, dbUsed } = await findIaLinkInDatabases(token);
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

    const payload = buildIaContextPayload(token, projectId, cardId, project, card, linkData, isBug);

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
});

// ============================================================================
// CREATE CARD API - For programmatic card creation (Claude, scripts, etc.)
// ============================================================================

// getAbbrId, generateCardId → shared/card-utils.cjs

/**
 * Validate create card request
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
 * Build task card data structure
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
 * Build bug card data structure
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
 * HTTP endpoint to create cards programmatically
 *
 * Protected by API Key in header: x-api-key
 *
 * POST /createCard
 * Headers:
 *   x-api-key: YOUR_SECRET_KEY
 *   Content-Type: application/json
 *
 * Body for TASK:
 * {
 *   "type": "task",
 *   "projectId": "Cinema4D",
 *   "title": "Implement new feature X",
 *   "description": "As a user, I want...",
 *   "sprint": "Sprint 5",
 *   "epic": "Feature Epic",
 *   "developer": "dev@example.com",
 *   "businessPoints": 5,
 *   "devPoints": 8,
 *   "status": "To Do",
 *   "year": 2025
 * }
 *
 * Body for BUG:
 * {
 *   "type": "bug",
 *   "projectId": "Cinema4D",
 *   "title": "Button not working in settings",
 *   "description": "Steps to reproduce...",
 *   "priority": "High",
 *   "developer": "dev@example.com",
 *   "status": "Created",
 *   "year": 2025
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "cardId": "C4D-TSK-0042",
 *   "firebaseId": "-NxAbCdEfGh",
 *   "path": "/cards/Cinema4D/TASKS_Cinema4D/-NxAbCdEfGh"
 * }
 */
exports.createCard = onRequest({
  region: "europe-west1",
  cors: true,
  secrets: [CREATE_CARD_API_KEY]
}, async (req, res) => {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Validate API Key
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedKey = CREATE_CARD_API_KEY.value();

    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
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
    const db = getDatabase();
    const projectSnap = await db.ref(`/projects/${data.projectId}`).once('value');
    if (!projectSnap.exists()) {
      return res.status(404).json({ error: `Project "${data.projectId}" not found` });
    }

    // Determine section based on type
    const section = data.type === 'task' ? 'tasks' : 'bugs';
    const sectionPath = data.type === 'task'
      ? `TASKS_${data.projectId}`
      : `BUGS_${data.projectId}`;

    // Generate card ID
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
});

// ============================================================================
// CREATE TASKS FROM PLAN - Generate task cards from an accepted development plan
// ============================================================================

/**
 * Creates task cards in Firebase from an accepted development plan.
 * Each phase's tasks become real task cards linked back to the plan.
 *
 * @param {string} projectId - The project ID
 * @param {string} planId - The Firebase plan ID
 * @returns {Object} - { createdTasks: [{cardId, firebaseId, title, phaseIndex}], totalCreated }
 */

/**
 * Infer which epic to assign to each phase.
 * Strategy:
 * - If phase already has epicIds assigned, use the first one
 * - If there are few phases (<=3) and the plan is cohesive, use/create a single epic for the whole plan
 * - For each phase, try to match its name against existing epic titles using keyword overlap
 * - If no match found, create a new epic based on the plan title
 *
 * @param {Object} db - Firebase database reference
 * @param {string} projectId - Project ID
 * @param {Array} phases - Plan phases
 * @param {Array} existingEpics - Existing epics [{firebaseId, cardId, title}]
 * @param {string} planTitle - The plan title (used for new epic naming)
 * @param {string} createdBy - Creator email
 * @param {string} now - ISO timestamp
 * @returns {Object} Map of phaseIndex -> epicCardId
 */
async function inferEpicsForPhases(db, projectId, phases, existingEpics, planTitle, createdBy, now) {
  const phaseEpicMap = {};

  // Check if any phase already has epicIds manually assigned
  const allHaveEpics = phases.every(p => p.epicIds && p.epicIds.length > 0);
  if (allHaveEpics) {
    phases.forEach((p, i) => { phaseEpicMap[i] = p.epicIds[0]; });
    return phaseEpicMap;
  }

  // Try to find a matching epic for the plan title
  const planKeywords = extractKeywords(planTitle);
  let bestMatch = findBestEpicMatch(planKeywords, existingEpics);

  // For cohesive plans (<=3 phases), use a single epic
  if (phases.length <= 3) {
    if (!bestMatch) {
      bestMatch = await createEpicForPlan(db, projectId, planTitle, createdBy, now);
    }
    phases.forEach((p, i) => {
      phaseEpicMap[i] = (p.epicIds && p.epicIds.length > 0) ? p.epicIds[0] : bestMatch;
    });
    return phaseEpicMap;
  }

  // For larger plans, try to match each phase individually
  const createdEpics = {};
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (phase.epicIds && phase.epicIds.length > 0) {
      phaseEpicMap[i] = phase.epicIds[0];
      continue;
    }

    const phaseKeywords = extractKeywords(phase.name);
    const match = findBestEpicMatch(phaseKeywords, existingEpics);
    if (match) {
      phaseEpicMap[i] = match;
    } else {
      // Use the plan-level epic (create once, reuse)
      if (!createdEpics.plan) {
        createdEpics.plan = bestMatch || await createEpicForPlan(db, projectId, planTitle, createdBy, now);
      }
      phaseEpicMap[i] = createdEpics.plan;
    }
  }

  return phaseEpicMap;
}

/**
 * Create a new epic card for a plan.
 */
async function createEpicForPlan(db, projectId, planTitle, createdBy, now) {
  const epicCardId = await generateCardId(projectId, 'epics', firestore);
  const epicSectionPath = `EPICS_${projectId}`;
  const epicPath = `/cards/${projectId}/${epicSectionPath}`;
  const newEpicRef = db.ref(epicPath).push();
  const firebaseId = newEpicRef.key;

  const epicData = {
    cardId: epicCardId,
    id: firebaseId,
    firebaseId,
    cardType: 'epic-card',
    group: 'epics',
    section: 'epics',
    projectId,
    title: planTitle,
    status: 'To Do',
    description: `Epic auto-created from development plan: ${planTitle}`,
    createdBy,
    year: new Date().getFullYear(),
    createdAt: now,
    updatedAt: now
  };

  await newEpicRef.set(epicData);
  logger.info('inferEpicsForPhases: Epic created for plan', { epicCardId, planTitle, projectId });

  return epicCardId;
}

exports.createTasksFromPlan = onCall({
  region: "europe-west1",
  memory: "256MiB",
  timeoutSeconds: 60
}, async (request) => {
  const { projectId, planId } = request.data || {};

  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'projectId is required');
  }
  if (!planId || typeof planId !== 'string') {
    throw new HttpsError('invalid-argument', 'planId is required');
  }

  const db = getDatabase();

  // Load the plan
  const planSnap = await db.ref(`/plans/${projectId}/${planId}`).once('value');
  if (!planSnap.exists()) {
    throw new HttpsError('not-found', `Plan "${planId}" not found in project "${projectId}"`);
  }
  const plan = planSnap.val();

  // Only accepted plans can generate tasks
  if (plan.status !== 'accepted') {
    throw new HttpsError('failed-precondition', 'Only accepted plans can generate tasks. Accept the plan first.');
  }

  // Check if tasks were already generated
  if (plan.generatedTasks && plan.generatedTasks.length > 0) {
    throw new HttpsError('already-exists', `This plan already has ${plan.generatedTasks.length} generated tasks. Use regenerate if you want to update them.`);
  }

  const phases = plan.phases || [];
  if (phases.length === 0) {
    throw new HttpsError('failed-precondition', 'Plan has no phases to generate tasks from.');
  }

  const createdTasks = [];
  const sectionPath = `TASKS_${projectId}`;
  const cardPath = `/cards/${projectId}/${sectionPath}`;
  const now = new Date().toISOString();
  const createdBy = request.auth?.token?.email || 'system';

  // Load existing epics for inference
  const epicsPath = `/cards/${projectId}/EPICS_${projectId}`;
  const epicsSnap = await db.ref(epicsPath).once('value');
  const epicsData = epicsSnap.val() || {};
  const existingEpics = Object.entries(epicsData)
    .filter(([, epic]) => !epic.deletedAt)
    .map(([fbId, epic]) => ({
      firebaseId: fbId,
      cardId: epic.cardId || fbId,
      title: (epic.title || '').toLowerCase()
    }));

  // Infer or create epic for each phase
  const phaseEpicMap = await inferEpicsForPhases(db, projectId, phases, existingEpics, plan.title, createdBy, now);

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];
    const phaseTasks = phase.tasks || [];
    const epicId = phaseEpicMap[phaseIndex] || '';

    for (const task of phaseTasks) {
      if (!task.title) continue;

      // Generate unique card ID
      const cardId = await generateCardId(projectId, 'tasks', firestore);

      // Generate Firebase push key
      const newCardRef = db.ref(cardPath).push();
      const firebaseId = newCardRef.key;

      // Build description structured from AI task data
      const descriptionStructured = {
        role: task.como || '',
        goal: task.quiero || '',
        benefit: task.para || ''
      };

      // Build card data
      const cardData = {
        cardId,
        id: firebaseId,
        firebaseId,
        cardType: 'task-card',
        group: 'tasks',
        section: 'tasks',
        projectId,
        title: task.title.trim(),
        createdBy,
        status: 'To Do',
        description: '',
        descriptionStructured,
        notes: '',
        sprint: '',
        epic: epicId,
        developer: '',
        validator: '',
        businessPoints: 0,
        devPoints: 0,
        startDate: '',
        endDate: '',
        desiredDate: '',
        year: new Date().getFullYear(),
        expedited: false,
        blockedByBusiness: false,
        blockedByDevelopment: false,
        acceptanceCriteria: '',
        acceptanceCriteriaStructured: [],
        repositoryLabel: '',
        coDeveloper: '',
        planId,
        planPhase: phase.name || `Phase ${phaseIndex + 1}`,
        createdAt: now,
        updatedAt: now
      };

      await newCardRef.set(cardData);

      createdTasks.push({
        cardId,
        firebaseId,
        title: task.title.trim(),
        phaseIndex,
        epic: epicId
      });

      logger.info('createTasksFromPlan: Task created', { cardId, planId, phaseIndex, epic: epicId });
    }
  }

  // Update plan with generated task references
  const generatedTasksData = createdTasks.map(t => ({
    cardId: t.cardId,
    firebaseId: t.firebaseId,
    phaseIndex: t.phaseIndex
  }));

  // Also update each phase with its taskIds and inferred epicIds
  const updatedPhases = phases.map((phase, i) => {
    const phaseTaskIds = createdTasks
      .filter(t => t.phaseIndex === i)
      .map(t => t.cardId);
    const inferredEpic = phaseEpicMap[i];
    const epicIds = inferredEpic
      ? [...new Set([...(phase.epicIds || []), inferredEpic])]
      : (phase.epicIds || []);
    return {
      ...phase,
      taskIds: [...(phase.taskIds || []), ...phaseTaskIds],
      epicIds
    };
  });

  await db.ref(`/plans/${projectId}/${planId}`).update({
    generatedTasks: generatedTasksData,
    phases: updatedPhases,
    updatedAt: now
  });

  logger.info('createTasksFromPlan: All tasks created', {
    planId,
    projectId,
    totalCreated: createdTasks.length
  });

  return {
    createdTasks,
    totalCreated: createdTasks.length
  };
});

/**
 * Regenerate tasks from a plan that was modified.
 * Deletes previously generated tasks (only if still in "To Do") and creates new ones.
 */
exports.regenerateTasksFromPlan = onCall({
  region: "europe-west1",
  memory: "256MiB",
  timeoutSeconds: 60
}, async (request) => {
  const { projectId, planId } = request.data || {};

  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'projectId is required');
  }
  if (!planId || typeof planId !== 'string') {
    throw new HttpsError('invalid-argument', 'planId is required');
  }

  const db = getDatabase();

  // Load the plan
  const planSnap = await db.ref(`/plans/${projectId}/${planId}`).once('value');
  if (!planSnap.exists()) {
    throw new HttpsError('not-found', `Plan "${planId}" not found`);
  }
  const plan = planSnap.val();

  if (plan.status !== 'accepted') {
    throw new HttpsError('failed-precondition', 'Only accepted plans can regenerate tasks.');
  }

  const previousTasks = plan.generatedTasks || [];
  const sectionPath = `TASKS_${projectId}`;
  const cardPath = `/cards/${projectId}/${sectionPath}`;
  const skippedTasks = [];

  // Delete previous tasks that are still in "To Do"
  for (const prev of previousTasks) {
    const taskSnap = await db.ref(`${cardPath}/${prev.firebaseId}`).once('value');
    if (!taskSnap.exists()) continue;

    const taskData = taskSnap.val();
    if (taskData.status === 'To Do') {
      await db.ref(`${cardPath}/${prev.firebaseId}`).remove();
      logger.info('regenerateTasksFromPlan: Deleted To Do task', { cardId: prev.cardId });
    } else {
      skippedTasks.push({
        cardId: prev.cardId,
        status: taskData.status,
        reason: 'Task already started, cannot delete'
      });
    }
  }

  // Clear generatedTasks and phase taskIds for regeneration
  const cleanedPhases = (plan.phases || []).map(phase => {
    const prevTaskIds = previousTasks
      .filter(t => !skippedTasks.find(s => s.cardId === t.cardId))
      .map(t => t.cardId);
    return {
      ...phase,
      taskIds: (phase.taskIds || []).filter(id => !prevTaskIds.includes(id))
    };
  });

  await db.ref(`/plans/${projectId}/${planId}`).update({
    generatedTasks: null,
    phases: cleanedPhases
  });

  // Now create new tasks using the existing function logic
  const createFn = exports.createTasksFromPlan;
  // Instead of calling itself, inline the creation
  const phases = cleanedPhases;
  const createdTasks = [];
  const now = new Date().toISOString();
  const createdBy = request.auth?.token?.email || 'system';

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];
    const phaseTasks = phase.tasks || [];

    for (const task of phaseTasks) {
      if (!task.title) continue;

      const cardId = await generateCardId(projectId, 'tasks', firestore);
      const newCardRef = db.ref(cardPath).push();
      const firebaseId = newCardRef.key;

      const descriptionStructured = {
        role: task.como || '',
        goal: task.quiero || '',
        benefit: task.para || ''
      };

      const cardData = {
        cardId,
        id: firebaseId,
        firebaseId,
        cardType: 'task-card',
        group: 'tasks',
        section: 'tasks',
        projectId,
        title: task.title.trim(),
        createdBy,
        status: 'To Do',
        description: '',
        descriptionStructured,
        notes: '',
        sprint: '',
        epic: (phase.epicIds && phase.epicIds.length > 0) ? phase.epicIds[0] : '',
        developer: '',
        validator: '',
        businessPoints: 0,
        devPoints: 0,
        startDate: '',
        endDate: '',
        desiredDate: '',
        year: new Date().getFullYear(),
        expedited: false,
        blockedByBusiness: false,
        blockedByDevelopment: false,
        acceptanceCriteria: '',
        acceptanceCriteriaStructured: [],
        repositoryLabel: '',
        coDeveloper: '',
        planId,
        planPhase: phase.name || `Phase ${phaseIndex + 1}`,
        createdAt: now,
        updatedAt: now
      };

      await newCardRef.set(cardData);
      createdTasks.push({ cardId, firebaseId, title: task.title.trim(), phaseIndex });
    }
  }

  // Update plan with new generated tasks
  const generatedTasksData = createdTasks.map(t => ({
    cardId: t.cardId,
    firebaseId: t.firebaseId,
    phaseIndex: t.phaseIndex
  }));

  const updatedPhases = phases.map((phase, i) => {
    const phaseTaskIds = createdTasks
      .filter(t => t.phaseIndex === i)
      .map(t => t.cardId);
    return {
      ...phase,
      taskIds: [...(phase.taskIds || []), ...phaseTaskIds]
    };
  });

  await db.ref(`/plans/${projectId}/${planId}`).update({
    generatedTasks: generatedTasksData,
    phases: updatedPhases,
    updatedAt: now
  });

  return {
    createdTasks,
    totalCreated: createdTasks.length,
    skippedTasks
  };
});

// ============================================================================
// PARSE DOCUMENT FOR CARDS - Generate tasks/bugs from text documents
// ============================================================================

/**
 * Call OpenAI API to parse document content and generate tasks/bugs
 */
async function callOpenAIForDocumentParsing(apiKey, documentContent, existingEpics, projectName, scoringSystem = '1-5') {
  const epicsList = existingEpics.length > 0
    ? existingEpics.map(e => `- "${e.title}" (${e.cardId})`).join('\n')
    : 'No hay épicas existentes en el proyecto.';

  // Get valid businessPoints values based on scoring system
  const businessPointsValues = scoringSystem === 'fibonacci' ? '1, 2, 3, 5, 8, 13' : '1, 2, 3, 4, 5';
  const businessPointsDefault = scoringSystem === 'fibonacci' ? '3' : '3';

  const systemPrompt = [
    'Eres un analista de producto experto que extrae requisitos de documentos.',
    'Tu tarea es analizar el documento proporcionado e identificar todas las tareas y bugs necesarios.',
    '',
    'IMPORTANTE: Devuelve SOLO JSON válido con esta estructura:',
    '',
    'Para TASKS (nuevas funcionalidades o mejoras):',
    `{"type":"task","title":"título","como":"rol del usuario","quiero":"acción deseada","para":"beneficio esperado","businessPoints":${businessPointsDefault},"epic":"épica","epicSuggested":true|false}`,
    '',
    'Para BUGS (problemas o errores):',
    '{"type":"bug","title":"título","description":"descripción del problema","priority":"APPLICATION BLOCKER|DEPARTMENT BLOCKER|INDIVIDUAL BLOCKER|USER EXPERIENCE ISSUE|WORKFLOW IMPROVEMENT|WORKAROUND AVAILABLE ISSUE","epic":"épica","epicSuggested":true|false}',
    '',
    'Estructura final: {"items":[...]}',
    '',
    'Reglas:',
    '- Identifica cada funcionalidad, mejora o problema como un item separado',
    '- type: "task" para nuevas funcionalidades o mejoras, "bug" para problemas o errores',
    '- title: máximo 100 caracteres, claro y específico',
    '',
    'Para TASKS:',
    `- businessPoints: OBLIGATORIO - Representa el VALOR DE NEGOCIO o importancia para el stakeholder (valores válidos: ${businessPointsValues})`,
    '  - Extrae la prioridad/importancia del texto si está indicada y mapéala a businessPoints:',
    '    - "crítico", "urgente", "muy alta", "alta prioridad" → valor alto (4-5 o 5-8 en fibonacci)',
    '    - "normal", "media", "estándar" → valor medio (3)',
    '    - "baja", "menor importancia", "nice-to-have" → valor bajo (1-2)',
    '  - Si no se indica prioridad, evalúa el impacto en negocio según contexto',
    '- usa formato historia de usuario (como/quiero/para)',
    '  - como: el rol o tipo de usuario (ej: "usuario registrado", "administrador")',
    '  - quiero: la acción o funcionalidad deseada',
    '  - para: el beneficio o valor que aporta',
    '',
    'Para BUGS:',
    '- priority: OBLIGATORIO - usa los valores exactos listados según severidad',
    '- usa description con explicación clara del problema',
    '',
    '- epic: asigna una épica existente si encaja, o sugiere una nueva si es necesario',
    '- epicSuggested: true si la épica es nueva (no existe), false si ya existe',
    '',
    `Proyecto: ${projectName}`,
    `Sistema de puntuación del proyecto: ${scoringSystem} (valores businessPoints: ${businessPointsValues})`,
    '',
    'Épicas existentes en el proyecto:',
    epicsList,
    '',
    'El contenido debe estar en español.',
    'Genera tantos items como sean necesarios para cubrir todo el documento.'
  ].join('\n');

  const userPrompt = [
    'Analiza el siguiente documento y genera la lista de tareas y bugs necesarios:',
    '',
    '---DOCUMENTO---',
    documentContent,
    '---FIN DOCUMENTO---'
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Error parsing document with OpenAI', { status: response.status, errorBody });
    throw new HttpsError('internal', 'No se pudo analizar el documento con IA.');
  }

  return response.json();
}

/**
 * Parse and validate document parsing response from OpenAI
 */
function parseDocumentParsingResponse(aiData) {
  const content = aiData?.choices?.[0]?.message?.content || '';

  if (!content) {
    logger.error('Empty OpenAI response for document parsing', { aiData });
    throw new HttpsError('internal', 'La IA devolvió una respuesta vacía.');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    logger.error('Invalid JSON from OpenAI for document parsing', { content, error: parseError.message });
    throw new HttpsError('internal', 'La IA devolvió JSON inválido.');
  }

  // Validate structure
  if (!parsed || !Array.isArray(parsed.items)) {
    logger.error('Missing items array in document parsing response', { parsed });
    throw new HttpsError('internal', 'La IA no devolvió el array "items" esperado.');
  }

  // Validate each item
  const validItems = [];
  parsed.items.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      logger.warn(`Skipping invalid item at index ${index}`);
      return;
    }

    const type = (item.type || '').toLowerCase();
    if (type !== 'task' && type !== 'bug') {
      logger.warn(`Skipping item with invalid type at index ${index}`, { type });
      return;
    }

    const title = (item.title || '').trim();
    if (!title || title.length < 3) {
      logger.warn(`Skipping item with invalid title at index ${index}`);
      return;
    }

    const validItem = {
      type,
      title: title.substring(0, 150), // Limit title length
      epic: (item.epic || '').trim(),
      epicSuggested: Boolean(item.epicSuggested)
    };

    // Tasks use como/quiero/para format, bugs use description
    if (type === 'task') {
      validItem.como = (item.como || '').trim().substring(0, 500);
      validItem.quiero = (item.quiero || '').trim().substring(0, 1000);
      validItem.para = (item.para || '').trim().substring(0, 500);
    } else {
      validItem.description = (item.description || '').trim().substring(0, 2000);
    }

    validItems.push(validItem);
  });

  if (validItems.length === 0) {
    throw new HttpsError('failed-precondition', 'La IA no pudo extraer tareas o bugs del documento.');
  }

  return validItems;
}

/**
 * Parse a document and generate tasks/bugs using OpenAI.
 *
 * Request data:
 * - projectId: string (required)
 * - documentContent: string (required) - The text content of the document
 * - fileName: string (optional) - Original file name for reference
 *
 * Response:
 * {
 *   "status": "ok",
 *   "items": [
 *     {
 *       "type": "task" | "bug",
 *       "title": "...",
 *       "description": "...",
 *       "epic": "Nombre de épica",
 *       "epicSuggested": true | false
 *     }
 *   ],
 *   "existingEpics": [...] // List of existing epics for reference
 * }
 */
exports.parseDocumentForCards = onCall({
  region: "europe-west1",
  secrets: [IA_API_KEY, IA_GLOBAL_ENABLE]
}, async (request) => {
  // Validate auth
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.');
  }

  // Validate global IA is enabled
  const globalIaEnabled = (IA_GLOBAL_ENABLE.value() || '').toString().trim().toLowerCase() !== 'false';
  if (!globalIaEnabled) {
    throw new HttpsError('failed-precondition', 'La IA no está habilitada globalmente.');
  }

  // Validate request data
  const data = request.data || {};
  const { projectId, documentContent, fileName, scoringSystem } = data;

  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'projectId es requerido.');
  }

  if (!documentContent || typeof documentContent !== 'string') {
    throw new HttpsError('invalid-argument', 'documentContent es requerido.');
  }

  // Limit document size (approx 50KB of text)
  const maxContentLength = 50000;
  if (documentContent.length > maxContentLength) {
    throw new HttpsError('invalid-argument', `El documento es demasiado largo. Máximo ${maxContentLength} caracteres.`);
  }

  const apiKey = getIaApiKey();
  const db = primaryDb;

  // Verify project exists and get its name
  const projectSnap = await db.ref(`/projects/${projectId}`).once('value');
  if (!projectSnap.exists()) {
    throw new HttpsError('not-found', 'Proyecto no encontrado.');
  }
  const project = projectSnap.val() || {};
  const projectName = project.name || projectId;

  // Get existing epics for the project
  const epicsPath = `/cards/${projectId}/EPICS_${projectId}`;
  const epicsSnap = await db.ref(epicsPath).once('value');
  const epicsData = epicsSnap.val() || {};

  const existingEpics = Object.entries(epicsData)
    .filter(([, epic]) => !epic.deletedAt)
    .map(([firebaseId, epic]) => ({
      cardId: epic.cardId || firebaseId,
      firebaseId,
      title: epic.title || '',
      epicType: epic.epicType || 'default'
    }))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  // Call OpenAI to parse the document
  logger.info('parseDocumentForCards: Starting document analysis', {
    projectId,
    fileName: fileName || 'unknown',
    contentLength: documentContent.length,
    existingEpicsCount: existingEpics.length
  });

  // Get project scoring system (defaults to '1-5' if not specified)
  const projectScoringSystem = scoringSystem || project.scoringSystem || '1-5';

  const aiData = await callOpenAIForDocumentParsing(apiKey, documentContent, existingEpics, projectName, projectScoringSystem);
  const items = parseDocumentParsingResponse(aiData);

  logger.info('parseDocumentForCards: Analysis complete', {
    projectId,
    scoringSystem: projectScoringSystem,
    itemsCount: items.length,
    taskCount: items.filter(i => i.type === 'task').length,
    bugCount: items.filter(i => i.type === 'bug').length
  });

  return {
    status: 'ok',
    items,
    existingEpics: existingEpics.map(e => ({
      cardId: e.cardId,
      title: e.title
    }))
  };
});

// ============================================================================
// GENERATE DEV PLAN - Generate a structured development plan from a description
// ============================================================================

async function callOpenAIForPlanGeneration(apiKey, context, existingEpics, projectName, existingPlanJson) {
  const epicsList = existingEpics.length > 0
    ? existingEpics.map(e => `- "${e.title}" (${e.cardId})`).join('\n')
    : 'No hay épicas existentes en el proyecto.';

  const refinementBlock = existingPlanJson
    ? [
      '',
      'PLAN ANTERIOR (el usuario quiere refinarlo/mejorarlo con el nuevo contexto):',
      existingPlanJson,
      '',
      'Mejora el plan anterior incorporando el nuevo contexto. Mantén lo que siga siendo válido.',
    ].join('\n')
    : '';

  const systemPrompt = [
    'Eres un arquitecto de software y project manager experto que crea planes de desarrollo estructurados.',
    'Tu tarea es analizar el contexto proporcionado y generar un plan de desarrollo con fases y tareas.',
    '',
    'IMPORTANTE: Devuelve SOLO JSON válido con esta estructura:',
    '{',
    '  "title": "Título conciso del plan",',
    '  "objective": "Objetivo general del plan en 1-2 frases",',
    '  "phases": [',
    '    {',
    '      "name": "Nombre de la fase",',
    '      "description": "Descripción de lo que se hace en esta fase",',
    '      "tasks": [',
    '        {',
    '          "title": "Título de la tarea (máx 100 chars)",',
    '          "como": "rol del usuario",',
    '          "quiero": "acción deseada",',
    '          "para": "beneficio esperado"',
    '        }',
    '      ]',
    '    }',
    '  ]',
    '}',
    '',
    'Reglas:',
    '- Genera entre 2 y 6 fases lógicas que representen etapas del desarrollo',
    '- Cada fase debe tener entre 1 y 8 tareas concretas',
    '- Las fases deben estar ordenadas por dependencia (lo primero primero)',
    '- Cada tarea debe ser atómica y realizable en 1-3 días máximo',
    '- El título del plan debe ser descriptivo pero conciso (máx 80 chars)',
    '- Las tareas usan formato historia de usuario (como/quiero/para)',
    '- Si el contexto es insuficiente, genera lo que puedas y pon tareas genéricas marcando claramente qué necesita más detalle',
    '',
    `Proyecto: ${projectName}`,
    '',
    'Épicas existentes en el proyecto:',
    epicsList,
    '',
    'El contenido debe estar en español.',
    refinementBlock
  ].join('\n');

  const userPrompt = [
    'Genera un plan de desarrollo estructurado a partir del siguiente contexto:',
    '',
    '---CONTEXTO---',
    context,
    '---FIN CONTEXTO---'
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Error generating dev plan with OpenAI', { status: response.status, errorBody });
    throw new HttpsError('internal', 'No se pudo generar el plan con IA.');
  }

  return response.json();
}

exports.generateDevPlan = onCall({
  region: "europe-west1",
  secrets: [IA_API_KEY, IA_GLOBAL_ENABLE]
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.');
  }

  const globalIaEnabled = (IA_GLOBAL_ENABLE.value() || '').toString().trim().toLowerCase() !== 'false';
  if (!globalIaEnabled) {
    throw new HttpsError('failed-precondition', 'La IA no está habilitada globalmente.');
  }

  const data = request.data || {};
  const { projectId, context, existingPlanJson } = data;

  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'projectId es requerido.');
  }
  if (!context || typeof context !== 'string' || context.trim().length < 10) {
    throw new HttpsError('invalid-argument', 'Se necesita un contexto con al menos 10 caracteres.');
  }
  if (context.length > 50000) {
    throw new HttpsError('invalid-argument', 'El contexto es demasiado largo. Máximo 50.000 caracteres.');
  }

  const apiKey = getIaApiKey();
  const db = primaryDb;

  const projectSnap = await db.ref(`/projects/${projectId}`).once('value');
  if (!projectSnap.exists()) {
    throw new HttpsError('not-found', 'Proyecto no encontrado.');
  }
  const project = projectSnap.val() || {};
  const projectName = project.name || projectId;

  const epicsPath = `/cards/${projectId}/EPICS_${projectId}`;
  const epicsSnap = await db.ref(epicsPath).once('value');
  const epicsData = epicsSnap.val() || {};
  const existingEpics = Object.entries(epicsData)
    .filter(([, epic]) => !epic.deletedAt)
    .map(([firebaseId, epic]) => ({
      cardId: epic.cardId || firebaseId,
      title: epic.title || ''
    }))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  logger.info('generateDevPlan: Starting plan generation', {
    projectId,
    contextLength: context.length,
    hasExistingPlan: !!existingPlanJson,
    existingEpicsCount: existingEpics.length
  });

  const aiData = await callOpenAIForPlanGeneration(apiKey, context, existingEpics, projectName, existingPlanJson || null);
  const content = aiData?.choices?.[0]?.message?.content || '';

  if (!content) {
    throw new HttpsError('internal', 'La IA no devolvió contenido.');
  }

  let plan;
  try {
    plan = JSON.parse(content);
  } catch (err) {
    logger.error('generateDevPlan: Invalid JSON from OpenAI', { content });
    throw new HttpsError('internal', 'La IA devolvió un formato inválido.');
  }

  if (!plan.title || !plan.phases || !Array.isArray(plan.phases)) {
    throw new HttpsError('internal', 'El plan generado no tiene la estructura esperada.');
  }

  plan.phases = plan.phases
    .filter(phase => phase.name && Array.isArray(phase.tasks))
    .map(phase => ({
      name: (phase.name || '').slice(0, 150),
      description: (phase.description || '').slice(0, 500),
      tasks: (phase.tasks || [])
        .filter(t => t.title)
        .map(t => ({
          title: (t.title || '').slice(0, 150),
          como: (t.como || '').slice(0, 300),
          quiero: (t.quiero || '').slice(0, 500),
          para: (t.para || '').slice(0, 300)
        }))
    }));

  const totalTasks = plan.phases.reduce((sum, p) => sum + p.tasks.length, 0);

  logger.info('generateDevPlan: Plan generated', {
    projectId,
    title: plan.title,
    phases: plan.phases.length,
    totalTasks
  });

  return {
    status: 'ok',
    plan: {
      title: (plan.title || '').slice(0, 150),
      objective: (plan.objective || '').slice(0, 500),
      phases: plan.phases
    },
    existingEpics: existingEpics.map(e => ({ cardId: e.cardId, title: e.title }))
  };
});

// ============================================================================
// CONVERT DESCRIPTION TO USER STORY - Transform legacy descriptions to como/quiero/para
// ============================================================================

/**
 * Convert a plain description to user story format (como/quiero/para) using OpenAI
 *
 * Request data:
 * - description: string (required) - The plain description to convert
 * - title: string (optional) - The card title for context
 *
 * Response:
 * {
 *   "status": "ok",
 *   "como": "...",
 *   "quiero": "...",
 *   "para": "..."
 * }
 */
exports.convertDescriptionToUserStory = onCall({
  region: "europe-west1",
  secrets: [IA_API_KEY, IA_GLOBAL_ENABLE]
}, async (request) => {
  // Validate auth
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.');
  }

  // Validate global IA is enabled
  const globalIaEnabled = (IA_GLOBAL_ENABLE.value() || '').toString().trim().toLowerCase() !== 'false';
  if (!globalIaEnabled) {
    throw new HttpsError('failed-precondition', 'La IA no está habilitada globalmente.');
  }

  // Validate request data
  const data = request.data || {};
  const { description, title } = data;

  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    throw new HttpsError('invalid-argument', 'La descripción es requerida y debe tener al menos 5 caracteres.');
  }

  const apiKey = getIaApiKey();

  const systemPrompt = [
    'Eres un analista de producto experto.',
    'Tu tarea es convertir una descripción de tarea en formato de historia de usuario.',
    '',
    'IMPORTANTE: Devuelve SOLO JSON válido con esta estructura exacta:',
    '{"como":"rol del usuario","quiero":"acción deseada","para":"beneficio esperado"}',
    '',
    'Reglas:',
    '- como: el rol o tipo de usuario (ej: "usuario registrado", "administrador", "cliente")',
    '- quiero: la acción o funcionalidad deseada, comenzando con un verbo en infinitivo',
    '- para: el beneficio o valor que aporta esta funcionalidad',
    '- Mantén el contenido en español',
    '- Sé conciso pero claro',
    '- Infiere el rol de usuario si no está claro en la descripción'
  ].join('\n');

  const userPrompt = title
    ? `Convierte esta descripción de la tarea "${title}" a formato historia de usuario:\n\n${description}`
    : `Convierte esta descripción a formato historia de usuario:\n\n${description}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Error converting description with OpenAI', { status: response.status, errorBody });
    throw new HttpsError('internal', 'No se pudo convertir la descripción con IA.');
  }

  const aiData = await response.json();
  const content = aiData?.choices?.[0]?.message?.content || '';

  if (!content) {
    throw new HttpsError('internal', 'La IA devolvió una respuesta vacía.');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    logger.error('Invalid JSON from OpenAI for description conversion', { content });
    throw new HttpsError('internal', 'La IA devolvió JSON inválido.');
  }

  if (!parsed.como || !parsed.quiero || !parsed.para) {
    throw new HttpsError('internal', 'La IA no devolvió todos los campos requeridos.');
  }

  logger.info('convertDescriptionToUserStory: Conversion complete', {
    originalLength: description.length,
    como: parsed.como.substring(0, 50),
    quiero: parsed.quiero.substring(0, 50)
  });

  return {
    status: 'ok',
    como: parsed.como.trim(),
    quiero: parsed.quiero.trim(),
    para: parsed.para.trim()
  };
});

// ============================================================================
// GET PROJECT EPICS API - For IA to assign epics automatically
// ============================================================================

/**
 * HTTP endpoint to get epics for a project
 *
 * Protected by API Key in header: x-api-key (same as createCard)
 *
 * GET /getProjectEpics?projectId=Cinema4D
 * Headers:
 *   x-api-key: YOUR_SECRET_KEY
 *
 * Optional query params:
 *   year: Filter epics by year (e.g., 2025)
 *   includeAll: If "true", include epics without year field
 *
 * Response:
 * {
 *   "success": true,
 *   "projectId": "Cinema4D",
 *   "count": 5,
 *   "epics": [
 *     {
 *       "cardId": "C4D-EPC-0001",
 *       "title": "Frontend Improvements",
 *       "description": "All frontend related tasks",
 *       "epicType": "feature",
 *       "year": 2025,
 *       "status": "In Progress"
 *     }
 *   ]
 * }
 */
exports.getProjectEpics = onRequest({
  region: "europe-west1",
  cors: true,
  secrets: [CREATE_CARD_API_KEY]
}, async (req, res) => {
  try {
    // Allow GET and POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
    }

    // Validate API Key
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedKey = CREATE_CARD_API_KEY.value();

    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
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
    const db = getDatabase();
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
});

// Export internal functions for testing
exports._test = {
  inferEpicsForPhases,
  createEpicForPlan
};

} // end if (!DEMO_MODE) — IA + API functions

/**
 * Cloud Function: onCardToValidate
 * Triggers when a card is updated, creates push notifications
 * and queues email for hourly digest when a task transitions to "To Validate".
 */
exports.onCardToValidate = onValueUpdated({
  ref: "/cards/{projectId}/{section}/{cardId}",
  region: "europe-west1"
}, async (event) => {
  const { projectId, section, cardId } = event.params;
  const beforeData = event.data.before.val();
  const afterData = event.data.after.val();

  const db = getDatabase();

  return handleCardToValidate(
    { projectId, section, cardId },
    beforeData,
    afterData,
    {
      db,
      logger
    }
  );
});

/**
 * Cloud Function: onBugFixed
 * Triggers when a bug is updated, creates push notifications
 * and queues email for hourly digest when a bug transitions to "Fixed".
 * Notifies the bug creator so they can verify the fix.
 */
exports.onBugFixed = onValueUpdated({
  ref: "/cards/{projectId}/{section}/{cardId}",
  region: "europe-west1"
}, async (event) => {
  const { projectId, section, cardId } = event.params;
  const beforeData = event.data.before.val();
  const afterData = event.data.after.val();

  const db = getDatabase();

  return handleBugFixed(
    { projectId, section, cardId },
    beforeData,
    afterData,
    {
      db,
      logger
    }
  );
});

/**
 * Cloud Function: onPortalBugResolved
 * Triggers when a bug is updated. If the bug was created from the
 * Portal de Incidencias and transitions to "Fixed" or "Verified",
 * notifies the Portal via POST so the ticket is auto-resolved.
 * Skipped in DEMO_MODE (no Portal integration needed).
 */
if (!DEMO_MODE) {
exports.onPortalBugResolved = onValueUpdated({
  ref: "/cards/{projectId}/{section}/{cardId}",
  region: "europe-west1",
  secrets: [CREATE_CARD_API_KEY]
}, async (event) => {
  const { projectId, section, cardId } = event.params;
  const beforeData = event.data.before.val();
  const afterData = event.data.after.val();

  return handlePortalBugResolved(
    { projectId, section, cardId },
    beforeData,
    afterData,
    {
      axios,
      apiKey: CREATE_CARD_API_KEY.value(),
      logger
    }
  );
});
}

/**
 * Cloud Function: onTaskStatusValidation
 * Validates task status transitions and reverts invalid changes.
 *
 * Validations:
 * 1. To "To Validate": requires validator, title, developer, startDate
 * 2. To "Done" or "Done&Validated": only validator/coValidator can change
 */
exports.onTaskStatusValidation = onValueUpdated({
  ref: "/cards/{projectId}/{section}/{cardId}",
  region: "europe-west1"
}, async (event) => {
  const { projectId, section, cardId } = event.params;
  const beforeData = event.data.before.val();
  const afterData = event.data.after.val();

  const db = getDatabase();

  return handleTaskStatusValidation(
    { projectId, section, cardId },
    beforeData,
    afterData,
    { db, logger }
  );
});

/**
 * Cloud Function: syncCardViews
 * Syncs card data to optimized views for reduced data transfer.
 *
 * Triggers on any write (create/update/delete) to /cards/{projectId}/{section}/{cardId}
 * and maintains denormalized views at:
 * - /views/task-list/{projectId}/{firebaseId}
 * - /views/bug-list/{projectId}/{firebaseId}
 * - /views/proposal-list/{projectId}/{firebaseId}
 *
 * This reduces Firebase traffic by ~70-80% for table views.
 */
exports.syncCardViews = onValueWritten({
  ref: "/cards/{projectId}/{section}/{cardId}",
  region: "europe-west1"
}, async (event) => {
  const { projectId, section, cardId } = event.params;
  const beforeData = event.data.before?.val() || null;
  const afterData = event.data.after?.val() || null;

  const db = getDatabase();

  return handleSyncCardViews(
    { projectId, section, cardId },
    beforeData,
    afterData,
    { db, logger }
  );
});

/**
 * Cloud Function: resyncAllViews
 * Callable function that re-generates all /views entries from /cards data.
 * Useful when view extraction logic changes (e.g., new fields like notesCount).
 * Requires authenticated user with appAdmin or superAdmin claim.
 */
exports.resyncAllViews = onCall({
  region: "europe-west1",
  timeoutSeconds: 120
}, async (request) => {
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

  const db = getDatabase();
  const cardsSnap = await db.ref('/cards').once('value');
  if (!cardsSnap.exists()) {
    return { success: true, message: 'No cards found', stats: {} };
  }

  const cardsData = cardsSnap.val();
  const stats = { tasks: 0, bugs: 0, proposals: 0, projects: 0 };
  const updates = {};

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
});

// decodeEmailFromFirebase → shared/email-utils.cjs

/**
 * Cloud Function: syncAllAppAdminClaims
 * Callable function to sync isAppAdmin claims for all users in /data/appAdmins.
 * Useful for initial setup/bootstrap or fixing claim inconsistencies.
 *
 * Can only be called by existing appAdmins or the SuperAdmin (from env var).
 */
exports.syncAllAppAdminClaims = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerEmail = request.auth.token.email;
  const callerClaims = request.auth.token;

  // Check if caller is appAdmin or SuperAdmin (from env var)
  const superAdminEmail = process.env.PUBLIC_SUPER_ADMIN_EMAIL || '';
  const isCallerSuperAdmin = callerEmail && superAdminEmail &&
    callerEmail.toLowerCase() === superAdminEmail.toLowerCase();
  const isCallerAppAdmin = callerClaims.isAppAdmin === true;

  if (!isCallerSuperAdmin && !isCallerAppAdmin) {
    throw new HttpsError('permission-denied', 'Solo appAdmins pueden ejecutar esta función.');
  }

  const db = getDatabase();
  const appAdminsSnapshot = await db.ref('/data/appAdmins').once('value');
  const appAdmins = appAdminsSnapshot.val() || {};

  const results = {
    success: [],
    notFound: [],
    errors: []
  };

  for (const [encodedEmail, value] of Object.entries(appAdmins)) {
    if (value !== true) continue;

    const email = decodeEmailFromFirebase(encodedEmail);
    if (!email) {
      results.errors.push({ encodedEmail, error: 'Could not decode email' });
      continue;
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const currentClaims = userRecord.customClaims || {};

      await admin.auth().setCustomUserClaims(userRecord.uid, {
        ...currentClaims,
        isAppAdmin: true
      });

      results.success.push({ email, uid: userRecord.uid });
      logger.info(`Synced isAppAdmin claim for ${email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        results.notFound.push({ email });
      } else {
        results.errors.push({ email, error: error.message });
        logger.error(`Failed to sync claim for ${email}`, error);
      }
    }
  }

  logger.info('syncAllAppAdminClaims completed', results);
  return results;
});

/**
 * Cloud Function: addAppAdmin
 * Callable function to add a new appAdmin.
 * Only existing appAdmins or SuperAdmin (from env var) can call this.
 * This bypasses Firebase rules and writes directly to the database.
 */
exports.addAppAdmin = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const { email: targetEmail } = request.data || {};
  if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
    throw new HttpsError('invalid-argument', 'Se requiere un email válido.');
  }

  const callerEmail = request.auth.token.email;
  const callerClaims = request.auth.token;

  // Check if caller is appAdmin or SuperAdmin (from env var)
  const superAdminEmail = process.env.PUBLIC_SUPER_ADMIN_EMAIL || '';
  const isCallerSuperAdmin = callerEmail && superAdminEmail &&
    callerEmail.toLowerCase() === superAdminEmail.toLowerCase();
  const isCallerAppAdmin = callerClaims.isAppAdmin === true;

  if (!isCallerSuperAdmin && !isCallerAppAdmin) {
    throw new HttpsError('permission-denied', 'Solo appAdmins o SuperAdmin pueden añadir appAdmins.');
  }

  const normalizedEmail = targetEmail.toLowerCase().trim();
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);

  const db = getDatabase();

  // Write to database (this will trigger syncAppAdminClaim)
  await db.ref(`/data/appAdmins/${encodedEmail}`).set(true);

  logger.info(`AppAdmin added: ${normalizedEmail} by ${callerEmail}`);

  return {
    success: true,
    email: normalizedEmail,
    addedBy: callerEmail
  };
});

/**
 * Cloud Function: removeAppAdmin
 * Callable function to remove an appAdmin.
 * Only existing appAdmins can call this. Cannot remove yourself.
 */
exports.removeAppAdmin = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const { email: targetEmail } = request.data || {};
  if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
    throw new HttpsError('invalid-argument', 'Se requiere un email válido.');
  }

  const callerEmail = request.auth.token.email;
  const callerClaims = request.auth.token;

  // Only appAdmins can remove appAdmins
  if (callerClaims.isAppAdmin !== true) {
    throw new HttpsError('permission-denied', 'Solo appAdmins pueden eliminar appAdmins.');
  }

  const normalizedEmail = targetEmail.toLowerCase().trim();

  // Cannot remove yourself
  if (callerEmail.toLowerCase() === normalizedEmail) {
    throw new HttpsError('failed-precondition', 'No puedes eliminarte a ti mismo como appAdmin.');
  }

  const encodedEmail = encodeEmailForFirebase(normalizedEmail);
  const db = getDatabase();

  // Remove from database (this will trigger syncAppAdminClaim)
  await db.ref(`/data/appAdmins/${encodedEmail}`).remove();

  logger.info(`AppAdmin removed: ${normalizedEmail} by ${callerEmail}`);

  return {
    success: true,
    email: normalizedEmail,
    removedBy: callerEmail
  };
});

/**
 * Cloud Function: addAppUploader
 * Callable function to add an app uploader for a specific project.
 * Only appAdmins can call this.
 */
exports.addAppUploader = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const { email: targetEmail, projectId } = request.data || {};
  if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
    throw new HttpsError('invalid-argument', 'Se requiere un email válido.');
  }
  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'Se requiere un projectId válido.');
  }

  const callerClaims = request.auth.token;

  // Only appAdmins can add uploaders
  if (callerClaims.isAppAdmin !== true) {
    throw new HttpsError('permission-denied', 'Solo appAdmins pueden añadir uploaders.');
  }

  const normalizedEmail = targetEmail.toLowerCase().trim();
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);

  const db = getDatabase();

  // Dual-write: legacy path + new /users/ path
  const updates = {};
  updates[`/data/appUploaders/${projectId}/${encodedEmail}`] = true;
  updates[`/users/${encodedEmail}/projects/${projectId}/appPermissions/upload`] = true;
  await db.ref().update(updates);

  logger.info(`AppUploader added: ${normalizedEmail} for project ${projectId}`);

  return {
    success: true,
    email: normalizedEmail,
    projectId,
    addedBy: request.auth.token.email
  };
});

/**
 * Cloud Function: removeAppUploader
 * Callable function to remove an app uploader from a specific project.
 * Only appAdmins can call this.
 */
exports.removeAppUploader = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const { email: targetEmail, projectId } = request.data || {};
  if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
    throw new HttpsError('invalid-argument', 'Se requiere un email válido.');
  }
  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'Se requiere un projectId válido.');
  }

  const callerClaims = request.auth.token;

  // Only appAdmins can remove uploaders
  if (callerClaims.isAppAdmin !== true) {
    throw new HttpsError('permission-denied', 'Solo appAdmins pueden eliminar uploaders.');
  }

  const normalizedEmail = targetEmail.toLowerCase().trim();
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);

  const db = getDatabase();

  // Dual-write: remove from legacy path + new /users/ path
  const updates = {};
  updates[`/data/appUploaders/${projectId}/${encodedEmail}`] = null;
  updates[`/users/${encodedEmail}/projects/${projectId}/appPermissions/upload`] = false;
  await db.ref().update(updates);

  logger.info(`AppUploader removed: ${normalizedEmail} from project ${projectId}`);

  return {
    success: true,
    email: normalizedEmail,
    projectId,
    removedBy: request.auth.token.email
  };
});

/**
 * Cloud Function: syncAppAdminClaim
 * Syncs the isAppAdmin custom claim when /data/appAdmins changes.
 *
 * When a user is added to appAdmins (value = true), sets isAppAdmin claim to true.
 * When a user is removed from appAdmins, sets isAppAdmin claim to false.
 */
exports.syncAppAdminClaim = onValueWritten({
  ref: "/data/appAdmins/{encodedEmail}",
  region: "europe-west1"
}, async (event) => {
  const { encodedEmail } = event.params;
  const beforeValue = event.data.before?.val();
  const afterValue = event.data.after?.val();

  // Decode the email
  const email = decodeEmailFromFirebase(encodedEmail);
  if (!email) {
    logger.error('Could not decode email from Firebase key', { encodedEmail });
    return null;
  }

  // Determine if user should be appAdmin
  const shouldBeAppAdmin = afterValue === true;
  const wasAppAdmin = beforeValue === true;

  // No change needed
  if (shouldBeAppAdmin === wasAppAdmin) {
    return null;
  }

  try {
    // Find user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Get current claims and update isAppAdmin
    const currentClaims = userRecord.customClaims || {};
    const newClaims = {
      ...currentClaims,
      isAppAdmin: shouldBeAppAdmin
    };

    await admin.auth().setCustomUserClaims(userRecord.uid, newClaims);

    logger.info(`Updated isAppAdmin claim for ${email}`, {
      uid: userRecord.uid,
      isAppAdmin: shouldBeAppAdmin
    });

    return { success: true, email, isAppAdmin: shouldBeAppAdmin };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      logger.warn(`User not found for appAdmin sync: ${email}`);
      return null;
    }
    logger.error(`Failed to sync appAdmin claim for ${email}`, error);
    throw error;
  }
});

/**
 * Cloud Function: syncUserAllowedClaim
 * Syncs the 'allowed' custom claim when /users/{encodedEmail}/projects changes.
 * If user has at least one project with developer or stakeholder = true → allowed: true.
 * Otherwise → allowed: false.
 */
exports.syncUserAllowedClaim = onValueWritten({
  ref: "/users/{encodedEmail}/projects/{projectId}",
  region: "europe-west1"
}, async (event) => {
  const { encodedEmail } = event.params;

  const email = decodeEmailFromFirebase(encodedEmail);
  if (!email) {
    logger.error('Could not decode email from Firebase key', { encodedEmail });
    return null;
  }

  try {
    // Read all projects for this user to determine allowed status
    const projectsSnap = await admin.database().ref(`/users/${encodedEmail}/projects`).once('value');
    const shouldBeAllowed = hasActiveProject(projectsSnap.val());

    const userRecord = await admin.auth().getUserByEmail(email);
    const currentClaims = userRecord.customClaims || {};

    if (currentClaims.allowed === shouldBeAllowed) {
      return null; // No change needed
    }

    const newClaims = { ...currentClaims, allowed: shouldBeAllowed };
    await admin.auth().setCustomUserClaims(userRecord.uid, newClaims);

    logger.info(`Updated allowed claim for ${email}`, {
      uid: userRecord.uid,
      allowed: shouldBeAllowed
    });

    return { success: true, email, allowed: shouldBeAllowed };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      logger.warn(`User not found for allowed sync: ${email}. Claim will be set when user registers.`);
      return null;
    }
    logger.error(`Failed to sync allowed claim for ${email}`, error);
    throw error;
  }
});

/**
 * Cloud Function: listUsers
 * Returns all users from /users/ enriched with Auth status.
 * Only appAdmins can call this.
 */
exports.listUsers = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerClaims = request.auth.token || {};
  if (!callerClaims.isAppAdmin) {
    throw new HttpsError('permission-denied', 'Only appAdmins can list users');
  }

  const snapshot = await admin.database().ref('/users').once('value');
  const usersData = snapshot.val() || {};

  const users = [];
  for (const [encodedEmail, userData] of Object.entries(usersData)) {
    if (!userData.email) continue;
    let authStatus = 'not_registered';
    try {
      const userRecord = await admin.auth().getUserByEmail(userData.email);
      authStatus = userRecord.disabled ? 'disabled' : 'active';
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        logger.warn(`Error checking auth for ${userData.email}`, error);
      }
    }
    // Include appPermissions nested inside each project
    const projects = userData.projects || {};
    users.push({
      encodedEmail,
      email: userData.email,
      name: userData.name || '',
      developerId: userData.developerId || null,
      stakeholderId: userData.stakeholderId || null,
      active: userData.active !== false,
      projects,
      authStatus
    });
  }

  return { users };
});

/**
 * Cloud Function: createOrUpdateUser
 * Creates or updates a user in /users/{encodedEmail}.
 * Auto-generates developerId/stakeholderId when assigning roles.
 * Syncs allowed claim if user exists in Auth.
 * Only appAdmins can call this.
 */
exports.createOrUpdateUser = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerClaims = request.auth.token || {};
  if (!callerClaims.isAppAdmin) {
    throw new HttpsError('permission-denied', 'Only appAdmins can manage users');
  }

  const { email, name, projectId, developer, stakeholder } = request.data || {};
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'Email is required');
  }
  if (!name || typeof name !== 'string') {
    throw new HttpsError('invalid-argument', 'Name is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);
  const now = new Date().toISOString();
  const callerEmail = request.auth.token.email || 'unknown';

  // Read existing user data
  const existingSnap = await admin.database().ref(`/users/${encodedEmail}`).once('value');
  const existingData = existingSnap.val() || {};

  const updates = {};
  updates[`/users/${encodedEmail}/name`] = name.trim();
  updates[`/users/${encodedEmail}/email`] = normalizedEmail;
  updates[`/users/${encodedEmail}/active`] = true;

  if (!existingData.createdAt) {
    updates[`/users/${encodedEmail}/createdAt`] = now;
    updates[`/users/${encodedEmail}/createdBy`] = callerEmail;
  }

  // Handle developer ID
  const isDeveloper = developer === true;
  if (isDeveloper && !existingData.developerId) {
    const newDevId = await generateNextId('dev_', 'developerId', admin.database());
    updates[`/users/${encodedEmail}/developerId`] = newDevId;
  }

  // Handle stakeholder ID
  const isStakeholder = stakeholder === true;
  if (isStakeholder && !existingData.stakeholderId) {
    const newStkId = await generateNextId('stk_', 'stakeholderId', admin.database());
    updates[`/users/${encodedEmail}/stakeholderId`] = newStkId;
  }

  // Handle project assignment
  if (projectId && typeof projectId === 'string') {
    updates[`/users/${encodedEmail}/projects/${projectId}/developer`] = isDeveloper;
    updates[`/users/${encodedEmail}/projects/${projectId}/stakeholder`] = isStakeholder;
    if (!existingData.projects?.[projectId]?.addedAt) {
      updates[`/users/${encodedEmail}/projects/${projectId}/addedAt`] = now;
    }
  }

  await admin.database().ref().update(updates);

  logger.info(`User created/updated: ${normalizedEmail}`, {
    changedBy: callerEmail,
    projectId,
    developer: isDeveloper,
    stakeholder: isStakeholder
  });

  // Sync allowed claim if user exists in Auth
  try {
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    const currentClaims = userRecord.customClaims || {};
    const projectsSnap = await admin.database().ref(`/users/${encodedEmail}/projects`).once('value');
    const shouldBeAllowed = hasActiveProject(projectsSnap.val());

    if (currentClaims.allowed !== shouldBeAllowed) {
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        ...currentClaims,
        allowed: shouldBeAllowed
      });
    }
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      logger.warn(`Could not sync claims for ${normalizedEmail}`, error);
    }
  }

  return { success: true, email: normalizedEmail, encodedEmail };
});

/**
 * Cloud Function: removeUserFromProject
 * Removes a user's assignment from a specific project.
 * If no projects remain, revokes allowed claim.
 * Only appAdmins can call this.
 */
exports.removeUserFromProject = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerClaims = request.auth.token || {};
  if (!callerClaims.isAppAdmin) {
    throw new HttpsError('permission-denied', 'Only appAdmins can manage users');
  }

  const { email, projectId } = request.data || {};
  if (!email || !projectId) {
    throw new HttpsError('invalid-argument', 'Email and projectId are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);

  // Remove project assignment
  await admin.database().ref(`/users/${encodedEmail}/projects/${projectId}`).remove();

  logger.info(`Removed ${normalizedEmail} from project ${projectId}`, {
    removedBy: request.auth.token.email
  });

  // Check remaining projects and sync allowed claim
  try {
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    const projectsSnap = await admin.database().ref(`/users/${encodedEmail}/projects`).once('value');
    const shouldBeAllowed = hasActiveProject(projectsSnap.val());

    const currentClaims = userRecord.customClaims || {};
    if (currentClaims.allowed !== shouldBeAllowed) {
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        ...currentClaims,
        allowed: shouldBeAllowed
      });
      logger.info(`Revoked allowed claim for ${normalizedEmail} (no projects remaining)`);
    }
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      logger.warn(`Could not sync claims for ${normalizedEmail}`, error);
    }
  }

  return { success: true, email: normalizedEmail, projectId };
});

/**
 * Cloud Function: deleteUser
 * Deletes a user from /users/ and cleans up legacy paths.
 * Revokes custom claims but does NOT delete the Firebase Auth account.
 * Only appAdmins can call this.
 */
exports.deleteUser = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerClaims = request.auth.token || {};
  if (!callerClaims.isAppAdmin) {
    throw new HttpsError('permission-denied', 'Only appAdmins can delete users');
  }

  const { email } = request.data || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const callerEmail = request.auth.token.email || 'unknown';

  // Cannot delete yourself
  if (normalizedEmail === callerEmail.toLowerCase()) {
    throw new HttpsError('failed-precondition', 'Cannot delete your own account');
  }

  const encodedEmail = encodeEmailForFirebase(normalizedEmail);
  const db = getDatabase();

  // Read user data to get project list
  const userSnap = await db.ref(`/users/${encodedEmail}`).once('value');
  if (!userSnap.exists()) {
    throw new HttpsError('not-found', `User ${normalizedEmail} not found`);
  }

  const userData = userSnap.val();
  const projectIds = userData.projects ? Object.keys(userData.projects) : [];

  // Build multi-path delete
  const deletePaths = {};
  deletePaths[`/users/${encodedEmail}`] = null;
  deletePaths[`/data/appAdmins/${encodedEmail}`] = null;

  for (const pid of projectIds) {
    deletePaths[`/data/appUploaders/${pid}/${encodedEmail}`] = null;
    deletePaths[`/data/betaUsers/${pid}/${encodedEmail}`] = null;
  }

  await db.ref().update(deletePaths);

  logger.info(`User deleted: ${normalizedEmail}`, {
    deletedBy: callerEmail,
    projectsCleared: projectIds
  });

  // Revoke claims if user exists in Auth (do NOT delete the Auth account)
  try {
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    const currentClaims = userRecord.customClaims || {};
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      allowed: false,
      isAppAdmin: false,
      appPerms: {}
    });
    logger.info(`Claims revoked for ${normalizedEmail}`);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      logger.warn(`Could not revoke claims for ${normalizedEmail}`, error);
    }
  }

  return {
    success: true,
    email: normalizedEmail,
    deletedBy: callerEmail,
    projectsCleared: projectIds
  };
});

/**
 * Cloud Function: updateAppPermissions
 * Updates app permissions for a user in a specific project.
 * Writes to /users/{encodedEmail}/projects/{projectId}/appPermissions
 * and dual-writes to legacy paths for backward compatibility.
 * Only appAdmins can call this.
 */
exports.updateAppPermissions = onCall({
  region: "europe-west1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerClaims = request.auth.token || {};
  if (!callerClaims.isAppAdmin) {
    throw new HttpsError('permission-denied', 'Only appAdmins can update app permissions');
  }

  const { email, projectId, permissions } = request.data || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email is required');
  }
  if (!projectId || typeof projectId !== 'string') {
    throw new HttpsError('invalid-argument', 'projectId is required');
  }
  if (!permissions || typeof permissions !== 'object') {
    throw new HttpsError('invalid-argument', 'permissions object is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);
  const db = getDatabase();

  // Verify user exists
  const userSnap = await db.ref(`/users/${encodedEmail}`).once('value');
  if (!userSnap.exists()) {
    throw new HttpsError('not-found', `User ${normalizedEmail} not found`);
  }

  const validPerms = ['view', 'download', 'upload', 'edit', 'approve'];
  const sanitized = {};
  for (const perm of validPerms) {
    sanitized[perm] = permissions[perm] === true;
  }

  // Multi-path update
  const updates = {};
  const basePath = `/users/${encodedEmail}/projects/${projectId}/appPermissions`;
  for (const [perm, value] of Object.entries(sanitized)) {
    updates[`${basePath}/${perm}`] = value;
  }

  // Dual-write to legacy paths
  if (sanitized.upload) {
    updates[`/data/appUploaders/${projectId}/${encodedEmail}`] = true;
  } else {
    updates[`/data/appUploaders/${projectId}/${encodedEmail}`] = null;
  }
  if (sanitized.view) {
    updates[`/data/betaUsers/${projectId}/${encodedEmail}`] = true;
  } else {
    updates[`/data/betaUsers/${projectId}/${encodedEmail}`] = null;
  }

  await db.ref().update(updates);

  logger.info(`App permissions updated for ${normalizedEmail} in ${projectId}`, {
    updatedBy: request.auth.token.email,
    permissions: sanitized
  });

  return {
    success: true,
    email: normalizedEmail,
    projectId,
    permissions: sanitized
  };
});

/**
 * Cloud Function: syncAppPermissionsClaim
 * Trigger on /users/{encodedEmail}/projects write.
 * Rebuilds the compact appPerms claim from all project appPermissions.
 * Flags: v=view, d=download, u=upload, e=edit, a=approve
 */
exports.syncAppPermissionsClaim = onValueWritten({
  ref: "/users/{encodedEmail}/projects",
  region: "europe-west1"
}, async (event) => {
  const { encodedEmail } = event.params;
  const projectsData = event.data.after?.val();

  const email = decodeEmailFromFirebase(encodedEmail);
  if (!email) {
    logger.error('Could not decode email for appPerms sync', { encodedEmail });
    return null;
  }

  // Build compact appPerms map
  const flagMap = { view: 'v', download: 'd', upload: 'u', edit: 'e', approve: 'a' };
  const appPerms = {};

  if (projectsData && typeof projectsData === 'object') {
    for (const [pid, projData] of Object.entries(projectsData)) {
      const perms = projData?.appPermissions;
      if (!perms || typeof perms !== 'object') continue;

      let flags = '';
      for (const [perm, flag] of Object.entries(flagMap)) {
        if (perms[perm] === true) flags += flag;
      }
      if (flags) {
        appPerms[pid] = flags;
      }
    }
  }

  // Update custom claims
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const currentClaims = userRecord.customClaims || {};
    const newClaims = { ...currentClaims, appPerms };

    await admin.auth().setCustomUserClaims(userRecord.uid, newClaims);
    logger.info(`appPerms claim synced for ${email}`, { appPerms });
    return { success: true, email, appPerms };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      logger.warn(`User not found for appPerms sync: ${email}. Claim will be set when user registers.`);
      return null;
    }
    logger.error(`Failed to sync appPerms claim for ${email}`, error);
    throw error;
  }
});


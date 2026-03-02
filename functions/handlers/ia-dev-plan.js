/**
 * IA Development Plan handler.
 * Generates structured development plans from descriptions using OpenAI.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');
const { callOpenAI } = require('../shared/openai-client.cjs');

/**
 * Call OpenAI API to generate a structured development plan.
 * @param {string} apiKey
 * @param {string} context
 * @param {Array} existingEpics
 * @param {string} projectName
 * @param {string|null} existingPlanJson - Existing plan JSON for refinement
 * @returns {Promise<object>} Raw OpenAI response
 */
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

  return callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    temperature: 0.4,
    max_tokens: 4000,
    errorContext: 'generating dev plan with OpenAI',
    errorMessage: 'No se pudo generar el plan con IA.'
  });
}

/**
 * Handle the generateDevPlan callable function.
 * @param {object} request - Firebase callable request
 * @param {object} deps - Injected dependencies
 * @param {object} deps.db - Firebase RTDB reference
 * @param {object} deps.logger - Logger instance
 * @param {string} deps.apiKey - OpenAI API key
 * @param {boolean} deps.iaEnabled - Whether IA is globally enabled
 * @returns {Promise<object>}
 */
async function handleGenerateDevPlan(request, deps) {
  const { db, logger, apiKey, iaEnabled } = deps;

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.');
  }

  if (!iaEnabled) {
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
}

module.exports = {
  handleGenerateDevPlan,
  // Exported for testing
  callOpenAIForPlanGeneration,
};

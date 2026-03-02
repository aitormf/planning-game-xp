/**
 * IA Bug Analysis handler.
 * Analyzes bug descriptions and generates acceptance criteria for bugs using OpenAI.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');
const { callOpenAI } = require('../shared/openai-client.cjs');
const { buildAcceptanceText } = require('../shared/card-utils.cjs');
const { parseAcceptanceCriteriaResponse } = require('./ia-acceptance-criteria');

/**
 * Call OpenAI API to analyze bug description clarity.
 * @param {string} apiKey
 * @param {string} title
 * @param {string} description
 * @returns {Promise<object>} Raw OpenAI response
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

  return callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    temperature: 0.3,
    errorContext: 'analyzing bug description',
    errorMessage: 'No se pudo analizar la descripción del bug.'
  });
}

/**
 * Parse and validate bug analysis response from OpenAI.
 * @param {object} aiData - Raw OpenAI response
 * @param {object} [logger=console] - Logger instance
 * @returns {object} Parsed analysis result
 * @throws {HttpsError}
 */
function parseBugAnalysisResponse(aiData, logger = console) {
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
 * Call OpenAI API to generate acceptance criteria for bugs.
 * @param {string} apiKey
 * @param {string} title
 * @param {string} description
 * @param {string} notes
 * @returns {Promise<object>} Raw OpenAI response
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

  return callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    temperature: 0.2,
    errorContext: 'generating bug acceptance criteria',
    errorMessage: 'No se pudo generar Acceptance Criteria para el bug.'
  });
}

/**
 * Handle the analyzeBugDescription callable function.
 * @param {object} request - Firebase callable request
 * @param {object} deps - Injected dependencies
 * @param {object} deps.db - Firebase RTDB reference
 * @param {object} deps.logger - Logger instance
 * @param {string} deps.apiKey - OpenAI API key
 * @param {boolean} deps.iaEnabled - Whether IA is globally enabled
 * @returns {Promise<object>}
 */
async function handleAnalyzeBugDescription(request, deps) {
  const { db, logger, apiKey, iaEnabled } = deps;

  if (!iaEnabled) {
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

  // Step 1: Analyze description (unless force or skipAnalysis)
  if (!force && !skipAnalysis) {
    try {
      const analysisData = await callOpenAIForBugAnalysis(apiKey, title, description);
      const analysis = parseBugAnalysisResponse(analysisData, logger);

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
  const scenarios = parseAcceptanceCriteriaResponse(aiData, logger);
  const acceptanceText = buildAcceptanceText(scenarios);

  // Step 3: Save to database if bugId and projectId provided
  if (projectId && bugId) {
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
}

module.exports = {
  handleAnalyzeBugDescription,
  // Exported for testing
  callOpenAIForBugAnalysis,
  parseBugAnalysisResponse,
  callOpenAIForBugAcceptanceCriteria,
};

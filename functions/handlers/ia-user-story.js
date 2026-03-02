/**
 * IA User Story handler.
 * Converts plain descriptions to user story format (como/quiero/para) using OpenAI.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');
const { callOpenAI } = require('../shared/openai-client.cjs');

/**
 * Handle the convertDescriptionToUserStory callable function.
 * @param {object} request - Firebase callable request
 * @param {object} deps - Injected dependencies
 * @param {object} deps.logger - Logger instance
 * @param {string} deps.apiKey - OpenAI API key
 * @param {boolean} deps.iaEnabled - Whether IA is globally enabled
 * @returns {Promise<object>}
 */
async function handleConvertDescriptionToUserStory(request, deps) {
  const { logger, apiKey, iaEnabled } = deps;

  // Validate auth
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.');
  }

  // Validate global IA is enabled
  if (!iaEnabled) {
    throw new HttpsError('failed-precondition', 'La IA no está habilitada globalmente.');
  }

  // Validate request data
  const data = request.data || {};
  const { description, title } = data;

  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    throw new HttpsError('invalid-argument', 'La descripción es requerida y debe tener al menos 5 caracteres.');
  }

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

  const aiData = await callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    temperature: 0.3,
    max_tokens: 500,
    errorContext: 'converting description with OpenAI',
    errorMessage: 'No se pudo convertir la descripción con IA.'
  });

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
}

module.exports = {
  handleConvertDescriptionToUserStory,
};

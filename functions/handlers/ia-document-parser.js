/**
 * IA Document Parser handler.
 * Parses documents and generates tasks/bugs using OpenAI.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');
const { callOpenAI } = require('../shared/openai-client.cjs');

/**
 * Call OpenAI API to parse document content and generate tasks/bugs.
 * @param {string} apiKey
 * @param {string} documentContent
 * @param {Array} existingEpics
 * @param {string} projectName
 * @param {string} [scoringSystem='1-5']
 * @returns {Promise<object>} Raw OpenAI response
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

  return callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], {
    temperature: 0.3,
    max_tokens: 4000,
    errorContext: 'parsing document with OpenAI',
    errorMessage: 'No se pudo analizar el documento con IA.'
  });
}

/**
 * Parse and validate document parsing response from OpenAI.
 * @param {object} aiData - Raw OpenAI response
 * @param {object} [logger=console] - Logger instance
 * @returns {Array} Array of validated item objects
 * @throws {HttpsError}
 */
function parseDocumentParsingResponse(aiData, logger = console) {
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
 * Handle the parseDocumentForCards callable function.
 * @param {object} request - Firebase callable request
 * @param {object} deps - Injected dependencies
 * @param {object} deps.db - Firebase RTDB reference
 * @param {object} deps.logger - Logger instance
 * @param {string} deps.apiKey - OpenAI API key
 * @param {boolean} deps.iaEnabled - Whether IA is globally enabled
 * @returns {Promise<object>}
 */
async function handleParseDocumentForCards(request, deps) {
  const { db, logger, apiKey, iaEnabled } = deps;

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
  const items = parseDocumentParsingResponse(aiData, logger);

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
}

module.exports = {
  handleParseDocumentForCards,
  // Exported for testing
  callOpenAIForDocumentParsing,
  parseDocumentParsingResponse,
};

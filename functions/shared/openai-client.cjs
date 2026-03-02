/**
 * Shared OpenAI API client for Firebase Cloud Functions.
 * Provides a generic wrapper around the OpenAI chat completions API
 * used by all IA-related functions.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Call the OpenAI chat completions API.
 *
 * @param {string} apiKey - OpenAI API key
 * @param {Array<{role: string, content: string}>} messages - Chat messages
 * @param {object} [options] - Optional overrides
 * @param {string} [options.model='gpt-4o-mini'] - Model to use
 * @param {number} [options.temperature=0.3] - Temperature (0-2)
 * @param {number} [options.max_tokens] - Max tokens in response
 * @param {object} [options.response_format] - Response format (e.g. { type: 'json_object' })
 * @param {object} [options.logger] - Logger instance for error reporting
 * @param {string} [options.errorContext='OpenAI'] - Context string for error messages
 * @param {string} [options.errorMessage='Error calling OpenAI API'] - User-facing error message
 * @returns {Promise<object>} Parsed JSON response from OpenAI
 * @throws {HttpsError} If the API call fails
 */
async function callOpenAI(apiKey, messages, options = {}) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.3,
    max_tokens,
    response_format = { type: 'json_object' },
    logger = console,
    errorContext = 'OpenAI',
    errorMessage = 'Error calling OpenAI API.'
  } = options;

  const body = {
    model,
    temperature,
    response_format,
    messages
  };

  if (max_tokens) {
    body.max_tokens = max_tokens;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`Error in ${errorContext}`, { status: response.status, errorBody });
    throw new HttpsError('internal', errorMessage);
  }

  return response.json();
}

module.exports = { callOpenAI };

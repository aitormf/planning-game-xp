/**
 * Authentication utility functions for Firebase Cloud Functions.
 * Extracted from functions/index.js during monolith refactor.
 *
 * Provides pre-authorization checks and ID generation for users.
 */
'use strict';

const { encodeEmailForFirebase, normalizeGmailEmail } = require('./email-utils.cjs');
const { hasActiveProject } = require('./card-utils.cjs');

/**
 * Check if an email is pre-authorized in /users/.
 * A user is authorized if they exist in /users/ and have at least one project assigned.
 * Tries both the exact email and the Gmail-normalized variant.
 * @param {string} email
 * @param {object} db - Firebase Realtime Database instance (injected)
 * @returns {Promise<boolean>}
 */
async function isEmailPreAuthorized(email, db) {
  const normalizedEmail = email.trim().toLowerCase();
  const encodedExact = encodeEmailForFirebase(normalizedEmail);

  const exactSnap = await db.ref(`/users/${encodedExact}/projects`).once('value');
  if (hasActiveProject(exactSnap.val())) return true;

  const gmailNormalized = normalizeGmailEmail(normalizedEmail);
  if (gmailNormalized !== normalizedEmail) {
    const encodedNormalized = encodeEmailForFirebase(gmailNormalized);
    const normalizedSnap = await db.ref(`/users/${encodedNormalized}/projects`).once('value');
    if (hasActiveProject(normalizedSnap.val())) return true;
  }

  return false;
}

/**
 * Auto-generate the next available developer or stakeholder ID.
 * Scans /users/ in RTDB and finds the highest existing ID, then increments.
 * @param {string} prefix - "dev_" or "stk_"
 * @param {string} field - "developerId" or "stakeholderId"
 * @param {object} db - Firebase Realtime Database instance (injected)
 * @returns {Promise<string>} The next ID (e.g., "dev_020")
 */
async function generateNextId(prefix, field, db) {
  const usersSnap = await db.ref('/users').once('value');
  const users = usersSnap.val() || {};
  let maxNum = 0;
  for (const userData of Object.values(users)) {
    const id = userData[field];
    if (id && id.startsWith(prefix)) {
      const num = parseInt(id.replace(prefix, ''), 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

module.exports = {
  isEmailPreAuthorized,
  generateNextId,
};

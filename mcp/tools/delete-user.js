import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';

/**
 * Email encoding for Firebase Realtime Database keys.
 * @ -> |, . -> !, # -> -
 */
function encodeEmailForFirebase(email) {
  if (!email) return '';
  return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

/**
 * Normalizes Gmail addresses by removing dots from the local part.
 */
function normalizeGmailEmail(email) {
  if (!email) return '';
  const lower = email.trim().toLowerCase();
  const [localPart, domain] = lower.split('@');
  if (!domain) return lower;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return localPart.replace(/\./g, '') + '@' + domain;
  }
  return lower;
}

export const deleteUserSchema = z.object({
  email: z.string().describe('Email of the user to delete. The user record and all legacy permission entries will be removed.')
});

export async function deleteUser({ email }) {
  const db = getDatabase();
  const normalizedEmail = normalizeGmailEmail(email);
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);

  // Read user data to get project list
  const userSnap = await db.ref(`/users/${encodedEmail}`).once('value');
  if (!userSnap.exists()) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: `User ${normalizedEmail} not found in /users/`
        }, null, 2)
      }]
    };
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

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        email: normalizedEmail,
        encodedEmail,
        projectsCleared: projectIds,
        pathsDeleted: Object.keys(deletePaths),
        message: `User "${userData.name}" (${normalizedEmail}) deleted. ${projectIds.length} project(s) cleaned up. Note: Firebase Auth account is NOT deleted (MCP has no Auth access).`
      }, null, 2)
    }]
  };
}

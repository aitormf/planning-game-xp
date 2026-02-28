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
 * Gmail treats "j.doe@gmail.com" and "jdoe@gmail.com" as the same.
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

/**
 * Scans all users to find the next available dev_ or stk_ ID.
 */
async function generateNextId(db, prefix, field) {
  const snapshot = await db.ref('/users').once('value');
  const users = snapshot.val() || {};
  let maxNum = 0;
  for (const userData of Object.values(users)) {
    const id = userData?.[field];
    if (id && typeof id === 'string' && id.startsWith(prefix)) {
      const num = parseInt(id.replace(prefix, ''), 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

export const provisionUserSchema = z.object({
  email: z.string().describe('User email address. Will be normalized and encoded for Firebase.'),
  name: z.string().describe('Full name of the user.'),
  projects: z.array(z.object({
    projectId: z.string().describe('Project ID to assign (e.g., "PLN", "NTR")'),
    developer: z.boolean().optional().default(true).describe('Assign as developer in this project'),
    stakeholder: z.boolean().optional().default(false).describe('Assign as stakeholder in this project'),
    appPermissions: z.object({
      view: z.boolean().optional().default(false),
      download: z.boolean().optional().default(false),
      upload: z.boolean().optional().default(false),
      edit: z.boolean().optional().default(false),
      approve: z.boolean().optional().default(false),
    }).optional().describe('App permissions for this project (view, download, upload, edit, approve)')
  })).min(1).describe('Array of project assignments. At least one project is required.'),
  developer: z.boolean().optional().default(true).describe('Generate a developer ID if the user does not have one yet'),
  stakeholder: z.boolean().optional().default(false).describe('Generate a stakeholder ID if the user does not have one yet')
});

export async function provisionUser({ email, name, projects, developer, stakeholder }) {
  const db = getDatabase();
  const normalizedEmail = normalizeGmailEmail(email);
  const encodedEmail = encodeEmailForFirebase(normalizedEmail);
  const now = new Date().toISOString();

  // Read existing user data (idempotent: re-runs are safe)
  const existingSnap = await db.ref(`/users/${encodedEmail}`).once('value');
  const existingData = existingSnap.val() || {};
  const isNew = !existingSnap.exists();

  const updates = {};
  const basePath = `/users/${encodedEmail}`;

  // Core user fields
  updates[`${basePath}/name`] = name.trim();
  updates[`${basePath}/email`] = normalizedEmail;
  updates[`${basePath}/active`] = true;

  if (!existingData.createdAt) {
    updates[`${basePath}/createdAt`] = now;
    updates[`${basePath}/createdBy`] = 'mcp-provision';
  }

  const result = {
    email: normalizedEmail,
    encodedEmail,
    isNew,
    steps: []
  };

  // Developer ID generation
  let developerId = existingData.developerId || null;
  if (developer && !developerId) {
    developerId = await generateNextId(db, 'dev_', 'developerId');
    updates[`${basePath}/developerId`] = developerId;
    result.steps.push({ action: 'created', detail: `Developer ID: ${developerId}` });
  } else if (developerId) {
    result.steps.push({ action: 'existing', detail: `Developer ID: ${developerId}` });
  }
  result.developerId = developerId;

  // Stakeholder ID generation
  let stakeholderId = existingData.stakeholderId || null;
  if (stakeholder && !stakeholderId) {
    stakeholderId = await generateNextId(db, 'stk_', 'stakeholderId');
    updates[`${basePath}/stakeholderId`] = stakeholderId;
    result.steps.push({ action: 'created', detail: `Stakeholder ID: ${stakeholderId}` });
  } else if (stakeholderId) {
    result.steps.push({ action: 'existing', detail: `Stakeholder ID: ${stakeholderId}` });
  }
  result.stakeholderId = stakeholderId;

  // Project assignments
  const existingProjects = existingData.projects || {};
  result.projectAssignments = [];

  for (const proj of projects) {
    const { projectId, developer: isDev, stakeholder: isStk, appPermissions } = proj;
    const existing = existingProjects[projectId];

    updates[`${basePath}/projects/${projectId}/developer`] = isDev;
    updates[`${basePath}/projects/${projectId}/stakeholder`] = isStk;

    if (!existing?.addedAt) {
      updates[`${basePath}/projects/${projectId}/addedAt`] = now;
    }

    // Write appPermissions if provided
    if (appPermissions && typeof appPermissions === 'object') {
      const permKeys = ['view', 'download', 'upload', 'edit', 'approve'];
      for (const key of permKeys) {
        updates[`${basePath}/projects/${projectId}/appPermissions/${key}`] = appPermissions[key] === true;
      }
    }

    result.projectAssignments.push({
      projectId,
      developer: isDev,
      stakeholder: isStk,
      appPermissions: appPermissions || null,
      status: existing ? 'updated' : 'added'
    });
    result.steps.push({
      action: existing ? 'updated' : 'added',
      detail: `Project: ${projectId} (dev=${isDev}, stk=${isStk}${appPermissions ? ', perms=' + JSON.stringify(appPermissions) : ''})`
    });
  }

  // Apply all updates atomically
  await db.ref().update(updates);

  result.steps.push({ action: 'done', detail: 'User record saved to /users/' });
  result.message = isNew
    ? `User "${name}" (${normalizedEmail}) provisioned successfully with ${projects.length} project(s).`
    : `User "${name}" (${normalizedEmail}) updated successfully. ${projects.length} project(s) processed.`;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

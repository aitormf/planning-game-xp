import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';

export const listStakeholdersSchema = z.object({
  projectId: z.string().optional().describe('Filter stakeholders by project ID')
});

export async function listStakeholders({ projectId } = {}) {
  const db = getDatabase();

  const snapshot = await db.ref('/users').once('value');
  const usersData = snapshot.val();

  if (!usersData) {
    return { content: [{ type: 'text', text: 'No stakeholders found.' }] };
  }

  let stakeholders = [];

  for (const [, userData] of Object.entries(usersData)) {
    if (!userData || typeof userData !== 'object') continue;
    if (!userData.stakeholderId) continue;
    if (userData.active === false) continue;

    // If projectId filter, check user has stakeholder role in that project
    if (projectId && userData.projects?.[projectId]?.stakeholder !== true) continue;

    stakeholders.push({
      id: userData.stakeholderId,
      name: userData.name || '',
      email: userData.email || '',
      teamId: userData.teamId || null
    });
  }

  if (stakeholders.length === 0) {
    return { content: [{ type: 'text', text: 'No stakeholders found.' }] };
  }

  stakeholders.sort((a, b) => a.name.localeCompare(b.name));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(stakeholders, null, 2)
    }]
  };
}

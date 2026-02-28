import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';

export const listDevelopersSchema = z.object({
  projectId: z.string().optional().describe('Filter developers by project ID')
});

export async function listDevelopers({ projectId } = {}) {
  const db = getDatabase();

  const snapshot = await db.ref('/users').once('value');
  const usersData = snapshot.val();

  if (!usersData) {
    return { content: [{ type: 'text', text: 'No developers found.' }] };
  }

  let developers = [];

  for (const [, userData] of Object.entries(usersData)) {
    if (!userData || typeof userData !== 'object') continue;
    if (!userData.developerId) continue;
    if (userData.active === false) continue;

    // If projectId filter, check user has developer role in that project
    if (projectId && userData.projects?.[projectId]?.developer !== true) continue;

    developers.push({
      id: userData.developerId,
      name: userData.name || '',
      email: userData.email || ''
    });
  }

  if (developers.length === 0) {
    return { content: [{ type: 'text', text: 'No developers found.' }] };
  }

  developers.sort((a, b) => a.name.localeCompare(b.name));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(developers, null, 2)
    }]
  };
}

import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';

export const listStakeholdersSchema = z.object({
  projectId: z.string().optional().describe('Filter stakeholders by project ID')
});

export async function listStakeholders({ projectId } = {}) {
  const db = getDatabase();

  const snapshot = await db.ref('/data/stakeholders').once('value');
  const stakeholdersData = snapshot.val();

  if (!stakeholdersData) {
    return { content: [{ type: 'text', text: 'No stakeholders found.' }] };
  }

  let stakeholders = [];

  for (const [key, value] of Object.entries(stakeholdersData)) {
    if (!value) continue;

    if (key.startsWith('stk_') && typeof value === 'object') {
      if (value.active === false) continue;
      stakeholders.push({
        id: key,
        name: value.name || '',
        email: value.email || '',
        teamId: value.teamId || null
      });
    } else if (typeof value === 'string') {
      stakeholders.push({
        id: key,
        name: key,
        email: value
      });
    }
  }

  if (projectId) {
    const projectSnapshot = await db.ref(`/projects/${projectId}/stakeholders`).once('value');
    const projectStakeholders = projectSnapshot.val();

    if (projectStakeholders && Array.isArray(projectStakeholders)) {
      stakeholders = stakeholders.filter(s => projectStakeholders.includes(s.id));
    }
  }

  stakeholders.sort((a, b) => a.name.localeCompare(b.name));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(stakeholders, null, 2)
    }]
  };
}

import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';

export const listDevelopersSchema = z.object({
  projectId: z.string().optional().describe('Filter developers by project ID')
});

export async function listDevelopers({ projectId } = {}) {
  const db = getDatabase();

  const snapshot = await db.ref('/data/developers').once('value');
  const developersData = snapshot.val();

  let developers = [];

  if (developersData) {
    for (const [id, data] of Object.entries(developersData)) {
      if (!data) continue;
      if (data.active === false) continue;

      developers.push({
        id,
        name: data.name || '',
        email: data.email || ''
      });
    }
  }

  if (developers.length === 0) {
    const projectsSnapshot = await db.ref('/projects').once('value');
    const projectsData = projectsSnapshot.val();

    if (projectsData) {
      const seenEmails = new Set();

      for (const [projId, proj] of Object.entries(projectsData)) {
        if (!proj.developers) continue;

        for (const dev of proj.developers) {
          if (!dev || !dev.email) continue;
          const email = dev.email.toLowerCase().trim();
          if (seenEmails.has(email)) continue;
          seenEmails.add(email);

          developers.push({
            id: email,
            name: dev.name || '',
            email: email
          });
        }
      }
    }
  }

  if (projectId && developers.length > 0) {
    const projectSnapshot = await db.ref(`/projects/${projectId}/developers`).once('value');
    const projectDevelopers = projectSnapshot.val();

    if (projectDevelopers) {
      if (Array.isArray(projectDevelopers)) {
        const isObjectArray = projectDevelopers.length > 0 && typeof projectDevelopers[0] === 'object';

        if (isObjectArray) {
          const projectEmails = new Set(projectDevelopers.map(d => d.email?.toLowerCase().trim()).filter(Boolean));
          developers = developers.filter(d => projectEmails.has(d.email.toLowerCase()));
        } else {
          const projectIds = new Set(projectDevelopers);
          developers = developers.filter(d => projectIds.has(d.id));
        }
      }
    }
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

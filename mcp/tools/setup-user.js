import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';
import { isMcpUserConfigured, writeMcpUser, getMcpUser } from '../user.js';

export const setupMcpUserSchema = z.object({
  developerId: z.string().optional().describe('Developer ID to configure (e.g., "dev_010"). If not provided, lists available developers to choose from.')
});

export async function setupMcpUser({ developerId } = {}) {
  const db = getDatabase();

  if (!developerId) {
    const snapshot = await db.ref('/data/developers').once('value');
    const developersData = snapshot.val();

    if (!developersData) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'No developers found in the database. Add developers first.',
            developers: []
          }, null, 2)
        }]
      };
    }

    const developers = [];
    for (const [devId, devData] of Object.entries(developersData)) {
      if (!devId.startsWith('dev_') || typeof devData !== 'object') continue;
      if (devData.active === false) continue;
      developers.push({ id: devId, name: devData.name || '', email: devData.email || '' });
    }

    developers.sort((a, b) => a.name.localeCompare(b.name));

    const currentUser = getMcpUser();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: currentUser
            ? `MCP user is currently configured as "${currentUser.name}" (${currentUser.developerId}). Select a developer to reconfigure.`
            : 'MCP user is not configured. Select your developer ID from the list below and call setup_mcp_user again with the developerId parameter.',
          currentUser: currentUser || null,
          developers
        }, null, 2)
      }]
    };
  }

  if (!developerId.startsWith('dev_')) {
    throw new Error(`Invalid developer ID "${developerId}". Must start with "dev_".`);
  }

  const devSnapshot = await db.ref(`/data/developers/${developerId}`).once('value');
  const devData = devSnapshot.val();

  if (!devData) {
    throw new Error(`Developer "${developerId}" not found in /data/developers.`);
  }

  const userData = {
    developerId,
    stakeholderId: null,
    name: devData.name || '',
    email: devData.email || ''
  };

  if (devData.email) {
    const stkSnapshot = await db.ref('/data/stakeholders').once('value');
    const stakeholdersData = stkSnapshot.val() || {};

    for (const [stkId, stkData] of Object.entries(stakeholdersData)) {
      if (!stkId.startsWith('stk_') || typeof stkData !== 'object') continue;
      if (stkData.active === false) continue;
      if (stkData.email === devData.email) {
        userData.stakeholderId = stkId;
        break;
      }
    }
  }

  writeMcpUser(userData);

  const response = {
    message: `MCP user configured successfully as "${userData.name}" (${developerId}).`,
    user: userData
  };

  if (!userData.stakeholderId) {
    response.warning = `No matching stakeholder found for email "${userData.email}". stakeholderId is null - validator auto-assignment may not work for this user.`;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }]
  };
}

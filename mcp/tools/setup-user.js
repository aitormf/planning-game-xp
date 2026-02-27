import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';
import { isMcpUserConfigured, writeMcpUser, getMcpUser } from '../user.js';

export const setupMcpUserSchema = z.object({
  developerId: z.string().optional().describe('Developer ID (e.g., "dev_010"). Optional if name or email is provided.'),
  name: z.string().optional().describe('Developer name to search for (e.g., "Reinaldo"). Partial match supported.'),
  email: z.string().optional().describe('Developer email to search for.')
});

export async function setupMcpUser({ developerId, name, email } = {}) {
  const db = getDatabase();

  // Load all developers (needed for listing, name/email matching, and validation)
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

  const allDevs = [];
  for (const [devId, devData] of Object.entries(developersData)) {
    if (!devId.startsWith('dev_') || typeof devData !== 'object') continue;
    if (devData.active === false) continue;
    allDevs.push({ id: devId, name: devData.name || '', email: devData.email || '' });
  }
  allDevs.sort((a, b) => a.name.localeCompare(b.name));

  // If name or email provided, try to find the matching developer
  if (!developerId && (name || email)) {
    let matches = [];

    if (email) {
      const emailLower = email.toLowerCase();
      matches = allDevs.filter(d => d.email.toLowerCase() === emailLower);
    } else if (name) {
      const nameLower = name.toLowerCase();
      // Exact match first, then partial
      matches = allDevs.filter(d => d.name.toLowerCase() === nameLower);
      if (matches.length === 0) {
        matches = allDevs.filter(d => d.name.toLowerCase().includes(nameLower));
      }
    }

    if (matches.length === 1) {
      developerId = matches[0].id;
    } else if (matches.length > 1) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Multiple developers match "${name || email}". Ask the user which one they are and call again with the developerId.`,
            matches
          }, null, 2)
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `No developer found matching "${name || email}". Ask the user to pick from the full list.`,
            developers: allDevs
          }, null, 2)
        }]
      };
    }
  }

  // No params at all — list developers for the AI to ask the user
  if (!developerId) {
    const currentUser = getMcpUser();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: currentUser
            ? `MCP user is currently configured as "${currentUser.name}" (${currentUser.developerId}). To reconfigure, ask the user their name or email and call setup_mcp_user with the name or email parameter.`
            : 'MCP user is not configured. Ask the user their name or email, then call setup_mcp_user again with the name or email parameter to auto-match.',
          currentUser: currentUser || null,
          developers: allDevs
        }, null, 2)
      }]
    };
  }

  if (!developerId.startsWith('dev_')) {
    throw new Error(`Invalid developer ID "${developerId}". Must start with "dev_".`);
  }

  const devData = allDevs.find(d => d.id === developerId);

  if (!devData) {
    throw new Error(`Developer "${developerId}" not found in /data/developers.`);
  }

  const userData = {
    developerId,
    stakeholderId: null,
    name: devData.name,
    email: devData.email
  };

  // Auto-match stakeholder by email
  if (devData.email) {
    const stkSnapshot = await db.ref('/data/stakeholders').once('value');
    const stakeholdersData = stkSnapshot.val() || {};

    for (const [stkId, stkData] of Object.entries(stakeholdersData)) {
      if (!stkId.startsWith('stk_') || typeof stkData !== 'object') continue;
      if (stkData.active === false) continue;
      if (stkData.email && stkData.email.toLowerCase() === devData.email.toLowerCase()) {
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

  if (userData.stakeholderId) {
    response.message += ` Stakeholder auto-matched: ${userData.stakeholderId}.`;
  } else {
    response.warning = `No matching stakeholder found for email "${userData.email}". stakeholderId is null - validator auto-assignment may not work for this user.`;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }]
  };
}

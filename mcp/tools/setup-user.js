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

  // Load all users from centralized /users/ model
  const snapshot = await db.ref('/users').once('value');
  const usersData = snapshot.val();

  if (!usersData) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: 'No users found in the database. Add users first.',
          developers: []
        }, null, 2)
      }]
    };
  }

  // Build developer list from /users/ entries that have a developerId
  const allDevs = [];
  for (const [, userData] of Object.entries(usersData)) {
    if (!userData || typeof userData !== 'object') continue;
    if (!userData.developerId) continue;
    if (userData.active === false) continue;
    allDevs.push({
      id: userData.developerId,
      name: userData.name || '',
      email: userData.email || '',
      stakeholderId: userData.stakeholderId || null
    });
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
            matches: matches.map(({ stakeholderId: _s, ...rest }) => rest)
          }, null, 2)
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `No developer found matching "${name || email}". Ask the user to pick from the full list.`,
            developers: allDevs.map(({ stakeholderId: _s, ...rest }) => rest)
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
          developers: allDevs.map(({ stakeholderId: _s, ...rest }) => rest)
        }, null, 2)
      }]
    };
  }

  if (!developerId.startsWith('dev_')) {
    throw new Error(`Invalid developer ID "${developerId}". Must start with "dev_".`);
  }

  const devData = allDevs.find(d => d.id === developerId);

  if (!devData) {
    throw new Error(`Developer "${developerId}" not found in /users/.`);
  }

  const userData = {
    developerId,
    stakeholderId: devData.stakeholderId || null,
    name: devData.name,
    email: devData.email
  };

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

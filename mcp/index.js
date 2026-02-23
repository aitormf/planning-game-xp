import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { basename } from 'path';
import { initFirebase } from './firebase-adapter.js';
import { createMcpServer } from './register-tools.js';
import { checkVersionAtStartup } from './version-check.js';

/**
 * Derive instance name from MCP_INSTANCE_DIR (last path segment).
 * Returns null if no instance directory is configured.
 */
function getInstanceName() {
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (!instanceDir) return null;
  return basename(instanceDir);
}

// Initialize Firebase
initFirebase();

// Check for updates at startup (logs to stderr if update available)
checkVersionAtStartup();

// Derive server name from instance directory
const instanceName = getInstanceName();
const serverName = instanceName ? `planning-game-${instanceName}` : 'planning-gamexp';

// Create and start the MCP server
const server = createMcpServer(serverName);
const transport = new StdioServerTransport();
await server.connect(transport);

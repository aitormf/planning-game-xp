import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the path to mcp.user.json.
 * Priority: MCP_INSTANCE_DIR/mcp.user.json > repo root/mcp.user.json
 */
export function resolveUserConfigPath() {
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (instanceDir) {
    return resolve(instanceDir, 'mcp.user.json');
  }
  return resolve(__dirname, '..', 'mcp.user.json');
}

export const USER_CONFIG_PATH = resolveUserConfigPath();

let mcpUser = null;
let loaded = false;

/**
 * Load user config from mcp.user.json
 */
function loadUser() {
  if (loaded) return;
  loaded = true;

  try {
    const raw = readFileSync(USER_CONFIG_PATH, 'utf8');
    mcpUser = JSON.parse(raw);
  } catch {
    mcpUser = null;
  }
}

export function isMcpUserConfigured() {
  loadUser();
  return mcpUser !== null && !!mcpUser.developerId;
}

export function getMcpUser() {
  loadUser();
  return mcpUser;
}

export function getMcpUserId() {
  loadUser();
  if (mcpUser && mcpUser.email) return mcpUser.email;
  return 'geniova-mcp';
}

export function writeMcpUser(userData) {
  writeFileSync(USER_CONFIG_PATH, JSON.stringify(userData, null, 2) + '\n', 'utf8');
  mcpUser = userData;
  loaded = true;
}

import { readConfig } from './utils/pg-config.js';
import { getFirebaseProjectId } from './firebase-adapter.js';

let cachedMetadata = null;

/**
 * Get instance metadata from pg.config.yml and environment.
 * Returns { name, firebaseProjectId, description }.
 * Cached after first call for performance.
 */
export function getInstanceMetadata() {
  if (cachedMetadata) return cachedMetadata;

  const instanceDir = process.env.MCP_INSTANCE_DIR || null;
  const instanceName = instanceDir ? instanceDir.split('/').pop() : null;

  let description = null;
  try {
    const config = readConfig();
    if (config?.instance?.description) {
      description = config.instance.description;
    }
  } catch {
    // Config may not exist yet — description stays null
  }

  cachedMetadata = {
    name: instanceName,
    firebaseProjectId: getFirebaseProjectId(),
    description
  };

  return cachedMetadata;
}

/**
 * Reset cached metadata (useful for tests or after config changes).
 */
export function resetInstanceMetadataCache() {
  cachedMetadata = null;
}

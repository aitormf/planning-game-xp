import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from './firebase-adapter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const TRACKING_FILENAME = '.pg-guidelines-versions.json';

/**
 * Resolve the path to the guidelines tracking file.
 * Priority: MCP_INSTANCE_DIR > repo root.
 */
export function getTrackingFilePath() {
  const instanceDir = process.env.MCP_INSTANCE_DIR;
  if (instanceDir) {
    return join(instanceDir, TRACKING_FILENAME);
  }
  return join(ROOT_DIR, TRACKING_FILENAME);
}

/**
 * Read local tracking data from .pg-guidelines-versions.json.
 * Returns null if file doesn't exist or is invalid.
 */
export function readLocalTracking(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    if (!data.guidelines || typeof data.guidelines !== 'object') {
      return null;
    }
    return data.guidelines;
  } catch {
    return null;
  }
}

/**
 * Fetch instructions from Firebase RTDB with a 5s timeout.
 */
export async function fetchRemoteInstructions(db) {
  const snapshot = await Promise.race([
    db.ref('global/instructions').once('value'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase query timeout')), 5000))
  ]);
  return snapshot.val();
}

/**
 * Check if local guidelines tracking is up to date with Firebase.
 * Non-blocking — returns a result object, logs warnings via console.error.
 *
 * @param {object} [deps] - Optional dependency overrides for testing
 * @param {function} [deps.getDb] - Function returning Firebase database instance
 * @param {function} [deps.getFilePath] - Function returning tracking file path
 * @param {function} [deps.readTracking] - Function to read local tracking data
 * @returns {{ status: 'up_to_date' | 'outdated' | 'never_synced' | 'error', outdated?: Array }}
 */
export async function checkGuidelinesStatus(deps = {}) {
  const getDb = deps.getDb || getDatabase;
  const getFilePath = deps.getFilePath || getTrackingFilePath;
  const readTrackingFn = deps.readTracking || readLocalTracking;

  try {
    const db = getDb();
    const remoteInstructions = await fetchRemoteInstructions(db);

    // No instructions in Firebase — nothing to check
    if (!remoteInstructions) {
      return { status: 'up_to_date' };
    }

    const trackingPath = getFilePath();
    const localGuidelines = readTrackingFn(trackingPath);

    // No local tracking file or invalid format
    if (localGuidelines === null) {
      const count = Object.keys(remoteInstructions).length;
      console.error(
        `⚠️  Guidelines nunca sincronizadas en esta instancia (${count} guidelines en Firebase). ` +
        'Usa la herramienta sync_guidelines para sincronizar.'
      );
      return { status: 'never_synced' };
    }

    // Compare each remote instruction with local tracking
    const outdated = [];
    for (const [configId, remote] of Object.entries(remoteInstructions)) {
      const local = localGuidelines[configId];
      if (!local) {
        outdated.push({ configId, name: remote.name, reason: 'new' });
      } else if (remote.updatedAt && local.updatedAt && remote.updatedAt > local.updatedAt) {
        outdated.push({ configId, name: remote.name, reason: 'updated' });
      }
    }

    if (outdated.length > 0) {
      const names = outdated.map(g => `"${g.name}"`).join(', ');
      console.error(
        `⚠️  ${outdated.length} guidelines desactualizadas: ${names}. ` +
        'Usa la herramienta sync_guidelines para actualizar.'
      );
      return { status: 'outdated', outdated };
    }

    return { status: 'up_to_date' };
  } catch {
    // Non-blocking: silently fail if Firebase is unreachable
    return { status: 'error' };
  }
}

/**
 * Check guidelines at MCP startup. Non-blocking wrapper.
 */
export async function checkGuidelinesAtStartup() {
  await checkGuidelinesStatus();
}

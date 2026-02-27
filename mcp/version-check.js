import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { getDatabase, getFirebaseProjectId } from './firebase-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const MCP_VERSION_PATH = '/data/mcp';

let versionCheckResult = null;
let hasNotifiedInSession = false;

export function getLocalVersion() {
  try {
    const packagePath = join(ROOT_DIR, 'mcp', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

async function getRemoteVersionFromFirebase() {
  try {
    const db = getDatabase();
    const snapshot = await db.ref(`${MCP_VERSION_PATH}/latestVersion`).once('value');
    return snapshot.val() || null;
  } catch (error) {
    return null;
  }
}

export async function setLatestVersionInFirebase(version) {
  try {
    const db = getDatabase();
    await db.ref(MCP_VERSION_PATH).update({
      latestVersion: version,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function getRemoteVersionFromGit() {
  try {
    execSync('git fetch origin main --quiet', {
      cwd: ROOT_DIR,
      timeout: 10000,
      stdio: 'pipe'
    });

    const remotePackageJson = execSync('git show origin/main:mcp/package.json', {
      cwd: ROOT_DIR,
      timeout: 5000,
      encoding: 'utf-8'
    });

    const packageData = JSON.parse(remotePackageJson);
    return packageData.version;
  } catch (error) {
    return null;
  }
}

async function getRemoteVersion() {
  let version = await getRemoteVersionFromFirebase();
  if (version) return version;
  return await getRemoteVersionFromGit();
}

function hasLocalChanges() {
  try {
    const status = execSync('git status --porcelain', {
      cwd: ROOT_DIR,
      encoding: 'utf-8'
    });
    return status.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function getCommitsBehind() {
  try {
    const behind = execSync('git rev-list HEAD..origin/main --count', {
      cwd: ROOT_DIR,
      encoding: 'utf-8'
    });
    return parseInt(behind.trim(), 10) || 0;
  } catch (error) {
    return 0;
  }
}

function isNewerVersion(local, remote) {
  if (!local || !remote || local === 'unknown') return false;

  const localParts = local.split('.').map(Number);
  const remoteParts = remote.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const l = localParts[i] || 0;
    const r = remoteParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }

  return false;
}

export async function checkForUpdates(forceRefresh = false) {
  if (versionCheckResult !== null && !forceRefresh) {
    return versionCheckResult;
  }

  const localVersion = getLocalVersion();
  const remoteVersion = await getRemoteVersion();
  const commitsBehind = remoteVersion ? getCommitsBehind() : 0;

  const hasUpdate = remoteVersion !== null && isNewerVersion(localVersion, remoteVersion);

  versionCheckResult = {
    hasUpdate,
    localVersion,
    remoteVersion,
    commitsBehind,
    message: hasUpdate
      ? `⚠️ planning-game-mcp v${remoteVersion} disponible (actual: v${localVersion}, ${commitsBehind} commits atrás). Usa update_mcp para actualizar.`
      : null
  };

  return versionCheckResult;
}

export async function checkVersionAtStartup() {
  const result = await checkForUpdates();

  if (result.hasUpdate && result.message) {
    console.error(result.message);
  }
}

export function getUpdateNoticeOnce() {
  if (hasNotifiedInSession || !versionCheckResult?.hasUpdate) {
    return null;
  }

  hasNotifiedInSession = true;
  return versionCheckResult.message;
}

export function resetNotificationFlag() {
  hasNotifiedInSession = false;
  versionCheckResult = null;
}

export async function getMcpStatus() {
  const result = await checkForUpdates(true);
  const localChanges = hasLocalChanges();

  const instanceDir = process.env.MCP_INSTANCE_DIR || null;
  const instanceName = instanceDir ? instanceDir.split('/').pop() : null;

  return {
    name: 'planning-game-mcp',
    instanceName,
    instanceDir,
    firebaseProjectId: getFirebaseProjectId(),
    localVersion: result.localVersion,
    remoteVersion: result.remoteVersion,
    commitsBehind: result.commitsBehind || 0,
    updateAvailable: result.hasUpdate,
    hasLocalChanges: localChanges,
    updateMessage: result.message,
    updateCommand: result.hasUpdate ? 'Use update_mcp tool to update' : null,
    repositoryPath: ROOT_DIR
  };
}

export async function updateMcp() {
  const localChanges = hasLocalChanges();

  if (localChanges) {
    return {
      success: false,
      error: 'Cannot update: you have local uncommitted changes. Commit or stash them first.',
      hasLocalChanges: true
    };
  }

  try {
    const pullResult = execSync('git pull origin main', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout: 30000
    });

    resetNotificationFlag();

    const newVersion = getLocalVersion();

    return {
      success: true,
      message: `MCP actualizado a v${newVersion}. IMPORTANTE: Reinicia la sesión de Claude para cargar la nueva versión.`,
      pullOutput: pullResult.trim(),
      newVersion,
      requiresRestart: true
    };
  } catch (error) {
    return {
      success: false,
      error: `Error al actualizar: ${error.message}`,
      suggestion: 'Intenta manualmente: cd ' + ROOT_DIR + ' && git pull'
    };
  }
}

import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';
import fs from 'node:fs';
import path from 'node:path';

const { readFileSync, writeFileSync, mkdirSync, existsSync } = fs;
const { resolve, dirname, isAbsolute, normalize } = path;

const VERSIONS_FILE = '.pg-guidelines-versions.json';

export const syncGuidelinesSchema = z.object({
  dryRun: z.boolean().optional().default(false).describe('Preview changes without writing files'),
  force: z.boolean().optional().default(false).describe('Force sync even if versions match')
});

/**
 * Validate that a targetFile path is safe (no path traversal, no absolute paths).
 * Returns error message string if unsafe, null if safe.
 */
function isPathSafe(targetFile) {
  if (!targetFile || typeof targetFile !== 'string') {
    return 'targetFile is required and must be a non-empty string';
  }

  if (isAbsolute(targetFile)) {
    return `targetFile must be a relative path, got absolute: "${targetFile}"`;
  }

  const normalized = normalize(targetFile);
  if (normalized.startsWith('..') || normalized.includes('/../') || normalized.includes('\\..\\')) {
    return `targetFile contains path traversal (".."), which is not allowed: "${targetFile}"`;
  }

  return null;
}

/**
 * Read the local versions tracking file.
 * @returns {Object} Map of configId -> { version, targetFile, syncedAt }
 */
function readLocalVersions() {
  const versionsPath = resolve(process.cwd(), VERSIONS_FILE);
  if (!existsSync(versionsPath)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(versionsPath, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Write the local versions tracking file.
 * @param {Object} versions - Map of configId -> { version, targetFile, syncedAt }
 */
function writeLocalVersions(versions) {
  const versionsPath = resolve(process.cwd(), VERSIONS_FILE);
  writeFileSync(versionsPath, JSON.stringify(versions, null, 2), 'utf-8');
}

/**
 * Sync guidelines from Firebase to local files.
 * Downloads guidelines from global/guidelines and writes them to their targetFile paths.
 */
export async function syncGuidelines({ dryRun = false, force = false }) {
  const db = getDatabase();
  const snapshot = await db.ref('global/guidelines').once('value');
  const guidelinesData = snapshot.val();

  if (!guidelinesData) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: 'No guidelines found in Firebase. Nothing to sync.',
          synced: 0,
          skipped: 0,
          errors: 0
        }, null, 2)
      }]
    };
  }

  const guidelines = Object.entries(guidelinesData)
    .filter(([, g]) => g && g.targetFile)
    .map(([configId, g]) => ({ configId, ...g }));

  if (guidelines.length === 0) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: 'Guidelines exist in Firebase but none have a targetFile defined. Nothing to sync.',
          synced: 0,
          skipped: 0,
          errors: 0
        }, null, 2)
      }]
    };
  }

  const localVersions = readLocalVersions();
  const results = [];
  const errors = [];
  let syncedCount = 0;
  let skippedCount = 0;

  for (const guideline of guidelines) {
    const { configId, targetFile, version, content, name } = guideline;
    const firebaseVersion = version || 1;

    // Validate path safety
    const pathError = isPathSafe(targetFile);
    if (pathError) {
      errors.push({ configId, targetFile, error: pathError });
      continue;
    }

    const localEntry = localVersions[configId];
    const localVersion = localEntry ? localEntry.version : 0;
    const needsSync = force || (firebaseVersion > localVersion);

    if (!needsSync) {
      skippedCount++;
      results.push({
        configId,
        name: name || configId,
        targetFile,
        action: 'skipped',
        reason: `Local version (${localVersion}) is up to date with Firebase (${firebaseVersion})`
      });
      continue;
    }

    const action = localVersion === 0 ? 'created' : `updated from v${localVersion} to v${firebaseVersion}`;

    if (dryRun) {
      syncedCount++;
      results.push({
        configId,
        name: name || configId,
        targetFile,
        action: 'would_sync',
        detail: localVersion === 0
          ? `Would create file (v${firebaseVersion})`
          : `Would update from v${localVersion} to v${firebaseVersion}`
      });
      continue;
    }

    // Write the file
    try {
      const fullPath = resolve(process.cwd(), targetFile);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(fullPath, content || '', 'utf-8');

      // Update local versions
      localVersions[configId] = {
        version: firebaseVersion,
        targetFile,
        syncedAt: new Date().toISOString()
      };

      syncedCount++;
      results.push({
        configId,
        name: name || configId,
        targetFile,
        action,
        version: firebaseVersion
      });
    } catch (err) {
      errors.push({ configId, targetFile, error: err.message });
    }
  }

  // Write updated versions file (only if not dryRun and we synced something)
  if (!dryRun && syncedCount > 0) {
    writeLocalVersions(localVersions);
  }

  const summary = {
    message: dryRun
      ? `Dry run complete. ${syncedCount} guideline(s) would be synced.`
      : `Sync complete. ${syncedCount} guideline(s) synced.`,
    synced: syncedCount,
    skipped: skippedCount,
    errors: errors.length,
    details: results
  };

  if (errors.length > 0) {
    summary.errorDetails = errors;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(summary, null, 2)
    }]
  };
}

/**
 * Public API for reading app version metadata from projects with apps enabled.
 * No authentication required - only exposes safe fields via whitelist.
 */
'use strict';

// Fields allowed in the public API response (whitelist approach)
const PUBLIC_VERSION_FIELDS = ['fileName', 'type', 'status', 'changelog', 'uploadedAt', 'approvedAt'];

/**
 * Extract version number from fileName.
 * Pattern: {project}_{version}_{timestamp}_{hash}.{ext}
 * Example: "Cinema4D_17.6.0_1772442476873_1qxs38b.exe" → "17.6.0"
 * @param {string} fileName
 * @returns {string|null}
 */
function extractVersion(fileName) {
  if (!fileName) return null;
  // Match version pattern: digits.digits.digits (with optional extra segments)
  const match = fileName.match(/_(\d+\.\d+\.\d+(?:\.\d+)*)/);
  return match ? match[1] : null;
}

/**
 * Project a version to only include public-safe fields + downloadCount + version.
 * @param {object} version - Full version metadata from RTDB
 * @param {number} downloadCount - Download count from /appDownloads
 * @returns {object} Version with only public fields
 */
function projectPublicVersionFields(version, downloadCount) {
  const projected = {};
  for (const field of PUBLIC_VERSION_FIELDS) {
    if (version[field] !== undefined) {
      projected[field] = version[field];
    }
  }
  projected.version = extractVersion(version.fileName) || null;
  projected.downloadCount = downloadCount || 0;
  return projected;
}

/**
 * Handle GET /api/apps/:projectId/versions[/:fileKey]
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {object} deps - { db, logger }
 */
async function handlePublicAppVersions(req, res, { db, logger }) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse path: /{projectId}/versions or /{projectId}/versions/{fileKey}
  const pathParts = req.path.split('/').filter(Boolean);
  let projectId = null;
  let fileKey = null;

  // Expected patterns:
  // [projectId, 'versions']           → list
  // [projectId, 'versions', fileKey]  → detail
  // ['api', 'apps', projectId, 'versions']           → list (via rewrite)
  // ['api', 'apps', projectId, 'versions', fileKey]  → detail (via rewrite)
  const versionsIdx = pathParts.indexOf('versions');
  if (versionsIdx >= 1) {
    projectId = pathParts[versionsIdx - 1];
    if (versionsIdx + 1 < pathParts.length) {
      fileKey = pathParts[versionsIdx + 1];
    }
  }

  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId. Use: /api/apps/{projectId}/versions' });
  }

  projectId = decodeURIComponent(projectId);
  if (fileKey) fileKey = decodeURIComponent(fileKey);

  try {
    // Load project
    const projectSnap = await db.ref(`/projects/${projectId}`).once('value');
    if (!projectSnap.exists()) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectSnap.val();

    // Access control: project must have apps enabled AND public app API active
    if (project.allowExecutables !== true) {
      return res.status(403).json({ error: 'This project does not have apps enabled.' });
    }
    if (project.publicAppApi !== true) {
      return res.status(403).json({ error: 'This project does not have public app API enabled.' });
    }

    if (fileKey) {
      // ── Detail endpoint ──
      // "latest" returns the recommended version (latest approved release)
      if (fileKey === 'latest') {
        const allSnap = await db.ref(`/appMetadata/${projectId}`).once('value');
        const allData = allSnap.exists() ? allSnap.val() : {};
        const dlAllSnap = await db.ref(`/appDownloads/${projectId}`).once('value');
        const dlAllData = dlAllSnap.exists() ? dlAllSnap.val() : {};

        let latest = null;
        let latestKey = null;
        for (const [key, ver] of Object.entries(allData)) {
          if (!ver || ver.status !== 'approved' || ver.type !== 'release') continue;
          if (!latest || (ver.approvedAt || '') > (latest.approvedAt || '')) {
            latest = ver;
            latestKey = key;
          }
        }

        if (!latest) {
          return res.status(404).json({ error: 'No approved release version found' });
        }

        const projected = projectPublicVersionFields(latest, dlAllData[latestKey]?.count || 0);
        projected.fileKey = latestKey;
        projected.recommended = true;
        logger.info('publicAppVersions: served latest', { projectId, version: projected.version });
        return res.status(200).json({ projectId, projectName: project.name || projectId, version: projected });
      }

      // fileKey can be a Firebase key (-abc123) or a version number (17.6.0)
      const isVersionNumber = /^\d+\.\d+/.test(fileKey);

      if (isVersionNumber) {
        // Search by version number in all metadata
        const allSnap = await db.ref(`/appMetadata/${projectId}`).once('value');
        const allData = allSnap.exists() ? allSnap.val() : {};
        const dlAllSnap = await db.ref(`/appDownloads/${projectId}`).once('value');
        const dlAllData = dlAllSnap.exists() ? dlAllSnap.val() : {};

        // Find all approved versions matching this version number, return the latest
        let match = null;
        let matchKey = null;
        for (const [key, ver] of Object.entries(allData)) {
          if (!ver || ver.status !== 'approved') continue;
          if (extractVersion(ver.fileName) === fileKey) {
            if (!match || (ver.approvedAt || '') > (match.approvedAt || '')) {
              match = ver;
              matchKey = key;
            }
          }
        }

        if (!match) {
          return res.status(404).json({ error: `Version "${fileKey}" not found` });
        }

        const projected = projectPublicVersionFields(match, dlAllData[matchKey]?.count || 0);
        projected.fileKey = matchKey;
        logger.info('publicAppVersions: served detail by version', { projectId, version: fileKey });
        return res.status(200).json({ projectId, projectName: project.name || projectId, version: projected });
      }

      // Lookup by Firebase key
      const versionSnap = await db.ref(`/appMetadata/${projectId}/${fileKey}`).once('value');
      if (!versionSnap.exists()) {
        return res.status(404).json({ error: 'Version not found' });
      }

      const version = versionSnap.val();
      if (version.status !== 'approved') {
        return res.status(404).json({ error: 'Version not found' });
      }

      const dlSnap = await db.ref(`/appDownloads/${projectId}/${fileKey}`).once('value');
      const dlData = dlSnap.exists() ? dlSnap.val() : {};

      const projected = projectPublicVersionFields(version, dlData.count || 0);
      projected.fileKey = fileKey;

      logger.info('publicAppVersions: served detail', { projectId, fileKey });
      return res.status(200).json({ projectId, projectName: project.name || projectId, version: projected });
    }

    // ── List endpoint ──
    const metadataSnap = await db.ref(`/appMetadata/${projectId}`).once('value');
    const metadataData = metadataSnap.exists() ? metadataSnap.val() : {};

    // Load all download stats in one read
    const dlSnap = await db.ref(`/appDownloads/${projectId}`).once('value');
    const dlData = dlSnap.exists() ? dlSnap.val() : {};

    // Find recommended (latest approved release) while building list
    let recommendedKey = null;
    let recommendedApprovedAt = '';

    const versions = [];
    for (const [key, version] of Object.entries(metadataData)) {
      if (!version || version.status !== 'approved') continue;
      const downloadCount = dlData[key]?.count || 0;
      const projected = projectPublicVersionFields(version, downloadCount);
      projected.fileKey = key;
      if (version.type === 'release' && (version.approvedAt || '') > recommendedApprovedAt) {
        recommendedKey = key;
        recommendedApprovedAt = version.approvedAt || '';
      }
      versions.push(projected);
    }

    // Mark recommended
    for (const v of versions) {
      v.recommended = v.fileKey === recommendedKey;
    }

    logger.info('publicAppVersions: served list', { projectId, count: versions.length });
    return res.status(200).json({ projectId, projectName: project.name || projectId, versions });

  } catch (error) {
    logger.error('publicAppVersions: error', { projectId, error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handlePublicAppVersions,
  projectPublicVersionFields,
  extractVersion,
  PUBLIC_VERSION_FIELDS
};

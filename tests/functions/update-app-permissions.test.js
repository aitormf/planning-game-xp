/**
 * Tests for updateAppPermissions Cloud Function logic
 */
import { describe, it, expect } from 'vitest';

describe('updateAppPermissions logic', () => {
  const validPerms = ['view', 'download', 'upload', 'edit', 'approve'];

  function sanitizePermissions(permissions) {
    const sanitized = {};
    for (const perm of validPerms) {
      sanitized[perm] = permissions[perm] === true;
    }
    return sanitized;
  }

  function buildUpdatePaths(encodedEmail, projectId, sanitized) {
    const updates = {};
    const basePath = `/users/${encodedEmail}/projects/${projectId}/appPermissions`;
    for (const [perm, value] of Object.entries(sanitized)) {
      updates[`${basePath}/${perm}`] = value;
    }

    // Dual-write to legacy paths
    if (sanitized.upload) {
      updates[`/data/appUploaders/${projectId}/${encodedEmail}`] = true;
    } else {
      updates[`/data/appUploaders/${projectId}/${encodedEmail}`] = null;
    }
    if (sanitized.view) {
      updates[`/data/betaUsers/${projectId}/${encodedEmail}`] = true;
    } else {
      updates[`/data/betaUsers/${projectId}/${encodedEmail}`] = null;
    }

    return updates;
  }

  it('should sanitize permissions to booleans', () => {
    const input = { view: true, download: 'yes', upload: 1, edit: false, approve: undefined };
    const sanitized = sanitizePermissions(input);

    expect(sanitized.view).toBe(true);
    expect(sanitized.download).toBe(false);
    expect(sanitized.upload).toBe(false);
    expect(sanitized.edit).toBe(false);
    expect(sanitized.approve).toBe(false);
  });

  it('should default missing permissions to false', () => {
    const sanitized = sanitizePermissions({});
    for (const perm of validPerms) {
      expect(sanitized[perm]).toBe(false);
    }
  });

  it('should build correct update paths with upload=true', () => {
    const sanitized = { view: true, download: true, upload: true, edit: false, approve: false };
    const updates = buildUpdatePaths('test|example!com', 'Cinema4D', sanitized);

    expect(updates['/users/test|example!com/projects/Cinema4D/appPermissions/view']).toBe(true);
    expect(updates['/users/test|example!com/projects/Cinema4D/appPermissions/upload']).toBe(true);
    expect(updates['/data/appUploaders/Cinema4D/test|example!com']).toBe(true);
    expect(updates['/data/betaUsers/Cinema4D/test|example!com']).toBe(true);
  });

  it('should set legacy paths to null when permissions are false', () => {
    const sanitized = { view: false, download: false, upload: false, edit: false, approve: false };
    const updates = buildUpdatePaths('test|example!com', 'NTR', sanitized);

    expect(updates['/data/appUploaders/NTR/test|example!com']).toBeNull();
    expect(updates['/data/betaUsers/NTR/test|example!com']).toBeNull();
  });

  it('should include all 5 permission paths plus 2 legacy paths', () => {
    const sanitized = { view: true, download: true, upload: true, edit: true, approve: true };
    const updates = buildUpdatePaths('usr|ex!com', 'PLN', sanitized);

    // 5 appPermissions + 2 legacy = 7
    expect(Object.keys(updates)).toHaveLength(7);
  });
});

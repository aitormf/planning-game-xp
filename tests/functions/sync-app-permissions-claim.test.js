/**
 * Tests for syncAppPermissionsClaim Cloud Function logic
 */
import { describe, it, expect } from 'vitest';

describe('syncAppPermissionsClaim logic', () => {
  const flagMap = { view: 'v', download: 'd', upload: 'u', edit: 'e', approve: 'a' };

  function buildAppPerms(projectsData) {
    const appPerms = {};
    if (!projectsData || typeof projectsData !== 'object') return appPerms;

    for (const [pid, projData] of Object.entries(projectsData)) {
      const perms = projData?.appPermissions;
      if (!perms || typeof perms !== 'object') continue;

      let flags = '';
      for (const [perm, flag] of Object.entries(flagMap)) {
        if (perms[perm] === true) flags += flag;
      }
      if (flags) {
        appPerms[pid] = flags;
      }
    }
    return appPerms;
  }

  it('should build correct appPerms from projects data', () => {
    const projectsData = {
      'Cinema4D': {
        developer: true,
        appPermissions: { view: true, download: true, upload: true, edit: false, approve: false }
      },
      'NTR': {
        developer: true,
        appPermissions: { view: true, download: false, upload: false, edit: false, approve: false }
      }
    };

    const appPerms = buildAppPerms(projectsData);
    expect(appPerms['Cinema4D']).toBe('vdu');
    expect(appPerms['NTR']).toBe('v');
  });

  it('should handle all permissions enabled', () => {
    const projectsData = {
      'PLN': {
        developer: true,
        appPermissions: { view: true, download: true, upload: true, edit: true, approve: true }
      }
    };

    const appPerms = buildAppPerms(projectsData);
    expect(appPerms['PLN']).toBe('vduea');
  });

  it('should skip projects without appPermissions', () => {
    const projectsData = {
      'PLN': { developer: true },
      'NTR': { developer: true, appPermissions: { view: true, download: true } }
    };

    const appPerms = buildAppPerms(projectsData);
    expect(appPerms['PLN']).toBeUndefined();
    expect(appPerms['NTR']).toBe('vd');
  });

  it('should skip projects where all permissions are false', () => {
    const projectsData = {
      'PLN': {
        developer: true,
        appPermissions: { view: false, download: false, upload: false, edit: false, approve: false }
      }
    };

    const appPerms = buildAppPerms(projectsData);
    expect(appPerms['PLN']).toBeUndefined();
    expect(Object.keys(appPerms)).toHaveLength(0);
  });

  it('should return empty object for null/undefined projects', () => {
    expect(buildAppPerms(null)).toEqual({});
    expect(buildAppPerms(undefined)).toEqual({});
  });

  it('should merge appPerms into existing claims preserving other fields', () => {
    const currentClaims = { allowed: true, isAppAdmin: false, encodedEmail: 'test|ex!com' };
    const appPerms = { 'Cinema4D': 'vdu' };
    const newClaims = { ...currentClaims, appPerms };

    expect(newClaims.allowed).toBe(true);
    expect(newClaims.isAppAdmin).toBe(false);
    expect(newClaims.encodedEmail).toBe('test|ex!com');
    expect(newClaims.appPerms).toEqual({ 'Cinema4D': 'vdu' });
  });
});

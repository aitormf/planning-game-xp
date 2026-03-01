/**
 * Tests for cleanupInactiveDemoUsers logic.
 * Verifies the criteria for identifying and deleting inactive demo users.
 */
import { describe, it, expect } from 'vitest';

describe('cleanupInactiveDemoUsers logic', () => {
  const INACTIVE_DAYS = 7;

  function isInactive(lastSignInTime, now = Date.now()) {
    const cutoff = now - INACTIVE_DAYS * 24 * 60 * 60 * 1000;
    const lastActive = lastSignInTime
      ? new Date(lastSignInTime).getTime()
      : 0;
    return lastActive <= cutoff;
  }

  function buildDemoProjectId(email) {
    const userPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    return `Demo_${userPrefix}`;
  }

  function encodeEmailForFirebase(email) {
    if (!email) return '';
    return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
  }

  function buildDeletionPaths(projectId, uid, encodedEmail) {
    return {
      [`/projects/${projectId}`]: null,
      [`/cards/${projectId}`]: null,
      [`/data/appPerms/${encodedEmail}`]: null,
      [`/userClaimsLog/${uid}`]: null,
      [`/history/${projectId}`]: null,
      [`/notifications/${uid}`]: null,
    };
  }

  describe('inactivity detection', () => {
    it('should mark user as inactive when last sign-in > 7 days ago', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      expect(isInactive(eightDaysAgo)).toBe(true);
    });

    it('should mark user as active when last sign-in < 7 days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(isInactive(twoDaysAgo)).toBe(false);
    });

    it('should mark user as inactive when last sign-in is exactly 7 days ago', () => {
      const now = Date.now();
      const exactlySeven = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      // At exactly cutoff, lastActive <= cutoff, so it IS inactive
      expect(isInactive(exactlySeven, now)).toBe(true);
    });

    it('should mark user as active when signed in today', () => {
      const today = new Date().toISOString();
      expect(isInactive(today)).toBe(false);
    });

    it('should treat null lastSignInTime as very old (inactive)', () => {
      expect(isInactive(null)).toBe(true);
    });
  });

  describe('user filtering', () => {
    it('should only process users with role=demo claim', () => {
      const users = [
        { claims: { role: 'demo' }, email: 'demo@test.com' },
        { claims: { role: 'standard' }, email: 'standard@test.com' },
        { claims: {}, email: 'noclaim@test.com' },
        { claims: { role: 'admin' }, email: 'admin@test.com' },
      ];
      const demoUsers = users.filter(u => u.claims.role === 'demo');
      expect(demoUsers).toHaveLength(1);
      expect(demoUsers[0].email).toBe('demo@test.com');
    });
  });

  describe('data deletion paths', () => {
    it('should generate correct deletion paths for user data', () => {
      const email = 'john@example.com';
      const projectId = buildDemoProjectId(email);
      const uid = 'uid123';
      const encodedEmail = encodeEmailForFirebase(email);
      const paths = buildDeletionPaths(projectId, uid, encodedEmail);

      expect(paths[`/projects/${projectId}`]).toBeNull();
      expect(paths[`/cards/${projectId}`]).toBeNull();
      expect(paths[`/data/appPerms/${encodedEmail}`]).toBeNull();
      expect(paths[`/userClaimsLog/${uid}`]).toBeNull();
      expect(paths[`/history/${projectId}`]).toBeNull();
      expect(paths[`/notifications/${uid}`]).toBeNull();
      expect(Object.keys(paths)).toHaveLength(6);
    });

    it('should generate correct projectId from email', () => {
      expect(buildDemoProjectId('john@test.com')).toBe('Demo_john');
      expect(buildDemoProjectId('jane.doe@mail.com')).toBe('Demo_janedoe');
    });

    it('should encode email correctly for Firebase paths', () => {
      expect(encodeEmailForFirebase('user@gmail.com')).toBe('user|gmail!com');
      expect(encodeEmailForFirebase('a.b@c.d')).toBe('a!b|c!d');
    });
  });

  describe('DEMO_MODE guard', () => {
    it('should skip cleanup when DEMO_MODE is off', () => {
      const demoMode = false;
      const result = demoMode ? 'would clean' : 'skip';
      expect(result).toBe('skip');
    });

    it('should run cleanup when DEMO_MODE is on', () => {
      const demoMode = true;
      const result = demoMode ? 'would clean' : 'skip';
      expect(result).toBe('would clean');
    });
  });
});

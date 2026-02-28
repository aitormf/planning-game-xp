import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const INSTANCES_DIR = path.join(process.cwd(), 'planning-game-instances');

function loadStorageRules(instanceName) {
  const rulesPath = path.join(INSTANCES_DIR, instanceName, 'storage.rules');
  if (!fs.existsSync(rulesPath)) return null;
  return fs.readFileSync(rulesPath, 'utf8');
}

const INSTANCES = ['geniova', 'manufosela'];

function extractMatchBlock(rules, pathPattern) {
  const regex = new RegExp(`match \\/${pathPattern}\\/.*?\\{\\n([^]*?)\\n\\s*\\}`);
  const m = rules.match(regex);
  return m ? m[0] : null;
}

describe('storage.rules - Custom Claims migration', () => {
  for (const instance of INSTANCES) {
    describe(`Instance: ${instance}`, () => {
      const rules = loadStorageRules(instance);

      it('should have a valid storage rules file', () => {
        if (!rules) return;
        expect(rules).toContain('service firebase.storage');
      });

      it('should define isAllowed() function using auth.token.allowed', () => {
        if (!rules) return;
        expect(rules).toContain('function isAllowed()');
        expect(rules).toContain('request.auth.token.allowed == true');
      });

      it('should define isAppAdmin() using auth.token.isAppAdmin custom claim', () => {
        if (!rules) return;
        expect(rules).toContain('function isAppAdmin()');
        expect(rules).toContain('request.auth.token.isAppAdmin == true');
      });

      it('should use isAllowed() for c4d path rules', () => {
        if (!rules) return;
        const section = extractMatchBlock(rules, 'c4d');
        expect(section).not.toBeNull();
        expect(section).toContain('isAllowed()');
      });

      it('should use isAllowed() for bug-attachments path rules', () => {
        if (!rules) return;
        const section = extractMatchBlock(rules, 'bug-attachments');
        expect(section).not.toBeNull();
        expect(section).toContain('isAllowed()');
      });

      it('should use isAllowed() for task-attachments path rules', () => {
        if (!rules) return;
        const section = extractMatchBlock(rules, 'task-attachments');
        expect(section).not.toBeNull();
        expect(section).toContain('isAllowed()');
      });

      it('should use isAllowed() for default catch-all path', () => {
        if (!rules) return;
        const m = rules.match(/match \/\{allPaths=\*\*\}\s*\{[^]*?\n\s*\}/);
        expect(m).not.toBeNull();
        expect(m[0]).toContain('isAllowed()');
      });

      it('should NOT contain hardcoded email addresses', () => {
        if (!rules) return;
        expect(rules).not.toContain('@geniova.com');
        expect(rules).not.toContain('@gmail.com');
        expect(rules).not.toContain('@maurerlabs.com');
        expect(rules).not.toContain('YOUR_ADMIN_EMAIL');
        expect(rules).not.toContain('YOUR_UPLOADER_EMAIL');
        expect(rules).not.toContain('YOUR_DOMAIN');
      });

      it('should NOT contain email-based domain matching (except appPerms pattern)', () => {
        if (!rules) return;
        // Remove the appPerms pattern check before asserting
        const rulesWithoutAppPerms = rules.replace(/\.matches\('\.?\*u\.\*'\)/g, '');
        expect(rulesWithoutAppPerms).not.toContain('.matches(');
      });

      it('should still use canUploadApps/canUploadAppsForProject for /apps/ path', () => {
        if (!rules) return;
        const section = extractMatchBlock(rules, 'apps');
        expect(section).not.toBeNull();
        const usesUploadCheck = section.includes('canUploadApps()') || section.includes('canUploadAppsForProject(');
        expect(usesUploadCheck).toBe(true);
      });
    });
  }
});

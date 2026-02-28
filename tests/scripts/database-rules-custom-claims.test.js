import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const INSTANCES_DIR = path.join(process.cwd(), 'planning-game-instances');

function loadRules(instanceName) {
  const rulesPath = path.join(INSTANCES_DIR, instanceName, 'database.rules.json');
  if (!fs.existsSync(rulesPath)) return null;
  return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

const INSTANCES = ['geniova', 'manufosela'];
const CUSTOM_CLAIMS_RULE = 'auth != null && auth.token.allowed === true';

describe('database.rules.json - Custom Claims migration', () => {
  for (const instance of INSTANCES) {
    describe(`Instance: ${instance}`, () => {
      const rules = loadRules(instance);

      it('should have a valid rules file', () => {
        if (!rules) return; // Skip if instance not present locally
        expect(rules).toHaveProperty('rules');
      });

      it('should use auth.token.allowed for root .read', () => {
        if (!rules) return;
        expect(rules.rules['.read']).toBe(CUSTOM_CLAIMS_RULE);
      });

      it('should use auth.token.allowed for root .write', () => {
        if (!rules) return;
        expect(rules.rules['.write']).toBe(CUSTOM_CLAIMS_RULE);
      });

      it('should NOT contain hardcoded email patterns in root rules', () => {
        if (!rules) return;
        expect(rules.rules['.read']).not.toContain('.matches(');
        expect(rules.rules['.read']).not.toContain('@geniova');
        expect(rules.rules['.read']).not.toContain('@gmail.com');
        expect(rules.rules['.write']).not.toContain('.matches(');
        expect(rules.rules['.write']).not.toContain('@geniova');
        expect(rules.rules['.write']).not.toContain('@gmail.com');
      });

      it('should use auth.token.allowed for publicAppShares .write', () => {
        if (!rules) return;
        const publicShares = rules.rules.publicAppShares;
        if (!publicShares) return;
        expect(publicShares['$shareId']['.write']).toBe(CUSTOM_CLAIMS_RULE);
      });

      it('should keep appConfig publicly readable', () => {
        if (!rules) return;
        expect(rules.rules.appConfig['.read']).toBe(true);
      });

      it('should keep publicAppShares $shareId publicly readable', () => {
        if (!rules) return;
        expect(rules.rules.publicAppShares['$shareId']['.read']).toBe('true');
      });
    });
  }
});

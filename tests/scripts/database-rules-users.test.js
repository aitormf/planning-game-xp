import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const INSTANCES_DIR = path.join(process.cwd(), 'planning-game-instances');

function loadRules(instanceName) {
  const rulesPath = path.join(INSTANCES_DIR, instanceName, 'database.rules.json');
  if (!fs.existsSync(rulesPath)) return null;
  return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

function loadExampleRules() {
  const rulesPath = path.join(process.cwd(), 'database.rules.example.json');
  return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

const INSTANCES = ['geniova', 'manufosela'];

describe('database.rules.json - /users/ centralized model', () => {
  describe('Example rules', () => {
    const rules = loadExampleRules();

    it('should have a /users/ node', () => {
      expect(rules.rules).toHaveProperty('users');
    });

    it('should allow read for authenticated users', () => {
      expect(rules.rules.users['.read']).toBe('auth != null');
    });

    it('should only allow write for isAppAdmin', () => {
      expect(rules.rules.users['.write']).toContain('isAppAdmin');
      expect(rules.rules.users['.write']).toBe('auth != null && auth.token.isAppAdmin === true');
    });

    it('should validate user has name and email', () => {
      const userRule = rules.rules.users['$encodedEmail'];
      expect(userRule).toBeDefined();
      expect(userRule['.validate']).toContain('name');
      expect(userRule['.validate']).toContain('email');
    });

    it('should validate project assignments have developer and stakeholder fields', () => {
      const projectRule = rules.rules.users['$encodedEmail'].projects['$projectId'];
      expect(projectRule).toBeDefined();
      expect(projectRule['.validate']).toContain('developer');
      expect(projectRule['.validate']).toContain('stakeholder');
    });
  });

  for (const instance of INSTANCES) {
    describe(`Instance: ${instance}`, () => {
      const rules = loadRules(instance);

      it('should have a valid rules file', () => {
        if (!rules) return;
        expect(rules).toHaveProperty('rules');
      });

      it('should have a /users/ node', () => {
        if (!rules) return;
        expect(rules.rules).toHaveProperty('users');
      });

      it('should allow read for authenticated users', () => {
        if (!rules) return;
        expect(rules.rules.users['.read']).toBe('auth != null');
      });

      it('should only allow write for isAppAdmin', () => {
        if (!rules) return;
        expect(rules.rules.users['.write']).toBe('auth != null && auth.token.isAppAdmin === true');
      });

      it('should validate user has name and email', () => {
        if (!rules) return;
        const userRule = rules.rules.users['$encodedEmail'];
        expect(userRule).toBeDefined();
        expect(userRule['.validate']).toBe("newData.hasChildren(['name', 'email'])");
      });

      it('should validate project assignments', () => {
        if (!rules) return;
        const projectRule = rules.rules.users['$encodedEmail'].projects['$projectId'];
        expect(projectRule).toBeDefined();
        expect(projectRule['.validate']).toBe("newData.hasChildren(['developer', 'stakeholder'])");
      });

      it('should match example rules structure for /users/', () => {
        if (!rules) return;
        const exampleRules = loadExampleRules();
        expect(rules.rules.users['.read']).toBe(exampleRules.rules.users['.read']);
        expect(rules.rules.users['.write']).toBe(exampleRules.rules.users['.write']);
      });
    });
  }
});

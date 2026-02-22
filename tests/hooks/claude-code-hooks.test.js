import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const PROJECT_DIR = process.cwd();
const HOOKS_DIR = resolve(PROJECT_DIR, '.claude/hooks');
const SETTINGS_PATH = resolve(PROJECT_DIR, '.claude/settings.json');

describe('Claude Code Pipeline Hooks', () => {

  describe('settings.json configuration', () => {
    it('should exist at .claude/settings.json', () => {
      expect(existsSync(SETTINGS_PATH)).toBe(true);
    });

    it('should be valid JSON', () => {
      const content = readFileSync(SETTINGS_PATH, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have PostToolUse hooks configured', () => {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PostToolUse).toBeDefined();
      expect(Array.isArray(settings.hooks.PostToolUse)).toBe(true);
      expect(settings.hooks.PostToolUse.length).toBeGreaterThan(0);
    });

    it('should match Bash tool calls', () => {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      const bashMatcher = settings.hooks.PostToolUse.find(m => m.matcher === 'Bash');
      expect(bashMatcher).toBeDefined();
      expect(bashMatcher.hooks).toBeDefined();
      expect(bashMatcher.hooks.length).toBeGreaterThan(0);
    });

    it('should reference pipeline-reminder.sh script', () => {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      const bashMatcher = settings.hooks.PostToolUse.find(m => m.matcher === 'Bash');
      const hookCommand = bashMatcher.hooks[0].command;
      expect(hookCommand).toContain('pipeline-reminder.sh');
    });

    it('should have a reasonable timeout', () => {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      const bashMatcher = settings.hooks.PostToolUse.find(m => m.matcher === 'Bash');
      expect(bashMatcher.hooks[0].timeout).toBeLessThanOrEqual(10);
    });
  });

  describe('pipeline-reminder.sh script', () => {
    const scriptPath = resolve(HOOKS_DIR, 'pipeline-reminder.sh');

    it('should exist', () => {
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should be executable', () => {
      const stats = execSync(`stat -c '%a' "${scriptPath}"`).toString().trim();
      expect(stats).toMatch(/[1357][1357][1357]/);
    });

    it('should output reminder for gh pr create', () => {
      const input = JSON.stringify({ tool_input: { command: 'gh pr create --title "test"' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output).toContain('PIPELINE REMINDER');
      expect(output).toContain('prCreated');
    });

    it('should output reminder for gh pr merge', () => {
      const input = JSON.stringify({ tool_input: { command: 'gh pr merge 42 --merge' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output).toContain('PIPELINE REMINDER');
      expect(output).toContain('merged');
    });

    it('should output reminder for git merge', () => {
      const input = JSON.stringify({ tool_input: { command: 'git merge main' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output).toContain('PIPELINE REMINDER');
      expect(output).toContain('merged');
    });

    it('should output reminder for firebase deploy', () => {
      const input = JSON.stringify({ tool_input: { command: 'firebase deploy --only hosting' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output).toContain('PIPELINE REMINDER');
      expect(output).toContain('deployed');
    });

    it('should output reminder for npm run deploy', () => {
      const input = JSON.stringify({ tool_input: { command: 'npm run deploy' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output).toContain('PIPELINE REMINDER');
      expect(output).toContain('deployed');
    });

    it('should NOT output anything for regular commands', () => {
      const input = JSON.stringify({ tool_input: { command: 'npm test' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output.trim()).toBe('');
    });

    it('should NOT output anything for git status', () => {
      const input = JSON.stringify({ tool_input: { command: 'git status' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output.trim()).toBe('');
    });

    it('should NOT output anything for git log', () => {
      const input = JSON.stringify({ tool_input: { command: 'git log --oneline -5' } });
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output.trim()).toBe('');
    });

    it('should handle empty input gracefully', () => {
      const input = JSON.stringify({});
      const output = execSync(`echo '${input}' | "${scriptPath}"`, { encoding: 'utf-8' });
      expect(output.trim()).toBe('');
    });
  });
});

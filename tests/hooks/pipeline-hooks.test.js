import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const HUSKY_DIR = resolve(process.cwd(), '.husky');

describe('Pipeline Git Hooks', () => {

  describe('pre-push hook', () => {
    const prePushPath = resolve(HUSKY_DIR, 'pre-push');
    let prePushContent;

    it('should exist and be readable', () => {
      prePushContent = readFileSync(prePushPath, 'utf-8');
      expect(prePushContent).toBeTruthy();
    });

    it('should source husky.sh', () => {
      const content = readFileSync(prePushPath, 'utf-8');
      expect(content).toContain('husky.sh');
    });

    it('should skip main branch', () => {
      const content = readFileSync(prePushPath, 'utf-8');
      expect(content).toContain('"main"');
      expect(content).toMatch(/exit 0/);
    });

    it('should only check feat/ and fix/ branches', () => {
      const content = readFileSync(prePushPath, 'utf-8');
      expect(content).toContain('feat/*');
      expect(content).toContain('fix/*');
    });

    it('should use gh CLI to check for PR', () => {
      const content = readFileSync(prePushPath, 'utf-8');
      expect(content).toContain('gh pr view');
    });

    it('should show warning when no PR found (not block)', () => {
      const content = readFileSync(prePushPath, 'utf-8');
      expect(content).toContain('WARNING');
      expect(content).toContain('gh pr create');
      // Should always exit 0 (non-blocking)
      const lines = content.split('\n');
      const lastExitLine = lines.filter(l => l.trim().startsWith('exit')).pop();
      expect(lastExitLine.trim()).toBe('exit 0');
    });

    it('should gracefully handle missing gh CLI', () => {
      const content = readFileSync(prePushPath, 'utf-8');
      expect(content).toContain('command -v gh');
      expect(content).toContain('skipping PR verification');
    });
  });

  describe('post-merge hook', () => {
    const postMergePath = resolve(HUSKY_DIR, 'post-merge');
    let postMergeContent;

    it('should exist and be readable', () => {
      postMergeContent = readFileSync(postMergePath, 'utf-8');
      expect(postMergeContent).toBeTruthy();
    });

    it('should source husky.sh', () => {
      const content = readFileSync(postMergePath, 'utf-8');
      expect(content).toContain('husky.sh');
    });

    it('should define card ID pattern matching XXX-TSK-NNNN and XXX-BUG-NNNN', () => {
      const content = readFileSync(postMergePath, 'utf-8');
      expect(content).toContain('TSK');
      expect(content).toContain('BUG');
      expect(content).toMatch(/[A-Z].*-.*[0-9]{4}/);
    });

    it('should extract card IDs from merge commit message', () => {
      const content = readFileSync(postMergePath, 'utf-8');
      expect(content).toContain('git log');
      expect(content).toContain('grep -oE');
    });

    it('should show pipelineStatus.merged reminder', () => {
      const content = readFileSync(postMergePath, 'utf-8');
      expect(content).toContain('pipelineStatus.merged');
      expect(content).toContain('Pipeline reminder');
    });

    it('should always exit 0 (informational only)', () => {
      const content = readFileSync(postMergePath, 'utf-8');
      const lines = content.split('\n');
      const lastExitLine = lines.filter(l => l.trim().startsWith('exit')).pop();
      expect(lastExitLine.trim()).toBe('exit 0');
    });

    it('should try branch name fallback if no card ID in commit message', () => {
      const content = readFileSync(postMergePath, 'utf-8');
      expect(content).toContain('feat|fix');
      expect(content).toContain('BRANCH_NAME');
    });
  });
});

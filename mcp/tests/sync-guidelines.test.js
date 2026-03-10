import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetMockData, setMockRtdbData } from './__mocks__/firebase.js';

vi.mock('../firebase-adapter.js', async () => {
  const mock = await import('./__mocks__/firebase.js');
  return {
    getDatabase: mock.getDatabase,
    getFirestore: mock.getFirestore
  };
});

// Shared state for fs mock - must use vi.hoisted() since vi.mock is hoisted
const { mockFiles, getMockVersionsContent, setMockVersionsContent, fsMocks } = vi.hoisted(() => {
  const mockFiles = {};
  let mockVersionsContent = null;

  const fsMocks = {
    readFileSync: (...args) => {
      const filePath = args[0];
      if (filePath.endsWith('.pg-guidelines-versions.json') && mockVersionsContent !== null) {
        return mockVersionsContent;
      }
      throw new Error(`ENOENT: no such file: ${filePath}`);
    },
    writeFileSync: (filePath, content) => {
      mockFiles[filePath] = content;
    },
    mkdirSync: () => {},
    existsSync: (filePath) => {
      if (filePath.endsWith('.pg-guidelines-versions.json')) {
        return mockVersionsContent !== null;
      }
      return true;
    }
  };

  return {
    mockFiles,
    getMockVersionsContent: () => mockVersionsContent,
    setMockVersionsContent: (val) => { mockVersionsContent = val; },
    fsMocks
  };
});

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = { ...actual, ...fsMocks };
  return { ...mocked, default: mocked };
});

import { syncGuidelines } from '../tools/sync-guidelines.js';

function parseResult(result) {
  return JSON.parse(result.content[0].text);
}

describe('sync-guidelines.js', () => {
  beforeEach(() => {
    resetMockData();
    Object.keys(mockFiles).forEach(k => delete mockFiles[k]);
    setMockVersionsContent(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC#1: sync all guidelines without parameters', () => {
    it('should download all guidelines and write to targetFile paths', async () => {
      setMockRtdbData('/global/guidelines', {
        'guide-1': {
          name: 'Code Style',
          content: '# Code Style\nUse SOLID principles.',
          targetFile: 'GUIDELINES.md',
          version: 1
        },
        'guide-2': {
          name: 'Testing Guide',
          content: '# Testing\nAlways test first.',
          targetFile: '.github/TESTING.md',
          version: 2
        }
      });

      const result = await syncGuidelines({ dryRun: false, force: false });
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(2);
      expect(parsed.skipped).toBe(0);
      expect(parsed.errors).toBe(0);
      expect(parsed.message).toContain('2 guideline(s) synced');

      // Verify files were written
      const writtenPaths = Object.keys(mockFiles);
      expect(writtenPaths.some(p => p.endsWith('GUIDELINES.md'))).toBe(true);
      expect(writtenPaths.some(p => p.endsWith('TESTING.md'))).toBe(true);

      // Verify content
      const guidelinesFile = writtenPaths.find(p => p.endsWith('GUIDELINES.md'));
      expect(mockFiles[guidelinesFile]).toBe('# Code Style\nUse SOLID principles.');

      // Verify versions file was written
      const versionsFile = writtenPaths.find(p => p.endsWith('.pg-guidelines-versions.json'));
      expect(versionsFile).toBeTruthy();
      const versions = JSON.parse(mockFiles[versionsFile]);
      expect(versions['guide-1'].version).toBe(1);
      expect(versions['guide-2'].version).toBe(2);
    });

    it('should report how many guidelines were synced', async () => {
      setMockRtdbData('/global/guidelines', {
        'g1': { name: 'G1', content: 'content1', targetFile: 'file1.md', version: 1 },
        'g2': { name: 'G2', content: 'content2', targetFile: 'file2.md', version: 1 },
        'g3': { name: 'G3', content: 'content3', targetFile: 'file3.md', version: 1 }
      });

      const result = await syncGuidelines({});
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(3);
      expect(parsed.details).toHaveLength(3);
    });
  });

  describe('AC#2: version comparison and update', () => {
    it('should update when Firebase version is higher than local version', async () => {
      // Local has version 3
      setMockVersionsContent(JSON.stringify({
        'guide-1': { version: 3, targetFile: 'CLAUDE.md', syncedAt: '2026-01-01T00:00:00Z' }
      }));

      // Firebase has version 5
      setMockRtdbData('/global/guidelines', {
        'guide-1': {
          name: 'Updated Guide',
          content: '# Updated content v5',
          targetFile: 'CLAUDE.md',
          version: 5
        }
      });

      const result = await syncGuidelines({ dryRun: false, force: false });
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(1);
      expect(parsed.skipped).toBe(0);
      expect(parsed.details[0].action).toContain('updated from v3 to v5');

      // Verify content was written
      const writtenFile = Object.keys(mockFiles).find(p => p.endsWith('CLAUDE.md'));
      expect(mockFiles[writtenFile]).toBe('# Updated content v5');

      // Verify versions file updated
      const versionsFile = Object.keys(mockFiles).find(p => p.endsWith('.pg-guidelines-versions.json'));
      const versions = JSON.parse(mockFiles[versionsFile]);
      expect(versions['guide-1'].version).toBe(5);
    });

    it('should skip when local version matches Firebase version', async () => {
      setMockVersionsContent(JSON.stringify({
        'guide-1': { version: 3, targetFile: 'CLAUDE.md', syncedAt: '2026-01-01T00:00:00Z' }
      }));

      setMockRtdbData('/global/guidelines', {
        'guide-1': {
          name: 'Guide',
          content: '# Content',
          targetFile: 'CLAUDE.md',
          version: 3
        }
      });

      const result = await syncGuidelines({ dryRun: false, force: false });
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(0);
      expect(parsed.skipped).toBe(1);
      expect(parsed.details[0].action).toBe('skipped');
    });

    it('should force sync when force=true even if versions match', async () => {
      setMockVersionsContent(JSON.stringify({
        'guide-1': { version: 3, targetFile: 'CLAUDE.md', syncedAt: '2026-01-01T00:00:00Z' }
      }));

      setMockRtdbData('/global/guidelines', {
        'guide-1': {
          name: 'Guide',
          content: '# Forced content',
          targetFile: 'CLAUDE.md',
          version: 3
        }
      });

      const result = await syncGuidelines({ dryRun: false, force: true });
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(1);
      expect(parsed.skipped).toBe(0);
    });
  });

  describe('AC#3: no guidelines in Firebase', () => {
    it('should inform without error when no guidelines exist', async () => {
      // No data set in mock = null from Firebase

      const result = await syncGuidelines({ dryRun: false, force: false });
      const parsed = parseResult(result);

      expect(parsed.message).toContain('No guidelines found');
      expect(parsed.synced).toBe(0);
      expect(parsed.skipped).toBe(0);
      expect(parsed.errors).toBe(0);
    });

    it('should inform when guidelines exist but none have targetFile', async () => {
      setMockRtdbData('/global/guidelines', {
        'guide-1': {
          name: 'No target',
          content: '# Content',
          version: 1
          // no targetFile
        }
      });

      const result = await syncGuidelines({});
      const parsed = parseResult(result);

      expect(parsed.message).toContain('none have a targetFile');
      expect(parsed.synced).toBe(0);
    });
  });

  describe('AC#4: dryRun mode', () => {
    it('should show what files would be updated without writing', async () => {
      setMockRtdbData('/global/guidelines', {
        'guide-1': {
          name: 'Guide 1',
          content: '# Content 1',
          targetFile: 'docs/guide1.md',
          version: 2
        },
        'guide-2': {
          name: 'Guide 2',
          content: '# Content 2',
          targetFile: 'docs/guide2.md',
          version: 1
        }
      });

      const result = await syncGuidelines({ dryRun: true, force: false });
      const parsed = parseResult(result);

      expect(parsed.message).toContain('Dry run');
      expect(parsed.synced).toBe(2);
      expect(parsed.details[0].action).toBe('would_sync');
      expect(parsed.details[1].action).toBe('would_sync');

      // Verify NO files were actually written (only mockFiles should be empty except for test setup)
      const nonVersionFiles = Object.keys(mockFiles).filter(p => !p.endsWith('.pg-guidelines-versions.json'));
      expect(nonVersionFiles).toHaveLength(0);
    });

    it('should not write versions file in dryRun mode', async () => {
      setMockRtdbData('/global/guidelines', {
        'guide-1': {
          name: 'Guide',
          content: '# Content',
          targetFile: 'file.md',
          version: 1
        }
      });

      const result = await syncGuidelines({ dryRun: true });
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(1);
      const versionsFile = Object.keys(mockFiles).find(p => p.endsWith('.pg-guidelines-versions.json'));
      expect(versionsFile).toBeUndefined();
    });
  });

  describe('Security: path validation', () => {
    it('should reject targetFile with path traversal (..)', async () => {
      setMockRtdbData('/global/guidelines', {
        'malicious': {
          name: 'Evil Guide',
          content: 'pwned',
          targetFile: '../../etc/passwd',
          version: 1
        }
      });

      const result = await syncGuidelines({});
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(0);
      expect(parsed.errors).toBe(1);
      expect(parsed.errorDetails[0].error).toContain('path traversal');
    });

    it('should reject absolute targetFile paths', async () => {
      setMockRtdbData('/global/guidelines', {
        'malicious': {
          name: 'Evil Guide',
          content: 'pwned',
          targetFile: '/etc/passwd',
          version: 1
        }
      });

      const result = await syncGuidelines({});
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(0);
      expect(parsed.errors).toBe(1);
      expect(parsed.errorDetails[0].error).toContain('relative path');
    });
  });

  describe('Edge cases', () => {
    it('should handle guidelines with empty content', async () => {
      setMockRtdbData('/global/guidelines', {
        'empty': {
          name: 'Empty Guide',
          content: '',
          targetFile: 'empty.md',
          version: 1
        }
      });

      const result = await syncGuidelines({});
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(1);
      const writtenFile = Object.keys(mockFiles).find(p => p.endsWith('empty.md'));
      expect(mockFiles[writtenFile]).toBe('');
    });

    it('should handle guidelines without explicit version (defaults to 1)', async () => {
      setMockRtdbData('/global/guidelines', {
        'no-version': {
          name: 'No Version',
          content: '# Content',
          targetFile: 'no-version.md'
          // no version field
        }
      });

      const result = await syncGuidelines({});
      const parsed = parseResult(result);

      expect(parsed.synced).toBe(1);
      expect(parsed.details[0].version).toBe(1);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkGuidelinesStatus } from '../../mcp/guidelines-check.js';

function createMockDb(instructionsData) {
  return {
    ref: vi.fn().mockReturnValue({
      once: vi.fn().mockResolvedValue({
        val: () => instructionsData
      })
    })
  };
}

function createDeps({ db, localGuidelines = undefined, filePath = '/mock/path' }) {
  return {
    getDb: () => db,
    getFilePath: () => filePath,
    readTracking: () => localGuidelines
  };
}

describe('checkGuidelinesStatus', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should warn when local tracking file does not exist (never synced)', async () => {
    const db = createMockDb({
      'guide-1': { name: 'Coding Standards', updatedAt: '2026-03-01T00:00:00Z' },
      'guide-2': { name: 'Security', updatedAt: '2026-03-01T00:00:00Z' }
    });

    const result = await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: null
    }));

    expect(result.status).toBe('never_synced');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('nunca sincronizadas')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('2 guidelines en Firebase')
    );
  });

  it('should warn when local guidelines are outdated compared to Firebase', async () => {
    const db = createMockDb({
      'guide-1': { name: 'Coding Standards', updatedAt: '2026-03-10T00:00:00Z' },
      'guide-2': { name: 'Security', updatedAt: '2026-03-01T00:00:00Z' }
    });

    const result = await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: {
        'guide-1': { updatedAt: '2026-02-01T00:00:00Z', name: 'Coding Standards' },
        'guide-2': { updatedAt: '2026-03-01T00:00:00Z', name: 'Security' }
      }
    }));

    expect(result.status).toBe('outdated');
    expect(result.outdated).toHaveLength(1);
    expect(result.outdated[0].configId).toBe('guide-1');
    expect(result.outdated[0].reason).toBe('updated');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('desactualizadas')
    );
  });

  it('should not warn when all guidelines are up to date', async () => {
    const db = createMockDb({
      'guide-1': { name: 'Coding Standards', updatedAt: '2026-03-10T00:00:00Z' },
      'guide-2': { name: 'Security', updatedAt: '2026-03-01T00:00:00Z' }
    });

    const result = await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: {
        'guide-1': { updatedAt: '2026-03-10T00:00:00Z', name: 'Coding Standards' },
        'guide-2': { updatedAt: '2026-03-01T00:00:00Z', name: 'Security' }
      }
    }));

    expect(result.status).toBe('up_to_date');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should warn about new guidelines in Firebase not present locally', async () => {
    const db = createMockDb({
      'guide-1': { name: 'Coding Standards', updatedAt: '2026-03-10T00:00:00Z' },
      'guide-new': { name: 'New Guideline', updatedAt: '2026-03-05T00:00:00Z' }
    });

    const result = await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: {
        'guide-1': { updatedAt: '2026-03-10T00:00:00Z', name: 'Coding Standards' }
      }
    }));

    expect(result.status).toBe('outdated');
    expect(result.outdated).toHaveLength(1);
    expect(result.outdated[0].configId).toBe('guide-new');
    expect(result.outdated[0].reason).toBe('new');
  });

  it('should return up_to_date when Firebase has no instructions', async () => {
    const db = createMockDb(null);

    const result = await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: null
    }));

    expect(result.status).toBe('up_to_date');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should not throw if Firebase query fails (non-blocking)', async () => {
    const db = {
      ref: vi.fn().mockReturnValue({
        once: vi.fn().mockRejectedValue(new Error('Firebase timeout'))
      })
    };

    const result = await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: null
    }));

    expect(result.status).toBe('error');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should include guideline names in outdated warning message', async () => {
    const db = createMockDb({
      'g1': { name: 'Alpha', updatedAt: '2026-03-10T00:00:00Z' },
      'g2': { name: 'Beta', updatedAt: '2026-03-10T00:00:00Z' }
    });

    const result = await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: {
        'g1': { updatedAt: '2026-01-01T00:00:00Z', name: 'Alpha' },
        'g2': { updatedAt: '2026-01-01T00:00:00Z', name: 'Beta' }
      }
    }));

    expect(result.status).toBe('outdated');
    expect(result.outdated).toHaveLength(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"Alpha"')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"Beta"')
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('sync_guidelines')
    );
  });

  it('should suggest sync_guidelines in never_synced message', async () => {
    const db = createMockDb({
      'g1': { name: 'Test', updatedAt: '2026-03-01T00:00:00Z' }
    });

    await checkGuidelinesStatus(createDeps({
      db,
      localGuidelines: null
    }));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('sync_guidelines')
    );
  });
});

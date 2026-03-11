import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist all mock functions and state
const {
  mockFiles, fsMocks,
  mockOnce, mockRef, mockDatabase, mockDelete, mockInitializeApp,
  mockConfirm, mockPrintHeader, mockPrintSuccess, mockPrintWarning, mockPrintInfo, mockPrintError, mockAsk
} = vi.hoisted(() => {
  const mockFiles = {};

  const mockOnce = vi.fn();
  const mockRef = vi.fn(() => ({ once: mockOnce }));
  const mockDatabase = vi.fn(() => ({ ref: mockRef }));
  const mockDelete = vi.fn(() => Promise.resolve());
  const mockInitializeApp = vi.fn(() => ({
    database: mockDatabase,
    delete: mockDelete
  }));

  const mockConfirm = vi.fn();
  const mockPrintHeader = vi.fn();
  const mockPrintSuccess = vi.fn();
  const mockPrintWarning = vi.fn();
  const mockPrintInfo = vi.fn();
  const mockPrintError = vi.fn();
  const mockAsk = vi.fn();

  const fsMocks = {
    readFileSync: vi.fn((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('serviceAccountKey.json')) {
        return JSON.stringify({ project_id: 'test-project' });
      }
      if (typeof filePath === 'string' && filePath.endsWith('.pg-guidelines-versions.json')) {
        throw new Error('ENOENT');
      }
      throw new Error(`ENOENT: no such file: ${filePath}`);
    }),
    writeFileSync: vi.fn((filePath, content) => {
      mockFiles[filePath] = content;
    }),
    mkdirSync: vi.fn(),
    existsSync: vi.fn((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('.pg-guidelines-versions.json')) return false;
      if (typeof filePath === 'string' && filePath.endsWith('serviceAccountKey.json')) return true;
      if (typeof filePath === 'string' && filePath.endsWith('pg.config.yml')) return false;
      return true;
    })
  };

  return {
    mockFiles, fsMocks,
    mockOnce, mockRef, mockDatabase, mockDelete, mockInitializeApp,
    mockConfirm, mockPrintHeader, mockPrintSuccess, mockPrintWarning, mockPrintInfo, mockPrintError, mockAsk
  };
});

// Mock firebase-admin
vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: mockInitializeApp,
    credential: {
      cert: vi.fn(() => 'mock-credential')
    }
  }
}));

// Mock fs
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = { ...actual, ...fsMocks };
  return { ...mocked, default: mocked };
});

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = { ...actual, ...fsMocks };
  return { ...mocked, default: mocked };
});

// Mock wizard utilities
vi.mock('../utils/wizard.js', () => ({
  ask: mockAsk,
  confirm: mockConfirm,
  printHeader: mockPrintHeader,
  printSuccess: mockPrintSuccess,
  printError: mockPrintError,
  printWarning: mockPrintWarning,
  printInfo: mockPrintInfo,
  select: vi.fn()
}));

// Mock pg-config
vi.mock('../utils/pg-config.js', () => ({
  readConfig: vi.fn(() => null),
  writeConfig: vi.fn(),
  resolveConfigPath: vi.fn(() => '/tmp/pg.config.yml'),
  getConfigValue: vi.fn()
}));

// Mock child_process
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, execSync: vi.fn(), default: { ...actual, execSync: vi.fn() } };
});

// Mock firebase-adapter (for syncGuidelines internal import)
vi.mock('../firebase-adapter.js', () => ({
  getDatabase: vi.fn(() => { throw new Error('should not call getDatabase in wizard'); }),
  getFirestore: vi.fn(),
  resolveCredentialsPath: vi.fn()
}));

import { runInit } from '../commands/init.js';

describe('init.js — guidelines sync step', () => {
  const credentialsPath = '/path/to/serviceAccountKey.json';
  const databaseUrl = 'https://test-project-default-rtdb.europe-west1.firebasedatabase.app';

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFiles).forEach(k => delete mockFiles[k]);

    // Reset fs mocks to defaults
    fsMocks.readFileSync.mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('serviceAccountKey.json')) {
        return JSON.stringify({ project_id: 'test-project' });
      }
      if (typeof filePath === 'string' && filePath.endsWith('.pg-guidelines-versions.json')) {
        throw new Error('ENOENT');
      }
      throw new Error(`ENOENT: no such file: ${filePath}`);
    });
    fsMocks.existsSync.mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.endsWith('.pg-guidelines-versions.json')) return false;
      if (typeof filePath === 'string' && filePath.endsWith('serviceAccountKey.json')) return true;
      if (typeof filePath === 'string' && filePath.endsWith('pg.config.yml')) return false;
      return true;
    });
    fsMocks.writeFileSync.mockImplementation((filePath, content) => {
      mockFiles[filePath] = content;
    });

    // Default mock for process exit prevention
    mockAsk.mockResolvedValue('test');
    mockConfirm.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setupGuidelinesInFirebase(guidelinesData) {
    mockOnce.mockResolvedValue({
      val: () => guidelinesData
    });
  }

  describe('AC#1: install + guidelines in Firebase → syncs and writes files', () => {
    it('should sync guidelines when Firebase has guidelines data', async () => {
      setupGuidelinesInFirebase({
        'guide-1': {
          name: 'Code Style',
          content: '# Code Style Guide',
          targetFile: 'GUIDELINES.md',
          version: 1
        }
      });

      await runInit({ nonInteractive: true });

      // Verify Firebase app was created for guidelines step
      const guidelinesAppCall = mockInitializeApp.mock.calls.find(
        call => typeof call[1] === 'string' && call[1].startsWith('init-guidelines-')
      );
      expect(guidelinesAppCall).toBeTruthy();

      // Verify db.ref was called with guidelines path
      expect(mockRef).toHaveBeenCalledWith('global/guidelines');

      // Verify files were written
      const guidelinesFile = Object.keys(mockFiles).find(p => p.endsWith('GUIDELINES.md'));
      expect(guidelinesFile).toBeTruthy();
      expect(mockFiles[guidelinesFile]).toBe('# Code Style Guide');

      // Verify success message was printed
      expect(mockPrintSuccess).toHaveBeenCalledWith(
        expect.stringContaining('1 guideline(s) synced')
      );

      // Verify temp app was cleaned up
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('AC#2: install + no guidelines → informative message, no error', () => {
    it('should show info message when no guidelines exist and continue', async () => {
      setupGuidelinesInFirebase(null);

      await runInit({ nonInteractive: true });

      // Verify informative message was shown
      expect(mockPrintInfo).toHaveBeenCalledWith(
        expect.stringContaining('No guidelines found')
      );

      // Verify setup completed
      expect(mockPrintHeader).toHaveBeenCalledWith('Setup Complete');

      // Verify temp app was cleaned up
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('AC#3: --non-interactive → sync runs automatically', () => {
    it('should run sync automatically without prompt in non-interactive mode', async () => {
      setupGuidelinesInFirebase({
        'guide-1': {
          name: 'Auto Guide',
          content: '# Auto synced',
          targetFile: 'AUTO.md',
          version: 1
        }
      });

      await runInit({ nonInteractive: true });

      // Verify confirm was NOT called for guidelines sync
      const guidelinesConfirmCall = mockConfirm.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].toLowerCase().includes('guidelines')
      );
      expect(guidelinesConfirmCall).toBeUndefined();

      // Verify sync ran and wrote file
      const autoFile = Object.keys(mockFiles).find(p => p.endsWith('AUTO.md'));
      expect(autoFile).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should continue setup if guidelines sync fails', async () => {
      mockOnce.mockRejectedValue(new Error('Network error'));

      await runInit({ nonInteractive: true });

      // Verify warning was shown
      expect(mockPrintWarning).toHaveBeenCalledWith(
        expect.stringContaining('Could not sync guidelines')
      );

      // Verify setup completed
      expect(mockPrintHeader).toHaveBeenCalledWith('Setup Complete');
    });

    it('should clean up temp app even if sync fails', async () => {
      mockOnce.mockRejectedValue(new Error('Database error'));

      await runInit({ nonInteractive: true });

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('Interactive mode', () => {
    it('should ask user before syncing in interactive mode', async () => {
      mockConfirm.mockImplementation((question) => {
        if (typeof question === 'string' && question.includes('Claude Code')) return Promise.resolve(false);
        if (typeof question === 'string' && question.includes('guidelines')) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      mockAsk.mockImplementation((question) => {
        if (question.includes('Instance name')) return Promise.resolve('test');
        if (question.includes('serviceAccountKey')) return Promise.resolve(credentialsPath);
        if (question.includes('Database URL')) return Promise.resolve(databaseUrl);
        if (question.includes('Your name')) return Promise.resolve('Test User');
        if (question.includes('email')) return Promise.resolve('test@example.com');
        if (question.includes('developer ID')) return Promise.resolve('dev_001');
        return Promise.resolve('test');
      });

      setupGuidelinesInFirebase({
        'guide-1': {
          name: 'Guide',
          content: '# Content',
          targetFile: 'GUIDE.md',
          version: 1
        }
      });

      await runInit({ nonInteractive: false });

      // Verify confirm was called with guidelines question
      const guidelinesConfirmCall = mockConfirm.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].toLowerCase().includes('guidelines')
      );
      expect(guidelinesConfirmCall).toBeTruthy();
    });

    it('should skip sync when user declines in interactive mode', async () => {
      mockConfirm.mockImplementation((question) => {
        if (typeof question === 'string' && question.includes('Claude Code')) return Promise.resolve(false);
        if (typeof question === 'string' && question.includes('guidelines')) return Promise.resolve(false);
        return Promise.resolve(false);
      });

      mockAsk.mockImplementation((question) => {
        if (question.includes('Instance name')) return Promise.resolve('test');
        if (question.includes('serviceAccountKey')) return Promise.resolve(credentialsPath);
        if (question.includes('Database URL')) return Promise.resolve(databaseUrl);
        if (question.includes('Your name')) return Promise.resolve('Test User');
        if (question.includes('email')) return Promise.resolve('test@example.com');
        if (question.includes('developer ID')) return Promise.resolve('dev_001');
        return Promise.resolve('test');
      });

      setupGuidelinesInFirebase({
        'guide-1': {
          name: 'Guide',
          content: '# Content',
          targetFile: 'GUIDE.md',
          version: 1
        }
      });

      await runInit({ nonInteractive: false });

      // Verify sync was skipped
      expect(mockPrintInfo).toHaveBeenCalledWith('Guidelines sync skipped.');
    });
  });
});

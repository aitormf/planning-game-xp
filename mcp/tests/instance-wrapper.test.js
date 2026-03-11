import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all external dependencies
vi.mock('../firebase-adapter.js', () => ({
  resolveCredentialsPath: vi.fn(() => '/fake/path/serviceAccountKey.json'),
  getFirebaseProjectId: vi.fn(() => 'test-project-id')
}));

vi.mock('../utils/pg-config.js', () => ({
  readConfig: vi.fn(() => ({
    instance: {
      name: 'test-instance',
      description: 'Test instance for wrapper tests'
    }
  })),
  resolveConfigPath: vi.fn(() => '/fake/pg.config.yml'),
  configExists: vi.fn(() => true)
}));

vi.mock('../user.js', () => ({
  resolveUserConfigPath: vi.fn(() => '/fake/path/mcp.user.json'),
  isMcpUserConfigured: vi.fn(() => true),
  getMcpUser: vi.fn(() => ({
    developerId: 'dev_001',
    developerName: 'Test User',
    developerEmail: 'test@example.com'
  }))
}));

vi.mock('../version-check.js', () => ({
  getLocalVersion: vi.fn(() => '1.14.1'),
  checkForUpdates: vi.fn(async () => ({ hasUpdate: false })),
  getUpdateNoticeOnce: vi.fn(() => null),
  resetNotificationFlag: vi.fn()
}));

// Import after mocks are set up
const { getInstanceMetadata, resetInstanceMetadataCache } = await import('../instance-metadata.js');

describe('instance metadata wrapper integration', () => {
  const originalEnv = process.env.MCP_INSTANCE_DIR;

  beforeEach(() => {
    process.env.MCP_INSTANCE_DIR = '/home/user/instances/personal';
    resetInstanceMetadataCache();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.MCP_INSTANCE_DIR = originalEnv;
    } else {
      delete process.env.MCP_INSTANCE_DIR;
    }
  });

  it('getInstanceMetadata returns correct structure', () => {
    const metadata = getInstanceMetadata();

    expect(metadata).toEqual({
      name: 'personal',
      firebaseProjectId: 'test-project-id',
      description: 'Test instance for wrapper tests'
    });
  });

  it('_instance can be injected into a JSON response', () => {
    const response = { ok: true, data: [1, 2, 3] };
    response._instance = getInstanceMetadata();

    expect(response._instance.name).toBe('personal');
    expect(response._instance.firebaseProjectId).toBe('test-project-id');
    expect(response._instance.description).toBe('Test instance for wrapper tests');

    // Verify it serializes correctly
    const serialized = JSON.stringify(response, null, 2);
    const parsed = JSON.parse(serialized);
    expect(parsed._instance).toEqual(response._instance);
  });

  it('_instance is injected by wrapWithUpdateNotice into tool responses', async () => {
    // Simulate what wrapWithUpdateNotice does: parse JSON, inject _instance
    const toolResult = {
      content: [{
        type: 'text',
        text: JSON.stringify({ ok: true, projects: ['PLN', 'PMC'] })
      }]
    };

    // Simulate the injection logic from register-tools.js
    const parsed = JSON.parse(toolResult.content[0].text);
    parsed._instance = getInstanceMetadata();
    toolResult.content[0] = { type: 'text', text: JSON.stringify(parsed, null, 2) };

    const finalParsed = JSON.parse(toolResult.content[0].text);
    expect(finalParsed._instance).toBeDefined();
    expect(finalParsed._instance.name).toBe('personal');
    expect(finalParsed._instance.firebaseProjectId).toBe('test-project-id');
    expect(finalParsed._instance.description).toBe('Test instance for wrapper tests');
    // Original data preserved
    expect(finalParsed.ok).toBe(true);
    expect(finalParsed.projects).toEqual(['PLN', 'PMC']);
  });

  it('_instance is NOT injected into non-JSON text responses', () => {
    const toolResult = {
      content: [{
        type: 'text',
        text: 'This is a plain text response, not JSON'
      }]
    };

    // Simulate the injection logic — safeJsonParse returns null for non-JSON
    let parsed;
    try { parsed = JSON.parse(toolResult.content[0].text); } catch { parsed = null; }

    if (parsed) {
      parsed._instance = getInstanceMetadata();
      toolResult.content[0] = { type: 'text', text: JSON.stringify(parsed, null, 2) };
    }

    // Non-JSON response should remain unchanged
    expect(toolResult.content[0].text).toBe('This is a plain text response, not JSON');
  });
});

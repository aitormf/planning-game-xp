import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing
vi.mock('../firebase-adapter.js', () => ({
  getFirebaseProjectId: vi.fn(() => 'test-project-id')
}));

vi.mock('../utils/pg-config.js', () => ({
  readConfig: vi.fn(() => ({
    instance: {
      name: 'test-instance',
      description: 'Test instance for unit tests'
    }
  }))
}));

const { getInstanceMetadata, resetInstanceMetadataCache } = await import('../instance-metadata.js');
const { readConfig } = await import('../utils/pg-config.js');

describe('getInstanceMetadata', () => {
  const originalEnv = process.env.MCP_INSTANCE_DIR;

  beforeEach(() => {
    resetInstanceMetadataCache();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.MCP_INSTANCE_DIR = originalEnv;
    } else {
      delete process.env.MCP_INSTANCE_DIR;
    }
  });

  it('should return instance name from MCP_INSTANCE_DIR', () => {
    process.env.MCP_INSTANCE_DIR = '/home/user/instances/personal';

    const metadata = getInstanceMetadata();

    expect(metadata.name).toBe('personal');
    expect(metadata.firebaseProjectId).toBe('test-project-id');
    expect(metadata.description).toBe('Test instance for unit tests');
  });

  it('should return null name when MCP_INSTANCE_DIR is not set', () => {
    delete process.env.MCP_INSTANCE_DIR;

    const metadata = getInstanceMetadata();

    expect(metadata.name).toBeNull();
    expect(metadata.firebaseProjectId).toBe('test-project-id');
  });

  it('should return null description when config has no description', () => {
    process.env.MCP_INSTANCE_DIR = '/home/user/instances/personal';
    readConfig.mockReturnValueOnce({ instance: { name: 'personal' } });
    resetInstanceMetadataCache();

    const metadata = getInstanceMetadata();

    expect(metadata.description).toBeNull();
  });

  it('should return null description when config does not exist', () => {
    process.env.MCP_INSTANCE_DIR = '/home/user/instances/personal';
    readConfig.mockReturnValueOnce(null);
    resetInstanceMetadataCache();

    const metadata = getInstanceMetadata();

    expect(metadata.description).toBeNull();
  });

  it('should cache metadata after first call', () => {
    process.env.MCP_INSTANCE_DIR = '/home/user/instances/cached';

    const first = getInstanceMetadata();
    const second = getInstanceMetadata();

    expect(first).toBe(second); // Same reference = cached
  });

  it('should reset cache when resetInstanceMetadataCache is called', () => {
    process.env.MCP_INSTANCE_DIR = '/home/user/instances/first';
    const first = getInstanceMetadata();

    resetInstanceMetadataCache();
    process.env.MCP_INSTANCE_DIR = '/home/user/instances/second';
    const second = getInstanceMetadata();

    expect(first.name).toBe('first');
    expect(second.name).toBe('second');
  });
});

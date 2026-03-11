import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetMockData,
  setMockRtdbData,
  getMockRtdbData
} from './__mocks__/firebase.js';
import { vi } from 'vitest';

vi.mock('../firebase-adapter.js', async () => {
  const mock = await import('./__mocks__/firebase.js');
  return {
    getDatabase: mock.getDatabase,
    getFirestore: mock.getFirestore
  };
});

const {
  listGlobalConfig,
  getGlobalConfig,
  createGlobalConfig,
  updateGlobalConfig,
  deleteGlobalConfig,
  VALID_CONFIG_TYPES
} = await import('../tools/global-config.js');

describe('global-config.js - guidelines type', () => {
  beforeEach(() => {
    resetMockData();
  });

  describe('VALID_CONFIG_TYPES', () => {
    it('should include guidelines as a valid type', () => {
      expect(VALID_CONFIG_TYPES).toContain('guidelines');
    });
  });

  describe('listGlobalConfig', () => {
    it('should return empty message when no guidelines exist', async () => {
      const result = await listGlobalConfig({ type: 'guidelines' });
      expect(result.content[0].text).toContain('No guidelines found');
    });

    it('should list guidelines with version and targetFile in summary', async () => {
      setMockRtdbData('/global/guidelines', {
        'gl-1': {
          name: 'CLAUDE.md guidelines',
          content: '# Guidelines',
          version: 2,
          targetFile: 'CLAUDE.md',
          category: 'development',
          createdAt: '2026-03-10T00:00:00Z',
          createdBy: 'geniova-mcp'
        }
      });

      const result = await listGlobalConfig({ type: 'guidelines' });
      const configs = JSON.parse(result.content[0].text);

      expect(configs).toHaveLength(1);
      expect(configs[0].version).toBe(2);
      expect(configs[0].targetFile).toBe('CLAUDE.md');
    });

    it('should filter guidelines by category', async () => {
      setMockRtdbData('/global/guidelines', {
        'gl-1': { name: 'GL1', category: 'development', content: 'a', version: 1 },
        'gl-2': { name: 'GL2', category: 'qa', content: 'b', version: 1 }
      });

      const result = await listGlobalConfig({ type: 'guidelines', category: 'qa' });
      const configs = JSON.parse(result.content[0].text);

      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('GL2');
    });
  });

  describe('getGlobalConfig', () => {
    it('should return not found message for non-existent guideline', async () => {
      const result = await getGlobalConfig({ type: 'guidelines', configId: 'nonexistent' });
      expect(result.content[0].text).toContain('not found');
    });

    it('should return full guideline data', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'Test guideline',
        content: '# Content',
        version: 1,
        targetFile: 'README.md',
        category: 'development'
      });

      const result = await getGlobalConfig({ type: 'guidelines', configId: 'gl-1' });
      const config = JSON.parse(result.content[0].text);

      expect(config.configId).toBe('gl-1');
      expect(config.type).toBe('guidelines');
      expect(config.version).toBe(1);
      expect(config.targetFile).toBe('README.md');
    });
  });

  describe('createGlobalConfig - guidelines', () => {
    it('should create a guideline with version=1', async () => {
      const result = await createGlobalConfig({
        type: 'guidelines',
        name: 'Test guideline',
        content: '# My guideline',
        category: 'development'
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('created successfully');
      expect(parsed.type).toBe('guidelines');
    });

    it('should require content for guidelines', async () => {
      await expect(
        createGlobalConfig({
          type: 'guidelines',
          name: 'No content guideline'
        })
      ).rejects.toThrow('content" is required for guidelines');
    });

    it('should accept targetFile as relative path', async () => {
      const result = await createGlobalConfig({
        type: 'guidelines',
        name: 'With target',
        content: '# Content',
        targetFile: 'CLAUDE.md'
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('created successfully');
    });

    it('should reject absolute targetFile path', async () => {
      await expect(
        createGlobalConfig({
          type: 'guidelines',
          name: 'Bad path',
          content: '# Content',
          targetFile: '/etc/passwd'
        })
      ).rejects.toThrow('relative path');
    });

    it('should reject targetFile with path traversal', async () => {
      await expect(
        createGlobalConfig({
          type: 'guidelines',
          name: 'Bad path',
          content: '# Content',
          targetFile: '../../../etc/passwd'
        })
      ).rejects.toThrow('path traversal');
    });

    it('should not require content for non-guidelines types', async () => {
      const result = await createGlobalConfig({
        type: 'instructions',
        name: 'Test instruction'
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('created successfully');
    });
  });

  describe('updateGlobalConfig - guidelines versioning', () => {
    it('should auto-increment version when content changes', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'Test guideline',
        content: 'Version 1 content',
        version: 1,
        category: 'development',
        updatedAt: '2026-03-09T00:00:00Z',
        updatedBy: 'geniova-mcp'
      });

      const result = await updateGlobalConfig({
        type: 'guidelines',
        configId: 'gl-1',
        updates: { content: 'Version 2 content' }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.config.version).toBe(2);
      expect(parsed.config.content).toBe('Version 2 content');
    });

    it('should save previous content in history subnodo', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'Test guideline',
        content: 'Original content',
        version: 1,
        category: 'development',
        updatedAt: '2026-03-09T00:00:00Z',
        updatedBy: 'geniova-mcp'
      });

      await updateGlobalConfig({
        type: 'guidelines',
        configId: 'gl-1',
        updates: { content: 'Updated content' }
      });

      // Verify history was saved at global/guidelines/gl-1/history/1
      const historyData = getMockRtdbData('global/guidelines/gl-1/history/1');
      expect(historyData).toBeDefined();
      expect(historyData.content).toBe('Original content');
      expect(historyData.updatedAt).toBe('2026-03-09T00:00:00Z');
      expect(historyData.updatedBy).toBe('geniova-mcp');
    });

    it('should not increment version when content does not change', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'Test guideline',
        content: 'Same content',
        version: 3,
        category: 'development',
        updatedAt: '2026-03-09T00:00:00Z',
        updatedBy: 'geniova-mcp'
      });

      const result = await updateGlobalConfig({
        type: 'guidelines',
        configId: 'gl-1',
        updates: { name: 'Renamed guideline' }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.config.version).toBe(3);
    });

    it('should reject manual version update for guidelines', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'Test',
        content: 'Content',
        version: 1,
        category: 'development'
      });

      await expect(
        updateGlobalConfig({
          type: 'guidelines',
          configId: 'gl-1',
          updates: { version: 99 }
        })
      ).rejects.toThrow('protected field');
    });

    it('should reject manual history update for guidelines', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'Test',
        content: 'Content',
        version: 1,
        category: 'development'
      });

      await expect(
        updateGlobalConfig({
          type: 'guidelines',
          configId: 'gl-1',
          updates: { history: {} }
        })
      ).rejects.toThrow('protected field');
    });

    it('should validate targetFile on update', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'Test',
        content: 'Content',
        version: 1,
        category: 'development'
      });

      await expect(
        updateGlobalConfig({
          type: 'guidelines',
          configId: 'gl-1',
          updates: { targetFile: '/absolute/path' }
        })
      ).rejects.toThrow('relative path');
    });

    it('should allow version/history updates for non-guidelines types', async () => {
      setMockRtdbData('/global/instructions/inst-1', {
        name: 'Test instruction',
        content: 'Content',
        category: 'development'
      });

      // version is not protected for non-guidelines types
      const result = await updateGlobalConfig({
        type: 'instructions',
        configId: 'inst-1',
        updates: { content: 'New content' }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('updated successfully');
    });
  });

  describe('deleteGlobalConfig - guidelines', () => {
    it('should delete a guideline and move to trash', async () => {
      setMockRtdbData('/global/guidelines/gl-1', {
        name: 'To delete',
        content: 'Content',
        version: 2,
        category: 'development'
      });

      const result = await deleteGlobalConfig({ type: 'guidelines', configId: 'gl-1' });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.message).toContain('deleted successfully');
      expect(parsed.type).toBe('guidelines');
    });

    it('should throw error when deleting non-existent guideline', async () => {
      await expect(
        deleteGlobalConfig({ type: 'guidelines', configId: 'nonexistent' })
      ).rejects.toThrow('not found');
    });
  });
});

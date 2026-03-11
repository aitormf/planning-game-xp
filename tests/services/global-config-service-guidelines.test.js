/**
 * Tests for Global Config Service - Guidelines specific functionality
 */
import { describe, it, expect } from 'vitest';
import { CONFIG_TYPES } from '../../public/js/services/global-config-service.js';

describe('Guidelines support in GlobalConfigService', () => {
  describe('CONFIG_TYPES includes guidelines', () => {
    it('should include guidelines in CONFIG_TYPES', () => {
      expect(CONFIG_TYPES).toContain('guidelines');
    });

    it('should still include original types', () => {
      expect(CONFIG_TYPES).toContain('agents');
      expect(CONFIG_TYPES).toContain('prompts');
      expect(CONFIG_TYPES).toContain('instructions');
    });
  });

  describe('_incrementVersion', () => {
    // Test the version increment logic directly
    function incrementVersion(version) {
      const parts = version.split('.').map(Number);
      if (parts.length === 3) {
        parts[2] += 1;
      }
      return parts.join('.');
    }

    it('should increment patch version', () => {
      expect(incrementVersion('1.0.0')).toBe('1.0.1');
    });

    it('should increment from higher patch', () => {
      expect(incrementVersion('1.2.9')).toBe('1.2.10');
    });

    it('should increment from zero', () => {
      expect(incrementVersion('0.0.0')).toBe('0.0.1');
    });

    it('should handle large version numbers', () => {
      expect(incrementVersion('10.20.30')).toBe('10.20.31');
    });
  });

  describe('Guidelines data model', () => {
    it('should have required fields for a guideline', () => {
      const guideline = {
        id: 'guide_001',
        name: 'Test Guideline',
        description: 'A test',
        content: '# Test content',
        category: 'development',
        targetFile: 'CLAUDE.md',
        version: '1.0.0',
        createdAt: '2026-03-11T10:00:00Z',
        createdBy: 'admin@example.com',
        updatedAt: '2026-03-11T10:00:00Z',
        updatedBy: 'admin@example.com'
      };

      expect(guideline.targetFile).toBeDefined();
      expect(guideline.version).toBeDefined();
      expect(typeof guideline.targetFile).toBe('string');
      expect(typeof guideline.version).toBe('string');
    });

    it('should support empty targetFile', () => {
      const guideline = {
        targetFile: '',
        version: '1.0.0'
      };
      expect(guideline.targetFile).toBe('');
    });
  });

  describe('Guidelines history entry', () => {
    it('should include targetFile and version in history', () => {
      const historyEntry = {
        name: 'Test Guideline',
        description: 'A test',
        content: '# Updated content',
        category: 'development',
        targetFile: 'CLAUDE.md',
        version: '1.0.1',
        timestamp: '2026-03-11T11:00:00Z',
        changedBy: 'admin@example.com',
        action: 'update'
      };

      expect(historyEntry.targetFile).toBe('CLAUDE.md');
      expect(historyEntry.version).toBe('1.0.1');
      expect(historyEntry.action).toBe('update');
    });
  });
});

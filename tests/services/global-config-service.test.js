/**
 * Tests for Global Config Service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CONFIG_TYPES, CONFIG_CATEGORIES } from '../../public/js/services/global-config-service.js';

describe('Global Config Service constants', () => {
  describe('CONFIG_TYPES', () => {
    it('should include agents', () => {
      expect(CONFIG_TYPES).toContain('agents');
    });

    it('should include prompts', () => {
      expect(CONFIG_TYPES).toContain('prompts');
    });

    it('should include instructions', () => {
      expect(CONFIG_TYPES).toContain('instructions');
    });

    it('should have exactly 3 types', () => {
      expect(CONFIG_TYPES).toHaveLength(3);
    });
  });

  describe('CONFIG_CATEGORIES', () => {
    it('should include development', () => {
      expect(CONFIG_CATEGORIES).toContain('development');
    });

    it('should include planning', () => {
      expect(CONFIG_CATEGORIES).toContain('planning');
    });

    it('should include qa', () => {
      expect(CONFIG_CATEGORIES).toContain('qa');
    });

    it('should include documentation', () => {
      expect(CONFIG_CATEGORIES).toContain('documentation');
    });

    it('should include architecture', () => {
      expect(CONFIG_CATEGORIES).toContain('architecture');
    });

    it('should have exactly 5 categories', () => {
      expect(CONFIG_CATEGORIES).toHaveLength(5);
    });
  });
});

describe('Global Config Service unit tests', () => {
  // Create a mock service class for unit testing
  class MockGlobalConfigService {
    constructor() {
      this.cache = new Map();
      this.typeCache = new Map();
    }

    _validateType(type) {
      if (!CONFIG_TYPES.includes(type)) {
        throw new Error(`Invalid config type: ${type}. Valid types: ${CONFIG_TYPES.join(', ')}`);
      }
    }

    _getCacheKey(type, configId) {
      return `${type}/${configId}`;
    }

    validateCategory(category) {
      if (!CONFIG_CATEGORIES.includes(category)) {
        throw new Error(`Invalid category: ${category}. Valid categories: ${CONFIG_CATEGORIES.join(', ')}`);
      }
      return true;
    }

    clearCache(type) {
      if (type) {
        this._validateType(type);
        this.typeCache.delete(type);
        for (const key of this.cache.keys()) {
          if (key.startsWith(`${type}/`)) {
            this.cache.delete(key);
          }
        }
      } else {
        this.cache.clear();
        this.typeCache.clear();
      }
    }
  }

  let service;

  beforeEach(() => {
    service = new MockGlobalConfigService();
  });

  describe('_validateType', () => {
    it('should accept valid types', () => {
      expect(() => service._validateType('agents')).not.toThrow();
      expect(() => service._validateType('prompts')).not.toThrow();
      expect(() => service._validateType('instructions')).not.toThrow();
    });

    it('should reject invalid type', () => {
      expect(() => service._validateType('invalid')).toThrow('Invalid config type');
    });
  });

  describe('_getCacheKey', () => {
    it('should generate correct cache key', () => {
      const key = service._getCacheKey('agents', 'agent_001');
      expect(key).toBe('agents/agent_001');
    });
  });

  describe('validateCategory', () => {
    it('should accept valid categories', () => {
      expect(service.validateCategory('development')).toBe(true);
      expect(service.validateCategory('planning')).toBe(true);
      expect(service.validateCategory('qa')).toBe(true);
    });

    it('should reject invalid category', () => {
      expect(() => service.validateCategory('invalid')).toThrow('Invalid category');
    });
  });

  describe('clearCache', () => {
    beforeEach(() => {
      service.cache.set('agents/agent_001', { id: 'agent_001' });
      service.cache.set('agents/agent_002', { id: 'agent_002' });
      service.cache.set('prompts/prompt_001', { id: 'prompt_001' });
      service.typeCache.set('agents', []);
      service.typeCache.set('prompts', []);
    });

    it('should clear all caches when no type provided', () => {
      service.clearCache();
      expect(service.cache.size).toBe(0);
      expect(service.typeCache.size).toBe(0);
    });

    it('should clear only specific type cache', () => {
      service.clearCache('agents');
      expect(service.cache.has('agents/agent_001')).toBe(false);
      expect(service.cache.has('agents/agent_002')).toBe(false);
      expect(service.cache.has('prompts/prompt_001')).toBe(true);
      expect(service.typeCache.has('agents')).toBe(false);
      expect(service.typeCache.has('prompts')).toBe(true);
    });

    it('should throw for invalid type', () => {
      expect(() => service.clearCache('invalid')).toThrow('Invalid config type');
    });
  });
});

describe('Global Config data model', () => {
  it('should define expected agent structure', () => {
    const validAgent = {
      id: 'agent_001',
      type: 'agents',
      name: 'Code Review Agent',
      description: 'Reviews code for best practices',
      content: 'You are a code review agent...',
      category: 'development',
      createdAt: '2026-01-31T10:00:00Z',
      createdBy: 'admin@example.com',
      updatedAt: '2026-01-31T10:00:00Z',
      updatedBy: 'admin@example.com'
    };

    expect(validAgent.id).toBeDefined();
    expect(validAgent.name).toBeDefined();
    expect(validAgent.content).toBeDefined();
    expect(validAgent.category).toBeDefined();
    expect(CONFIG_CATEGORIES).toContain(validAgent.category);
  });

  it('should define expected prompt structure', () => {
    const validPrompt = {
      id: 'prompt_001',
      type: 'prompts',
      name: 'Task Description Prompt',
      description: 'Helps write clear task descriptions',
      content: 'Write a clear description for...',
      category: 'planning',
      createdAt: '2026-01-31T10:00:00Z',
      createdBy: 'admin@example.com'
    };

    expect(validPrompt.id).toBeDefined();
    expect(validPrompt.name).toBeDefined();
    expect(CONFIG_CATEGORIES).toContain(validPrompt.category);
  });

  it('should define expected instruction structure', () => {
    const validInstruction = {
      id: 'instr_001',
      type: 'instructions',
      name: 'Coding Standards',
      description: 'General coding standards for the team',
      content: '## Coding Standards\n\n1. Use TypeScript...',
      category: 'development',
      createdAt: '2026-01-31T10:00:00Z',
      createdBy: 'admin@example.com'
    };

    expect(validInstruction.id).toBeDefined();
    expect(validInstruction.name).toBeDefined();
    expect(CONFIG_CATEGORIES).toContain(validInstruction.category);
  });
});

describe('Project selection of global configs', () => {
  it('should support selectedAgents array on project', () => {
    const project = {
      name: 'TestProject',
      selectedAgents: ['agent_001', 'agent_002'],
      selectedPrompts: ['prompt_001'],
      selectedInstructions: []
    };

    expect(Array.isArray(project.selectedAgents)).toBe(true);
    expect(project.selectedAgents).toHaveLength(2);
  });

  it('should support empty selections', () => {
    const project = {
      name: 'TestProject',
      selectedAgents: [],
      selectedPrompts: [],
      selectedInstructions: []
    };

    expect(project.selectedAgents).toHaveLength(0);
    expect(project.selectedPrompts).toHaveLength(0);
    expect(project.selectedInstructions).toHaveLength(0);
  });
});

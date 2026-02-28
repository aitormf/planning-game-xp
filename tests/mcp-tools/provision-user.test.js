/**
 * Tests for MCP provision_user tool
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-adapter
const mockOnce = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue();
const mockRef = vi.fn();

vi.mock('../../mcp/firebase-adapter.js', () => ({
  getDatabase: () => ({
    ref: mockRef
  })
}));

const { provisionUser } = await import('../../mcp/tools/provision-user.js');

function setupMockRef(dataByPath = {}) {
  mockRef.mockImplementation((path) => {
    const data = path !== undefined ? dataByPath[path] ?? null : null;
    return {
      once: vi.fn().mockResolvedValue({
        exists: () => data !== null,
        val: () => data
      }),
      update: mockUpdate
    };
  });
}

describe('MCP provision_user tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('new user creation', () => {
    it('should create a new user with developer ID', async () => {
      setupMockRef({
        '/users/john|doe!example!com': null,
        '/users': { 'existing|user!test!com': { developerId: 'dev_003', stakeholderId: 'stk_002' } }
      });

      const result = await provisionUser({
        email: 'john.doe@example.com',
        name: 'John Doe',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.isNew).toBe(true);
      expect(parsed.email).toBe('john.doe@example.com');
      expect(parsed.encodedEmail).toBe('john!doe|example!com');
      expect(parsed.developerId).toBe('dev_004');
      expect(parsed.stakeholderId).toBeNull();
      expect(parsed.projectAssignments).toHaveLength(1);
      expect(parsed.projectAssignments[0].status).toBe('added');

      // Verify Firebase update was called
      expect(mockRef).toHaveBeenCalledWith();
      expect(mockUpdate).toHaveBeenCalled();
      const updates = mockUpdate.mock.calls[0][0];
      expect(updates['/users/john!doe|example!com/name']).toBe('John Doe');
      expect(updates['/users/john!doe|example!com/email']).toBe('john.doe@example.com');
      expect(updates['/users/john!doe|example!com/active']).toBe(true);
      expect(updates['/users/john!doe|example!com/developerId']).toBe('dev_004');
      expect(updates['/users/john!doe|example!com/projects/PLN/developer']).toBe(true);
      expect(updates['/users/john!doe|example!com/projects/PLN/stakeholder']).toBe(false);
    });

    it('should create both developer and stakeholder IDs', async () => {
      setupMockRef({
        '/users/test|test!com': null,
        '/users': {
          'a|b!com': { developerId: 'dev_005', stakeholderId: 'stk_003' }
        }
      });

      const result = await provisionUser({
        email: 'test@test.com',
        name: 'Test User',
        projects: [{ projectId: 'NTR', developer: true, stakeholder: true }],
        developer: true,
        stakeholder: true
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.developerId).toBe('dev_006');
      expect(parsed.stakeholderId).toBe('stk_004');
    });
  });

  describe('Gmail normalization', () => {
    it('should normalize Gmail addresses by removing dots', async () => {
      setupMockRef({
        '/users/johndoe|gmail!com': null,
        '/users': {}
      });

      const result = await provisionUser({
        email: 'john.doe@gmail.com',
        name: 'John Doe',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.email).toBe('johndoe@gmail.com');
      expect(parsed.encodedEmail).toBe('johndoe|gmail!com');
    });

    it('should normalize googlemail.com addresses', async () => {
      setupMockRef({
        '/users/johndoe|googlemail!com': null,
        '/users': {}
      });

      const result = await provisionUser({
        email: 'john.doe@googlemail.com',
        name: 'John Doe',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.email).toBe('johndoe@googlemail.com');
    });

    it('should NOT normalize non-Gmail addresses', async () => {
      setupMockRef({
        '/users/john!doe|company!com': null,
        '/users': {}
      });

      const result = await provisionUser({
        email: 'john.doe@company.com',
        name: 'John Doe',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.email).toBe('john.doe@company.com');
    });
  });

  describe('idempotent updates', () => {
    it('should not overwrite existing developer/stakeholder IDs', async () => {
      setupMockRef({
        '/users/existing|example!com': {
          name: 'Old Name',
          email: 'existing@example.com',
          developerId: 'dev_001',
          stakeholderId: 'stk_001',
          createdAt: '2025-01-01T00:00:00Z',
          projects: { PLN: { developer: true, stakeholder: false, addedAt: '2025-01-01' } }
        },
        '/users': {
          'existing|example!com': { developerId: 'dev_001', stakeholderId: 'stk_001' }
        }
      });

      const result = await provisionUser({
        email: 'existing@example.com',
        name: 'New Name',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: true
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.isNew).toBe(false);
      expect(parsed.developerId).toBe('dev_001');
      expect(parsed.stakeholderId).toBe('stk_001');

      // Should NOT create new IDs
      const updates = mockUpdate.mock.calls[0][0];
      expect(updates['/users/existing|example!com/developerId']).toBeUndefined();
      expect(updates['/users/existing|example!com/stakeholderId']).toBeUndefined();
      expect(updates['/users/existing|example!com/createdAt']).toBeUndefined();
    });

    it('should add new project to existing user', async () => {
      setupMockRef({
        '/users/user|test!com': {
          name: 'User',
          email: 'user@test.com',
          developerId: 'dev_002',
          createdAt: '2025-01-01',
          projects: { PLN: { developer: true, stakeholder: false, addedAt: '2025-01-01' } }
        },
        '/users': { 'user|test!com': { developerId: 'dev_002' } }
      });

      const result = await provisionUser({
        email: 'user@test.com',
        name: 'User',
        projects: [
          { projectId: 'PLN', developer: true, stakeholder: false },
          { projectId: 'NTR', developer: true, stakeholder: true }
        ],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.projectAssignments).toHaveLength(2);
      expect(parsed.projectAssignments[0].status).toBe('updated');
      expect(parsed.projectAssignments[1].status).toBe('added');

      const updates = mockUpdate.mock.calls[0][0];
      expect(updates['/users/user|test!com/projects/NTR/developer']).toBe(true);
      expect(updates['/users/user|test!com/projects/NTR/stakeholder']).toBe(true);
      expect(updates['/users/user|test!com/projects/NTR/addedAt']).toBeDefined();
      // PLN already had addedAt, should not overwrite
      expect(updates['/users/user|test!com/projects/PLN/addedAt']).toBeUndefined();
    });
  });

  describe('multiple projects', () => {
    it('should assign multiple projects in one call', async () => {
      setupMockRef({
        '/users/multi|example!com': null,
        '/users': {}
      });

      const result = await provisionUser({
        email: 'multi@example.com',
        name: 'Multi User',
        projects: [
          { projectId: 'PLN', developer: true, stakeholder: false },
          { projectId: 'NTR', developer: true, stakeholder: true },
          { projectId: 'EX2', developer: false, stakeholder: true }
        ],
        developer: true,
        stakeholder: true
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.projectAssignments).toHaveLength(3);
      expect(parsed.projectAssignments.every((p) => p.status === 'added')).toBe(true);

      const updates = mockUpdate.mock.calls[0][0];
      expect(updates['/users/multi|example!com/projects/PLN/developer']).toBe(true);
      expect(updates['/users/multi|example!com/projects/NTR/developer']).toBe(true);
      expect(updates['/users/multi|example!com/projects/EX2/developer']).toBe(false);
      expect(updates['/users/multi|example!com/projects/EX2/stakeholder']).toBe(true);
    });
  });

  describe('email encoding', () => {
    it('should encode special characters correctly', async () => {
      setupMockRef({
        '/users/user|domain!co!uk': null,
        '/users': {}
      });

      const result = await provisionUser({
        email: 'user@domain.co.uk',
        name: 'UK User',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.encodedEmail).toBe('user|domain!co!uk');
    });
  });

  describe('ID generation', () => {
    it('should generate correct next ID when no users exist', async () => {
      setupMockRef({
        '/users/new|test!com': null,
        '/users': {}
      });

      const result = await provisionUser({
        email: 'new@test.com',
        name: 'New User',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.developerId).toBe('dev_001');
    });

    it('should handle non-sequential existing IDs', async () => {
      setupMockRef({
        '/users/gap|test!com': null,
        '/users': {
          'a|b!com': { developerId: 'dev_001' },
          'c|d!com': { developerId: 'dev_010' },
          'e|f!com': { developerId: 'dev_005' }
        }
      });

      const result = await provisionUser({
        email: 'gap@test.com',
        name: 'Gap User',
        projects: [{ projectId: 'PLN', developer: true, stakeholder: false }],
        developer: true,
        stakeholder: false
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.developerId).toBe('dev_011');
    });
  });
});

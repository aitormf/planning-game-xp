/**
 * Tests for MCP delete_user tool
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

const { deleteUser } = await import('../../mcp/tools/delete-user.js');

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

describe('MCP delete_user tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when user not found', async () => {
    setupMockRef({
      '/users/unknown|user!test!com': null
    });

    const result = await deleteUser({ email: 'unknown.user@test.com' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('not found');
  });

  it('should delete user and clean up legacy paths', async () => {
    setupMockRef({
      '/users/test|example!com': {
        name: 'Test User',
        email: 'test@example.com',
        projects: {
          'Cinema4D': { developer: true },
          'NTR': { stakeholder: true }
        }
      }
    });

    const result = await deleteUser({ email: 'test@example.com' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.email).toBe('test@example.com');
    expect(parsed.projectsCleared).toEqual(['Cinema4D', 'NTR']);
    expect(parsed.pathsDeleted).toContain('/users/test|example!com');
    expect(parsed.pathsDeleted).toContain('/data/appAdmins/test|example!com');
    expect(parsed.pathsDeleted).toContain('/data/appUploaders/Cinema4D/test|example!com');
    expect(parsed.pathsDeleted).toContain('/data/appUploaders/NTR/test|example!com');
    expect(parsed.pathsDeleted).toContain('/data/betaUsers/Cinema4D/test|example!com');
    expect(parsed.pathsDeleted).toContain('/data/betaUsers/NTR/test|example!com');

    // Verify update was called with null paths
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('should handle user without projects', async () => {
    setupMockRef({
      '/users/solo|example!com': {
        name: 'Solo User',
        email: 'solo@example.com'
      }
    });

    const result = await deleteUser({ email: 'solo@example.com' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.projectsCleared).toEqual([]);
    expect(parsed.pathsDeleted).toHaveLength(2);
  });

  it('should normalize Gmail addresses', async () => {
    setupMockRef({
      '/users/johndoe|gmail!com': {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        projects: { 'PLN': { developer: true } }
      }
    });

    const result = await deleteUser({ email: 'john.doe@gmail.com' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.email).toBe('johndoe@gmail.com');
  });
});

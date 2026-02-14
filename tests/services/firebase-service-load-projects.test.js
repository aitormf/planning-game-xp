import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockGet = vi.fn();
const mockRef = vi.fn(() => 'mock-ref');

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: (...args) => mockRef(...args),
  get: (...args) => mockGet(...args),
  push: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  databaseFirestore: {},
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  auth: { currentUser: { email: 'testuser@example.com' } },
  firebaseConfig: {},
  superAdminEmail: 'superadmin@example.com',
}));

vi.mock('../../public/js/utils/email-sanitizer.js', () => ({
  encodeEmailForFirebase: (email) => email.replace(/[@.]/g, '_'),
  decodeEmailFromFirebase: (encoded) => encoded,
  sanitizeEmailForFirebase: (email) => email.replace(/[@.]/g, '_'),
}));

vi.mock('../../public/js/services/permission-service.js', () => ({
  permissionService: {},
}));

vi.mock('../../public/js/services/history-service.js', () => ({
  historyService: {},
}));

vi.mock('../../public/js/services/user-directory-service.js', () => ({
  userDirectoryService: { load: vi.fn() },
}));

vi.mock('../../public/js/services/entity-directory-service.js', () => ({
  entityDirectoryService: {},
}));

vi.mock('../../public/js/services/developer-backlog-service.js', () => ({
  developerBacklogService: {},
}));

vi.mock('../../public/js/utils/developer-normalizer.js', () => ({
  normalizeDeveloperEntry: vi.fn(),
}));

vi.mock('../../public/js/utils/project-people-utils.js', () => ({
  normalizeProjectPeople: vi.fn(),
}));

describe('FirebaseService.loadProjects', () => {
  let FirebaseService;

  const allProjects = {
    'project-a': { name: 'Project A' },
    'project-b': { name: 'Project B' },
    'project-c': { name: 'Project C' },
  };

  beforeEach(async () => {
    vi.resetModules();
    window.projects = {};
    window.isAppAdmin = false;

    mockGet.mockReset();
    mockRef.mockReset();
    mockRef.mockReturnValue('mock-ref');

    const module = await import('../../public/js/services/firebase-service.js');
    FirebaseService = module.FirebaseService;
  });

  afterEach(() => {
    delete window.projects;
    delete window.isAppAdmin;
  });

  it('should return all projects when userEmail is null', async () => {
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => allProjects });

    await FirebaseService.loadProjects(null);

    expect(window.projects).toEqual(allProjects);
  });

  it('should return all projects when window.isAppAdmin is true', async () => {
    window.isAppAdmin = true;
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => allProjects });

    await FirebaseService.loadProjects('regular@example.com');

    expect(window.projects).toEqual(allProjects);
  });

  it('should return all projects when userEmail is the superAdmin without calling getUserProjects', async () => {
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => allProjects });

    await FirebaseService.loadProjects('superadmin@example.com');

    expect(window.projects).toEqual(allProjects);
    // Should only call get() once (for projects), NOT a second time for getUserProjects
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should return all projects when userEmail is the superAdmin (case insensitive)', async () => {
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => allProjects });

    await FirebaseService.loadProjects('SuperAdmin@Example.com');

    expect(window.projects).toEqual(allProjects);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should return filtered projects for regular user with specific assignments', async () => {
    // First call: get all projects
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => allProjects });
    // Second call: get user's project assignments
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => 'project-a,project-c' });

    await FirebaseService.loadProjects('regular@example.com');

    expect(window.projects).toEqual({
      'project-a': { name: 'Project A' },
      'project-c': { name: 'Project C' },
    });
  });

  it('should return all projects for regular user with "All" assignment', async () => {
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => allProjects });
    mockGet.mockResolvedValueOnce({ exists: () => true, val: () => 'All' });

    await FirebaseService.loadProjects('regular@example.com');

    expect(window.projects).toEqual(allProjects);
  });

  it('should return empty object when no projects exist in database', async () => {
    mockGet.mockResolvedValueOnce({ exists: () => false, val: () => null });

    await FirebaseService.loadProjects(null);

    expect(window.projects).toEqual({});
  });
});

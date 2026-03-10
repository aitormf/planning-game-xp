import { getDatabase } from '../firebase-adapter.js';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let projectCache = null;
let cacheLoadedAt = 0;

/**
 * Load all projects from Firebase, with TTL caching.
 * @returns {Promise<Object>} Map of projectId → project data
 */
export async function loadProjects() {
  if (projectCache && (Date.now() - cacheLoadedAt) < CACHE_TTL_MS) {
    return projectCache;
  }

  const db = getDatabase();
  const snapshot = await db.ref('/projects').once('value');
  const projects = snapshot.val();

  if (!projects) {
    throw new Error('No projects found in Firebase. Verify the database has projects at /projects.');
  }

  projectCache = projects;
  cacheLoadedAt = Date.now();
  return projectCache;
}

/**
 * Invalidate the project cache. Call after create/update project.
 */
export function invalidateProjectCache() {
  projectCache = null;
  cacheLoadedAt = 0;
}

/**
 * Normalize a repository URL for comparison.
 * Removes protocol, trailing slash, and .git suffix.
 * Supports HTTPS and SSH formats.
 *
 * @param {string} url - Repository URL
 * @returns {string} Normalized URL (e.g., "github.com/user/repo")
 */
export function normalizeRepoUrl(url) {
  if (!url || typeof url !== 'string') return '';

  let normalized = url.trim().toLowerCase();

  // SSH format: git@github.com:user/repo.git → github.com/user/repo
  if (normalized.startsWith('git@')) {
    normalized = normalized.replace(/^git@/, '').replace(':', '/');
  }

  // Remove protocol (https://, http://, ssh://)
  normalized = normalized.replace(/^(?:https?|ssh):\/\//, '');

  // Remove trailing .git
  normalized = normalized.replace(/\.git$/, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');

  return normalized;
}

/**
 * Resolve a projectId input to an actual Firebase project key.
 *
 * Resolution strategies (in order):
 * 1. Exact match on Firebase key
 * 2. Case-insensitive match on Firebase key
 * 3. Case-insensitive match on project name
 * 4. Case-insensitive match on abbreviation
 * 5. Match by normalized repoUrl
 *
 * @param {string} input - The projectId provided by the user/agent
 * @returns {Promise<{resolvedId: string, wasResolved: boolean, input: string}>}
 * @throws {Error} If no match is found (includes list of available projects)
 */
export async function resolveProjectId(input) {
  if (!input || typeof input !== 'string' || input.trim() === '') {
    throw new Error('projectId is required and cannot be empty.');
  }

  const trimmedInput = input.trim();
  const projects = await loadProjects();
  const projectKeys = Object.keys(projects);

  // Strategy 1: Exact match on key
  if (projects[trimmedInput]) {
    if (projects[trimmedInput].archived) {
      throw new Error(`Project "${trimmedInput}" is archived. Unarchive it first if you need to work with it.`);
    }
    return { resolvedId: trimmedInput, wasResolved: false, input: trimmedInput };
  }

  const inputLower = trimmedInput.toLowerCase();

  // Strategy 2: Case-insensitive match on key
  for (const key of projectKeys) {
    if (key.toLowerCase() === inputLower) {
      if (projects[key].archived) {
        throw new Error(`Project "${key}" is archived. Unarchive it first if you need to work with it.`);
      }
      return { resolvedId: key, wasResolved: true, input: trimmedInput };
    }
  }

  // Strategy 3: Case-insensitive match on project name
  for (const key of projectKeys) {
    const project = projects[key];
    const projectName = project.name || '';
    if (projectName.toLowerCase() === inputLower) {
      if (project.archived) {
        throw new Error(`Project "${key}" is archived. Unarchive it first if you need to work with it.`);
      }
      return { resolvedId: key, wasResolved: true, input: trimmedInput };
    }
  }

  // Strategy 4: Case-insensitive match on abbreviation
  for (const key of projectKeys) {
    const project = projects[key];
    const abbreviation = project.abbreviation || '';
    if (abbreviation.toLowerCase() === inputLower) {
      if (project.archived) {
        throw new Error(`Project "${key}" is archived. Unarchive it first if you need to work with it.`);
      }
      return { resolvedId: key, wasResolved: true, input: trimmedInput };
    }
  }

  // Strategy 5: Match by normalized repoUrl
  const normalizedInput = normalizeRepoUrl(trimmedInput);
  if (normalizedInput) {
    for (const key of projectKeys) {
      const project = projects[key];
      const projectRepoUrl = normalizeRepoUrl(project.repoUrl || '');
      if (projectRepoUrl && projectRepoUrl === normalizedInput) {
        if (project.archived) {
          throw new Error(`Project "${key}" is archived. Unarchive it first if you need to work with it.`);
        }
        return { resolvedId: key, wasResolved: true, input: trimmedInput };
      }
    }
  }

  // No match found — throw with available projects list (exclude archived)
  const availableProjects = projectKeys
    .filter(key => !projects[key].archived)
    .map(key => {
      const p = projects[key];
      return {
        id: key,
        name: p.name || key,
        abbreviation: p.abbreviation || null,
        repoUrl: p.repoUrl || null
      };
    });

  throw new Error(
    `Project "${trimmedInput}" not found. Available projects:\n${JSON.stringify(availableProjects, null, 2)}`
  );
}

/**
 * Discover a project by its repository URL.
 *
 * @param {string} repoUrl - Repository URL (HTTPS, SSH, with/without .git)
 * @returns {Promise<{resolvedId: string, project: Object}>}
 * @throws {Error} If no project matches the repo URL
 */
export async function discoverProjectByRepo(repoUrl) {
  if (!repoUrl || typeof repoUrl !== 'string' || repoUrl.trim() === '') {
    throw new Error('repoUrl is required and cannot be empty.');
  }

  const projects = await loadProjects();
  const normalizedInput = normalizeRepoUrl(repoUrl);

  if (!normalizedInput) {
    throw new Error(`Invalid repository URL: "${repoUrl}".`);
  }

  for (const [key, project] of Object.entries(projects)) {
    if (project.archived) continue;
    const projectRepoUrl = normalizeRepoUrl(project.repoUrl || '');
    if (projectRepoUrl && projectRepoUrl === normalizedInput) {
      return { resolvedId: key, project };
    }
  }

  const availableProjects = Object.entries(projects)
    .filter(([, p]) => p.repoUrl && !p.archived)
    .map(([key, p]) => ({ id: key, name: p.name || key, repoUrl: p.repoUrl }));

  throw new Error(
    `No project found with repository URL "${repoUrl}". Projects with repoUrl:\n${JSON.stringify(availableProjects, null, 2)}`
  );
}

import { z } from 'zod';
import { getDatabase, getFirestore } from '../firebase-adapter.js';
import { getMcpUser, getMcpUserId } from '../user.js';
import { buildSectionPath, getAbbrId, SECTION_MAP } from '../../shared/utils.js';
import { invalidateProjectCache, discoverProjectByRepo } from '../services/project-resolver.js';

export const listProjectsSchema = z.object({});

export const getProjectSchema = z.object({
  projectId: z.string().describe('Project ID (e.g., "PlanningGame", "Cinema4D")')
});

export const updateProjectSchema = z.object({
  projectId: z.string().describe('Project ID to update'),
  updates: z.record(z.unknown()).describe('Fields to update (e.g., { description: "...", repoUrl: "..." })')
});

export const createProjectSchema = z.object({
  projectId: z.string().describe('Project ID (e.g., "MiProyecto"). Will be used as the database key'),
  name: z.string().describe('Display name of the project'),
  abbreviation: z.string().describe('Short abbreviation for card IDs (e.g., "MPR" for MiProyecto)'),
  description: z.string().optional().describe('Project description'),
  version: z.string().optional().describe('Project version (e.g., "1.0.0")'),
  scoringSystem: z.enum(['1-5', 'fibonacci']).optional().describe('Scoring system for points (default: "1-5")'),
  repoUrl: z.string().optional().describe('Repository URL'),
  languages: z.array(z.string()).optional().describe('Programming languages used'),
  frameworks: z.array(z.string()).optional().describe('Frameworks used')
});

export const discoverProjectSchema = z.object({
  repoUrl: z.string().describe('Repository URL (HTTPS, SSH, with/without .git suffix)')
});

export async function listProjects() {
  const db = getDatabase();
  const snapshot = await db.ref('/projects').once('value');
  const projects = snapshot.val();

  if (!projects) {
    return { content: [{ type: 'text', text: 'No projects found.' }] };
  }

  const result = Object.entries(projects)
    .filter(([, project]) => !project.archived)
    .map(([id, project]) => {
      const developers = extractDevelopers(project.developers);
      return {
        id,
        name: project.name || id,
        abbreviation: project.abbreviation || null,
        scoringSystem: project.scoringSystem || null,
        developers,
        createdAt: project.createdAt || null
      };
    });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

export async function getProject({ projectId }) {
  const db = getDatabase();
  const snapshot = await db.ref(`/projects/${projectId}`).once('value');
  const project = snapshot.val();

  if (!project) {
    return { content: [{ type: 'text', text: `Project "${projectId}" not found.` }] };
  }

  const result = {
    id: projectId,
    name: project.name || projectId,
    abbreviation: project.abbreviation || null,
    description: project.description || null,
    version: project.version || null,
    changelog: project.changelog || [],
    scoringSystem: project.scoringSystem || null,
    repoUrl: project.repoUrl || null,
    languages: project.languages || [],
    frameworks: project.frameworks || [],
    developers: extractDevelopers(project.developers),
    stakeholders: extractStakeholders(project.stakeholders),
    agentsGuidelines: project.agentsGuidelines || null,
    iaEnabled: project.iaEnabled || false,
    allowExecutables: project.allowExecutables || false,
    archived: project.archived || false,
    order: project.order || null,
    createdAt: project.createdAt || null,
    createdBy: project.createdBy || null,
    updatedAt: project.updatedAt || null,
    updatedBy: project.updatedBy || null
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

export async function updateProject({ projectId, updates }) {
  const db = getDatabase();
  const projectRef = db.ref(`/projects/${projectId}`);

  const snapshot = await projectRef.once('value');
  if (!snapshot.exists()) {
    throw new Error(`Project "${projectId}" not found.`);
  }

  const currentProject = snapshot.val();

  const protectedFields = ['name', 'createdAt', 'createdBy'];
  for (const field of protectedFields) {
    if (field in updates) {
      throw new Error(`Cannot update protected field: "${field}". Use project rename feature in UI if needed.`);
    }
  }

  const cleanUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  }

  if (cleanUpdates.version && cleanUpdates.version !== currentProject.version) {
    const newVersion = cleanUpdates.version;
    const changes = cleanUpdates.changelogEntry || cleanUpdates.changes || [];
    const changelogEntry = {
      version: newVersion,
      date: new Date().toISOString().split('T')[0],
      changes: Array.isArray(changes) ? changes : [changes],
      updatedBy: getMcpUserId()
    };

    const existingChangelog = currentProject.changelog || [];
    cleanUpdates.changelog = [changelogEntry, ...existingChangelog];

    delete cleanUpdates.changelogEntry;
    delete cleanUpdates.changes;
  }

  // Ensure developers exist in /data/developers (global collection)
  if (cleanUpdates.developers && Array.isArray(cleanUpdates.developers)) {
    for (const dev of cleanUpdates.developers) {
      if (dev && typeof dev === 'object' && dev.id && dev.id.startsWith('dev_')) {
        const devRef = db.ref(`/data/developers/${dev.id}`);
        const devSnapshot = await devRef.once('value');
        if (!devSnapshot.exists()) {
          await devRef.set({
            name: dev.name || '',
            email: dev.email || '',
            active: true
          });
        }
      }
    }
  }

  // Ensure stakeholders exist in /data/stakeholders (global collection)
  if (cleanUpdates.stakeholders && Array.isArray(cleanUpdates.stakeholders)) {
    for (const stk of cleanUpdates.stakeholders) {
      if (stk && typeof stk === 'object' && stk.id && stk.id.startsWith('stk_')) {
        const stkRef = db.ref(`/data/stakeholders/${stk.id}`);
        const stkSnapshot = await stkRef.once('value');
        if (!stkSnapshot.exists()) {
          await stkRef.set({
            name: stk.name || '',
            email: stk.email || '',
            active: true
          });
        }
      }
    }
  }

  // Auto-generate publicToken when set to "generate" or true
  if (cleanUpdates.publicToken === 'generate' || cleanUpdates.publicToken === true) {
    const { randomUUID } = await import('crypto');
    cleanUpdates.publicToken = randomUUID();
  }

  cleanUpdates.updatedAt = new Date().toISOString();
  cleanUpdates.updatedBy = getMcpUserId();

  await projectRef.update(cleanUpdates);
  invalidateProjectCache();

  const updatedSnapshot = await projectRef.once('value');
  const updatedProject = updatedSnapshot.val();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: 'Project updated successfully',
        project: {
          id: projectId,
          ...updatedProject
        }
      }, null, 2)
    }]
  };
}

const DEFAULT_DEVELOPERS = ['dev_010', 'dev_016'];
const DEFAULT_STAKEHOLDERS = ['stk_014'];

async function resolveDefaultTeam(db) {
  const warnings = [];

  const developers = [];
  for (const devId of DEFAULT_DEVELOPERS) {
    const devSnapshot = await db.ref(`/data/developers/${devId}`).once('value');
    const devData = devSnapshot.val();
    if (devData) {
      developers.push({ id: devId, name: devData.name || '', email: devData.email || '' });
    } else {
      warnings.push({ code: 'DEFAULT_MEMBER_NOT_FOUND', message: `Default developer "${devId}" not found in /data/developers` });
    }
  }

  const stakeholders = [];
  for (const stkId of DEFAULT_STAKEHOLDERS) {
    const stkSnapshot = await db.ref(`/data/stakeholders/${stkId}`).once('value');
    const stkData = stkSnapshot.val();
    if (stkData) {
      stakeholders.push(stkId);
    } else {
      warnings.push({ code: 'DEFAULT_MEMBER_NOT_FOUND', message: `Default stakeholder "${stkId}" not found in /data/stakeholders` });
    }
  }

  return { developers, stakeholders, warnings };
}

export async function createProject({ projectId, name, abbreviation, description, version, scoringSystem, repoUrl, languages, frameworks }) {
  const db = getDatabase();
  const firestore = getFirestore();
  const projectRef = db.ref(`/projects/${projectId}`);
  const mcpUserId = getMcpUserId();

  const snapshot = await projectRef.once('value');
  if (snapshot.exists()) {
    throw new Error(`Project "${projectId}" already exists.`);
  }

  const { developers, stakeholders, warnings } = await resolveDefaultTeam(db);

  const mcpUser = getMcpUser();
  if (mcpUser && mcpUser.developerId) {
    const alreadyInList = developers.some(d => d.id === mcpUser.developerId);
    if (!alreadyInList) {
      const devSnapshot = await db.ref(`/data/developers/${mcpUser.developerId}`).once('value');
      const devData = devSnapshot.val();
      if (devData) {
        developers.push({ id: mcpUser.developerId, name: devData.name || mcpUser.name || '', email: devData.email || mcpUser.email || '' });
      } else {
        developers.push({ id: mcpUser.developerId, name: mcpUser.name || '', email: mcpUser.email || '' });
      }
    }
  }

  const project = {
    name,
    abbreviation,
    description: description || null,
    version: version || '1.0.0',
    changelog: version ? [{
      version: version,
      date: new Date().toISOString().split('T')[0],
      changes: ['Initial release'],
      updatedBy: mcpUserId
    }] : [],
    scoringSystem: scoringSystem || '1-5',
    repoUrl: repoUrl || null,
    languages: languages || [],
    frameworks: frameworks || [],
    developers,
    stakeholders,
    iaEnabled: true,
    allowExecutables: false,
    archived: false,
    createdAt: new Date().toISOString(),
    createdBy: mcpUserId
  };

  await projectRef.set(project);
  invalidateProjectCache();

  const epicSectionPath = buildSectionPath(projectId, 'epic');
  const sectionAbbr = getAbbrId(SECTION_MAP['epic']);
  const counterKey = `${abbreviation}-${sectionAbbr}`;
  const counterRef = firestore.collection('projectCounters').doc(counterKey);

  const epicId = await firestore.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(counterRef);
    let lastId = 0;
    if (docSnap.exists) {
      lastId = docSnap.data().lastId || 0;
    }
    const newId = lastId + 1;
    transaction.set(counterRef, { lastId: newId }, { merge: true });
    return `${counterKey}-${newId.toString().padStart(4, '0')}`;
  });

  const epicRef = db.ref(epicSectionPath).push();
  await epicRef.set({
    cardId: epicId,
    cardType: 'epic-card',
    group: 'epics',
    projectId,
    title: '[MANTENIMIENTO]',
    description: 'Épica por defecto para tareas de mantenimiento del proyecto.',
    status: 'To Do',
    priority: 'Medium',
    year: new Date().getFullYear(),
    createdAt: new Date().toISOString(),
    createdBy: mcpUserId,
    firebaseId: epicRef.key
  });

  const response = {
    message: 'Project created successfully',
    projectId,
    project,
    defaultEpic: {
      cardId: epicId,
      title: '[MANTENIMIENTO]'
    }
  };

  if (warnings.length > 0) {
    response.warnings = warnings;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }]
  };
}

export async function discoverProject({ repoUrl }) {
  const result = await discoverProjectByRepo(repoUrl);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        projectId: result.resolvedId,
        name: result.project.name || result.resolvedId,
        abbreviation: result.project.abbreviation || null,
        repoUrl: result.project.repoUrl || null,
        message: `Project found: "${result.resolvedId}" matches repository URL "${repoUrl}".`
      }, null, 2)
    }]
  };
}

function extractDevelopers(developers) {
  if (!developers) return [];

  if (Array.isArray(developers)) {
    return developers.map(d => ({ id: d.id || null, name: d.name, email: d.email }));
  }

  return Object.entries(developers).map(([key, value]) => {
    if (typeof value === 'string') {
      return { id: null, name: key, email: value };
    }
    return { id: value.id || null, name: value.name || key, email: value.email || '' };
  });
}

function extractStakeholders(stakeholders) {
  if (!stakeholders) return [];

  if (Array.isArray(stakeholders)) {
    return stakeholders.map(s => ({ id: s.id || null, name: s.name, email: s.email }));
  }

  return Object.entries(stakeholders).map(([key, value]) => {
    if (typeof value === 'string') {
      return { id: null, name: key, email: value };
    }
    return { id: value.id || null, name: value.name || key, email: value.email || '' };
  });
}

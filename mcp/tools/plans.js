import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';
import { getMcpUserId } from '../user.js';

const VALID_PLAN_STATUSES = ['draft', 'accepted', 'rejected'];

// ── Schemas ──

export const listPlansSchema = z.object({
  projectId: z.string().describe('Project ID (e.g., "PlanningGame", "Cinema4D")'),
  status: z.string().optional().describe('Filter by status: draft, accepted, rejected')
});

export const getPlanSchema = z.object({
  projectId: z.string().describe('Project ID'),
  planId: z.string().describe('Plan ID (the Firebase key)')
});

export const createPlanSchema = z.object({
  projectId: z.string().describe('Project ID'),
  title: z.string().describe('Plan title (max 150 chars)'),
  objective: z.string().optional().describe('Plan objective (max 500 chars)'),
  proposalId: z.string().optional().describe('Plan Proposal ID to link this plan to (auto-updates the proposal planIds)'),
  phases: z.array(z.object({
    name: z.string().describe('Phase name (max 150 chars)'),
    description: z.string().optional().describe('Phase description (max 500 chars)'),
    tasks: z.array(z.object({
      title: z.string().describe('Task title (max 150 chars)'),
      como: z.string().optional().describe('User role - "As a..."'),
      quiero: z.string().optional().describe('Goal - "I want..."'),
      para: z.string().optional().describe('Benefit - "So that..."')
    })).optional().describe('Tasks proposed for this phase')
  })).optional().describe('Plan phases with tasks')
});

export const updatePlanSchema = z.object({
  projectId: z.string().describe('Project ID'),
  planId: z.string().describe('Plan ID (the Firebase key)'),
  updates: z.record(z.unknown()).describe('Fields to update (title, objective, status, phases)')
});

export const deletePlanSchema = z.object({
  projectId: z.string().describe('Project ID'),
  planId: z.string().describe('Plan ID (the Firebase key)')
});

// ── Handlers ──

export async function listPlans({ projectId, status }) {
  const db = getDatabase();
  const snapshot = await db.ref(`plans/${projectId}`).once('value');
  const data = snapshot.val();

  if (!data) {
    return { content: [{ type: 'text', text: `No development plans found for project "${projectId}".` }] };
  }

  let plans = Object.entries(data).map(([planId, plan]) => ({
    planId,
    ...plan
  }));

  if (status) {
    const normalizedStatus = status.toLowerCase().trim();
    if (!VALID_PLAN_STATUSES.includes(normalizedStatus)) {
      return { content: [{ type: 'text', text: `Invalid status "${status}". Valid values: ${VALID_PLAN_STATUSES.join(', ')}` }] };
    }
    plans = plans.filter(p => p.status === normalizedStatus);
  }

  plans.sort((a, b) => {
    const order = { draft: 0, accepted: 1, rejected: 2 };
    const sa = order[a.status] ?? 99;
    const sb = order[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });

  const summary = plans.map(p => {
    const phaseCount = (p.phases || []).length;
    const taskCount = (p.phases || []).reduce((sum, ph) => sum + (ph.tasks || []).length, 0);
    const generatedCount = (p.generatedTasks || []).length;
    return {
      planId: p.planId,
      title: p.title,
      status: p.status,
      phases: phaseCount,
      proposedTasks: taskCount,
      generatedTasks: generatedCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      createdBy: p.createdBy
    };
  });

  return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
}

export async function getPlan({ projectId, planId }) {
  const db = getDatabase();
  const snapshot = await db.ref(`plans/${projectId}/${planId}`).once('value');

  if (!snapshot.exists()) {
    return { content: [{ type: 'text', text: `Plan "${planId}" not found in project "${projectId}".` }] };
  }

  const plan = { planId, ...snapshot.val() };

  return { content: [{ type: 'text', text: JSON.stringify(plan, null, 2) }] };
}

export async function createPlan({ projectId, title, objective, proposalId, phases }) {
  if (!title || title.trim().length === 0) {
    throw new Error('title is required and must be a non-empty string');
  }

  const db = getDatabase();

  // Verify project exists
  const projectSnap = await db.ref(`projects/${projectId}`).once('value');
  if (!projectSnap.exists()) {
    throw new Error(`Project "${projectId}" not found`);
  }

  const now = new Date().toISOString();
  const createdBy = getMcpUserId();

  // Validate proposalId if provided
  if (proposalId) {
    const proposalSnap = await db.ref(`planProposals/${projectId}/${proposalId}`).once('value');
    if (!proposalSnap.exists()) {
      throw new Error(`Plan proposal "${proposalId}" not found in project "${projectId}"`);
    }
  }

  const planData = {
    title: title.trim().slice(0, 150),
    objective: (objective || '').trim().slice(0, 500),
    status: 'draft',
    phases: (phases || []).map(p => ({
      name: (p.name || '').trim().slice(0, 150),
      description: (p.description || '').trim().slice(0, 500),
      tasks: (p.tasks || []).map(t => ({
        title: (t.title || '').trim().slice(0, 150),
        como: (t.como || '').trim().slice(0, 300),
        quiero: (t.quiero || '').trim().slice(0, 500),
        para: (t.para || '').trim().slice(0, 300)
      })),
      epicIds: [],
      taskIds: [],
      status: 'pending'
    })),
    createdAt: now,
    updatedAt: now,
    createdBy
  };

  if (proposalId) {
    planData.proposalId = proposalId;
  }

  const newRef = db.ref(`plans/${projectId}`).push();
  await newRef.set(planData);

  // Auto-add planId to proposal's planIds array
  if (proposalId) {
    const proposalRef = db.ref(`planProposals/${projectId}/${proposalId}`);
    const proposalSnap = await proposalRef.once('value');
    const proposal = proposalSnap.val();
    const currentPlanIds = proposal.planIds || [];
    if (!currentPlanIds.includes(newRef.key)) {
      await proposalRef.update({
        planIds: [...currentPlanIds, newRef.key],
        updatedAt: now,
        updatedBy: createdBy
      });
    }
  }

  const totalTasks = planData.phases.reduce((sum, p) => sum + p.tasks.length, 0);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: `Plan created successfully`,
        planId: newRef.key,
        title: planData.title,
        status: 'draft',
        phases: planData.phases.length,
        totalTasks,
        proposalId: proposalId || null
      }, null, 2)
    }]
  };
}

export async function updatePlan({ projectId, planId, updates }) {
  const db = getDatabase();
  const planRef = db.ref(`plans/${projectId}/${planId}`);
  const snapshot = await planRef.once('value');

  if (!snapshot.exists()) {
    throw new Error(`Plan "${planId}" not found in project "${projectId}"`);
  }

  const existing = snapshot.val();

  // Validate status if being updated
  if (updates.status) {
    const normalizedStatus = updates.status.toLowerCase().trim();
    if (!VALID_PLAN_STATUSES.includes(normalizedStatus)) {
      throw new Error(`Invalid status "${updates.status}". Valid values: ${VALID_PLAN_STATUSES.join(', ')}`);
    }
    updates.status = normalizedStatus;
  }

  // Protect certain fields
  const protectedFields = ['createdAt', 'createdBy', 'generatedTasks'];
  for (const field of protectedFields) {
    if (field in updates) {
      delete updates[field];
    }
  }

  // Truncate string fields
  if (updates.title) updates.title = updates.title.trim().slice(0, 150);
  if (updates.objective) updates.objective = updates.objective.trim().slice(0, 500);

  // Validate phases if provided
  if (updates.phases && Array.isArray(updates.phases)) {
    updates.phases = updates.phases.map(p => ({
      name: (p.name || '').trim().slice(0, 150),
      description: (p.description || '').trim().slice(0, 500),
      tasks: (p.tasks || []).map(t => ({
        title: (t.title || '').trim().slice(0, 150),
        como: (t.como || '').trim().slice(0, 300),
        quiero: (t.quiero || '').trim().slice(0, 500),
        para: (t.para || '').trim().slice(0, 300)
      })),
      epicIds: p.epicIds || [],
      taskIds: p.taskIds || [],
      status: p.status || 'pending'
    }));
  }

  updates.updatedAt = new Date().toISOString();
  updates.updatedBy = getMcpUserId();

  await planRef.update(updates);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: `Plan "${planId}" updated successfully`,
        planId,
        updatedFields: Object.keys(updates)
      }, null, 2)
    }]
  };
}

export async function deletePlan({ projectId, planId }) {
  const db = getDatabase();
  const planRef = db.ref(`plans/${projectId}/${planId}`);
  const snapshot = await planRef.once('value');

  if (!snapshot.exists()) {
    throw new Error(`Plan "${planId}" not found in project "${projectId}"`);
  }

  const plan = snapshot.val();

  // Move to trash
  const trashRef = db.ref(`plans-trash/${projectId}/${planId}`);
  await trashRef.set({
    ...plan,
    deletedAt: new Date().toISOString(),
    deletedBy: getMcpUserId()
  });

  await planRef.remove();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: `Plan "${planId}" deleted (moved to trash)`,
        planId,
        title: plan.title
      }, null, 2)
    }]
  };
}

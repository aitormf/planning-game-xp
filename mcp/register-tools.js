import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { listProjectsSchema, listProjects, getProjectSchema, getProject, updateProjectSchema, updateProject, createProjectSchema, createProject } from './tools/projects.js';
import { listCardsSchema, getCardSchema, createCardSchema, updateCardSchema, relateCardsSchema, getTransitionRulesSchema, listCards, getCard, createCard, updateCard, relateCards, getTransitionRules } from './tools/cards.js';
import { listSprintsSchema, listSprints, createSprintSchema, createSprint, updateSprintSchema, updateSprint, getSprintSchema, getSprint } from './tools/sprints.js';
import { listDevelopersSchema, listDevelopers } from './tools/developers.js';
import { listStakeholdersSchema, listStakeholders } from './tools/stakeholders.js';
import { listAdrsSchema, listAdrs, getAdrSchema, getAdr, createAdrSchema, createAdr, updateAdrSchema, updateAdr, deleteAdrSchema, deleteAdr } from './tools/adrs.js';
import { listPlansSchema, listPlans, getPlanSchema, getPlan, createPlanSchema, createPlan, updatePlanSchema, updatePlan, deletePlanSchema, deletePlan } from './tools/plans.js';
import { listGlobalConfigSchema, listGlobalConfig, getGlobalConfigSchema, getGlobalConfig, createGlobalConfigSchema, createGlobalConfig, updateGlobalConfigSchema, updateGlobalConfig, deleteGlobalConfigSchema, deleteGlobalConfig } from './tools/global-config.js';
import { setupMcpUserSchema, setupMcpUser } from './tools/setup-user.js';
import { checkForUpdates, getUpdateNoticeOnce, getMcpStatus, getLocalVersion, updateMcp, resetNotificationFlag, setLatestVersionInFirebase } from './version-check.js';
import { USAGE_RULES_CONTENT } from './usage-rules.js';
import { isMcpUserConfigured } from './user.js';

// Track calls for periodic update checks
let callCount = 0;
let lastCheckTime = Date.now();
const CHECK_INTERVAL_CALLS = 20;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

/**
 * Wrap tool handler to include update notice and user configuration warnings.
 */
function wrapWithUpdateNotice(handler) {
  return async (params) => {
    callCount++;

    const now = Date.now();
    const shouldCheck = (callCount % CHECK_INTERVAL_CALLS === 0) ||
                        (now - lastCheckTime > CHECK_INTERVAL_MS);

    if (shouldCheck) {
      lastCheckTime = now;
      resetNotificationFlag();
      await checkForUpdates(true);
    }

    const result = await handler(params);
    const updateNotice = getUpdateNoticeOnce();

    if (updateNotice && result.content && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent.type === 'text') {
        result.content[0] = {
          type: 'text',
          text: `${updateNotice}\n\n---\n\n${firstContent.text}`
        };
      }
    }

    // Add USER_NOT_CONFIGURED warning if mcp.user.json is missing
    if (!isMcpUserConfigured() && result.content && result.content.length > 0) {
      const parsed = safeJsonParse(result.content[0].text);
      if (parsed) {
        if (!parsed.warnings) parsed.warnings = [];
        parsed.warnings.push({
          code: 'USER_NOT_CONFIGURED',
          message: 'MCP user is not configured. Run setup_mcp_user to configure your identity. This enables auto-assignment of validator, correct createdBy/updatedBy tracking, and more.'
        });
        result.content[0] = { type: 'text', text: JSON.stringify(parsed, null, 2) };
      }
    }

    return result;
  };
}

/**
 * Create and configure a McpServer with all tools and resources registered.
 * @param {string} serverName - Name for the MCP server instance
 * @returns {McpServer}
 */
export function createMcpServer(serverName) {
  const server = new McpServer({
    name: serverName || 'planning-gamexp',
    version: getLocalVersion()
  });

  // ── Project tools ──
  server.tool('list_projects', 'List all projects with name, abbreviation, and developers', listProjectsSchema.shape, wrapWithUpdateNotice(async () => {
    return await listProjects();
  }));

  server.tool('get_project', 'Get full details of a project including description, repos, languages, frameworks, and team', getProjectSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await getProject(params);
  }));

  server.tool('update_project', 'Update fields of an existing project (description, repoUrl, languages, frameworks, agentsGuidelines, etc.)', updateProjectSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await updateProject(params);
  }));

  server.tool('create_project', 'Create a new project with name, abbreviation, and optional settings', createProjectSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await createProject(params);
  }));

  // ── Card tools ──
  server.tool('list_cards', 'List cards of a project filtered by type, status, sprint, developer, or year', listCardsSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await listCards(params);
  }));

  server.tool('get_card', 'Get full details of a card by its cardId', getCardSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await getCard(params);
  }));

  server.tool('create_card', 'Create a new card (task, bug, epic, or proposal) with auto-generated ID', createCardSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await createCard(params);
  }));

  server.tool('update_card', 'Update fields of an existing card', updateCardSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await updateCard(params);
  }));

  server.tool('relate_cards', 'Create or remove relations between cards (related, blocks/blockedBy)', relateCardsSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await relateCards(params);
  }));

  server.tool('get_transition_rules', 'Get status transition rules for cards. Call this BEFORE attempting status updates to understand requirements.', getTransitionRulesSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await getTransitionRules(params);
  }));

  // ── Sprint tools ──
  server.tool('list_sprints', 'List sprints of a project with dates and points', listSprintsSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await listSprints(params);
  }));

  server.tool('get_sprint', 'Get full details of a sprint by its cardId', getSprintSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await getSprint(params);
  }));

  server.tool('create_sprint', 'Create a new sprint with start and end dates', createSprintSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await createSprint(params);
  }));

  server.tool('update_sprint', 'Update fields of an existing sprint', updateSprintSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await updateSprint(params);
  }));

  // ── Team tools ──
  server.tool('list_developers', 'List all developers with name and email', listDevelopersSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await listDevelopers(params);
  }));

  server.tool('list_stakeholders', 'List all stakeholders with name and email', listStakeholdersSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await listStakeholders(params);
  }));

  // ── ADR tools ──
  server.tool('list_adrs', 'List all ADRs for a project', listAdrsSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await listAdrs(params);
  }));

  server.tool('get_adr', 'Get full details of an ADR', getAdrSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await getAdr(params);
  }));

  server.tool('create_adr', 'Create a new ADR (Architecture Decision Record)', createAdrSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await createAdr(params);
  }));

  server.tool('update_adr', 'Update an existing ADR', updateAdrSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await updateAdr(params);
  }));

  server.tool('delete_adr', 'Delete an ADR (moves to trash)', deleteAdrSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await deleteAdr(params);
  }));

  // ── Development Plans tools ──
  server.tool('list_plans', 'List development plans for a project, optionally filtered by status (draft, accepted, rejected)', listPlansSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await listPlans(params);
  }));

  server.tool('get_plan', 'Get full details of a development plan including phases and proposed tasks', getPlanSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await getPlan(params);
  }));

  server.tool('create_plan', 'Create a new development plan with phases and proposed tasks', createPlanSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await createPlan(params);
  }));

  server.tool('update_plan', 'Update a development plan (title, objective, status, phases)', updatePlanSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await updatePlan(params);
  }));

  server.tool('delete_plan', 'Delete a development plan (moves to trash)', deletePlanSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await deletePlan(params);
  }));

  // ── Global Config tools ──
  server.tool('list_global_config', 'List all global configs of a type (agents, prompts, instructions)', listGlobalConfigSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await listGlobalConfig(params);
  }));

  server.tool('get_global_config', 'Get full details of a global config', getGlobalConfigSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await getGlobalConfig(params);
  }));

  server.tool('create_global_config', 'Create a new global config (agent, prompt, or instruction)', createGlobalConfigSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await createGlobalConfig(params);
  }));

  server.tool('update_global_config', 'Update an existing global config', updateGlobalConfigSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await updateGlobalConfig(params);
  }));

  server.tool('delete_global_config', 'Delete a global config (moves to trash)', deleteGlobalConfigSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await deleteGlobalConfig(params);
  }));

  // ── MCP Status & Update tools ──
  const getMcpStatusSchema = z.object({});
  server.tool('get_mcp_status', 'Get MCP server status including version and update availability', getMcpStatusSchema.shape, async () => {
    const status = await getMcpStatus();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(status, null, 2)
      }]
    };
  });

  const updateMcpSchema = z.object({});
  server.tool('update_mcp', 'Update MCP server to latest version (git pull). Requires session restart after update.', updateMcpSchema.shape, async () => {
    const result = await updateMcp();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  });

  const publishMcpVersionSchema = z.object({
    version: z.string().optional().describe('Version to publish. If not provided, uses current local version from package.json')
  });
  server.tool('publish_mcp_version', 'Publish MCP version to Firebase so other users get update notifications. Call after pushing changes.', publishMcpVersionSchema.shape, async (params) => {
    const version = params.version || getLocalVersion();
    const success = await setLatestVersionInFirebase(version);

    if (success) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Versión v${version} publicada en Firebase. Los usuarios serán notificados de la actualización.`,
            version
          }, null, 2)
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Error al publicar la versión en Firebase. Verifica la conexión.'
          }, null, 2)
        }]
      };
    }
  });

  // ── User Setup tool ──
  server.tool('setup_mcp_user', 'Configure MCP user identity. Without params: lists developers. With developerId: creates mcp.user.json with user info and matching stakeholder.', setupMcpUserSchema.shape, wrapWithUpdateNotice(async (params) => {
    return await setupMcpUser(params);
  }));

  // ── Usage Rules resource ──
  server.resource(
    'usage-rules',
    'mcp://planning-game/usage-rules',
    {
      name: 'Planning Game Usage Rules',
      description: 'Rules and guidelines for using Planning Game MCP correctly',
      mimeType: 'text/markdown'
    },
    async () => ({
      contents: [{
        uri: 'mcp://planning-game/usage-rules',
        mimeType: 'text/markdown',
        text: USAGE_RULES_CONTENT
      }]
    })
  );

  return server;
}

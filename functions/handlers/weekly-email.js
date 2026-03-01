/**
 * Handler for weekly task summary email Cloud Function.
 * Extracted from functions/index.js during monolith refactor.
 *
 * Sends consolidated weekly task summaries to team members,
 * grouped by user with per-project breakdowns.
 */
'use strict';

const { extractEmails, resolveEmail, resolveName, normalizeEmail } = require('../shared/email-utils.cjs');

/**
 * Analyze tasks from past sprints and categorize them by status.
 * @param {object} tasks - Tasks keyed by Firebase ID
 * @param {object} sprints - Sprints keyed by Firebase ID
 * @returns {object} Task summary with categorized arrays
 */
function analyzeTasks(tasks, sprints) {
  const taskSummary = {
    todoTasks: [],
    inProgressTasks: [],
    incompleteCompletedTasks: [],
    blockedTasks: [],
    toValidateTasks: [],
    sprintSummary: []
  };

  // Get past sprints (ended before today)
  const today = new Date();
  const pastSprints = Object.values(sprints || {}).filter(sprint => {
    if (!sprint.endDate && !sprint.estimatedEndDate) return false;
    const endDate = new Date(sprint.endDate || sprint.estimatedEndDate);
    return endDate < today;
  });

  const pastSprintIds = pastSprints.map(sprint => sprint.cardId || sprint.id);
  taskSummary.sprintSummary = pastSprints.map(sprint => sprint.title || sprint.cardId || 'Sin nombre');

  // Analyze each task
  Object.values(tasks || {}).forEach(task => {
    // Skip deleted tasks
    if (task.deletedAt) return;

    // Only include tasks from past sprints
    if (!task.sprint || !pastSprintIds.includes(task.sprint)) return;

    const status = (task.status || '').toLowerCase().trim();

    // Check for missing required fields in completed tasks
    const requiredFields = ['startDate', 'endDate', 'epic', 'developer'];
    const missingFields = requiredFields.filter(field => !task[field]);

    switch (status) {
      case 'todo':
      case 'to do':
      case 'pending':
        taskSummary.todoTasks.push({
          ...task,
          missingFields: missingFields.length > 0 ? missingFields : null
        });
        break;

      case 'in progress':
      case 'in-progress':
      case 'working':
        taskSummary.inProgressTasks.push({
          ...task,
          missingFields: missingFields.length > 0 ? missingFields : null
        });
        break;

      case 'done':
      case 'completed':
        // Only include if has missing fields
        if (missingFields.length > 0) {
          taskSummary.incompleteCompletedTasks.push({
            ...task,
            missingFields
          });
        }
        break;

      case 'blocked':
        taskSummary.blockedTasks.push({
          ...task,
          blockReason: task.blockReason || task.reason || 'Sin razón especificada',
          missingFields: missingFields.length > 0 ? missingFields : null
        });
        break;

      case 'to validate':
      case 'validation':
      case 'review':
        taskSummary.toValidateTasks.push({
          ...task,
          missingFields: missingFields.length > 0 ? missingFields : null
        });
        break;
    }
  });

  return taskSummary;
}

/**
 * Analyze ALL pending tasks for a user (not just past sprints).
 * Used for consolidated weekly emails per user.
 * @param {object} tasks - Tasks keyed by Firebase ID
 * @returns {object} Task summary with categorized arrays
 */
function analyzeAllPendingTasks(tasks) {
  const taskSummary = {
    todoTasks: [],
    inProgressTasks: [],
    blockedTasks: [],
    toValidateTasks: []
  };

  Object.values(tasks || {}).forEach(task => {
    // Skip deleted tasks
    if (task.deletedAt) return;

    const status = (task.status || '').toLowerCase().trim();

    switch (status) {
      case 'todo':
      case 'to do':
      case 'pending':
        taskSummary.todoTasks.push(task);
        break;

      case 'in progress':
      case 'in-progress':
      case 'working':
        taskSummary.inProgressTasks.push(task);
        break;

      case 'blocked':
        taskSummary.blockedTasks.push({
          ...task,
          blockReason: task.blockReason || task.reason || 'Sin razón especificada'
        });
        break;

      case 'to validate':
      case 'validation':
      case 'review':
        taskSummary.toValidateTasks.push(task);
        break;
    }
  });

  return taskSummary;
}

/**
 * Generate HTML email template for a single project's task summary.
 * @param {string} projectName - Project name
 * @param {object} taskSummary - Categorized task summary
 * @returns {string} HTML email content
 */
function generateEmailTemplate(projectName, taskSummary) {
  const {
    todoTasks,
    inProgressTasks,
    incompleteCompletedTasks,
    blockedTasks,
    toValidateTasks,
    sprintSummary
  } = taskSummary;

  const formatTaskList = (tasks, includeReason = false) => {
    if (!tasks || tasks.length === 0) {
      return '<li style="color: #28a745;">Ninguna tarea pendiente ✅</li>';
    }

    return tasks.map(task => `
      <li>
        <strong>${task.title || 'Sin título'}</strong>
        ${task.sprint ? `<span style="color: #6c757d;">[Sprint: ${task.sprint}]</span>` : ''}
        ${task.developer ? `<span style="color: #007bff;">[Dev: ${task.developer}]</span>` : ''}
        ${includeReason && task.blockReason ? `<br><em style="color: #dc3545;">Razón: ${task.blockReason}</em>` : ''}
        ${task.missingFields ? `<br><em style="color: #ffc107;">Campos faltantes: ${task.missingFields.join(', ')}</em>` : ''}
      </li>
    `).join('');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumen Semanal de Tareas - ${projectName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; }
            .project-name { font-size: 24px; font-weight: bold; margin: 0; }
            .date { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .section { margin-bottom: 25px; }
            .section-title { color: #495057; font-size: 18px; font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #e9ecef; }
            .task-list { margin: 0; padding-left: 20px; }
            .task-list li { margin-bottom: 8px; }
            .sprint-summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; }
            .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
            .status-todo { background: #ffc107; color: #000; }
            .status-progress { background: #17a2b8; color: white; }
            .status-blocked { background: #dc3545; color: white; }
            .status-validate { background: #6f42c1; color: white; }
            .no-issues { color: #28a745; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="project-name">📊 Resumen Semanal - ${projectName}</div>
                <div class="date">Generado el: ${new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
            </div>

            <div class="sprint-summary">
                <h3>📈 Resumen de Sprints Anteriores</h3>
                <p>Este reporte incluye tareas de sprints que ya deberían estar completados pero aún tienen pendientes.</p>
                ${sprintSummary ? `<p><strong>Sprints analizados:</strong> ${sprintSummary.join(', ')}</p>` : ''}
            </div>

            <div class="section">
                <div class="section-title">⏳ Tareas Sin Comenzar <span class="status-badge status-todo">TODO</span></div>
                <ul class="task-list">
                    ${formatTaskList(todoTasks)}
                </ul>
            </div>

            <div class="section">
                <div class="section-title">🔄 Tareas En Progreso <span class="status-badge status-progress">IN PROGRESS</span></div>
                <ul class="task-list">
                    ${formatTaskList(inProgressTasks)}
                </ul>
            </div>

            <div class="section">
                <div class="section-title">⚠️ Tareas "Completadas" con Datos Faltantes <span class="status-badge status-todo">DONE</span></div>
                <ul class="task-list">
                    ${formatTaskList(incompleteCompletedTasks)}
                </ul>
            </div>

            <div class="section">
                <div class="section-title">🚫 Tareas Bloqueadas <span class="status-badge status-blocked">BLOCKED</span></div>
                <ul class="task-list">
                    ${formatTaskList(blockedTasks, true)}
                </ul>
            </div>

            ${toValidateTasks && toValidateTasks.length > 0 ? `
            <div class="section">
                <div class="section-title">✅ Tareas Esperando Validación <span class="status-badge status-validate">TO VALIDATE</span></div>
                <ul class="task-list">
                    ${formatTaskList(toValidateTasks)}
                </ul>
                <p><em>Nota: Este correo se envía específicamente a los stakeholders para revisión.</em></p>
            </div>
            ` : ''}

            <div class="footer">
                <p>Este es un correo automático generado por el sistema PlanningGameXP.</p>
                <p>Para consultas contacta con el equipo de desarrollo.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Generate consolidated HTML email template for a user with multiple projects.
 * @param {string} userName - User's name
 * @param {Array} projectsSummary - Array of project summaries
 * @returns {string} HTML email content
 */
function generateConsolidatedEmailTemplate(userName, projectsSummary) {
  // Calculate total stats
  let totalAssigned = 0;
  let totalTodo = 0;
  let totalInProgress = 0;
  let totalBlocked = 0;
  let totalToValidate = 0;

  for (const project of projectsSummary) {
    totalTodo += project.assigned.todo.length;
    totalInProgress += project.assigned.inProgress.length;
    totalBlocked += project.assigned.blocked.length;
    totalToValidate += project.toValidate.length;
  }
  totalAssigned = totalTodo + totalInProgress + totalBlocked;

  const formatTaskList = (tasks, projectId, includeReason = false) => {
    if (!tasks || tasks.length === 0) {
      return '<li style="color: #28a745;">Ninguna tarea pendiente ✅</li>';
    }

    if (!process.env.PUBLIC_APP_URL) {
      throw new Error('PUBLIC_APP_URL environment variable is required. Set it in functions/.env or Firebase Functions config.');
    }
    if (process.env.FUNCTIONS_EMULATOR !== 'true' && process.env.PUBLIC_APP_URL.includes('localhost')) {
      throw new Error('PUBLIC_APP_URL contains "localhost" in production. Fix the value in functions/.env.');
    }
    const baseUrl = process.env.PUBLIC_APP_URL;

    return tasks.map(task => {
      const taskUrl = `${baseUrl}/adminproject/?projectId=${encodeURIComponent(projectId)}&cardId=${encodeURIComponent(task.cardId)}#tasks`;
      return `
        <li>
          <a href="${taskUrl}" style="color: #667eea; text-decoration: none; font-weight: bold;">${task.title}</a>
          <span style="color: #999; font-size: 12px;">[${task.cardId}]</span>
          ${task.sprint ? `<span style="color: #6c757d; font-size: 12px;"> · Sprint: ${task.sprint}</span>` : ''}
          ${includeReason && task.blockReason ? `<br><em style="color: #dc3545; font-size: 12px;">⚠️ ${task.blockReason}</em>` : ''}
        </li>
      `;
    }).join('');
  };

  const renderProjectSection = (project) => {
    const hasAssignedTasks = project.assigned.todo.length > 0 ||
                            project.assigned.inProgress.length > 0 ||
                            project.assigned.blocked.length > 0;
    const hasValidationTasks = project.toValidate.length > 0;

    if (!hasAssignedTasks && !hasValidationTasks) return '';

    const totalProjectTasks = project.assigned.todo.length +
                              project.assigned.inProgress.length +
                              project.assigned.blocked.length;

    return `
      <div class="project-section">
        <div class="project-header">
          <span class="project-title">📁 ${project.projectName}</span>
          <span class="project-stats">
            Asignadas: <strong>${totalProjectTasks}</strong> ·
            Por validar: <strong>${project.toValidate.length}</strong> ·
            Bloqueadas: <strong>${project.assigned.blocked.length}</strong>
          </span>
        </div>

        ${hasAssignedTasks ? `
          <div class="task-category">
            ${project.assigned.todo.length > 0 ? `
              <div class="section">
                <div class="section-title">⏳ Sin Comenzar <span class="status-badge status-todo">${project.assigned.todo.length}</span></div>
                <ul class="task-list">${formatTaskList(project.assigned.todo, project.projectId)}</ul>
              </div>
            ` : ''}

            ${project.assigned.inProgress.length > 0 ? `
              <div class="section">
                <div class="section-title">🔄 En Progreso <span class="status-badge status-progress">${project.assigned.inProgress.length}</span></div>
                <ul class="task-list">${formatTaskList(project.assigned.inProgress, project.projectId)}</ul>
              </div>
            ` : ''}

            ${project.assigned.blocked.length > 0 ? `
              <div class="section">
                <div class="section-title">🚫 Bloqueadas <span class="status-badge status-blocked">${project.assigned.blocked.length}</span></div>
                <ul class="task-list">${formatTaskList(project.assigned.blocked, project.projectId, true)}</ul>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${hasValidationTasks ? `
          <div class="task-category">
            <div class="section">
              <div class="section-title">✅ Esperando tu Validación <span class="status-badge status-validate">${project.toValidate.length}</span></div>
              <ul class="task-list">${formatTaskList(project.toValidate, project.projectId)}</ul>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  const projectSections = projectsSummary
    .map(renderProjectSection)
    .filter(section => section.trim() !== '')
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumen Semanal de Tareas</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; }
            .greeting { font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .date { font-size: 12px; opacity: 0.8; margin-top: 10px; }
            .summary-line { background: #f8f9fa; padding: 12px 15px; border-radius: 8px; margin-bottom: 25px; font-size: 14px; color: #495057; }
            .summary-line strong { color: #667eea; font-size: 16px; }
            .project-section { margin-bottom: 25px; padding: 15px 20px; background: #fafafa; border-radius: 8px; border-left: 4px solid #667eea; }
            .project-header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e9ecef; }
            .project-title { font-size: 18px; font-weight: bold; color: #495057; }
            .project-stats { font-size: 13px; color: #6c757d; }
            .task-category { margin-bottom: 15px; }
            .section { margin-bottom: 12px; }
            .section-title { color: #495057; font-size: 13px; font-weight: bold; margin-bottom: 6px; }
            .task-list { margin: 0; padding-left: 20px; }
            .task-list li { margin-bottom: 8px; font-size: 14px; line-height: 1.4; }
            .task-list a { color: #667eea; text-decoration: none; }
            .task-list a:hover { text-decoration: underline; }
            .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; }
            .status-badge { padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-left: 5px; }
            .status-todo { background: #ffc107; color: #000; }
            .status-progress { background: #17a2b8; color: white; }
            .status-blocked { background: #dc3545; color: white; }
            .status-validate { background: #6f42c1; color: white; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="greeting">Hola ${userName},</div>
                <div class="subtitle">Aquí tienes tu resumen semanal de tareas</div>
                <div class="date">Generado el: ${new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
            </div>

            <div class="summary-line">
                📊 Proyectos: <strong>${projectsSummary.length}</strong> ·
                Tareas asignadas: <strong>${totalAssigned}</strong> ·
                Por validar: <strong>${totalToValidate}</strong> ·
                Bloqueadas: <strong>${totalBlocked}</strong>
            </div>

            ${projectSections}

            <div class="footer">
                <p>Este es un correo automático generado por el sistema PlanningGameXP.</p>
                <p>Para consultas contacta con el equipo de desarrollo.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Notify admin about missing email configuration for a project.
 * @param {string} projectId - Project ID
 * @param {string} accessToken - MS Graph access token
 * @param {object} deps - { sendEmail, logger }
 */
async function notifyAdminMissingConfiguration(projectId, accessToken, deps) {
  const { sendEmail, logger } = deps;
  const adminEmailContent = generateEmailTemplate(`⚠️ Configuración Faltante`, {
    todoTasks: [{
      title: `El proyecto "${projectId}" no tiene emails resolubles en /projects + /data`,
      developer: 'Admin',
      sprint: 'N/A'
    }],
    inProgressTasks: [],
    incompleteCompletedTasks: [],
    blockedTasks: [],
    toValidateTasks: [],
    sprintSummary: ['Configuración pendiente']
  });

  await sendEmail(
    accessToken,
    [process.env.PUBLIC_SUPER_ADMIN_EMAIL || 'admin@example.com'],
    `⚠️ Configuración de emails faltante para proyecto ${projectId}`,
    adminEmailContent
  );
}

/**
 * Check if task summary has any issues to report.
 * @param {object} taskSummary - Categorized task summary
 * @returns {boolean}
 */
function hasReportableIssues(taskSummary) {
  return taskSummary.todoTasks.length > 0 ||
         taskSummary.inProgressTasks.length > 0 ||
         taskSummary.incompleteCompletedTasks.length > 0 ||
         taskSummary.blockedTasks.length > 0 ||
         taskSummary.toValidateTasks.length > 0;
}

/**
 * Send weekly summary email to team members.
 * @param {string} accessToken - MS Graph access token
 * @param {string[]} emails - Team member emails
 * @param {string} projectName - Project name
 * @param {object} taskSummary - Categorized task summary
 * @param {string} projectId - Project ID
 * @param {object} deps - { sendEmail, logger }
 */
async function sendTeamSummaryEmail(accessToken, emails, projectName, taskSummary, projectId, deps) {
  const { sendEmail, logger } = deps;
  if (emails.length === 0) return;

  const emailContent = generateEmailTemplate(projectName, taskSummary);
  await sendEmail(
    accessToken,
    emails,
    `📊 Resumen Semanal de Tareas Pendientes - ${projectName}`,
    emailContent
  );
  logger.info(`Weekly summary sent to team for project ${projectId}`);
}

/**
 * Send validation tasks email to stakeholders.
 * @param {string} accessToken - MS Graph access token
 * @param {string[]} stakeholderEmails - Stakeholder emails
 * @param {string} projectName - Project name
 * @param {object} taskSummary - Categorized task summary
 * @param {string} projectId - Project ID
 * @param {object} deps - { sendEmail, logger }
 */
async function sendStakeholderValidationEmail(accessToken, stakeholderEmails, projectName, taskSummary, projectId, deps) {
  const { sendEmail, logger } = deps;
  if (taskSummary.toValidateTasks.length === 0 || stakeholderEmails.length === 0) return;

  const stakeholderEmailContent = generateEmailTemplate(
    `${projectName} - Tareas para Validación`,
    {
      todoTasks: [],
      inProgressTasks: [],
      incompleteCompletedTasks: [],
      blockedTasks: [],
      toValidateTasks: taskSummary.toValidateTasks,
      sprintSummary: taskSummary.sprintSummary
    }
  );

  await sendEmail(
    accessToken,
    stakeholderEmails,
    `✅ Tareas Esperando Validación - ${projectName}`,
    stakeholderEmailContent
  );
  logger.info(`Validation tasks email sent to stakeholders for project ${projectId}`);
}

/**
 * Process a single project for the weekly summary.
 * @param {string} projectId - Project ID
 * @param {object} project - Project data
 * @param {object} developersDirectory - Developers directory
 * @param {object} stakeholdersDirectory - Stakeholders directory
 * @param {string} accessToken - MS Graph access token
 * @param {object} deps - { db, sendEmail, logger }
 */
async function processProjectForWeeklySummary(projectId, project, developersDirectory, stakeholdersDirectory, accessToken, deps) {
  const { db, sendEmail, logger } = deps;
  logger.info(`Processing project: ${projectId}`);

  const developerEmails = extractEmails(project?.developers, developersDirectory);
  const stakeholderEmails = extractEmails(project?.stakeholders, stakeholdersDirectory);

  if (developerEmails.length === 0 && stakeholderEmails.length === 0) {
    logger.warn(`No team emails found for project ${projectId}, notifying admin`);
    await notifyAdminMissingConfiguration(projectId, accessToken, { sendEmail, logger });
    return;
  }

  const [tasksSnapshot, sprintsSnapshot] = await Promise.all([
    db.ref(`/cards/${projectId}/TASKS_${projectId}`).once('value'),
    db.ref(`/cards/${projectId}/SPRINTS_${projectId}`).once('value')
  ]);

  const tasks = tasksSnapshot.val() || {};
  const sprints = sprintsSnapshot.val() || {};
  const taskSummary = analyzeTasks(tasks, sprints);

  if (!hasReportableIssues(taskSummary)) {
    logger.info(`Project ${projectId} has no pending issues, skipping email`);
    return;
  }

  const projectName = project.name || projectId;
  await sendTeamSummaryEmail(accessToken, [...developerEmails], projectName, taskSummary, projectId, { sendEmail, logger });
  await sendStakeholderValidationEmail(accessToken, stakeholderEmails, projectName, taskSummary, projectId, { sendEmail, logger });
}

/**
 * Add a task to the user task map.
 * @param {Map} userTaskMap - Map of email -> user data
 * @param {string} email - User email
 * @param {string} projectId - Project ID
 * @param {string} projectName - Project name
 * @param {object} task - Task data
 * @param {string} taskType - Type of task for user: 'assigned' or 'toValidate'
 * @param {string} status - Task status category
 * @param {object} directories - Developer and stakeholder directories
 */
function addTaskToUserMap(userTaskMap, email, projectId, projectName, task, taskType, status, directories) {
  if (!email) return;

  const { developersDirectory, stakeholdersDirectory } = directories;
  const combinedDirectory = { ...developersDirectory, ...stakeholdersDirectory };

  if (!userTaskMap.has(email)) {
    // Determine user name from developer or stakeholder entry
    let userName = 'Usuario';
    const devEntry = Object.values(developersDirectory).find(d => normalizeEmail(d.email) === email);
    const stkEntry = Object.values(stakeholdersDirectory).find(s => normalizeEmail(s.email) === email);
    if (devEntry?.name) userName = devEntry.name;
    else if (stkEntry?.name) userName = stkEntry.name;
    else if (email.includes('@')) userName = email.split('@')[0];

    userTaskMap.set(email, {
      name: userName,
      email: email,
      projects: new Map()
    });
  }

  const userData = userTaskMap.get(email);

  if (!userData.projects.has(projectId)) {
    userData.projects.set(projectId, {
      projectId,
      projectName,
      assigned: { todo: [], inProgress: [], blocked: [] },
      toValidate: [],
      sprintSummary: []
    });
  }

  const projectData = userData.projects.get(projectId);

  const taskInfo = {
    cardId: task.cardId || task.id,
    title: task.title || 'Sin título',
    sprint: task.sprint,
    developer: task.developer ? resolveName(task.developer, combinedDirectory) : null,
    validator: task.validator ? resolveName(task.validator, combinedDirectory) : null,
    blockReason: task.blockReason || task.reason,
    missingFields: task.missingFields
  };

  if (taskType === 'assigned') {
    if (status === 'todo') {
      projectData.assigned.todo.push(taskInfo);
    } else if (status === 'inProgress') {
      projectData.assigned.inProgress.push(taskInfo);
    } else if (status === 'blocked') {
      projectData.assigned.blocked.push(taskInfo);
    }
  } else if (taskType === 'toValidate') {
    projectData.toValidate.push(taskInfo);
  }
}

/**
 * Helper: Add tasks from a list to the user map.
 * @param {Map} userTaskMap - The user task map to update
 * @param {Array} tasks - Array of tasks to process
 * @param {string} userField - Field name to get user (developer or validator)
 * @param {object} combinedDirectory - Combined developers/stakeholders directory
 * @param {string} projectId - Project ID
 * @param {string} projectName - Project name
 * @param {string} taskType - Task type (assigned or toValidate)
 * @param {string|null} status - Status for assigned tasks (todo, inProgress, blocked)
 * @param {object} directories - Directories object
 */
function processTasksForUserMap(userTaskMap, tasks, userField, combinedDirectory, projectId, projectName, taskType, status, directories) {
  for (const task of tasks) {
    const email = resolveEmail(task[userField], combinedDirectory);
    if (email) {
      addTaskToUserMap(userTaskMap, email, projectId, projectName, task, taskType, status, directories);
    }
  }
}

/**
 * Build a map of user -> tasks grouped by project.
 * @param {object} db - Firebase database reference
 * @param {object} projects - Projects data
 * @param {object} developersDirectory - Developers directory
 * @param {object} stakeholdersDirectory - Stakeholders directory
 * @param {object} deps - { logger }
 * @returns {Promise<Map>} Map of email -> user data with projects
 */
async function buildUserTaskMap(db, projects, developersDirectory, stakeholdersDirectory, deps) {
  const { logger } = deps;
  const userTaskMap = new Map();
  const directories = { developersDirectory, stakeholdersDirectory };
  const combinedDirectory = { ...developersDirectory, ...stakeholdersDirectory };

  for (const [projectId, project] of Object.entries(projects)) {
    try {
      const tasksSnapshot = await db.ref(`/cards/${projectId}/TASKS_${projectId}`).once('value');
      const tasks = tasksSnapshot.val() || {};
      const taskSummary = analyzeAllPendingTasks(tasks);
      const projectName = project.name || projectId;

      // Group tasks by developer (assigned tasks)
      processTasksForUserMap(userTaskMap, taskSummary.todoTasks, 'developer', combinedDirectory, projectId, projectName, 'assigned', 'todo', directories);
      processTasksForUserMap(userTaskMap, taskSummary.inProgressTasks, 'developer', combinedDirectory, projectId, projectName, 'assigned', 'inProgress', directories);
      processTasksForUserMap(userTaskMap, taskSummary.blockedTasks, 'developer', combinedDirectory, projectId, projectName, 'assigned', 'blocked', directories);

      // Group "To Validate" tasks by validator
      processTasksForUserMap(userTaskMap, taskSummary.toValidateTasks, 'validator', combinedDirectory, projectId, projectName, 'toValidate', null, directories);

    } catch (error) {
      logger.error(`Error processing project ${projectId} for user task map:`, error);
    }
  }

  return userTaskMap;
}

/**
 * Legacy function to send weekly task summary (per project).
 * @deprecated Use handleWeeklyEmail instead
 * @param {object} deps - { db, logger, getGraphAccessToken, sendEmail }
 * @returns {Promise<object>}
 */
async function sendWeeklyTaskSummaryLegacy(deps) {
  const { db, logger, getGraphAccessToken, sendEmail } = deps;
  try {
    logger.info('Starting weekly task summary process (legacy)...');

    const [projectsSnapshot, developersSnapshot, stakeholdersSnapshot] = await Promise.all([
      db.ref('/projects').once('value'),
      db.ref('/data/developers').once('value'),
      db.ref('/data/stakeholders').once('value')
    ]);
    const projects = projectsSnapshot.val() || {};
    const developersDirectory = developersSnapshot.val() || {};
    const stakeholdersDirectory = stakeholdersSnapshot.val() || {};

    const accessToken = await getGraphAccessToken();

    for (const [projectId, project] of Object.entries(projects)) {
      try {
        await processProjectForWeeklySummary(projectId, project, developersDirectory, stakeholdersDirectory, accessToken, { db, sendEmail, logger });
      } catch (error) {
        logger.error(`Error processing project ${projectId}:`, error);
      }
    }

    logger.info('Weekly task summary process completed successfully (legacy)');
    return { success: true, message: 'Weekly summaries sent successfully' };

  } catch (error) {
    logger.error('Error in weekly task summary process:', error);
    throw error;
  }
}

/**
 * Main handler: send weekly task summary per user (consolidated emails).
 * @param {object} deps - { db, logger, getGraphAccessToken, sendEmail }
 * @param {string} [filterEmail] - Optional email to filter (only send to this user)
 * @returns {Promise<object>}
 */
async function handleWeeklyEmail(deps, filterEmail = null) {
  const { db, logger, getGraphAccessToken, sendEmail } = deps;
  try {
    const filterInfo = filterEmail ? ` (filtered to: ${filterEmail})` : '';
    logger.info(`Starting weekly task summary process (per user)...${filterInfo}`);

    const [projectsSnapshot, developersSnapshot, stakeholdersSnapshot] = await Promise.all([
      db.ref('/projects').once('value'),
      db.ref('/data/developers').once('value'),
      db.ref('/data/stakeholders').once('value')
    ]);
    const projects = projectsSnapshot.val() || {};
    const developersDirectory = developersSnapshot.val() || {};
    const stakeholdersDirectory = stakeholdersSnapshot.val() || {};

    // Build map of user -> tasks grouped by project
    const userTaskMap = await buildUserTaskMap(db, projects, developersDirectory, stakeholdersDirectory, { logger });

    logger.info(`Found ${userTaskMap.size} users with tasks to notify`);

    if (userTaskMap.size === 0) {
      logger.info('No users with tasks to notify');
      return { success: true, message: 'No tasks to report', emailsSent: 0 };
    }

    const accessToken = await getGraphAccessToken();
    let emailsSent = 0;
    let emailsFailed = 0;

    // Normalize filter email for comparison
    const normalizedFilterEmail = filterEmail ? normalizeEmail(filterEmail) : null;

    for (const [email, userData] of userTaskMap) {
      // Skip if filter is set and this is not the target email
      if (normalizedFilterEmail && email !== normalizedFilterEmail) {
        continue;
      }

      try {
        // Convert projects Map to array
        const projectsArray = Array.from(userData.projects.values());

        // Check if user has any reportable tasks
        const hasReportableTasks = projectsArray.some(p =>
          p.assigned.todo.length > 0 ||
          p.assigned.inProgress.length > 0 ||
          p.assigned.blocked.length > 0 ||
          p.toValidate.length > 0
        );

        if (!hasReportableTasks) {
          logger.info(`User ${email} has no reportable tasks, skipping`);
          continue;
        }

        const emailContent = generateConsolidatedEmailTemplate(userData.name, projectsArray);
        const projectCount = projectsArray.length;
        const subject = projectCount === 1
          ? `📊 Resumen Semanal - ${projectsArray[0].projectName}`
          : `📊 Resumen Semanal - ${projectCount} proyectos`;

        await sendEmail(accessToken, [email], subject, emailContent);
        emailsSent++;
        logger.info(`Consolidated email sent to ${email} for ${projectCount} projects`);

      } catch (error) {
        emailsFailed++;
        logger.error(`Error sending email to ${email}:`, error);
      }
    }

    logger.info(`Weekly task summary process completed: ${emailsSent} emails sent, ${emailsFailed} failed`);
    return {
      success: true,
      message: 'Weekly summaries sent successfully',
      emailsSent,
      emailsFailed,
      totalUsers: userTaskMap.size
    };

  } catch (error) {
    logger.error('Error in weekly task summary per user process:', error);
    throw error;
  }
}

module.exports = {
  analyzeTasks,
  analyzeAllPendingTasks,
  generateEmailTemplate,
  generateConsolidatedEmailTemplate,
  notifyAdminMissingConfiguration,
  hasReportableIssues,
  sendTeamSummaryEmail,
  sendStakeholderValidationEmail,
  processProjectForWeeklySummary,
  addTaskToUserMap,
  processTasksForUserMap,
  buildUserTaskMap,
  sendWeeklyTaskSummaryLegacy,
  handleWeeklyEmail,
};

/**
 * Utility functions for Development Plans.
 * Extracted from adminproject.astro for testability.
 */

/**
 * Escape HTML attribute values to prevent XSS.
 * @param {string} str - The string to escape
 * @returns {string} Escaped string safe for HTML attributes
 */
export function escapeAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Collect tasks from phase task item DOM elements.
 * @param {Element} phaseRowEl - The .phase-row DOM element
 * @returns {Array<{title: string, como: string, quiero: string, para: string}>}
 */
export function collectPhaseTasks(phaseRowEl) {
  const tasks = [];
  phaseRowEl.querySelectorAll('.phase-task-item').forEach(taskEl => {
    const title = taskEl.querySelector('.phase-task-title').value.trim();
    if (!title) return;
    tasks.push({
      title,
      como: taskEl.querySelector('.phase-task-como').value.trim(),
      quiero: taskEl.querySelector('.phase-task-quiero').value.trim(),
      para: taskEl.querySelector('.phase-task-para').value.trim()
    });
  });
  return tasks;
}

/**
 * Collect full plan data from a plan form container.
 * @param {Element} container - The container with the plan form
 * @returns {{title: string, objective: string, status: string, phases: Array}}
 */
export function collectPlanFormData(container) {
  const title = container.querySelector('#planTitle').value.trim();
  const phases = [];
  container.querySelectorAll('.phase-row').forEach(row => {
    const name = row.querySelector('.phase-name').value.trim();
    if (!name) return;
    phases.push({
      name,
      description: row.querySelector('.phase-description').value.trim(),
      epicIds: [],
      taskIds: [],
      tasks: collectPhaseTasks(row),
      status: 'pending'
    });
  });
  return {
    title,
    objective: container.querySelector('#planObjective').value.trim(),
    status: 'draft',
    phases
  };
}

/**
 * Merge existing phase references (epicIds, taskIds) into form-collected phases.
 * Used when editing an existing plan to preserve generated references.
 * @param {Array} formPhases - Phases from collectPlanFormData
 * @param {Array} existingPhases - Phases from Firebase
 * @returns {Array} Merged phases
 */
export function mergePhaseReferences(formPhases, existingPhases) {
  if (!existingPhases) return formPhases;
  return formPhases.map((phase, i) => {
    const existing = existingPhases[i];
    if (existing) {
      phase.epicIds = existing.epicIds || [];
      phase.taskIds = existing.taskIds || [];
    }
    return phase;
  });
}

/**
 * Count total proposed tasks across all phases.
 * @param {Array} phases - Array of phase objects
 * @returns {number} Total task count
 */
export function countPlanTasks(phases) {
  return (phases || []).reduce((sum, p) => sum + (p.tasks || []).length, 0);
}

/**
 * Count generated tasks from plan (already created cards).
 * @param {Object} plan - The plan object
 * @returns {number} Count of generated tasks
 */
export function countGeneratedTasks(plan) {
  return (plan.generatedTasks || []).length;
}

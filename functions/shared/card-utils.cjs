/**
 * Card utility functions for Firebase Cloud Functions.
 * Extracted from functions/index.js during monolith refactor.
 *
 * Provides helpers for acceptance criteria text, user story text,
 * branch names, abbreviation IDs, card ID generation, and repo resolution.
 */
'use strict';

/**
 * Build human-readable acceptance criteria text from structured scenarios.
 * @param {Array<{given: string, when: string, then: string}>} scenarios
 * @returns {string}
 */
function buildAcceptanceText(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return '';
  }
  const parts = scenarios.map((scenario, index) => {
    const givenParts = (scenario.given || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    const thenParts = (scenario.then || '').split(/\n+/).map(s => s.trim()).filter(Boolean);

    const givenLines = givenParts.map((line, idx) => idx === 0 ? `Dado ${line}` : `Y ${line}`);
    const thenLines = thenParts.map((line, idx) => idx === 0 ? `Entonces ${line}` : `Y ${line}`);
    const whenLine = scenario.when ? `Cuando ${scenario.when}` : '';

    const allLines = [...givenLines, whenLine, ...thenLines].filter(Boolean);
    const title = scenarios.length > 1 ? `Escenario ${index + 1}:\n` : '';
    return `${title}${allLines.join('\n')}`;
  });
  return parts.filter(Boolean).join('\n\n');
}

/**
 * Build user story text from a task with descriptionStructured.
 * Format: "Como {role}\nQuiero {goal}\nPara {benefit}"
 * Falls back to legacy or description fields.
 * @param {object} task
 * @returns {string}
 */
function buildUserStoryText(task) {
  const entry = Array.isArray(task.descriptionStructured)
    ? (task.descriptionStructured[0] || {})
    : (task.descriptionStructured || {});
  const role = entry.role || '';
  const goal = entry.goal || '';
  const benefit = entry.benefit || '';
  const legacy = entry.legacy || '';

  const pieces = [
    role ? `Como ${role}` : '',
    goal ? `Quiero ${goal}` : '',
    benefit ? `Para ${benefit}` : ''
  ].filter(Boolean);
  if (pieces.length > 0) {
    return pieces.join('\n');
  }
  if (legacy) return legacy;
  return task.description || '';
}

/**
 * Build a git branch name from a task/card ID and title.
 * @param {string} taskId
 * @param {string} title
 * @returns {string}
 */
function buildBranchName(taskId, title) {
  const slug = (title || '')
    .toString()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '') // NOSONAR - simple non-capturing patterns
    .slice(0, 40);
  const normalizedId = (taskId || '').toString().replaceAll(/\s+/g, '');
  const slugSuffix = slug ? `-${slug}` : '';
  return `feature/${normalizedId}${slugSuffix}`;
}

/**
 * Generate an abbreviation ID for a project or section name.
 * Mirrors the frontend logic in firebase-service.js.
 * @param {string} wordToAbbr
 * @returns {string}
 */
function getAbbrId(wordToAbbr) {
  const upperWord = (wordToAbbr || '').toUpperCase().trim();

  // Exceptions
  if (upperWord === "BUGS") return 'BUG';
  if (upperWord === "CINEMA4D") return 'C4D';
  if (upperWord === "EXTRANET V1") return 'EX1';
  if (upperWord === "EXTRANET V2") return 'EX2';
  if (upperWord === "PLANNING-GAME") return 'PLN';
  if (upperWord === "PLANNINGGAMEXP") return 'PLN';

  // Rule 1: 3 chars or less, return as-is
  if (upperWord.length <= 3) return upperWord.padStart(3, '_');

  // Extract consonants and vowels
  const consonants = upperWord.replace(/[AEIOUÁÉÍÓÚÜ\s\d]/gi, '').split('');
  const vowels = upperWord.replace(/[^AEIOUÁÉÍÓÚÜ]/gi, '').split('');

  // Check for trailing number
  const matchNumber = upperWord.match(/\d+$/);
  const lastNumber = matchNumber ? matchNumber[0] : null;

  // Rule 2: Number at end + 3+ consonants
  if (lastNumber && consonants.length >= 3) {
    return consonants.slice(0, 2).join('') + lastNumber;
  }

  // Rule 3: 3+ consonants
  if (consonants.length >= 3) {
    return consonants.slice(0, 3).join('');
  }

  // Rule 4: 2 consonants + first vowel
  if (consonants.length === 2) {
    return consonants.join('') + (vowels[0] || '_');
  }

  // Rule 5: 1 consonant + first and last vowel
  if (consonants.length === 1) {
    return consonants[0] + (vowels[0] || '_') + (vowels[vowels.length - 1] || '_');
  }

  // Rule 6: No consonants, first 3 letters
  return upperWord.slice(0, 3);
}

/**
 * Generate a unique card ID using Firestore transaction.
 * Format: {PROJECT_ABBR}-{SECTION_ABBR}-{NUMBER}
 * Example: C4D-TSK-0042
 * @param {string} projectId
 * @param {string} section
 * @param {object} firestore - Firestore instance (injected)
 * @returns {Promise<string>}
 */
async function generateCardId(projectId, section, firestore) {
  const projectAbbr = getAbbrId(projectId);
  const sectionAbbr = getAbbrId(section);
  const counterKey = `${projectAbbr}-${sectionAbbr}`;

  const counterRef = firestore.collection('projectCounters').doc(counterKey);

  // Use transaction to ensure atomic increment
  const newId = await firestore.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(counterRef);

    let lastId = 0;
    if (docSnap.exists) {
      lastId = docSnap.data().lastId || 0;
    }

    const nextId = lastId + 1;
    transaction.set(counterRef, { lastId: nextId }, { merge: true });

    return nextId;
  });

  const paddedId = newId.toString().padStart(4, '0');
  return `${counterKey}-${paddedId}`;
}

/**
 * Resolve the repository URL and label for a task based on project config.
 * @param {object} project
 * @param {object} task
 * @returns {{url: string, label: string}}
 */
function getRepositoryForTask(project, task) {
  const repoUrl = project.repoUrl || project.repositoryUrl;

  // No repository configured
  if (!repoUrl) {
    return { url: '', label: '' };
  }

  // Single repository (string format)
  if (typeof repoUrl === 'string') {
    return { url: repoUrl, label: 'Default' };
  }

  // Multiple repositories (array format)
  if (Array.isArray(repoUrl) && repoUrl.length > 0) {
    const taskLabel = task.repositoryLabel;
    if (taskLabel) {
      const found = repoUrl.find(r => r.label === taskLabel);
      if (found) {
        return { url: found.url || '', label: found.label || '' };
      }
    }
    // No label or not found → use the first one (default)
    return { url: repoUrl[0]?.url || '', label: repoUrl[0]?.label || 'Default' };
  }

  return { url: '', label: '' };
}

/**
 * Check if a projects object has at least one project with developer or stakeholder = true.
 * @param {object} projects
 * @returns {boolean}
 */
function hasActiveProject(projects) {
  if (!projects || typeof projects !== 'object') return false;
  return Object.values(projects).some(p => p.developer === true || p.stakeholder === true);
}

module.exports = {
  buildAcceptanceText,
  buildUserStoryText,
  buildBranchName,
  getAbbrId,
  generateCardId,
  getRepositoryForTask,
  hasActiveProject,
};

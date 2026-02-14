import { FirebaseService } from './firebase-service.js';

/**
 * Service responsible for handling user story uploads from JSON payloads.
 * Keeps parsing, validation, and persistence concerns encapsulated so the UI
 * can remain focused on user interactions.
 */
class StoryUploadService {
  constructor() {
    this.validGroups = new Set(['tasks', 'TASKS']);
    this.validCardTypes = new Set(['task-card']);
  }

  /**
   * Parses an arbitrary JSON payload and returns upload-ready records.
   * The payload is expected to follow the structure produced by the realtime
   * database exports (cards grouped by project).
   *
   * @param {unknown} payload - Parsed JSON content.
   * @returns {{records: Array, summary: Object}} Parsed records and metadata.
   * @throws {Error} When no user stories can be extracted.
   */
  prepareRecords(payload) {
    const rawEntries = this._extractEntries(payload);
    const records = rawEntries.map((entry) => {
      const normalized = this._normalizeCard(entry.card, entry.context);
      const validationErrors = this._validateCard(normalized);
      return {
        card: normalized,
        source: entry.source,
        errors: validationErrors
      };
    });

    if (records.length === 0) {
      throw new Error('No se encontraron historias de usuario en el archivo.');
    }

    const summary = this._buildSummary(records);
    return { records, summary };
  }

  /**
   * Persists the provided user stories in Firebase using the existing
   * FirebaseService so history tracking and permissions remain centralised.
   *
   * @param {Array} records - Collection of records returned by prepareRecords.
   * @param {Object} [options]
   * @param {boolean} [options.silent=true] - Avoid UI slide notifications.
   * @returns {Promise<Object>} Operation result containing successes and errors.
   */
  async uploadStories(records, options = {}) {
    const validRecords = records.filter((record) => record.errors.length === 0);
    const uploadOptions = { silent: true, ...(options || {}) };
    const result = {
      total: records.length,
      toUpload: validRecords.length,
      uploaded: 0,
      failed: [],
    };

    if (validRecords.length === 0) {
      return result;
    }

    for (const record of validRecords) {
      try {
        await FirebaseService.saveCard({ ...record.card }, uploadOptions);
        result.uploaded += 1;
      } catch (error) {
        result.failed.push({
          source: record.source,
          message: error?.message || 'Error desconocido al guardar la historia'
        });
      }
    }

    return result;
  }

  _extractEntries(payload) {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload.map((card, index) => ({
        card,
        context: {
          projectId: card?.projectId,
          group: card?.group,
          cardType: card?.cardType
        },
        source: { path: `[${index}]` }
      }));
    }

    if (typeof payload !== 'object') {
      return [];
    }

    // Primary structure: { cards: { [projectId]: { TASKS_projectId: { [id]: card } } } }
    if ('cards' in payload && typeof payload.cards === 'object' && payload.cards !== null) {
      return this._extractFromCardsRoot(payload.cards);
    }

    // Fallback: object already positioned at project level (e.g. { "Cinema4D": { "TASKS_Cinema4D": {...} } })
    const projectScoped = this._extractFromCardsRoot(payload);
    if (projectScoped.length > 0) {
      return projectScoped;
    }

    // Another fallback: direct TASKS_{project} object
    return this._extractFromTasksRoot(payload);
  }

  _extractFromCardsRoot(root) {
    const entries = [];
    Object.entries(root).forEach(([projectId, projectData]) => {
      if (!projectData || typeof projectData !== 'object') {
        return;
      }

      const normalizedProjectId = projectId.replace(/^cards\//, '');

      Object.entries(projectData).forEach(([sectionKey, sectionValue]) => {
        if (!sectionKey.toUpperCase().startsWith('TASKS')) {
          return;
        }

        if (!sectionValue || typeof sectionValue !== 'object') {
          return;
        }

        Object.entries(sectionValue).forEach(([firebaseKey, card]) => {
          entries.push({
            card,
            context: {
              projectId: card?.projectId || normalizedProjectId,
              group: card?.group || 'tasks',
              cardType: card?.cardType || 'task-card'
            },
            source: {
              projectId: card?.projectId || normalizedProjectId,
              section: sectionKey,
              firebaseKey
            }
          });
        });
      });
    });
    return entries;
  }

  _extractFromTasksRoot(root) {
    const entries = [];
    Object.entries(root).forEach(([sectionKey, sectionValue]) => {
      if (!sectionKey.toUpperCase().startsWith('TASKS') || typeof sectionValue !== 'object' || !sectionValue) {
        return;
      }

      const projectId = sectionKey.replace(/^TASKS[_-]?/i, '') || sectionValue?.projectId;
      Object.entries(sectionValue).forEach(([firebaseKey, card]) => {
        entries.push({
          card,
          context: {
            projectId: card?.projectId || projectId,
            group: card?.group || 'tasks',
            cardType: card?.cardType || 'task-card'
          },
          source: {
            projectId: card?.projectId || projectId,
            section: sectionKey,
            firebaseKey
          }
        });
      });
    });
    return entries;
  }

  _normalizeCard(card, context) {
    const safeCard = { ...(card || {}) };
    const normalizedGroup = (safeCard.group || context.group || 'tasks').toLowerCase();

    delete safeCard.id;
    delete safeCard.firebaseId;
    delete safeCard._id;

    return {
      ...safeCard,
      projectId: safeCard.projectId || context.projectId,
      group: normalizedGroup,
      cardType: safeCard.cardType || context.cardType || 'task-card'
    };
  }

  _validateCard(card) {
    const errors = [];
    if (!card.projectId) {
      errors.push('projectId es obligatorio');
    }

    if (!card.title) {
      errors.push('title es obligatorio');
    }

    if (!card.group || !this.validGroups.has(card.group) ) {
      errors.push('group debe ser "tasks"');
    }

    if (!card.cardType || !this.validCardTypes.has(card.cardType)) {
      errors.push('cardType debe ser "task-card"');
    }

    return errors;
  }

  _buildSummary(records) {
    const summary = {
      total: records.length,
      valid: 0,
      invalid: 0,
      perProject: new Map()
    };

    records.forEach((record) => {
      const projectId = record.card.projectId || 'desconocido';
      if (!summary.perProject.has(projectId)) {
        summary.perProject.set(projectId, { total: 0, valid: 0, invalid: 0 });
      }
      const projectStats = summary.perProject.get(projectId);
      projectStats.total += 1;

      if (record.errors.length === 0) {
        summary.valid += 1;
        projectStats.valid += 1;
      } else {
        summary.invalid += 1;
        projectStats.invalid += 1;
      }
    });

    return {
      total: summary.total,
      valid: summary.valid,
      invalid: summary.invalid,
      perProject: Object.fromEntries(summary.perProject)
    };
  }
}

export const storyUploadService = new StoryUploadService();

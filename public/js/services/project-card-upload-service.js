import { FirebaseService } from './firebase-service.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';

const TYPE_CONFIG = {
  tasks: {
    group: 'tasks',
    section: 'tasks',
    cardType: 'task-card',
    requiredFields: ['title', 'status'],
    statusField: 'status',
    numericFields: {
      devPoints: { min: 0, max: 13 },
      businessPoints: { min: 0, max: 13 }
    }
  },
  bugs: {
    group: 'bugs',
    section: 'bugs',
    cardType: 'bug-card',
    requiredFields: ['title', 'status', 'priority'],
    statusField: 'status',
    priorityField: 'priority'
  },
  proposals: {
    group: 'proposals',
    section: 'proposals',
    cardType: 'proposal-card',
    requiredFields: ['title', 'description']
  }
};

const DATASET_FIELD_KEYS = {
  tasks: [
    'acceptanceCriteria',
    'attachment',
    'bbbWho',
    'bbbWhy',
    'bbdWho',
    'bbdWhy',
    'blockedByBusiness',
    'blockedByDevelopment',
    'businessPoints',
    'card-type',
    'cardId',
    'cardType',
    'createdBy',
    'description',
    'desiredDate',
    'devPoints',
    'developer',
    'endDate',
    'epic',
    'expanded',
    'expedited',
    'firebaseId',
    'group',
    'id',
    'notes',
    'projectId',
    'relatedTasks',
    'section',
    'sprint',
    'startDate',
    'status',
    'title',
    'userEmail',
    'validator'
  ],
  bugs: [
    'acceptanceCriteria',
    'acceptanceCriteriaColor',
    'activeTab',
    'attachment',
    'bugType',
    'canEditPermission',
    'cardId',
    'cardType',
    'cinemaFile',
    'createdAt',
    'createdBy',
    'description',
    'descriptionColor',
    'developer',
    'editingNote',
    'editingNoteIndex',
    'endDate',
    'expanded',
    'exportedFile',
    'firebaseId',
    'group',
    'hasUnsavedChanges',
    'id',
    'importedFile',
    'invalidFields',
    'isEditable',
    'isSaving',
    'newNoteText',
    'notes',
    'notesColor',
    'originalFiles',
    'originalStatus',
    'plugin',
    'pluginVersion',
    'priority',
    'projectId',
    'registerDate',
    'startDate',
    'status',
    'title',
    'treatmentType',
    'user',
    'userAuthorizedEmails',
    'userEmail'
  ],
  proposals: [
    'acceptanceCriteria',
    'activeTab',
    'canEditPermission',
    'cardId',
    'cardType',
    'createdBy',
    'description',
    'endDate',
    'epic',
    'expanded',
    'firebaseId',
    'group',
    'hasUnsavedChanges',
    'id',
    'isEditable',
    'isSaving',
    'notes',
    'projectId',
    'registerDate',
    'section',
    'selected',
    'startDate',
    'title',
    'userEmail'
  ]
};

const COMMON_ALLOWED_FIELDS = [
  'acceptanceCriteria',
  'acceptanceCriteriaColor',
  'activeTab',
  'attachment',
  'attachments',
  'canEditPermission',
  'cardId',
  'cardType',
  'card-type',
  'createdAt',
  'createdBy',
  'description',
  'descriptionColor',
  'endDate',
  'expanded',
  'firebaseId',
  'group',
  'hasUnsavedChanges',
  'history',
  'id',
  'invalidFields',
  'isEditable',
  'isSaving',
  'notes',
  'notesColor',
  'notesHistory',
  'originalFiles',
  'originalStatus',
  'priority',
  'priorityColor',
  'projectId',
  'registerDate',
  'section',
  'selected',
  'startDate',
  'status',
  'statusColor',
  'title',
  'titleColor',
  'user',
  'userAuthorizedEmails',
  'userEmail'
];

const TASK_EXTRA_FIELDS = [
  'bbbWho',
  'bbbWhy',
  'bbdWho',
  'bbdWhy',
  'blockedByBusiness',
  'blockedByDevelopment',
  'businessPoints',
  'devPoints',
  'desiredDate',
  'developer',
  'developers',
  'developerList',
  'developerName',
  'epic',
  'expedited',
  'globalSprintList',
  'projectScoringSystem',
  'projectStakeholders',
  'relatedTasks',
  'sprint',
  'sprintColor',
  'stakeholders',
  'stakeholdersSelected',
  'validator'
];

const BUG_EXTRA_FIELDS = [
  'bugType',
  'bugTypeList',
  'cinemaFile',
  'editingNote',
  'editingNoteIndex',
  'exportedFile',
  'importedFile',
  'newNoteText',
  'plugin',
  'pluginVersion',
  'treatmentType'
];

const PROPOSAL_EXTRA_FIELDS = [
  'epic',
  'objective',
  'projectStakeholders',
  'stakeholders',
  'stakeholdersSelected'
];

const FIELD_WHITELIST = {
  tasks: new Set([
    ...COMMON_ALLOWED_FIELDS,
    ...TASK_EXTRA_FIELDS,
    ...DATASET_FIELD_KEYS.tasks
  ]),
  bugs: new Set([
    ...COMMON_ALLOWED_FIELDS,
    ...BUG_EXTRA_FIELDS,
    ...DATASET_FIELD_KEYS.bugs
  ]),
  proposals: new Set([
    ...COMMON_ALLOWED_FIELDS,
    ...PROPOSAL_EXTRA_FIELDS,
    ...DATASET_FIELD_KEYS.proposals
  ])
};

const BUG_PRIORITY_SET = new Set(
  (APP_CONSTANTS?.BUG_PRIORITY_ORDER || []).map((priority) => priority.toUpperCase())
);

function normalizeTitle(title = '') {
  return title.trim().toLowerCase();
}

function isValidDate(value) {
  if (!value) return true;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

class ProjectCardUploadService {
  constructor() {
    this._titlesCache = new Map(); // `${projectId}:${type}` -> Set
    this._statusCatalogCache = new Map(); // cardType -> Set
  }

  async analyzePayload(payload, options) {
    const { projectId, targetType } = options || {};
    if (!projectId) {
      throw new Error('Selecciona un proyecto antes de analizar el archivo.');
    }
    const schema = this._getSchema(targetType);
    const entries = this._extractEntries(payload, schema, projectId);

    if (!entries.length) {
      throw new Error('No se encontraron registros compatibles en el JSON proporcionado.');
    }

    const [existingTitles, statusCatalog] = await Promise.all([
      this._getExistingTitles(projectId, targetType),
      this._getStatusCatalog(schema.cardType)
    ]);

    const records = entries.map((entry, index) => {
      const normalizedCard = this._normalizeCard(entry.card, schema, projectId);
      const normalizedTitle = normalizeTitle(normalizedCard.title || '');
      const errors = this._validateCard(normalizedCard, schema, {
        projectId,
        statusCatalog,
        normalizedTitle,
        existingTitles
      });

      return {
        card: normalizedCard,
        errors,
        source: entry.source,
        normalizedTitle,
        index
      };
    });

    this._applyBatchDuplicateChecks(records);

    const summary = this._buildSummary(records);
    return { records, summary };
  }

  async uploadRecords(records, options) {
    const { projectId, targetType } = options || {};
    const schema = this._getSchema(targetType);
    const validRecords = records.filter((record) => record.errors.length === 0);
    const report = {
      total: records.length,
      queued: validRecords.length,
      uploaded: 0,
      failed: []
    };

    if (!validRecords.length) {
      return report;
    }

    for (const record of validRecords) {
      try {
        const payload = this._prepareForSave(record.card, schema, projectId);
        await FirebaseService.saveCard(payload, { silent: true });
        this._rememberTitle(projectId, targetType, record.normalizedTitle);
        report.uploaded += 1;
      } catch (error) {
        report.failed.push({
          title: record.card.title || `Registro ${record.index + 1}`,
          message: error?.message || 'Error desconocido al guardar la card'
        });
      }
    }

    return report;
  }

  _getSchema(targetType) {
    const normalizedType = targetType || 'tasks';
    const schema = TYPE_CONFIG[normalizedType];
    if (!schema) {
      throw new Error(`Tipo de importación no soportado: ${targetType}`);
    }

    return {
      ...schema,
      typeKey: normalizedType,
      allowedFields: FIELD_WHITELIST[normalizedType]
    };
  }

  _extractEntries(payload, schema, projectId) {
    if (!payload) return [];
    if (Array.isArray(payload)) {
      return payload
        .filter((card) => typeof card === 'object' && card !== null)
        .map((card, index) => ({
          card,
          source: { path: `[${index}]`, projectId }
        }));
    }

    if (typeof payload !== 'object') {
      return [];
    }

    const buckets = [];
    const sectionPrefix = schema.section.toUpperCase();

    if (payload.cards && typeof payload.cards === 'object') {
      const projects = payload.cards;
      const projectData = projects[projectId];
      if (projectData && typeof projectData === 'object') {
        const sectionKey = Object.keys(projectData).find((key) =>
          key.toUpperCase().startsWith(sectionPrefix)
        );
        if (sectionKey && typeof projectData[sectionKey] === 'object') {
          buckets.push({
            collection: projectData[sectionKey],
            sectionKey,
            projectId
          });
        }
      }
    } else {
      const directSectionKey = Object.keys(payload).find((key) =>
        key.toUpperCase().startsWith(sectionPrefix)
      );
      if (directSectionKey && typeof payload[directSectionKey] === 'object') {
        buckets.push({
          collection: payload[directSectionKey],
          sectionKey: directSectionKey,
          projectId
        });
      }
    }

    const entries = [];
    buckets.forEach(({ collection, sectionKey }) => {
      Object.entries(collection || {}).forEach(([firebaseKey, card]) => {
        if (!card || typeof card !== 'object') return;
        entries.push({
          card,
          source: { firebaseKey, sectionKey, projectId }
        });
      });
    });

    if (!entries.length) {
      Object.entries(payload).forEach(([key, value]) => {
        if (!value || typeof value !== 'object') return;
        const cardType = value.cardType || value.group;
        if (!cardType) return;
        const matchesType =
          (typeof cardType === 'string' && cardType.toLowerCase().includes(schema.group)) ||
          cardType === schema.cardType;
        if (matchesType) {
          entries.push({
            card: value,
            source: { firebaseKey: key, sectionKey: schema.section, projectId: value.projectId || projectId }
          });
        }
      });
    }

    return entries;
  }

  _normalizeCard(card, schema, projectId) {
    const normalized = { ...(card || {}) };
    if (!normalized.projectId) {
      normalized.projectId = projectId;
    }

    normalized.cardType = schema.cardType;
    normalized.group = schema.group;
    normalized.section = schema.section;

    if (typeof normalized.title === 'string') {
      normalized.title = normalized.title.trim();
    }

    if (typeof normalized.description === 'string') {
      normalized.description = normalized.description.trim();
    }

    return normalized;
  }

  _validateCard(card, schema, context) {
    const errors = [];
    const { allowedFields, requiredFields, numericFields, statusField, priorityField } = schema;
    const { projectId, statusCatalog, normalizedTitle, existingTitles } = context;

    const unknownFields = Object.keys(card).filter((key) => !allowedFields.has(key));
    if (unknownFields.length) {
      errors.push(`Campos no permitidos: ${unknownFields.join(', ')}`);
    }

    requiredFields.forEach((field) => {
      if (!this._hasValue(card[field])) {
        errors.push(`Campo obligatorio faltante: ${field}`);
      }
    });

    if (card.projectId !== projectId) {
      errors.push(`projectId debe ser "${projectId}"`);
    }

    if (schema.group && card.group?.toLowerCase() !== schema.group) {
      errors.push(`group debe ser "${schema.group}"`);
    }

    if (schema.cardType && card.cardType !== schema.cardType) {
      errors.push(`cardType debe ser "${schema.cardType}"`);
    }

    if (statusField && card[statusField]) {
      if (!statusCatalog.has(card[statusField].toLowerCase())) {
        errors.push(`Estado no reconocido: ${card[statusField]}`);
      }
    }

    if (priorityField && card[priorityField]) {
      if (!BUG_PRIORITY_SET.has(card[priorityField].toUpperCase())) {
        errors.push(`Prioridad no válida: ${card[priorityField]}`);
      }
    }

    if (numericFields) {
      Object.entries(numericFields).forEach(([field, limits]) => {
        if (this._hasValue(card[field])) {
          const value = Number(card[field]);
          if (!Number.isFinite(value)) {
            errors.push(`"${field}" debe ser un número`);
          } else {
            if (typeof limits.min === 'number' && value < limits.min) {
              errors.push(`"${field}" debe ser >= ${limits.min}`);
            }
            if (typeof limits.max === 'number' && value > limits.max) {
              errors.push(`"${field}" debe ser <= ${limits.max}`);
            }
            card[field] = value;
          }
        }
      });
    }

    if (card.startDate && !isValidDate(card.startDate)) {
      errors.push('startDate no tiene un formato de fecha válido');
    }

    if (card.endDate && !isValidDate(card.endDate)) {
      errors.push('endDate no tiene un formato de fecha válido');
    }

    if (card.startDate && card.endDate) {
      const start = Date.parse(card.startDate);
      const end = Date.parse(card.endDate);
      if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
        errors.push('startDate no puede ser posterior a endDate');
      }
    }

    if (!card.title || card.title.trim().length < 3) {
      errors.push('title debe contener al menos 3 caracteres');
    }

    if (normalizedTitle && existingTitles.has(normalizedTitle)) {
      errors.push('Ya existe una card con este título en el proyecto');
    }

    return errors;
  }

  _applyBatchDuplicateChecks(records) {
    const counts = new Map();
    records.forEach((record) => {
      if (!record.normalizedTitle) return;
      counts.set(record.normalizedTitle, (counts.get(record.normalizedTitle) || 0) + 1);
    });

    records.forEach((record) => {
      if (!record.normalizedTitle) return;
      if (counts.get(record.normalizedTitle) > 1) {
        record.errors.push('Título duplicado dentro del archivo');
      }
    });
  }

  _buildSummary(records) {
    const summary = {
      total: records.length,
      valid: 0,
      invalid: 0
    };

    records.forEach((record) => {
      if (record.errors.length) {
        summary.invalid += 1;
      } else {
        summary.valid += 1;
      }
    });

    return summary;
  }

  _prepareForSave(card, schema, projectId) {
    const payload = { ...card };
    delete payload.id;
    delete payload.firebaseId;
    delete payload.canEditPermission;
    delete payload.hasUnsavedChanges;
    delete payload.isSaving;
    delete payload.selected;
    delete payload.history;
    delete payload.cardHistory;
    delete payload.notesHistory;

    payload.projectId = projectId;
    payload.group = schema.group;
    payload.cardType = schema.cardType;
    payload.section = schema.section;

    return payload;
  }

  _hasValue(value) {
    return value !== undefined && value !== null && value !== '';
  }

  async _getExistingTitles(projectId, targetType) {
    const cacheKey = `${projectId}:${targetType}`;
    if (this._titlesCache.has(cacheKey)) {
      return this._titlesCache.get(cacheKey);
    }

    const schema = this._getSchema(targetType);
    const path = FirebaseService.getPathBySectionAndProjectId(schema.section, projectId);
    const snapshot = await FirebaseService.getCards(path);
    const titles = new Set();
    if (snapshot && typeof snapshot === 'object') {
      Object.values(snapshot).forEach((card) => {
        if (card?.title) {
          titles.add(normalizeTitle(card.title));
        }
      });
    }

    this._titlesCache.set(cacheKey, titles);
    return titles;
  }

  _rememberTitle(projectId, targetType, normalizedTitle) {
    if (!normalizedTitle) return;
    const cacheKey = `${projectId}:${targetType}`;
    const cache = this._titlesCache.get(cacheKey);
    if (cache) {
      cache.add(normalizedTitle);
    }
  }

  async _getStatusCatalog(cardType) {
    if (!cardType) return new Set();
    if (this._statusCatalogCache.has(cardType)) {
      return this._statusCatalogCache.get(cardType);
    }

    try {
      const rawList = await FirebaseService.getStatusList(cardType);
      const statusSet = new Set();

      if (Array.isArray(rawList)) {
        rawList.forEach((item) => {
          if (typeof item === 'string') {
            statusSet.add(item.toLowerCase());
          } else if (item?.name) {
            statusSet.add(String(item.name).toLowerCase());
          }
        });
      } else if (rawList && typeof rawList === 'object') {
        Object.keys(rawList).forEach((key) => statusSet.add(key.toLowerCase()));
      }

      this._statusCatalogCache.set(cardType, statusSet);
      return statusSet;
    } catch (error) {
      return new Set();
    }
  }
}

export const projectCardUploadService = new ProjectCardUploadService();

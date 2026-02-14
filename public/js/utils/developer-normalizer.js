import { developerDirectory } from '../config/developer-directory.js';
import { APP_CONSTANTS } from '../constants/app-constants.js';

const ACCENT_REGEX = /[\u0300-\u036f]/g;

const derivedDirectory = developerDirectory.map(entry => ({
  ...entry,
  primaryEmail: (entry.primaryEmail || '').trim().toLowerCase(),
  emails: (entry.emails || []).map(email => (email || '').trim().toLowerCase()),
  aliases: (entry.aliases || []).map(alias => (alias || '').trim())
}));

const developerIndex = (() => {
  const index = new Map();

  const register = (rawKey, canonical) => {
    if (!rawKey && rawKey !== 0) {
      return;
    }
    const normalizedKey = normalizeKey(rawKey);
    if (!normalizedKey) {
      return;
    }
    if (!index.has(normalizedKey)) {
      index.set(normalizedKey, canonical);
    }
  };

  derivedDirectory.forEach(entry => {
    const canonical = {
      id: entry.id,
      name: entry.name,
      primaryEmail: entry.primaryEmail,
      emails: entry.emails,
      aliases: entry.aliases,
      isUnassigned: Boolean(entry.isUnassigned)
    };

    register(entry.name, canonical);
    entry.aliases.forEach(alias => register(alias, canonical));
    entry.aliases.forEach(alias => register(stripAccents(alias), canonical));
    if (entry.name) {
      register(stripAccents(entry.name), canonical);
    }
    if (entry.primaryEmail) {
      register(entry.primaryEmail, canonical);
    }
    entry.emails.forEach(email => register(email, canonical));
  });

  return index;
})();

function stripAccents(value) {
  return value
    ?.normalize('NFD')
    .replace(ACCENT_REGEX, '');
}

function normalizeKey(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return stripAccents(String(value).trim().toLowerCase());
}

function deriveNameFromEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '';
  }
  const localPart = email.split('@')[0];
  if (!localPart) {
    return '';
  }
  return localPart
    .replace(/[._]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Normalizes a developer entry (string or {name, email}) and returns a canonical form.
 * @param {string|{name?: string, email?: string}} entry
 * @param {{fallbackToEmailName?: boolean}} [options]
 * @returns {{name: string, email: string, canonicalId: string|null, isUnassigned: boolean, sourceEmail: string}}
 */
export function normalizeDeveloperEntry(entry, options = {}) {
  const { fallbackToEmailName = true } = options;
  const isString = typeof entry === 'string';
  const rawName = isString ? entry : entry?.name;
  const rawEmail = isString && entry?.includes?.('@') ? entry : entry?.email;

  const trimmedName = (rawName || '').trim();
  const trimmedEmail = (rawEmail || '').trim().toLowerCase();

  const candidates = [];
  if (trimmedEmail) {
    candidates.push(trimmedEmail);
  }
  if (trimmedName) {
    candidates.push(trimmedName);
  }
  if (isString && !trimmedEmail && !trimmedName) {
    candidates.push(String(entry));
  }

  let canonicalMatch = null;
  for (const candidate of candidates) {
    const normalized = normalizeKey(candidate);
    if (normalized && developerIndex.has(normalized)) {
      canonicalMatch = developerIndex.get(normalized);
      break;
    }
  }

  if (canonicalMatch) {
    const resolvedEmail = canonicalMatch.primaryEmail || trimmedEmail || '';
    return {
      name: canonicalMatch.name,
      email: canonicalMatch.isUnassigned ? '' : resolvedEmail,
      canonicalId: canonicalMatch.id || null,
      isUnassigned: canonicalMatch.isUnassigned,
      sourceEmail: trimmedEmail
    };
  }

  const fallbackName = trimmedName ||
    (fallbackToEmailName ? deriveNameFromEmail(trimmedEmail) : trimmedName);

  const isUnassigned = !trimmedEmail && normalizeKey(trimmedName) === normalizeKey('sin asignar');

  return {
    name: fallbackName || trimmedName || trimmedEmail || '',
    email: trimmedEmail,
    canonicalId: isUnassigned ? 'sin-asignar' : null,
    isUnassigned,
    sourceEmail: trimmedEmail
  };
}

/**
 * Normalizes a list of developer entries and deduplicates them by canonicalId/email.
 * @param {Array<string|{name?: string, email?: string}>} entries
 * @param {{fallbackToEmailName?: boolean}} [options]
 * @returns {Array<{name: string, email: string, canonicalId: string|null, isUnassigned: boolean}>}
 */
export function normalizeDeveloperEntries(entries, options = {}) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const seen = new Map();
  const normalizedList = [];

  entries.forEach(entry => {
    if (entry === undefined || entry === null || entry === '') {
      return;
    }
    const normalized = normalizeDeveloperEntry(entry, options);
    const key = normalized.canonicalId || (normalized.email ? `email:${normalized.email}` : normalizeKey(normalized.name));

    if (!seen.has(key)) {
      seen.set(key, normalizedList.length);
      normalizedList.push(normalized);
    } else {
      // Merge missing information if we already have an entry for this developer
      const existingIndex = seen.get(key);
      const existing = normalizedList[existingIndex];
      if (!existing.email && normalized.email) {
        existing.email = normalized.email;
      }
      if (!existing.name && normalized.name) {
        existing.name = normalized.name;
      }
    }
  });

  return normalizedList;
}

/**
 * Resolves a developer identifier (name/email) and returns the canonical name.
 * @param {string} value
 * @returns {string}
 */
export function normalizeDeveloperName(value) {
  const normalized = normalizeDeveloperEntry(value);
  return normalized.name || '';
}

/**
 * Resolves a developer identifier and returns a grouping key that stays stable
 * across aliases (uses canonicalId when available).
 * @param {string} value
 * @returns {string}
 */
export function getDeveloperKey(value) {
  const normalized = normalizeDeveloperEntry(value);
  return normalized.canonicalId || (normalized.email ? `email:${normalized.email}` : normalizeKey(normalized.name));
}

/**
 * Returns a lightweight structure ready to be used in selects: { value, display }.
 * Uses entityDirectoryService to resolve any reference (email, name, id) to dev_XXX IDs.
 * @param {Array<string|{id?: string, name?: string, email?: string}>} entries
 * @param {{includeUnassigned?: boolean, unassignedLabel?: string}} [options]
 * @returns {Array<{value: string, display: string}>}
 */
export function buildDeveloperSelectOptions(entries, options = {}) {
  const { includeUnassigned = true, unassignedLabel = APP_CONSTANTS.DEVELOPER_UNASSIGNED.DISPLAY_ES } = options;

  const seenIds = new Set();
  const result = [];
  const entityService = globalThis.entityDirectoryService;

  (entries || []).forEach(entry => {
    if (!entry) return;

    let id = null;
    let name = '';
    let email = '';

    // Extract candidate values from entry
    if (typeof entry === 'string') {
      const candidate = entry.trim();
      if (candidate.startsWith('dev_')) {
        id = candidate;
      } else if (candidate.includes('@')) {
        email = candidate.toLowerCase();
      } else {
        // Try to resolve by name
        if (entityService?.isInitialized?.()) {
          id = entityService.resolveDeveloperId(candidate);
        }
        if (!id) {
          name = candidate;
        }
      }
    } else if (typeof entry === 'object') {
      id = entry.id || null;
      name = entry.name || entry.display || '';
      email = (entry.email || '').trim().toLowerCase();
    }

    // Try to resolve to a dev_XXX ID if we don't have one yet
    if (!id || !id.startsWith('dev_')) {
      if (entityService?.isInitialized?.()) {
        // Try email first, then name
        if (email) {
          id = entityService.resolveDeveloperId(email);
        }
        if (!id && name) {
          id = entityService.resolveDeveloperId(name);
        }
      }
    }

    // Skip if we couldn't resolve to a dev_XXX ID
    if (!id || !id.startsWith('dev_')) return;

    // Skip duplicates
    if (seenIds.has(id)) return;
    seenIds.add(id);

    // Resolve display name from entityDirectoryService
    let displayName = name;
    if (!displayName || displayName === id) {
      if (entityService?.isInitialized?.()) {
        displayName = entityService.getDeveloperDisplayName(id) || id;
      } else {
        displayName = id;
      }
    }

    result.push({
      value: id,
      display: displayName
    });
  });

  if (includeUnassigned) {
    return [{ value: APP_CONSTANTS.DEVELOPER_UNASSIGNED.STORAGE_VALUE, display: unassignedLabel }, ...result];
  }

  return result;
}

export function isUnassignedDeveloper(value) {
  const normalized = normalizeDeveloperEntry(value);
  return normalized.isUnassigned;
}

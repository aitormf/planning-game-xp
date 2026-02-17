import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock developer directory before import
vi.mock('@/config/developer-directory.js', () => ({
  developerDirectory: [
    {
      id: 'sin-asignar',
      name: 'Sin asignar',
      primaryEmail: '',
      emails: [''],
      aliases: ['Sin asignar', 'No developer assigned', ''],
      isUnassigned: true
    },
    {
      id: 'jane-doe',
      name: 'Jane Doe',
      primaryEmail: 'jane@example.com',
      emails: ['jane@example.com', 'j.doe@example.com'],
      aliases: ['Jane Doe', 'J. Doe', 'Jané Doé']
    },
    {
      id: 'carlos-garcia',
      name: 'Carlos García',
      primaryEmail: 'carlos@example.com',
      emails: ['carlos@example.com'],
      aliases: ['Carlos García', 'Carlos Garcia']
    }
  ],
  getDeveloperDirectory: () => []
}));

vi.mock('@/constants/app-constants.js', () => ({
  APP_CONSTANTS: {
    DEVELOPER_UNASSIGNED: {
      DISPLAY_ES: 'Sin asignar',
      STORAGE_VALUE: 'sin-asignar'
    }
  }
}));

// Mock entityDirectoryService
globalThis.entityDirectoryService = undefined;

const {
  normalizeDeveloperEntry,
  normalizeDeveloperEntries,
  normalizeDeveloperName,
  getDeveloperKey,
  buildDeveloperSelectOptions,
  isUnassignedDeveloper
} = await import('@/utils/developer-normalizer.js');

describe('developer-normalizer', () => {
  describe('normalizeDeveloperEntry', () => {
    it('should resolve by canonical name', () => {
      const result = normalizeDeveloperEntry('Jane Doe');
      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
      expect(result.canonicalId).toBe('jane-doe');
    });

    it('should resolve by email', () => {
      const result = normalizeDeveloperEntry('jane@example.com');
      expect(result.name).toBe('Jane Doe');
      expect(result.canonicalId).toBe('jane-doe');
    });

    it('should resolve by alias', () => {
      const result = normalizeDeveloperEntry('J. Doe');
      expect(result.name).toBe('Jane Doe');
      expect(result.canonicalId).toBe('jane-doe');
    });

    it('should resolve by secondary email', () => {
      const result = normalizeDeveloperEntry('j.doe@example.com');
      expect(result.name).toBe('Jane Doe');
      expect(result.canonicalId).toBe('jane-doe');
    });

    it('should resolve with accented characters', () => {
      const result = normalizeDeveloperEntry('Carlos García');
      expect(result.name).toBe('Carlos García');
      expect(result.canonicalId).toBe('carlos-garcia');
    });

    it('should resolve without accents', () => {
      const result = normalizeDeveloperEntry('Carlos Garcia');
      expect(result.name).toBe('Carlos García');
      expect(result.canonicalId).toBe('carlos-garcia');
    });

    it('should be case-insensitive', () => {
      const result = normalizeDeveloperEntry('jane doe');
      expect(result.name).toBe('Jane Doe');
      expect(result.canonicalId).toBe('jane-doe');
    });

    it('should handle "Sin asignar" as unassigned', () => {
      const result = normalizeDeveloperEntry('Sin asignar');
      expect(result.isUnassigned).toBe(true);
      expect(result.email).toBe('');
    });

    it('should handle object input with name and email', () => {
      const result = normalizeDeveloperEntry({ name: 'Jane', email: 'jane@example.com' });
      expect(result.name).toBe('Jane Doe');
      expect(result.canonicalId).toBe('jane-doe');
    });

    it('should handle unknown developer string', () => {
      const result = normalizeDeveloperEntry('Unknown Person');
      expect(result.name).toBe('Unknown Person');
      expect(result.canonicalId).toBeNull();
    });

    it('should handle unknown email with fallback name derivation via object', () => {
      // When passing a string email, rawName = email itself (truthy), so fallback is not triggered
      // To get name derivation from email, pass an object with only email (rawName will be empty)
      const result = normalizeDeveloperEntry({ email: 'unknown.user@test.com' });
      expect(result.name).toBe('Unknown User');
      expect(result.email).toBe('unknown.user@test.com');
    });

    it('should use email as name when passing email as string', () => {
      // When a string containing @ is passed, rawName = the string itself
      const result = normalizeDeveloperEntry('unknown.user@test.com');
      expect(result.name).toBe('unknown.user@test.com');
      expect(result.email).toBe('unknown.user@test.com');
    });

    it('should handle unknown email without fallback when option disabled', () => {
      const result = normalizeDeveloperEntry(
        { email: 'unknown.user@test.com' },
        { fallbackToEmailName: false }
      );
      // Without fallback, name derivation is skipped but final fallback uses email as name
      expect(result.name).toBe('unknown.user@test.com');
      expect(result.email).toBe('unknown.user@test.com');
    });

    it('should handle null input', () => {
      const result = normalizeDeveloperEntry(null);
      expect(result.name).toBe('');
      expect(result.isUnassigned).toBe(false);
    });

    it('should handle empty string input', () => {
      const result = normalizeDeveloperEntry('');
      expect(result.name).toBe('');
    });
  });

  describe('normalizeDeveloperEntries', () => {
    it('should normalize an array of entries', () => {
      const result = normalizeDeveloperEntries(['Jane Doe', 'carlos@example.com']);
      expect(result).toHaveLength(2);
      expect(result[0].canonicalId).toBe('jane-doe');
      expect(result[1].canonicalId).toBe('carlos-garcia');
    });

    it('should deduplicate by canonical ID', () => {
      const result = normalizeDeveloperEntries(['Jane Doe', 'jane@example.com', 'J. Doe']);
      expect(result).toHaveLength(1);
      expect(result[0].canonicalId).toBe('jane-doe');
    });

    it('should return empty array for non-array input', () => {
      expect(normalizeDeveloperEntries(null)).toEqual([]);
      expect(normalizeDeveloperEntries('string')).toEqual([]);
      expect(normalizeDeveloperEntries(123)).toEqual([]);
    });

    it('should skip null, undefined and empty entries', () => {
      const result = normalizeDeveloperEntries([null, undefined, '', 'Jane Doe']);
      expect(result).toHaveLength(1);
    });

    it('should merge missing information from duplicates', () => {
      // Both entries resolve to 'jane-doe' canonical ID
      const result = normalizeDeveloperEntries([
        'Jane Doe',
        'jane@example.com'
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('jane@example.com');
      expect(result[0].canonicalId).toBe('jane-doe');
    });
  });

  describe('normalizeDeveloperName', () => {
    it('should return canonical name for known developer', () => {
      expect(normalizeDeveloperName('jane@example.com')).toBe('Jane Doe');
    });

    it('should return empty string for empty input', () => {
      expect(normalizeDeveloperName('')).toBe('');
    });

    it('should return the email string when passed as string (no name derivation)', () => {
      // When passing email as string, rawName = email itself, so it won't derive
      expect(normalizeDeveloperName('john.smith@test.com')).toBe('john.smith@test.com');
    });

    it('should derive name from email when passed as object', () => {
      const result = normalizeDeveloperEntry({ email: 'john.smith@test.com' });
      expect(result.name).toBe('John Smith');
    });
  });

  describe('getDeveloperKey', () => {
    it('should return canonical ID for known developer', () => {
      expect(getDeveloperKey('Jane Doe')).toBe('jane-doe');
    });

    it('should return email-based key for unknown developer with email', () => {
      expect(getDeveloperKey('unknown@test.com')).toBe('email:unknown@test.com');
    });

    it('should return normalized name key for unknown developer without email', () => {
      const key = getDeveloperKey('Some Person');
      expect(typeof key).toBe('string');
      expect(key).toBe('some person');
    });
  });

  describe('isUnassignedDeveloper', () => {
    it('should return true for "Sin asignar"', () => {
      expect(isUnassignedDeveloper('Sin asignar')).toBe(true);
    });

    it('should return true for case variations', () => {
      expect(isUnassignedDeveloper('sin asignar')).toBe(true);
    });

    it('should return false for actual developers', () => {
      expect(isUnassignedDeveloper('Jane Doe')).toBe(false);
    });

    it('should return false for empty input', () => {
      expect(isUnassignedDeveloper('')).toBe(false);
    });
  });

  describe('buildDeveloperSelectOptions', () => {
    beforeEach(() => {
      // Setup entityDirectoryService mock
      globalThis.entityDirectoryService = {
        isInitialized: () => true,
        resolveDeveloperId: (ref) => {
          const map = {
            'jane@example.com': 'dev_001',
            'jane doe': 'dev_001',
            'carlos@example.com': 'dev_002',
            'carlos garcía': 'dev_002',
            'dev_001': 'dev_001',
            'dev_002': 'dev_002'
          };
          return map[ref?.toLowerCase?.()] || null;
        },
        getDeveloperDisplayName: (id) => {
          const map = { dev_001: 'Jane Doe', dev_002: 'Carlos García' };
          return map[id] || id;
        }
      };
    });

    it('should build options with dev_XXX IDs', () => {
      const result = buildDeveloperSelectOptions(['dev_001', 'dev_002']);
      // Includes "Sin asignar" + 2 developers
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe('sin-asignar');
      expect(result[1].value).toBe('dev_001');
      expect(result[1].display).toBe('Jane Doe');
    });

    it('should resolve from emails', () => {
      const result = buildDeveloperSelectOptions(['jane@example.com']);
      expect(result).toHaveLength(2); // Sin asignar + Jane
      expect(result[1].value).toBe('dev_001');
    });

    it('should skip unresolvable entries', () => {
      const result = buildDeveloperSelectOptions(['unknown@nobody.com']);
      expect(result).toHaveLength(1); // Only Sin asignar
    });

    it('should deduplicate entries', () => {
      const result = buildDeveloperSelectOptions(['dev_001', 'jane@example.com']);
      expect(result).toHaveLength(2); // Sin asignar + Jane (deduped)
    });

    it('should exclude unassigned when option is false', () => {
      const result = buildDeveloperSelectOptions(['dev_001'], { includeUnassigned: false });
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('dev_001');
    });

    it('should handle null entries array', () => {
      const result = buildDeveloperSelectOptions(null);
      expect(result).toHaveLength(1); // Only Sin asignar
    });

    it('should handle empty array', () => {
      const result = buildDeveloperSelectOptions([]);
      expect(result).toHaveLength(1); // Only Sin asignar
    });
  });
});

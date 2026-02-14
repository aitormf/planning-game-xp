import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn(),
  onValue: vi.fn(),
  get: vi.fn()
}));

vi.mock('../../public/js/config/developer-directory.js', () => ({
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
      id: 'dani-neff',
      name: 'Dani Neff',
      primaryEmail: 'dneff@example.com',
      emails: ['dneff@example.com'],
      aliases: ['Dani Neff', 'dneff']
    },
    {
      id: 'daniel-gonzalez',
      name: 'Daniel González',
      primaryEmail: 'dglopez@partner.example.com',
      emails: ['dglopez@partner.example.com'],
      aliases: ['Daniel González', 'dglopez']
    }
  ],
  getDeveloperDirectory: vi.fn()
}));

import { userDirectoryService } from '../../public/js/services/user-directory-service.js';
import { developerDirectory } from '../../public/js/config/developer-directory.js';

describe('Resolución de nombres de developers', () => {
  beforeEach(() => {
    userDirectoryService._process({});
    userDirectoryService._canonicalNameMap = new Map();
  });

  const addDirectoryEntries = () => {
    userDirectoryService._process({
      'dneff|example!com': { name: 'Dani Neff', email: 'dneff@example.com', aliases: [] },
      'mfosela|example!com': { name: 'Dani Fosela', email: 'mfosela@example.com', aliases: [] },
      'dglopez|partner!example!com': { name: 'Daniel González', email: 'dglopez@partner.example.com', aliases: [] }
    });
  };

  it('devuelve nombres distintos para cada Dani', () => {
    addDirectoryEntries();
    expect(userDirectoryService.resolveDisplayName('dneff@example.com')).toBe('Dani Neff');
    expect(userDirectoryService.resolveDisplayName('mfosela@example.com')).toBe('Dani Fosela');
    expect(userDirectoryService.resolveDisplayName('dglopez@partner.example.com')).toBe('Daniel González');
  });

  it('resuelve aliases sin @ al nombre correcto', () => {
    addDirectoryEntries();
    expect(userDirectoryService.resolveDisplayName('dneff')).toBe('Dani Neff');
    expect(userDirectoryService.resolveDisplayName('dglopez')).toBe('Daniel González');
  });

  it('usa developerDirectory como fallback cuando no hay usersDirectory', () => {
    userDirectoryService._process({});
    const neff = developerDirectory.find(d => d.id === 'dani-neff');
    expect(neff.name).toBe('Dani Neff');
    expect(userDirectoryService.resolveDisplayName('dneff@example.com')).toBe('Dani Neff');
    expect(userDirectoryService.resolveDisplayName('dglopez@partner.example.com')).toBe('Daniel González');
  });
});

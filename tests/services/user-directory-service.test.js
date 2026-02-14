import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: vi.fn(),
  onValue: vi.fn(),
  get: vi.fn()
}));

describe('user-directory-service alias resolution', () => {
  let userDirectoryService;

  beforeEach(async () => {
    const module = await import('../../public/js/services/user-directory-service.js');
    userDirectoryService = module.userDirectoryService;
    // Reset state before each scenario
    userDirectoryService._process({});
  });

  const rawDirectory = {
    // Entrada principal
    'dnfernandez|partner!example!com': {
      name: '',
      email: 'dnfernandez@partner.example.com',
      aliases: ['dnfernandez@partner.example.com'],
      roles: { developer: [], stakeholder: [] },
      isAdmin: false,
      isSuperAdmin: false
    },
    // Variante org.example.com sin nombre
    'dnfernandez_partner!example!com-ext-|org!example!com': {
      name: '',
      email: 'dnfernandez_partner.example.com#ext#@org.example.com',
      aliases: [],
      roles: { developer: [], stakeholder: [] },
      isAdmin: false,
      isSuperAdmin: false
    }
  };

  it('resuelve variantes con espacios y #ext# al nombre real', async () => {
    userDirectoryService._process(rawDirectory);

    const samples = [
      'Dnfernandez Partner Example Com#ext#',
      'dnfernandez partner example com#ext#',
      'dnfernandez partner example com',
      'dnfernandez_partner example com#ext#'
    ];

    samples.forEach(sample => {
      const display = userDirectoryService.resolveDisplayName(sample);
      expect(display).toBe('David Nieto');
    });
  });

  it('resuelve alias corto sin dominio al nombre real', async () => {
    userDirectoryService._process(rawDirectory);
    expect(userDirectoryService.resolveDisplayName('dnfernandez')).toBe('David Nieto');
  });
});

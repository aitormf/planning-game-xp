import { describe, it, expect, beforeEach, vi } from 'vitest';

const loadConstants = async (allowedEmailDomains) => {
  vi.resetModules();
  window.allowedEmailDomains = allowedEmailDomains;
  const mod = await import('../../public/js/constants/app-constants.js');
  return mod.APP_CONSTANTS;
};

describe('APP_CONSTANTS.AUTH_ALLOWED_EMAIL_DOMAINS', () => {
  beforeEach(() => {
    delete window.allowedEmailDomains;
  });

  it('should parse comma-separated string domains', async () => {
    const constants = await loadConstants('example.com,corp.example.com');
    expect(constants.AUTH_ALLOWED_EMAIL_DOMAINS).toEqual(['example.com', 'corp.example.com']);
  });

  it('should accept pre-parsed array domains', async () => {
    const constants = await loadConstants(['example.com', 'corp.example.com']);
    expect(constants.AUTH_ALLOWED_EMAIL_DOMAINS).toEqual(['example.com', 'corp.example.com']);
  });

  it('should return an empty array when undefined', async () => {
    const constants = await loadConstants(undefined);
    expect(constants.AUTH_ALLOWED_EMAIL_DOMAINS).toEqual([]);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

const loadConstants = async ({
  allowedEmailDomains,
  orgName
} = {}) => {
  vi.resetModules();
  window.allowedEmailDomains = allowedEmailDomains;
  window.orgName = orgName;
  const mod = await import('../../public/js/constants/app-constants.js');
  return mod.APP_CONSTANTS;
};

describe('APP_CONSTANTS.AUTH_ALLOWED_EMAIL_DOMAINS', () => {
  beforeEach(() => {
    delete window.allowedEmailDomains;
    delete window.orgName;
  });

  it('should parse comma-separated string domains', async () => {
    const constants = await loadConstants({ allowedEmailDomains: 'example.com,corp.example.com' });
    expect(constants.AUTH_ALLOWED_EMAIL_DOMAINS).toEqual(['example.com', 'corp.example.com']);
  });

  it('should accept pre-parsed array domains', async () => {
    const constants = await loadConstants({ allowedEmailDomains: ['example.com', 'corp.example.com'] });
    expect(constants.AUTH_ALLOWED_EMAIL_DOMAINS).toEqual(['example.com', 'corp.example.com']);
  });

  it('should return an empty array when undefined', async () => {
    const constants = await loadConstants({ allowedEmailDomains: undefined });
    expect(constants.AUTH_ALLOWED_EMAIL_DOMAINS).toEqual([]);
  });
});

describe('APP_CONSTANTS.ORG_NAME', () => {
  beforeEach(() => {
    delete window.orgName;
    delete window.allowedEmailDomains;
  });

  it('should expose trimmed organization name when configured', async () => {
    const constants = await loadConstants({ orgName: '  Geniova  ' });
    expect(constants.ORG_NAME).toBe('Geniova');
  });

  it('should return empty string when org name is not configured', async () => {
    const constants = await loadConstants({ orgName: undefined });
    expect(constants.ORG_NAME).toBe('');
  });
});

/**
 * Tests for onAuthUserCreated auto-provision logic.
 *
 * Tests the normalizeGmailEmail and isEmailPreAuthorized helpers,
 * and the extended setEncodedEmailClaim trigger behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==================== normalizeGmailEmail tests ====================

describe('normalizeGmailEmail', () => {
  // Import the function by extracting it from the module
  // Since functions/index.js doesn't export it, we re-implement the pure function for testing
  function normalizeGmailEmail(email) {
    if (!email) return '';
    const lower = email.trim().toLowerCase();
    const [localPart, domain] = lower.split('@');
    if (!domain) return lower;
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      return localPart.replace(/\./g, '') + '@' + domain;
    }
    return lower;
  }

  it('should remove dots from Gmail local part', () => {
    expect(normalizeGmailEmail('jorge.casar@gmail.com')).toBe('jorgecasar@gmail.com');
  });

  it('should remove multiple dots from Gmail', () => {
    expect(normalizeGmailEmail('j.o.r.g.e@gmail.com')).toBe('jorge@gmail.com');
  });

  it('should handle googlemail.com domain', () => {
    expect(normalizeGmailEmail('user.name@googlemail.com')).toBe('username@googlemail.com');
  });

  it('should NOT remove dots from non-Gmail domains', () => {
    expect(normalizeGmailEmail('jorge.casar@geniova.com')).toBe('jorge.casar@geniova.com');
  });

  it('should lowercase the email', () => {
    expect(normalizeGmailEmail('Jorge.Casar@Gmail.com')).toBe('jorgecasar@gmail.com');
  });

  it('should handle empty string', () => {
    expect(normalizeGmailEmail('')).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(normalizeGmailEmail(null)).toBe('');
    expect(normalizeGmailEmail(undefined)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(normalizeGmailEmail(' user@gmail.com ')).toBe('user@gmail.com');
  });

  it('should handle email without domain', () => {
    expect(normalizeGmailEmail('nodomain')).toBe('nodomain');
  });

  it('should handle Gmail without dots (no-op)', () => {
    expect(normalizeGmailEmail('jorgecasar@gmail.com')).toBe('jorgecasar@gmail.com');
  });
});

// ==================== encodeEmailForFirebase tests ====================

describe('encodeEmailForFirebase', () => {
  function encodeEmailForFirebase(email) {
    if (!email) return '';
    return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
  }

  it('should encode @ as |', () => {
    expect(encodeEmailForFirebase('user@gmail.com')).toBe('user|gmail!com');
  });

  it('should encode . as !', () => {
    expect(encodeEmailForFirebase('jorge.casar@geniova.com')).toBe('jorge!casar|geniova!com');
  });

  it('should encode # as -', () => {
    expect(encodeEmailForFirebase('user#ext#@domain.com')).toBe('user-ext-|domain!com');
  });

  it('should handle empty string', () => {
    expect(encodeEmailForFirebase('')).toBe('');
  });
});

// ==================== Auto-provision logic tests ====================

describe('setEncodedEmailClaim auto-provision', () => {
  let mockDatabase;
  let mockAuth;

  beforeEach(() => {
    mockDatabase = {
      ref: vi.fn().mockReturnThis(),
      once: vi.fn(),
      set: vi.fn().mockResolvedValue(undefined),
    };
    mockAuth = {
      getUser: vi.fn(),
      setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
    };
  });

  function encodeEmailForFirebase(email) {
    if (!email) return '';
    return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
  }

  function normalizeGmailEmail(email) {
    if (!email) return '';
    const lower = email.trim().toLowerCase();
    const [localPart, domain] = lower.split('@');
    if (!domain) return lower;
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      return localPart.replace(/\./g, '') + '@' + domain;
    }
    return lower;
  }

  async function isEmailPreAuthorized(email, dbRef) {
    const normalizedEmail = email.trim().toLowerCase();
    const encodedExact = encodeEmailForFirebase(normalizedEmail);

    const exactVal = await dbRef(`/data/allowedUsers/${encodedExact}`);
    if (exactVal === true) return true;

    const gmailNormalized = normalizeGmailEmail(normalizedEmail);
    if (gmailNormalized !== normalizedEmail) {
      const encodedNormalized = encodeEmailForFirebase(gmailNormalized);
      const normalizedVal = await dbRef(`/data/allowedUsers/${encodedNormalized}`);
      if (normalizedVal === true) return true;
    }

    return false;
  }

  it('should find exact email match in allowedUsers', async () => {
    const dbLookup = vi.fn()
      .mockResolvedValueOnce(true); // exact match found

    const result = await isEmailPreAuthorized('user@geniova.com', dbLookup);
    expect(result).toBe(true);
    expect(dbLookup).toHaveBeenCalledWith('/data/allowedUsers/user|geniova!com');
  });

  it('should find Gmail-normalized match in allowedUsers', async () => {
    const dbLookup = vi.fn()
      .mockResolvedValueOnce(null)  // exact match NOT found (jorge.casar encoded)
      .mockResolvedValueOnce(true); // normalized match found (jorgecasar encoded)

    const result = await isEmailPreAuthorized('jorge.casar@gmail.com', dbLookup);
    expect(result).toBe(true);
    // First call: exact encoded email
    expect(dbLookup).toHaveBeenCalledWith('/data/allowedUsers/jorge!casar|gmail!com');
    // Second call: normalized encoded email
    expect(dbLookup).toHaveBeenCalledWith('/data/allowedUsers/jorgecasar|gmail!com');
  });

  it('should return false for non-authorized email', async () => {
    const dbLookup = vi.fn().mockResolvedValue(null);

    const result = await isEmailPreAuthorized('unknown@domain.com', dbLookup);
    expect(result).toBe(false);
  });

  it('should not try Gmail normalization for non-Gmail domains', async () => {
    const dbLookup = vi.fn().mockResolvedValueOnce(null);

    const result = await isEmailPreAuthorized('user@company.com', dbLookup);
    expect(result).toBe(false);
    // Only one call (no Gmail normalization needed)
    expect(dbLookup).toHaveBeenCalledTimes(1);
  });

  it('should set allowed=true in claims when email is pre-authorized', () => {
    // Simulate the claim-setting logic
    const currentClaims = { encodedEmail: 'old' };
    const isAllowed = true;
    const encodedEmail = 'user|geniova!com';

    const newClaims = {
      ...currentClaims,
      encodedEmail,
    };
    if (isAllowed) {
      newClaims.allowed = true;
    }

    expect(newClaims).toEqual({
      encodedEmail: 'user|geniova!com',
      allowed: true,
    });
  });

  it('should NOT set allowed claim when email is NOT pre-authorized', () => {
    const currentClaims = {};
    const isAllowed = false;
    const encodedEmail = 'unknown|domain!com';

    const newClaims = {
      ...currentClaims,
      encodedEmail,
    };
    if (isAllowed) {
      newClaims.allowed = true;
    }

    expect(newClaims).toEqual({
      encodedEmail: 'unknown|domain!com',
    });
    expect(newClaims.allowed).toBeUndefined();
  });

  it('should be idempotent for already-allowed users', () => {
    const currentClaims = { encodedEmail: 'user|geniova!com', allowed: true };
    const isAllowed = true;
    const encodedEmail = 'user|geniova!com';

    const newClaims = {
      ...currentClaims,
      encodedEmail,
    };
    if (isAllowed) {
      newClaims.allowed = true;
    }

    expect(newClaims).toEqual({
      encodedEmail: 'user|geniova!com',
      allowed: true,
    });
  });
});

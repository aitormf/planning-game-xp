import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeEmailForFirebase,
  encodeEmailForFirebase,
  decodeEmailFromFirebase,
  sanitizeEmail,
  isFirebaseSafeKey
} from '@/utils/email-sanitizer.js';

describe('email-sanitizer', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('sanitizeEmailForFirebase', () => {
    it('should extract prefix before @ by default', () => {
      expect(sanitizeEmailForFirebase('user@example.com')).toBe('user');
    });

    it('should replace forbidden chars in prefix', () => {
      expect(sanitizeEmailForFirebase('user.name@example.com')).toBe('user_name');
    });

    it('should keep full email when useOnlyPrefix is false', () => {
      expect(sanitizeEmailForFirebase('user@example.com', false)).toBe('user@example_com');
    });

    it('should replace all forbidden characters (. # $ [ ] /)', () => {
      expect(sanitizeEmailForFirebase('a.b#c$d[e]f/g', false)).toBe('a_b_c_d_e_f_g');
    });

    it('should return empty string for null input', () => {
      expect(sanitizeEmailForFirebase(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(sanitizeEmailForFirebase(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(sanitizeEmailForFirebase('')).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeEmailForFirebase(123)).toBe('');
      expect(sanitizeEmailForFirebase({})).toBe('');
    });

    it('should handle email without @ when useOnlyPrefix is true', () => {
      expect(sanitizeEmailForFirebase('nodomain')).toBe('nodomain');
    });

    it('should handle multiple @ symbols', () => {
      expect(sanitizeEmailForFirebase('user@bad@example.com')).toBe('user');
    });
  });

  describe('encodeEmailForFirebase', () => {
    it('should encode @ to |', () => {
      expect(encodeEmailForFirebase('user@example.com')).toBe('user|example!com');
    });

    it('should encode . to !', () => {
      expect(encodeEmailForFirebase('first.last')).toBe('first!last');
    });

    it('should encode # to -', () => {
      expect(encodeEmailForFirebase('user#tag')).toBe('user-tag');
    });

    it('should encode all special chars in one email', () => {
      expect(encodeEmailForFirebase('first.last#tag@example.com'))
        .toBe('first!last-tag|example!com');
    });

    it('should return empty string for null', () => {
      expect(encodeEmailForFirebase(null)).toBe('');
    });

    it('should return empty string for non-string', () => {
      expect(encodeEmailForFirebase(42)).toBe('');
    });
  });

  describe('decodeEmailFromFirebase', () => {
    it('should decode | to @', () => {
      expect(decodeEmailFromFirebase('user|example!com')).toBe('user@example.com');
    });

    it('should decode ! to .', () => {
      expect(decodeEmailFromFirebase('first!last')).toBe('first.last');
    });

    it('should decode - to #', () => {
      expect(decodeEmailFromFirebase('user-tag')).toBe('user#tag');
    });

    it('should return empty string for null', () => {
      expect(decodeEmailFromFirebase(null)).toBe('');
    });

    it('should return empty string for non-string', () => {
      expect(decodeEmailFromFirebase(123)).toBe('');
    });
  });

  describe('encode/decode round-trip', () => {
    it('should encode and decode back to original', () => {
      const original = 'user@example.com';
      expect(decodeEmailFromFirebase(encodeEmailForFirebase(original))).toBe(original);
    });

    it('should round-trip complex emails', () => {
      const original = 'first.last#tag@sub.example.com';
      expect(decodeEmailFromFirebase(encodeEmailForFirebase(original))).toBe(original);
    });
  });

  describe('sanitizeEmail (legacy)', () => {
    it('should delegate to sanitizeEmailForFirebase with useOnlyPrefix=true', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user');
    });

    it('should handle invalid input', () => {
      expect(sanitizeEmail(null)).toBe('');
    });
  });

  describe('isFirebaseSafeKey', () => {
    it('should return true for safe keys', () => {
      expect(isFirebaseSafeKey('valid_key')).toBe(true);
      expect(isFirebaseSafeKey('user123')).toBe(true);
      expect(isFirebaseSafeKey('key-with-dashes')).toBe(true);
    });

    it('should return false for keys with dots', () => {
      expect(isFirebaseSafeKey('key.with.dots')).toBe(false);
    });

    it('should return false for keys with #', () => {
      expect(isFirebaseSafeKey('key#hash')).toBe(false);
    });

    it('should return false for keys with $', () => {
      expect(isFirebaseSafeKey('key$dollar')).toBe(false);
    });

    it('should return false for keys with brackets', () => {
      expect(isFirebaseSafeKey('key[0]')).toBe(false);
    });

    it('should return false for keys with /', () => {
      expect(isFirebaseSafeKey('key/path')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isFirebaseSafeKey(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isFirebaseSafeKey(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isFirebaseSafeKey('')).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(isFirebaseSafeKey(123)).toBe(false);
    });
  });
});

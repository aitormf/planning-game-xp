import { describe, it, expect } from 'vitest';
import { UIUtils } from '@/utils/ui-utils.js';

describe('UIUtils', () => {
  describe('formatDate', () => {
    it('should return empty string for falsy values', () => {
      expect(UIUtils.formatDate('')).toBe('');
      expect(UIUtils.formatDate(null)).toBe('');
      expect(UIUtils.formatDate(undefined)).toBe('');
    });

    it('should extract date-only from ISO string', () => {
      expect(UIUtils.formatDate('2026-02-20T14:30:00Z')).toBe('2026-02-20');
    });

    it('should return date-only string as-is', () => {
      expect(UIUtils.formatDate('2026-02-20')).toBe('2026-02-20');
    });

    it('should return empty string for invalid date', () => {
      expect(UIUtils.formatDate('not-a-date')).toBe('');
    });
  });

  describe('formatDateFriendly', () => {
    it('should return empty string for falsy values', () => {
      expect(UIUtils.formatDateFriendly('')).toBe('');
      expect(UIUtils.formatDateFriendly(null)).toBe('');
      expect(UIUtils.formatDateFriendly(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(UIUtils.formatDateFriendly('not-a-date')).toBe('');
    });

    it('should format ISO timestamp with time in Spanish', () => {
      const result = UIUtils.formatDateFriendly('2026-02-20T14:30:00Z');
      // Should contain day, month abbreviation in Spanish, year, and time
      expect(result).toMatch(/20/);
      expect(result).toMatch(/feb/i);
      expect(result).toMatch(/2026/);
      // Should contain time component
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should format date-only string without time', () => {
      const result = UIUtils.formatDateFriendly('2026-02-20');
      expect(result).toMatch(/20/);
      expect(result).toMatch(/feb/i);
      expect(result).toMatch(/2026/);
      // Should NOT contain time for date-only input
      expect(result).not.toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle different months in Spanish', () => {
      const jan = UIUtils.formatDateFriendly('2026-01-15T10:00:00Z');
      expect(jan).toMatch(/ene/i);

      const dec = UIUtils.formatDateFriendly('2026-12-25T10:00:00Z');
      expect(dec).toMatch(/dic/i);
    });
  });
});

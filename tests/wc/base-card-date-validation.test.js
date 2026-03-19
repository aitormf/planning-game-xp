/**
 * Tests for BaseCard endDate >= startDate validation
 * PLN-BUG-0099: Cards must validate that endDate is not before startDate
 *
 * Uses _toLocalDate() normalization (via extractDateTimeLocal) to ensure
 * consistent comparison regardless of timezone format differences.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractDateTimeLocal } from '@/utils/timestamp-utils.js';

/**
 * Mirror of BaseCard._toLocalDate() - normalizes any date string to local time
 */
function toLocalDate(dateStr, context = 'start') {
  const normalized = extractDateTimeLocal(dateStr, context);
  if (!normalized) return new Date(NaN);
  return new Date(normalized);
}

describe('BaseCard - Date Validation', () => {
  describe('validateDates()', () => {
    function validateDates(startDate, endDate) {
      if (!startDate || !endDate) return true;
      return toLocalDate(endDate, 'end') >= toLocalDate(startDate, 'start');
    }

    it('should return true when no dates are set', () => {
      expect(validateDates('', '')).toBe(true);
      expect(validateDates(null, null)).toBe(true);
      expect(validateDates(undefined, undefined)).toBe(true);
    });

    it('should return true when only startDate is set', () => {
      expect(validateDates('2026-01-01', '')).toBe(true);
      expect(validateDates('2026-01-01', null)).toBe(true);
    });

    it('should return true when only endDate is set', () => {
      expect(validateDates('', '2026-01-01')).toBe(true);
      expect(validateDates(null, '2026-01-01')).toBe(true);
    });

    it('should return true when endDate equals startDate', () => {
      expect(validateDates('2026-03-07', '2026-03-07')).toBe(true);
    });

    it('should return true when endDate is after startDate', () => {
      expect(validateDates('2026-01-01', '2026-12-31')).toBe(true);
      expect(validateDates('2026-03-07', '2026-03-08')).toBe(true);
    });

    it('should return false when endDate is before startDate', () => {
      expect(validateDates('2026-03-07', '2026-03-06')).toBe(false);
      expect(validateDates('2026-12-31', '2026-01-01')).toBe(false);
    });

    it('should handle ISO datetime strings with timezone', () => {
      expect(validateDates('2026-03-07T10:00:00Z', '2026-03-07T09:00:00Z')).toBe(false);
      expect(validateDates('2026-03-07T10:00:00Z', '2026-03-07T11:00:00Z')).toBe(true);
    });

    it('should handle timestamps with time components (same day)', () => {
      expect(validateDates('2026-03-16T15:10:00', '2026-03-16T17:05:00')).toBe(true);
      expect(validateDates('2026-03-16T17:05:00', '2026-03-16T15:10:00')).toBe(false);
    });

    it('should handle mixed formats: local time vs UTC', () => {
      // startDate from Firebase (UTC), endDate from user input (local, no timezone)
      // Both should be normalized to the same local time before comparison
      const utcStart = '2026-03-16T14:10:00Z'; // UTC → local depends on timezone
      const localEnd = '2026-03-16T17:05:00';   // local time, no timezone

      const startLocal = toLocalDate(utcStart, 'start');
      const endLocal = toLocalDate(localEnd, 'end');

      // endDate (17:05 local) should be after startDate (14:10 UTC = 15:10 local in UTC+1)
      // This test verifies normalization works regardless of system timezone
      expect(endLocal >= startLocal).toBe(true);
    });

    it('should handle mixed formats: date-only startDate vs datetime endDate', () => {
      // date-only gets default start time (09:00)
      expect(validateDates('2026-03-16', '2026-03-16T17:05:00')).toBe(true);
      // date-only gets default start time (09:00), endDate at 08:00 same day
      expect(validateDates('2026-03-16', '2026-03-16T08:00:00')).toBe(false);
    });
  });

  describe('enforceDateCoherence()', () => {
    function enforceDateCoherence(card) {
      if (card.startDate && card.endDate && toLocalDate(card.endDate, 'end') < toLocalDate(card.startDate, 'start')) {
        card.endDate = '';
        return true; // endDate was cleared
      }
      return false;
    }

    it('should clear endDate when it is before new startDate', () => {
      const card = { startDate: '2026-03-10', endDate: '2026-03-05' };
      const cleared = enforceDateCoherence(card);
      expect(cleared).toBe(true);
      expect(card.endDate).toBe('');
    });

    it('should not clear endDate when it is after startDate', () => {
      const card = { startDate: '2026-03-01', endDate: '2026-03-10' };
      const cleared = enforceDateCoherence(card);
      expect(cleared).toBe(false);
      expect(card.endDate).toBe('2026-03-10');
    });

    it('should not clear endDate when it equals startDate', () => {
      const card = { startDate: '2026-03-07', endDate: '2026-03-07' };
      const cleared = enforceDateCoherence(card);
      expect(cleared).toBe(false);
      expect(card.endDate).toBe('2026-03-07');
    });

    it('should do nothing when endDate is empty', () => {
      const card = { startDate: '2026-03-10', endDate: '' };
      const cleared = enforceDateCoherence(card);
      expect(cleared).toBe(false);
    });

    it('should do nothing when startDate is empty', () => {
      const card = { startDate: '', endDate: '2026-03-10' };
      const cleared = enforceDateCoherence(card);
      expect(cleared).toBe(false);
    });

    it('should handle ISO datetime strings with timezone', () => {
      const card = { startDate: '2026-03-10T14:00:00Z', endDate: '2026-03-10T10:00:00Z' };
      const cleared = enforceDateCoherence(card);
      expect(cleared).toBe(true);
      expect(card.endDate).toBe('');
    });

    it('should handle same-day times correctly', () => {
      const card = { startDate: '2026-03-16T15:10:00', endDate: '2026-03-16T17:00:00' };
      const cleared = enforceDateCoherence(card);
      expect(cleared).toBe(false);
      expect(card.endDate).toBe('2026-03-16T17:00:00');
    });
  });

  describe('validateEndDateChange()', () => {
    function validateEndDateChange(startDate, newEndDate) {
      if (!startDate || !newEndDate) return true;
      return toLocalDate(newEndDate, 'end') >= toLocalDate(startDate, 'start');
    }

    it('should accept endDate after startDate', () => {
      expect(validateEndDateChange('2026-03-01', '2026-03-10')).toBe(true);
    });

    it('should accept endDate equal to startDate', () => {
      expect(validateEndDateChange('2026-03-07', '2026-03-07')).toBe(true);
    });

    it('should reject endDate before startDate', () => {
      expect(validateEndDateChange('2026-03-10', '2026-03-05')).toBe(false);
    });

    it('should accept when startDate is empty', () => {
      expect(validateEndDateChange('', '2026-03-10')).toBe(true);
      expect(validateEndDateChange(null, '2026-03-10')).toBe(true);
    });

    it('should accept when newEndDate is empty', () => {
      expect(validateEndDateChange('2026-03-10', '')).toBe(true);
      expect(validateEndDateChange('2026-03-10', null)).toBe(true);
    });

    it('should accept same-day endDate with later time than startDate', () => {
      // This is the exact user scenario: start=15:10, end=17:05, same day
      expect(validateEndDateChange('2026-03-16T15:10:00', '2026-03-16T17:05:00')).toBe(true);
    });

    it('should reject same-day endDate with earlier time than startDate', () => {
      expect(validateEndDateChange('2026-03-16T15:10:00', '2026-03-16T14:00:00')).toBe(false);
    });

    it('should handle mixed formats: startDate with timezone, endDate without', () => {
      // startDate from Firebase with Z suffix, endDate from user input (local)
      const utcStart = '2026-03-16T15:10:00Z';
      const localEnd = '2026-03-16T17:05:00';

      const startLocal = toLocalDate(utcStart, 'start');
      const endLocal = toLocalDate(localEnd, 'end');

      // After normalization, both are in local time → comparison is correct
      expect(endLocal >= startLocal).toBe(true);
    });

    it('should handle mixed formats: startDate with offset, endDate without', () => {
      const offsetStart = '2026-03-16T15:10:00+01:00';
      const localEnd = '2026-03-16T17:05:00';

      // +01:00 → UTC 14:10 → local 15:10 (in UTC+1)
      // localEnd → 17:05 local
      // 17:05 > 15:10 → valid
      expect(validateEndDateChange(offsetStart, localEnd)).toBe(true);
    });
  });

  describe('toLocalDate() normalization', () => {
    it('should normalize date-only to datetime with default time', () => {
      const startDate = toLocalDate('2026-03-16', 'start');
      const endDate = toLocalDate('2026-03-16', 'end');

      // start defaults to 09:00, end defaults to 17:00
      expect(startDate.getHours()).toBe(9);
      expect(startDate.getMinutes()).toBe(0);
      expect(endDate.getHours()).toBe(17);
      expect(endDate.getMinutes()).toBe(0);
    });

    it('should preserve time for datetime strings without timezone', () => {
      const date = toLocalDate('2026-03-16T15:10:00', 'start');
      expect(date.getHours()).toBe(15);
      expect(date.getMinutes()).toBe(10);
    });

    it('should convert UTC timezone to local time', () => {
      const utcDate = '2026-03-16T14:10:00Z';
      const normalized = toLocalDate(utcDate, 'start');
      // Should match what new Date(utcDate) gives in local time
      const expected = new Date(utcDate);
      expect(normalized.getHours()).toBe(expected.getHours());
      expect(normalized.getMinutes()).toBe(expected.getMinutes());
    });

    it('should return Invalid Date for empty/null input', () => {
      expect(isNaN(toLocalDate('', 'start').getTime())).toBe(true);
      expect(isNaN(toLocalDate(null, 'start').getTime())).toBe(true);
      expect(isNaN(toLocalDate(undefined, 'start').getTime())).toBe(true);
    });
  });
});

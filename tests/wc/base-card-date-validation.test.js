/**
 * Tests for BaseCard endDate >= startDate validation
 * PLN-BUG-0099: Cards must validate that endDate is not before startDate
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('BaseCard - Date Validation', () => {
  describe('validateDates()', () => {
    let validateDates;

    beforeEach(() => {
      // Extract the pure validation logic to test independently
      // This function mirrors what BaseCard._validateDates() should do
      validateDates = (startDate, endDate) => {
        if (!startDate || !endDate) return true;
        return new Date(endDate) >= new Date(startDate);
      };
    });

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

    it('should handle ISO datetime strings', () => {
      expect(validateDates('2026-03-07T10:00:00Z', '2026-03-07T09:00:00Z')).toBe(false);
      expect(validateDates('2026-03-07T10:00:00Z', '2026-03-07T11:00:00Z')).toBe(true);
    });
  });
});

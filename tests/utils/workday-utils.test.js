import { describe, it, expect, vi } from 'vitest';

vi.mock('@/config/holidays-config.js', () => ({
  holidays: [
    '2026-01-01',
    '2026-01-06',
    '2026-05-01',
    '2026-12-25'
  ],
  HOURS_PER_WORKDAY: 8
}));

const { isWorkday, calculateWorkdays, formatWorkdays, getWorkdaysDuration } =
  await import('@/utils/workday-utils.js');

describe('workday-utils', () => {
  describe('isWorkday', () => {
    it('should return true for a regular weekday', () => {
      // 2026-02-17 is Tuesday - use noon to avoid UTC timezone shift
      expect(isWorkday(new Date(2026, 1, 17, 12, 0))).toBe(true);
    });

    it('should return false for Saturday', () => {
      // 2026-02-14 is Saturday
      expect(isWorkday(new Date(2026, 1, 14, 12, 0))).toBe(false);
    });

    it('should return false for Sunday', () => {
      // 2026-02-15 is Sunday
      expect(isWorkday(new Date(2026, 1, 15, 12, 0))).toBe(false);
    });

    it('should return false for a configured holiday', () => {
      // 2026-01-01 is in the mock holidays - use noon to ensure UTC date matches
      expect(isWorkday(new Date(2026, 0, 1, 12, 0))).toBe(false);
    });

    it('should return true for a non-holiday weekday', () => {
      // 2026-01-02 is Friday, not a holiday - use noon
      expect(isWorkday(new Date(2026, 0, 2, 12, 0))).toBe(true);
    });
  });

  describe('calculateWorkdays', () => {
    it('should return 0 for invalid start date', () => {
      expect(calculateWorkdays('invalid-date', new Date())).toBe(0);
    });

    it('should return 0 for invalid end date', () => {
      expect(calculateWorkdays(new Date(), 'invalid-date')).toBe(0);
    });

    it('should return 0 when end is before start', () => {
      expect(calculateWorkdays(
        new Date(2026, 1, 17, 15, 0),
        new Date(2026, 1, 17, 10, 0)
      )).toBe(0);
    });

    it('should return 0 when start equals end', () => {
      const d = new Date(2026, 1, 17, 12, 0);
      expect(calculateWorkdays(d, d)).toBe(0);
    });

    it('should calculate partial day on same workday', () => {
      // Tuesday 2026-02-17 from 10:00 to 14:00 = 4 hours = 0.5 workdays (8h/day)
      const start = new Date(2026, 1, 17, 10, 0);
      const end = new Date(2026, 1, 17, 14, 0);
      expect(calculateWorkdays(start, end)).toBe(0.5);
    });

    it('should cap same-day calculation within work hours (9-18)', () => {
      // Tuesday from 7:00 to 20:00 → capped to 9-18 = 9 hours
      // 9h / 8h per workday = 1.1 (implementation counts 9-to-18 window)
      const start = new Date(2026, 1, 17, 7, 0);
      const end = new Date(2026, 1, 17, 20, 0);
      expect(calculateWorkdays(start, end)).toBe(1.1);
    });

    it('should return 0 for same day starting and ending after 18:00', () => {
      const start = new Date(2026, 1, 17, 19, 0);
      const end = new Date(2026, 1, 17, 20, 0);
      expect(calculateWorkdays(start, end)).toBe(0);
    });

    it('should calculate across multiple weekdays', () => {
      // Monday 2026-02-16 10:00 to Wednesday 2026-02-18 17:00
      // Start day (Mon): 18-10 = 8h
      // Middle (Tue): 8h
      // End day (Wed): 17-9 = 8h
      // Total: 24h / 8 = 3.0
      const start = new Date(2026, 1, 16, 10, 0);
      const end = new Date(2026, 1, 18, 17, 0);
      expect(calculateWorkdays(start, end)).toBe(3);
    });

    it('should skip weekends', () => {
      // Friday 2026-02-13 10:00 to Monday 2026-02-16 17:00
      // Fri: 18-10 = 8h, skip Sat/Sun, Mon: 17-9 = 8h
      // Total: 16h / 8 = 2.0
      const start = new Date(2026, 1, 13, 10, 0);
      const end = new Date(2026, 1, 16, 17, 0);
      expect(calculateWorkdays(start, end)).toBe(2);
    });

    it('should accept ISO string dates', () => {
      const start = '2026-02-17T10:00:00';
      const end = '2026-02-17T14:00:00';
      expect(calculateWorkdays(start, end)).toBe(0.5);
    });

    it('should return 0 if entire range is on weekend', () => {
      // Saturday to Sunday
      const start = new Date(2026, 1, 14, 9, 0);
      const end = new Date(2026, 1, 15, 18, 0);
      expect(calculateWorkdays(start, end)).toBe(0);
    });

    it('should handle start time after work hours', () => {
      // Starting after 18:00 on a workday - that day should not count
      const start = new Date(2026, 1, 17, 19, 0);
      const end = new Date(2026, 1, 18, 17, 0);
      // Start day: 0 hours (after 18:00), End day: 17-9 = 8h = 1.0
      expect(calculateWorkdays(start, end)).toBe(1);
    });

    it('should handle end time before work hours', () => {
      // Ending before 9:00 on a workday - end day should not count
      const start = new Date(2026, 1, 17, 10, 0);
      const end = new Date(2026, 1, 18, 8, 0);
      // Start day: 18-10 = 8h, End day: 0 hours (before 9:00) = 1.0
      expect(calculateWorkdays(start, end)).toBe(1);
    });
  });

  describe('formatWorkdays', () => {
    it('should return "< 1h" for 0 workdays', () => {
      expect(formatWorkdays(0)).toBe('< 1h');
    });

    it('should return "< 1h" for very small values', () => {
      expect(formatWorkdays(0.05)).toBe('< 1h');
    });

    it('should return "1 jornada" for exactly 1', () => {
      expect(formatWorkdays(1)).toBe('1 jornada');
    });

    it('should return plural format for values > 1', () => {
      expect(formatWorkdays(2.5)).toBe('2.5 jornadas');
    });

    it('should return plural format for fractional values', () => {
      expect(formatWorkdays(0.5)).toBe('0.5 jornadas');
    });
  });

  describe('getWorkdaysDuration', () => {
    it('should return "-" for null startDate', () => {
      expect(getWorkdaysDuration(null)).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(getWorkdaysDuration('')).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(getWorkdaysDuration(undefined)).toBe('-');
    });

    it('should return formatted string for valid date', () => {
      const result = getWorkdaysDuration('2026-02-16T09:00:00');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('-');
    });
  });
});

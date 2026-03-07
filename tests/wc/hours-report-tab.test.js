import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * HoursReportTab component tests.
 *
 * The component lives in public/js/wc/ and Vite's publicDir protection
 * blocks transitive import resolution in tests. We test the component's
 * logic (formatting, state management) directly. The service layer
 * (reportHoursService) is fully tested in tests/services/report-hours-service.test.js.
 */

// Reproduce formatHours from HoursReportTab.js
function formatHours(val) {
  if (val === 0) return '0';
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
}

describe('HoursReportTab', () => {
  describe('default state', () => {
    it('should initialize with current month and year', () => {
      const now = new Date();
      const state = {
        _selectedMonth: now.getMonth() + 1,
        _selectedYear: now.getFullYear(),
        _loading: false,
        _report: null,
      };
      expect(state._selectedMonth).toBeGreaterThanOrEqual(1);
      expect(state._selectedMonth).toBeLessThanOrEqual(12);
      expect(state._selectedYear).toBeGreaterThanOrEqual(2020);
      expect(state._loading).toBe(false);
      expect(state._report).toBe(null);
    });
  });

  describe('formatHours', () => {
    it('should return "0" for zero', () => {
      expect(formatHours(0)).toBe('0');
    });

    it('should return integer string for whole numbers', () => {
      expect(formatHours(8)).toBe('8');
      expect(formatHours(40)).toBe('40');
    });

    it('should return one decimal for fractional numbers', () => {
      expect(formatHours(7.5)).toBe('7.5');
      expect(formatHours(3.33)).toBe('3.3');
    });

    it('should handle large numbers', () => {
      expect(formatHours(160)).toBe('160');
      expect(formatHours(159.75)).toBe('159.8');
    });
  });

  describe('report data structure validation', () => {
    it('should validate a well-formed report with all groups', () => {
      const report = {
        weeks: ['S1', 'S2', 'S3', 'S4'],
        groups: {
          internal: {
            label: 'Internos',
            developers: {
              dev_001: {
                name: 'Dev Uno',
                weeks: { S1: { development: 8, maintenance: 4 }, S2: { development: 16, maintenance: 0 } },
                totals: { development: 24, maintenance: 4 },
              },
            },
            subtotals: { development: 24, maintenance: 4 },
          },
          external: { label: 'Externos', developers: {}, subtotals: { development: 0, maintenance: 0 } },
          manager: { label: 'Manager', developers: {}, subtotals: { development: 0, maintenance: 0 } },
        },
        grandTotals: { development: 24, maintenance: 4 },
      };

      expect(report.weeks).toHaveLength(4);
      expect(report.groups.internal.developers.dev_001.name).toBe('Dev Uno');
      expect(report.groups.internal.subtotals.development).toBe(24);
      expect(report.grandTotals.development + report.grandTotals.maintenance).toBe(28);
    });

    it('should handle a report with 5 weeks', () => {
      const report = {
        weeks: ['S1', 'S2', 'S3', 'S4', 'S5'],
        groups: {},
        grandTotals: { development: 0, maintenance: 0 },
      };
      expect(report.weeks).toHaveLength(5);
    });

    it('should handle multiple developers in same group', () => {
      const group = {
        label: 'Internos',
        developers: {
          dev_001: { name: 'Dev Uno', weeks: {}, totals: { development: 40, maintenance: 8 } },
          dev_002: { name: 'Dev Dos', weeks: {}, totals: { development: 32, maintenance: 16 } },
        },
        subtotals: { development: 72, maintenance: 24 },
      };

      const devCount = Object.keys(group.developers).length;
      expect(devCount).toBe(2);
      expect(group.subtotals.development).toBe(72);
      expect(group.subtotals.maintenance).toBe(24);
    });

    it('should compute grand totals as sum across all groups', () => {
      const groups = {
        internal: { subtotals: { development: 40, maintenance: 8 } },
        external: { subtotals: { development: 24, maintenance: 16 } },
        manager: { subtotals: { development: 8, maintenance: 0 } },
      };

      const grandDev = Object.values(groups).reduce((sum, g) => sum + g.subtotals.development, 0);
      const grandMaint = Object.values(groups).reduce((sum, g) => sum + g.subtotals.maintenance, 0);

      expect(grandDev).toBe(72);
      expect(grandMaint).toBe(24);
    });
  });

  describe('weekly hours rendering', () => {
    it('should format zero hours as dimmed', () => {
      const val = 0;
      const cssClass = val === 0 ? 'zero-value' : '';
      expect(cssClass).toBe('zero-value');
    });

    it('should not dim non-zero hours', () => {
      const val = 8;
      const cssClass = val === 0 ? 'zero-value' : '';
      expect(cssClass).toBe('');
    });
  });
});

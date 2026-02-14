import { describe, expect, it } from 'vitest';
import { toDateKey, filterDownloadEvents, buildCountsByDate, buildRowsForCsv, buildCsv } from '../../public/js/utils/download-stats-utils.js';

describe('download stats utils', () => {
  it('normalizes ISO date to YYYY-MM-DD', () => {
    expect(toDateKey('2025-12-22T10:00:00.000Z')).toBe('2025-12-22');
  });

  it('filters by file key and date range', () => {
    const events = [
      { fileKey: 'a', downloadedAt: '2025-12-20T10:00:00Z' },
      { fileKey: 'b', downloadedAt: '2025-12-21T10:00:00Z' },
      { fileKey: 'a', downloadedAt: '2025-12-22T10:00:00Z' }
    ];
    const filtered = filterDownloadEvents(events, { fileKey: 'a', from: '2025-12-21', to: '2025-12-22' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].downloadedAt).toBe('2025-12-22T10:00:00Z');
  });

  it('builds counts and csv rows', () => {
    const events = [
      { fileKey: 'a', fileName: 'AppA', downloadedAt: '2025-12-22T10:00:00Z' },
      { fileKey: 'a', fileName: 'AppA', downloadedAt: '2025-12-22T11:00:00Z' },
      { fileKey: 'b', fileName: 'AppB', downloadedAt: '2025-12-23T10:00:00Z' }
    ];
    const counts = buildCountsByDate(events);
    expect(counts['2025-12-22']).toBe(2);
    expect(counts['2025-12-23']).toBe(1);

    const rows = buildRowsForCsv(events);
    expect(rows).toHaveLength(2);
    const csv = buildCsv(rows);
    expect(csv.split('\n')[0]).toBe('date,file,count');
  });
});

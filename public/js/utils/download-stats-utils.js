export const toDateKey = (isoString = '') => {
  if (!isoString || typeof isoString !== 'string') return '';
  return isoString.slice(0, 10);
};

export const flattenDownloadEvents = (eventsByFile = {}) => {
  const result = [];
  Object.entries(eventsByFile || {}).forEach(([fileKey, events]) => {
    Object.values(events || {}).forEach((event) => {
      if (!event || typeof event !== 'object') return;
      result.push({
        fileKey,
        fileName: event.fileName || '',
        downloadedAt: event.downloadedAt || '',
        source: event.source || ''
      });
    });
  });
  return result;
};

export const filterDownloadEvents = (events = [], { fileKey = 'all', from = '', to = '' } = {}) => {
  const fromDate = from ? new Date(`${from}T00:00:00Z`) : null;
  const toDate = to ? new Date(`${to}T23:59:59Z`) : null;

  return events.filter((event) => {
    if (fileKey !== 'all' && event.fileKey !== fileKey) {
      return false;
    }
    if (!event.downloadedAt) {
      return false;
    }
    const eventDate = new Date(event.downloadedAt);
    if (Number.isNaN(eventDate.getTime())) {
      return false;
    }
    if (fromDate && eventDate < fromDate) {
      return false;
    }
    if (toDate && eventDate > toDate) {
      return false;
    }
    return true;
  });
};

export const buildCountsByDate = (events = []) => {
  const counts = {};
  events.forEach((event) => {
    const key = toDateKey(event.downloadedAt);
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

export const buildRowsForCsv = (events = []) => {
  const counts = new Map();
  events.forEach((event) => {
    const dateKey = toDateKey(event.downloadedAt);
    if (!dateKey) return;
    const fileName = event.fileName || '';
    const key = `${dateKey}::${fileName}`;
    counts.set(key, {
      date: dateKey,
      fileName,
      count: (counts.get(key)?.count || 0) + 1
    });
  });
  return Array.from(counts.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const buildCsv = (rows = []) => {
  const header = 'date,file,count';
  const body = rows.map((row) => {
    const safeName = (row.fileName || '').replace(/"/g, '""');
    return `${row.date},"${safeName}",${row.count}`;
  });
  return [header, ...body].join('\n');
};

const normalizeEmail = (email) => (email || '').toString().trim().toLowerCase();
const normalizeName = (name) => (name || '').toString().trim();

const deriveNameFromEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const localPart = email.split('@')[0] || '';
  if (!localPart) return '';
  return localPart
    .replace(/#ext#/gi, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const isIdKey = (value, prefix) => {
  if (!prefix) return false;
  return typeof value === 'string' && value.startsWith(prefix);
};

const isEmail = (value) => typeof value === 'string' && value.includes('@');

const buildEntry = ({ id = '', email = '', name = '', active = true } = {}) => {
  const normalizedEmail = normalizeEmail(email);
  let normalizedName = normalizeName(name);
  if (!normalizedName && normalizedEmail) {
    normalizedName = deriveNameFromEmail(normalizedEmail);
  }
  return {
    id: (id || '').toString().trim(),
    email: normalizedEmail,
    name: normalizedName,
    active: active !== false
  };
};

const mergeEntry = (target, source) => ({
  id: target.id || source.id,
  email: target.email || source.email,
  name: target.name || source.name,
  active: target.active && source.active
});

export const normalizeProjectPeople = (rawData, options = {}) => {
  const { type = '' } = options;
  const prefix = type === 'developer' ? 'dev_' : type === 'stakeholder' ? 'stk_' : '';
  const entries = [];

  const addEntry = (entry, key = '') => {
    const keyStr = (key || '').toString().trim();
    if (!entry && entry !== 0) {
      return;
    }

    if (typeof entry === 'string') {
      if (isIdKey(entry, prefix)) {
        entries.push(buildEntry({ id: entry, name: keyStr && !isIdKey(keyStr, prefix) ? keyStr : '' }));
        return;
      }
      if (isEmail(entry)) {
        entries.push(buildEntry({
          id: isIdKey(keyStr, prefix) ? keyStr : '',
          email: entry,
          name: !isIdKey(keyStr, prefix) && !isEmail(keyStr) ? keyStr : ''
        }));
        return;
      }
      entries.push(buildEntry({
        id: isIdKey(keyStr, prefix) ? keyStr : '',
        name: entry
      }));
      return;
    }

    if (typeof entry === 'object') {
      const idCandidate = entry.id || entry.devId || entry.stkId || '';
      const emailCandidate = entry.email || entry.mail || entry.value || entry.address || '';
      const nameCandidate = entry.name || entry.display || entry.label || entry.fullName || entry.title || '';
      const activeCandidate = entry.active !== false;

      entries.push(buildEntry({
        id: idCandidate || (isIdKey(keyStr, prefix) ? keyStr : ''),
        email: emailCandidate || (isEmail(keyStr) ? keyStr : ''),
        name: nameCandidate || (!isIdKey(keyStr, prefix) && !isEmail(keyStr) ? keyStr : ''),
        active: activeCandidate
      }));
      return;
    }
  };

  if (Array.isArray(rawData)) {
    rawData.forEach(item => addEntry(item));
  } else if (typeof rawData === 'object' && rawData !== null) {
    Object.entries(rawData).forEach(([key, value]) => addEntry(value, key));
  } else if (typeof rawData === 'string') {
    addEntry(rawData);
  }

  const seen = new Map();
  const normalized = [];

  entries.forEach(entry => {
    const key = entry.id || entry.email || entry.name || '';
    if (!key) return;
    if (!seen.has(key)) {
      seen.set(key, normalized.length);
      normalized.push(entry);
    } else {
      const idx = seen.get(key);
      normalized[idx] = mergeEntry(normalized[idx], entry);
    }
  });

  return normalized;
};

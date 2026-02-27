/**
 * Priority utility functions for converting business/dev points to priority ranks.
 *
 * Uses dynamic ranking from the Planning Game formula:
 *   ratio = (businessPoints / devPoints) * 100
 *   rank = position in sorted list of all combinations (descending ratio)
 *
 * Supports 1-5 (25 ranks) and fibonacci (36 ranks) scoring systems.
 * Lower rank = higher priority (1 = highest).
 */

/**
 * Generate a priority map for a given scoring system.
 * Aligned with shared/priority.js (single source of truth).
 * @param {string} scoringSystem - '1-5' or 'fibonacci'
 * @returns {Array<{biz: number, dev: number, ratio: number, priority: number}>}
 */
function generatePriorityMap(scoringSystem = '1-5') {
  const values = scoringSystem === 'fibonacci'
    ? [1, 2, 3, 5, 8, 13]
    : [1, 2, 3, 4, 5];

  const combinations = [];
  for (const biz of values) {
    for (const dev of values) {
      const ratio = (biz / dev) * 100;
      combinations.push({ biz, dev, ratio });
    }
  }

  combinations.sort((a, b) => b.ratio - a.ratio);
  return combinations.map((c, index) => ({
    ...c,
    priority: index + 1
  }));
}

const PRIORITY_MAP_1_5 = generatePriorityMap('1-5');
const PRIORITY_MAP_FIBONACCI = generatePriorityMap('fibonacci');

/**
 * Calculate priority value from business and dev points
 * @param {number} businessPoints - Business points
 * @param {number} devPoints - Development points
 * @returns {number} Priority value (rounded to nearest integer)
 */
export function calculatePriorityValue(businessPoints, devPoints) {
  if (!businessPoints || !devPoints || devPoints === 0) {
    return 0;
  }
  return Math.round((businessPoints * 100) / devPoints);
}

/**
 * Calculate the priority rank for given business/dev points.
 * Uses exact match from the priority map (position-based ranking).
 * @param {number} businessPoints - Business points
 * @param {number} devPoints - Development points
 * @param {string} scoringSystem - '1-5' or 'fibonacci'
 * @returns {number|null} Rank or null if no priority
 */
export function calculatePriorityRank(businessPoints, devPoints, scoringSystem = '1-5') {
  if (!businessPoints || !devPoints || devPoints === 0) return null;

  const ratio = (businessPoints / devPoints) * 100;
  const map = scoringSystem === 'fibonacci' ? PRIORITY_MAP_FIBONACCI : PRIORITY_MAP_1_5;

  for (const entry of map) {
    if (ratio >= entry.ratio) return entry.priority;
  }

  return map.length;
}

/**
 * Find the closest rank for a given priority value.
 * Kept for backward compatibility — prefers exact match from the map.
 * @param {number} value - Calculated priority value
 * @param {string} scoringSystem - '1-5' or 'fibonacci'
 * @returns {number|null} Rank or null if no priority
 */
export function findClosestRank(value, scoringSystem = '1-5') {
  if (!value || value === 0) {
    return null;
  }

  const map = scoringSystem === 'fibonacci' ? PRIORITY_MAP_FIBONACCI : PRIORITY_MAP_1_5;

  // Walk the sorted map: first entry whose ratio <= value is the match
  for (const entry of map) {
    if (value >= entry.ratio) return entry.priority;
  }

  return map.length;
}

/**
 * Get priority display information from business and dev points
 * @param {number} businessPoints - Business points
 * @param {number} devPoints - Development points
 * @param {string} scoringSystem - '1-5' or 'fibonacci'
 * @returns {Object} Priority display info
 */
export function getPriorityDisplay(businessPoints, devPoints, scoringSystem = '1-5') {
  const value = calculatePriorityValue(businessPoints, devPoints);
  const rank = calculatePriorityRank(businessPoints, devPoints, scoringSystem);

  if (rank === null) {
    return {
      label: 'Sin prioridad',
      shortLabel: '—',
      rank: null,
      badge: null,
      value: 0,
      hasPriority: false
    };
  }

  const colorInfo = getPriorityColor(rank, scoringSystem);

  return {
    label: `Prioridad ${rank}`,
    shortLabel: `P${rank}`,
    rank,
    badge: `${value}`,
    value,
    hasPriority: true,
    color: colorInfo.color,
    backgroundColor: colorInfo.backgroundColor
  };
}

/**
 * Get color for priority based on rank.
 * Alpha scales from 1.0 (rank 1) to 0.35 (max rank).
 * @param {number} rank - Priority rank
 * @param {string} scoringSystem - '1-5' or 'fibonacci'
 * @returns {Object} Color info with color and backgroundColor
 */
export function getPriorityColor(rank, scoringSystem = '1-5') {
  const maxRank = scoringSystem === 'fibonacci'
    ? PRIORITY_MAP_FIBONACCI.length
    : PRIORITY_MAP_1_5.length;

  if (!rank || rank < 1 || rank > maxRank) {
    return {
      color: 'var(--text-secondary)',
      backgroundColor: 'var(--bg-muted)'
    };
  }

  // Base color: #e600ce (magenta)
  const minAlpha = 0.35;
  const maxAlpha = 1.0;
  const alpha = maxRank === 1
    ? maxAlpha
    : maxAlpha - ((rank - 1) / (maxRank - 1)) * (maxAlpha - minAlpha);

  return {
    color: 'white',
    backgroundColor: `rgba(230, 0, 206, ${alpha.toFixed(2)})`
  };
}

/**
 * Get all possible priority values sorted by rank
 * @param {string} scoringSystem - '1-5' or 'fibonacci'
 * @returns {Array} Array of {rank, value, biz, dev} objects
 */
export function getAllPriorityRanks(scoringSystem = '1-5') {
  const map = scoringSystem === 'fibonacci' ? PRIORITY_MAP_FIBONACCI : PRIORITY_MAP_1_5;
  return map.map(entry => ({
    rank: entry.priority,
    value: Math.round(entry.ratio),
    biz: entry.biz,
    dev: entry.dev
  }));
}

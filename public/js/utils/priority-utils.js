/**
 * Priority utility functions for converting business/dev points to priority ranks
 *
 * Priority is calculated as (businessPoints * 100) / devPoints
 * Lower rank = higher priority (1 is highest, 18 is lowest)
 */

// Map of calculated priority values to their rank (1-18)
const PRIORITY_VALUE_TO_RANK = new Map([
  [500, 1],   // 5/1
  [400, 2],   // 4/1
  [300, 3],   // 3/1
  [250, 4],   // 5/2
  [200, 5],   // 2/1
  [150, 6],   // 3/2
  [133, 7],   // 4/3
  [125, 8],   // 5/4
  [100, 9],   // x/x (equal points)
  [80, 10],   // 4/5
  [75, 11],   // 3/4
  [67, 12],   // 2/3
  [60, 13],   // 3/5
  [50, 14],   // 1/2
  [40, 15],   // 2/5
  [33, 16],   // 1/3
  [25, 17],   // 1/4
  [20, 18]    // 1/5
]);

/**
 * Calculate priority value from business and dev points
 * @param {number} businessPoints - Business points (1-5)
 * @param {number} devPoints - Development points (1-5)
 * @returns {number} Priority value (rounded to nearest integer)
 */
export function calculatePriorityValue(businessPoints, devPoints) {
  if (!businessPoints || !devPoints || devPoints === 0) {
    return 0;
  }
  return Math.round((businessPoints * 100) / devPoints);
}

/**
 * Find the closest rank for a given priority value
 * @param {number} value - Calculated priority value
 * @returns {number|null} Rank (1-18) or null if no priority
 */
export function findClosestRank(value) {
  if (!value || value === 0) {
    return null;
  }

  // Direct match
  if (PRIORITY_VALUE_TO_RANK.has(value)) {
    return PRIORITY_VALUE_TO_RANK.get(value);
  }

  // Find closest value
  const sortedValues = Array.from(PRIORITY_VALUE_TO_RANK.keys()).sort((a, b) => b - a);
  let closestValue = sortedValues[0];
  let minDiff = Math.abs(value - closestValue);

  for (const v of sortedValues) {
    const diff = Math.abs(value - v);
    if (diff < minDiff) {
      minDiff = diff;
      closestValue = v;
    }
  }

  return PRIORITY_VALUE_TO_RANK.get(closestValue);
}

/**
 * Get priority display information from business and dev points
 * @param {number} businessPoints - Business points (1-5)
 * @param {number} devPoints - Development points (1-5)
 * @returns {Object} Priority display info
 */
export function getPriorityDisplay(businessPoints, devPoints) {
  const value = calculatePriorityValue(businessPoints, devPoints);
  const rank = findClosestRank(value);

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

  // Calculate color intensity based on rank (1 = most intense, 18 = most faded)
  const colorInfo = getPriorityColor(rank);

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
 * Get color for priority based on rank
 * Rank 1 (highest priority) = most intense color
 * Rank 18 (lowest priority) = most faded/transparent color
 * @param {number} rank - Priority rank (1-18)
 * @returns {Object} Color info with color and backgroundColor
 */
export function getPriorityColor(rank) {
  if (!rank || rank < 1 || rank > 18) {
    return {
      color: 'var(--text-secondary)',
      backgroundColor: 'var(--bg-muted)'
    };
  }

  // Base color: #e600ce (magenta)
  // Calculate alpha from 1.0 (rank 1) to 0.3 (rank 18)
  const maxRank = 18;
  const minAlpha = 0.35;
  const maxAlpha = 1.0;
  const alpha = maxAlpha - ((rank - 1) / (maxRank - 1)) * (maxAlpha - minAlpha);

  return {
    color: 'white',
    backgroundColor: `rgba(230, 0, 206, ${alpha.toFixed(2)})`
  };
}

/**
 * Get all possible priority values sorted by rank
 * @returns {Array} Array of {rank, value, ratio} objects
 */
export function getAllPriorityRanks() {
  return Array.from(PRIORITY_VALUE_TO_RANK.entries())
    .map(([value, rank]) => ({ rank, value }))
    .sort((a, b) => a.rank - b.rank);
}

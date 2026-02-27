/**
 * Priority calculation using Planning Game formula.
 * Supports both 1-5 and fibonacci scoring systems.
 *
 * Priority = ranking by ratio (businessPoints / devPoints) * 100
 * Lower rank = higher priority (1 = highest).
 */

export function generatePriorityMap(scoringSystem = '1-5') {
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

export const PRIORITY_MAP_1_5 = generatePriorityMap('1-5');
export const PRIORITY_MAP_FIBONACCI = generatePriorityMap('fibonacci');

export function calculatePriority(businessPoints, devPoints, scoringSystem = '1-5') {
  if (!businessPoints || !devPoints || devPoints === 0) return null;

  const ratio = (businessPoints / devPoints) * 100;
  const map = scoringSystem === 'fibonacci' ? PRIORITY_MAP_FIBONACCI : PRIORITY_MAP_1_5;

  for (const entry of map) {
    if (ratio >= entry.ratio) return entry.priority;
  }

  return map.length;
}

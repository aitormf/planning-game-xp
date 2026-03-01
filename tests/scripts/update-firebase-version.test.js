/**
 * Tests for update-firebase-version.cjs URL normalization logic.
 */
import { describe, it, expect } from 'vitest';

/**
 * Replicate the URL normalization logic from update-firebase-version.cjs
 */
function normalizeDatabaseUrl(url) {
  const regionMatch = url.match(/^(https:\/\/[^.]+)\.[^.]+\.firebasedatabase\.app\/?$/);
  if (regionMatch) {
    return `${regionMatch[1]}.firebaseio.com`;
  }
  return url;
}

describe('normalizeDatabaseUrl', () => {
  it('should convert europe-west1 firebasedatabase.app URL to firebaseio.com', () => {
    const input = 'https://pgamexp-demo-default-rtdb.europe-west1.firebasedatabase.app';
    expect(normalizeDatabaseUrl(input)).toBe('https://pgamexp-demo-default-rtdb.firebaseio.com');
  });

  it('should convert us-central1 firebasedatabase.app URL to firebaseio.com', () => {
    const input = 'https://my-project-default-rtdb.us-central1.firebasedatabase.app';
    expect(normalizeDatabaseUrl(input)).toBe('https://my-project-default-rtdb.firebaseio.com');
  });

  it('should handle trailing slash', () => {
    const input = 'https://pgamexp-demo-default-rtdb.europe-west1.firebasedatabase.app/';
    expect(normalizeDatabaseUrl(input)).toBe('https://pgamexp-demo-default-rtdb.firebaseio.com');
  });

  it('should leave firebaseio.com URLs unchanged', () => {
    const input = 'https://planning-gamexp-default-rtdb.firebaseio.com';
    expect(normalizeDatabaseUrl(input)).toBe(input);
  });

  it('should leave already-correct URLs unchanged', () => {
    const input = 'https://planning-game-xp-default-rtdb.firebaseio.com';
    expect(normalizeDatabaseUrl(input)).toBe(input);
  });
});

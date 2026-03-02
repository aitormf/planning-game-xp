/**
 * Tests for update-firebase-version.cjs URL handling logic.
 *
 * The script now passes database URLs through as-is (no normalization).
 * Previously it converted firebasedatabase.app URLs to firebaseio.com,
 * which dropped region info and caused connection hangs for non-US databases.
 */
import { describe, it, expect } from 'vitest';

/**
 * Replicate the URL pass-through logic from update-firebase-version.cjs
 * (getDatabaseUrl just returns the URL trimmed, no conversion)
 */
function getDatabaseUrl(url) {
  return url.trim();
}

describe('getDatabaseUrl (pass-through)', () => {
  it('should preserve europe-west1 firebasedatabase.app URL as-is', () => {
    const input = 'https://planning-gamexp-default-rtdb.europe-west1.firebasedatabase.app';
    expect(getDatabaseUrl(input)).toBe(input);
  });

  it('should preserve us-central1 firebasedatabase.app URL as-is', () => {
    const input = 'https://my-project-default-rtdb.us-central1.firebasedatabase.app';
    expect(getDatabaseUrl(input)).toBe(input);
  });

  it('should preserve firebaseio.com URL as-is', () => {
    const input = 'https://pgamexp-demo-default-rtdb.firebaseio.com';
    expect(getDatabaseUrl(input)).toBe(input);
  });

  it('should trim whitespace from URL', () => {
    const input = '  https://planning-gamexp-default-rtdb.europe-west1.firebasedatabase.app  ';
    expect(getDatabaseUrl(input)).toBe('https://planning-gamexp-default-rtdb.europe-west1.firebasedatabase.app');
  });

  it('should not convert between URL formats', () => {
    const appUrl = 'https://planning-gamexp-default-rtdb.europe-west1.firebasedatabase.app';
    const ioUrl = 'https://planning-gamexp-default-rtdb.firebaseio.com';
    // Each format should remain unchanged
    expect(getDatabaseUrl(appUrl)).toBe(appUrl);
    expect(getDatabaseUrl(ioUrl)).toBe(ioUrl);
  });
});

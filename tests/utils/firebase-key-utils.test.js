import { describe, expect, it } from 'vitest';
import { toFirebaseKey } from '../../public/js/utils/firebase-key-utils.js';

describe('toFirebaseKey', () => {
  it('replaces forbidden firebase key characters', () => {
    expect(toFirebaseKey('file.name/with#bad$chars[]')).toBe('file_name_with_bad_chars__');
  });

  it('returns a string for non-string values', () => {
    expect(toFirebaseKey(123)).toBe('123');
  });
});

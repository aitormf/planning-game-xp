import { vi } from 'vitest';

export const database = {};
export const ref = vi.fn((db, path) => ({ db, path }));
export const push = vi.fn((refObj, value) => ({ refObj, value, key: 'test-key' }));
export const get = vi.fn();
export const query = vi.fn();
export const orderByChild = vi.fn();
export const limitToLast = vi.fn();
export const onValue = vi.fn((queryRef, callback) => {
  if (callback) {
    callback({ exists: () => false, val: () => null });
  }
  return () => {};
});
export const set = vi.fn();
export const runDbTransaction = vi.fn();
export const auth = { currentUser: null };
export const firebaseConfig = {};
export const functions = {};
export const httpsCallable = vi.fn();

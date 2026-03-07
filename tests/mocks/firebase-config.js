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
export const update = vi.fn();
export const remove = vi.fn();
export const runDbTransaction = vi.fn();
export const runTransaction = vi.fn();
export const auth = { currentUser: null };
export const firebaseConfig = {};
export const functions = {};
export const httpsCallable = vi.fn();
export const databaseFirestore = {};
export const doc = vi.fn();
export const getDoc = vi.fn();
export const setDoc = vi.fn();
export const superAdminEmail = 'test@test.com';
export const signOut = vi.fn();
export const signInWithPopup = vi.fn();
export const signInWithEmailAndPassword = vi.fn();
export const onAuthStateChanged = vi.fn();
export const vapidKey = '';
export const connectDatabaseEmulator = vi.fn();
export const connectStorageEmulator = vi.fn();
export const OAuthProvider = vi.fn();
export const GoogleAuthProvider = vi.fn();

/**
 * @fileoverview RTDB implementation of BaseRepository.
 *
 * Supports both Firebase Admin SDK and Client SDK through an adapter pattern.
 * The caller provides an adapter object with the actual Firebase functions.
 *
 * @module shared/dal/rtdb/base-rtdb-repository
 */

import { BaseRepository } from '../base-repository.js';

/**
 * @typedef {Object} RtdbAdapter
 * @property {Function} read - (path) => Promise<data|null>
 * @property {Function} write - (path, data) => Promise<void>
 * @property {Function} update - (path, updates) => Promise<void>
 * @property {Function} push - (path, data) => Promise<string> (returns generated key)
 * @property {Function} remove - (path) => Promise<void>
 * @property {Function} subscribe - (path, callback) => unsubscribeFn
 * @property {Function} transaction - (path, updateFn) => Promise<result>
 * @property {Function} multiUpdate - (pathUpdates) => Promise<void>
 */

export class RtdbBaseRepository extends BaseRepository {
  /**
   * @param {RtdbAdapter} adapter - Firebase SDK adapter
   */
  constructor(adapter) {
    super('rtdb');
    if (!adapter) {
      throw new Error('RtdbBaseRepository requires an adapter');
    }
    this._adapter = adapter;
  }

  async read(path) {
    return this._adapter.read(path);
  }

  async write(path, data) {
    return this._adapter.write(path, data);
  }

  async update(path, updates) {
    return this._adapter.update(path, updates);
  }

  async push(path, data) {
    return this._adapter.push(path, data);
  }

  async remove(path) {
    return this._adapter.remove(path);
  }

  subscribe(path, callback) {
    return this._adapter.subscribe(path, callback);
  }

  async transaction(path, updateFn) {
    return this._adapter.transaction(path, updateFn);
  }

  async multiUpdate(pathUpdates) {
    return this._adapter.multiUpdate(pathUpdates);
  }
}

/**
 * Create an adapter for Firebase Admin SDK (Node.js / MCP server).
 * @param {Object} db - Firebase Admin database instance (admin.database())
 * @returns {RtdbAdapter}
 */
export function createAdminAdapter(db) {
  return {
    async read(path) {
      const snapshot = await db.ref(path).once('value');
      return snapshot.val();
    },

    async write(path, data) {
      await db.ref(path).set(data);
    },

    async update(path, updates) {
      await db.ref(path).update(updates);
    },

    async push(path, data) {
      const newRef = db.ref(path).push();
      await newRef.set(data);
      return newRef.key;
    },

    async remove(path) {
      await db.ref(path).remove();
    },

    subscribe(path, callback) {
      const ref = db.ref(path);
      const handler = (snapshot) => callback(snapshot.val());
      ref.on('value', handler);
      return () => ref.off('value', handler);
    },

    async transaction(path, updateFn) {
      const ref = db.ref(path);
      const result = await ref.transaction(updateFn);
      return result.snapshot.val();
    },

    async multiUpdate(pathUpdates) {
      await db.ref().update(pathUpdates);
    }
  };
}

/**
 * Create an adapter for Firebase Client SDK (browser / web app).
 * @param {Object} deps - Client SDK functions
 * @param {Object} deps.database - Firebase database instance
 * @param {Function} deps.ref - ref() function
 * @param {Function} deps.get - get() function
 * @param {Function} deps.set - set() function
 * @param {Function} deps.update - update() function
 * @param {Function} deps.push - push() function
 * @param {Function} deps.remove - remove() function
 * @param {Function} deps.onValue - onValue() function
 * @param {Function} deps.off - off() function
 * @param {Function} deps.runTransaction - runTransaction() function
 * @returns {RtdbAdapter}
 */
export function createClientAdapter(deps) {
  const { database, ref, get, set, update, push, remove, onValue, off, runTransaction } = deps;

  return {
    async read(path) {
      const snapshot = await get(ref(database, path));
      return snapshot.exists() ? snapshot.val() : null;
    },

    async write(path, data) {
      await set(ref(database, path), data);
    },

    async update(path, updates) {
      await update(ref(database, path), updates);
    },

    async push(path, data) {
      const newRef = push(ref(database, path));
      await set(newRef, data);
      return newRef.key;
    },

    async remove(path) {
      await remove(ref(database, path));
    },

    subscribe(path, callback) {
      const dbRef = ref(database, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
      });
      return unsubscribe;
    },

    async transaction(path, updateFn) {
      const dbRef = ref(database, path);
      const result = await runTransaction(dbRef, updateFn);
      return result.snapshot.val();
    },

    async multiUpdate(pathUpdates) {
      await update(ref(database), pathUpdates);
    }
  };
}

/**
 * @fileoverview Firestore implementation of BaseRepository.
 *
 * Supports both Firebase Admin SDK and Client SDK through an adapter pattern.
 * Firestore uses collections/documents instead of flat paths.
 *
 * Path mapping from RTDB to Firestore:
 * - /projects/{id} → collection "projects", doc {id}
 * - /cards/{projectId}/{SECTION}_{projectId}/{firebaseId} → collection "projects/{projectId}/{section}", doc {firebaseId}
 * - /adrs/{projectId}/{adrId} → collection "projects/{projectId}/adrs", doc {adrId}
 *
 * @module shared/dal/firestore/base-firestore-repository
 */

import { BaseRepository } from '../base-repository.js';

/**
 * @typedef {Object} FirestoreAdapter
 * @property {Function} getDoc - (collectionPath, docId) => Promise<data|null>
 * @property {Function} listDocs - (collectionPath) => Promise<Object<id, data>>
 * @property {Function} setDoc - (collectionPath, docId, data, options?) => Promise<void>
 * @property {Function} updateDoc - (collectionPath, docId, updates) => Promise<void>
 * @property {Function} addDoc - (collectionPath, data) => Promise<string> (returns generated ID)
 * @property {Function} deleteDoc - (collectionPath, docId) => Promise<void>
 * @property {Function} subscribe - (collectionPath, docId, callback) => unsubscribeFn
 * @property {Function} query - (collectionPath, filters) => Promise<Object<id, data>>
 * @property {Function} transaction - (fn) => Promise<result>
 * @property {Function} batch - () => BatchWriter
 */

export class FirestoreBaseRepository extends BaseRepository {
  /**
   * @param {FirestoreAdapter} adapter - Firestore SDK adapter
   */
  constructor(adapter) {
    super('firestore');
    if (!adapter) {
      throw new Error('FirestoreBaseRepository requires an adapter');
    }
    this._adapter = adapter;
  }

  /**
   * Read a single document.
   * @param {string} path - Slash-separated path where last segment is doc ID
   *   e.g., "projects/PlanningGame" → collection "projects", doc "PlanningGame"
   */
  async read(path) {
    const { collection, docId } = FirestoreBaseRepository.parsePath(path);
    if (!docId) {
      return this._adapter.listDocs(collection);
    }
    return this._adapter.getDoc(collection, docId);
  }

  async write(path, data) {
    const { collection, docId } = FirestoreBaseRepository.parsePath(path);
    if (!docId) throw new Error('Cannot write to a collection path without document ID');
    await this._adapter.setDoc(collection, docId, data);
  }

  async update(path, updates) {
    const { collection, docId } = FirestoreBaseRepository.parsePath(path);
    if (!docId) throw new Error('Cannot update a collection path without document ID');
    await this._adapter.updateDoc(collection, docId, updates);
  }

  async push(path, data) {
    const { collection } = FirestoreBaseRepository.parsePath(path);
    return this._adapter.addDoc(collection, data);
  }

  async remove(path) {
    const { collection, docId } = FirestoreBaseRepository.parsePath(path);
    if (!docId) throw new Error('Cannot remove a collection path without document ID');
    await this._adapter.deleteDoc(collection, docId);
  }

  subscribe(path, callback) {
    const { collection, docId } = FirestoreBaseRepository.parsePath(path);
    return this._adapter.subscribe(collection, docId, callback);
  }

  async transaction(path, updateFn) {
    return this._adapter.transaction(async (txn) => {
      const { collection, docId } = FirestoreBaseRepository.parsePath(path);
      const current = await txn.get(collection, docId);
      const newData = updateFn(current);
      await txn.set(collection, docId, newData);
      return newData;
    });
  }

  async multiUpdate(pathUpdates) {
    const batch = this._adapter.batch();
    for (const [path, value] of Object.entries(pathUpdates)) {
      const { collection, docId } = FirestoreBaseRepository.parsePath(path);
      if (value === null) {
        batch.delete(collection, docId);
      } else {
        batch.set(collection, docId, value);
      }
    }
    await batch.commit();
  }

  /**
   * Parse a slash-separated path into collection and document ID.
   * Even segments = collection path, odd segments = includes doc ID.
   * @param {string} path
   * @returns {{collection: string, docId: string|null}}
   */
  static parsePath(path) {
    const clean = path.replace(/^\/+|\/+$/g, '');
    const segments = clean.split('/');

    if (segments.length % 2 === 0) {
      // Even number of segments: last is docId
      const docId = segments.pop();
      return { collection: segments.join('/'), docId };
    }
    // Odd number: it's a collection path
    return { collection: clean, docId: null };
  }
}

/**
 * Create an adapter for Firebase Admin SDK (Node.js / MCP server).
 * @param {Object} firestore - Firebase Admin Firestore instance
 * @returns {FirestoreAdapter}
 */
export function createAdminFirestoreAdapter(firestore) {
  return {
    async getDoc(collectionPath, docId) {
      const docRef = firestore.collection(collectionPath).doc(docId);
      const snap = await docRef.get();
      return snap.exists ? snap.data() : null;
    },

    async listDocs(collectionPath) {
      const snap = await firestore.collection(collectionPath).get();
      const result = {};
      snap.forEach(doc => { result[doc.id] = doc.data(); });
      return Object.keys(result).length > 0 ? result : null;
    },

    async setDoc(collectionPath, docId, data, options) {
      const docRef = firestore.collection(collectionPath).doc(docId);
      await docRef.set(data, options || {});
    },

    async updateDoc(collectionPath, docId, updates) {
      const docRef = firestore.collection(collectionPath).doc(docId);
      await docRef.update(updates);
    },

    async addDoc(collectionPath, data) {
      const docRef = await firestore.collection(collectionPath).add(data);
      return docRef.id;
    },

    async deleteDoc(collectionPath, docId) {
      await firestore.collection(collectionPath).doc(docId).delete();
    },

    subscribe(collectionPath, docId, callback) {
      if (docId) {
        const unsub = firestore.collection(collectionPath).doc(docId).onSnapshot(snap => {
          callback(snap.exists ? snap.data() : null);
        });
        return unsub;
      }
      const unsub = firestore.collection(collectionPath).onSnapshot(snap => {
        const result = {};
        snap.forEach(doc => { result[doc.id] = doc.data(); });
        callback(Object.keys(result).length > 0 ? result : null);
      });
      return unsub;
    },

    async query(collectionPath, filters) {
      let query = firestore.collection(collectionPath);
      for (const [field, value] of Object.entries(filters)) {
        query = query.where(field, '==', value);
      }
      const snap = await query.get();
      const result = {};
      snap.forEach(doc => { result[doc.id] = doc.data(); });
      return result;
    },

    async transaction(fn) {
      return firestore.runTransaction(async (txn) => {
        const txnHelper = {
          async get(collectionPath, docId) {
            const ref = firestore.collection(collectionPath).doc(docId);
            const snap = await txn.get(ref);
            return snap.exists ? snap.data() : null;
          },
          async set(collectionPath, docId, data) {
            const ref = firestore.collection(collectionPath).doc(docId);
            txn.set(ref, data);
          }
        };
        return fn(txnHelper);
      });
    },

    batch() {
      const b = firestore.batch();
      return {
        set(collectionPath, docId, data) {
          b.set(firestore.collection(collectionPath).doc(docId), data);
        },
        delete(collectionPath, docId) {
          b.delete(firestore.collection(collectionPath).doc(docId));
        },
        async commit() { await b.commit(); }
      };
    }
  };
}

/**
 * Create an adapter for Firebase Client SDK (browser / web app).
 * @param {Object} deps - Client SDK functions
 * @param {Object} deps.firestore - Firestore instance
 * @param {Function} deps.collection - collection() function
 * @param {Function} deps.doc - doc() function
 * @param {Function} deps.getDoc - getDoc() function
 * @param {Function} deps.getDocs - getDocs() function
 * @param {Function} deps.setDoc - setDoc() function
 * @param {Function} deps.updateDoc - updateDoc() function
 * @param {Function} deps.addDoc - addDoc() function
 * @param {Function} deps.deleteDoc - deleteDoc() function
 * @param {Function} deps.onSnapshot - onSnapshot() function
 * @param {Function} deps.query - query() function
 * @param {Function} deps.where - where() function
 * @param {Function} deps.runTransaction - runTransaction() function
 * @param {Function} deps.writeBatch - writeBatch() function
 * @returns {FirestoreAdapter}
 */
export function createClientFirestoreAdapter(deps) {
  const { firestore, collection, doc, getDoc, getDocs, setDoc, updateDoc,
    addDoc, deleteDoc, onSnapshot, query, where, runTransaction, writeBatch } = deps;

  return {
    async getDoc(collectionPath, docId) {
      const docRef = doc(firestore, collectionPath, docId);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    },

    async listDocs(collectionPath) {
      const colRef = collection(firestore, collectionPath);
      const snap = await getDocs(colRef);
      const result = {};
      snap.forEach(d => { result[d.id] = d.data(); });
      return Object.keys(result).length > 0 ? result : null;
    },

    async setDoc(collectionPath, docId, data, options) {
      const docRef = doc(firestore, collectionPath, docId);
      await setDoc(docRef, data, options || {});
    },

    async updateDoc(collectionPath, docId, updates) {
      const docRef = doc(firestore, collectionPath, docId);
      await updateDoc(docRef, updates);
    },

    async addDoc(collectionPath, data) {
      const colRef = collection(firestore, collectionPath);
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    },

    async deleteDoc(collectionPath, docId) {
      const docRef = doc(firestore, collectionPath, docId);
      await deleteDoc(docRef);
    },

    subscribe(collectionPath, docId, callback) {
      if (docId) {
        const docRef = doc(firestore, collectionPath, docId);
        return onSnapshot(docRef, snap => {
          callback(snap.exists() ? snap.data() : null);
        });
      }
      const colRef = collection(firestore, collectionPath);
      return onSnapshot(colRef, snap => {
        const result = {};
        snap.forEach(d => { result[d.id] = d.data(); });
        callback(Object.keys(result).length > 0 ? result : null);
      });
    },

    async query(collectionPath, filters) {
      const colRef = collection(firestore, collectionPath);
      const constraints = Object.entries(filters).map(([field, value]) => where(field, '==', value));
      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      const result = {};
      snap.forEach(d => { result[d.id] = d.data(); });
      return result;
    },

    async transaction(fn) {
      return runTransaction(firestore, async (txn) => {
        const txnHelper = {
          async get(collectionPath, docId) {
            const ref = doc(firestore, collectionPath, docId);
            const snap = await txn.get(ref);
            return snap.exists() ? snap.data() : null;
          },
          async set(collectionPath, docId, data) {
            const ref = doc(firestore, collectionPath, docId);
            txn.set(ref, data);
          }
        };
        return fn(txnHelper);
      });
    },

    batch() {
      const b = writeBatch(firestore);
      return {
        set(collectionPath, docId, data) {
          b.set(doc(firestore, collectionPath, docId), data);
        },
        delete(collectionPath, docId) {
          b.delete(doc(firestore, collectionPath, docId));
        },
        async commit() { await b.commit(); }
      };
    }
  };
}

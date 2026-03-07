/**
 * @fileoverview Firestore-based counter service for atomic ID generation.
 * This always uses Firestore transactions regardless of the main data backend.
 *
 * @module shared/dal/rtdb/rtdb-counter-service
 */

import { CounterService } from '../counter-service.js';

/**
 * @typedef {Object} FirestoreCounterAdapter
 * @property {Function} runTransaction - (counterKey, incrementFn) => Promise<number>
 * @property {Function} getCurrentId - (counterKey) => Promise<number>
 */

export class RtdbCounterService extends CounterService {
  /**
   * @param {FirestoreCounterAdapter} adapter - Firestore adapter for counter operations
   */
  constructor(adapter) {
    super();
    if (!adapter) {
      throw new Error('RtdbCounterService requires a Firestore adapter');
    }
    this._adapter = adapter;
  }

  async nextId(counterKey) {
    const newId = await this._adapter.runTransaction(counterKey);
    return CounterService.formatId(counterKey, newId);
  }

  async currentId(counterKey) {
    return this._adapter.getCurrentId(counterKey);
  }
}

/**
 * Create a counter adapter for Firebase Admin SDK.
 * @param {Object} firestore - Firestore admin instance
 * @param {string} [collection='projectCounters'] - Collection name
 * @returns {FirestoreCounterAdapter}
 */
export function createAdminCounterAdapter(firestore, collection = 'projectCounters') {
  return {
    async runTransaction(counterKey) {
      const counterRef = firestore.collection(collection).doc(counterKey);
      return firestore.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(counterRef);
        let lastId = 0;
        if (docSnap.exists) {
          lastId = docSnap.data().lastId || 0;
        }
        const newId = lastId + 1;
        transaction.set(counterRef, { lastId: newId }, { merge: true });
        return newId;
      });
    },

    async getCurrentId(counterKey) {
      const docSnap = await firestore.collection(collection).doc(counterKey).get();
      if (!docSnap.exists) return 0;
      return docSnap.data().lastId || 0;
    }
  };
}

/**
 * Create a counter adapter for Firebase Client SDK.
 * @param {Object} deps - Client SDK functions
 * @param {Object} deps.firestore - Firestore instance
 * @param {Function} deps.doc - doc() function
 * @param {Function} deps.getDoc - getDoc() function
 * @param {Function} deps.setDoc - setDoc() function
 * @param {Function} deps.runTransaction - runTransaction() function
 * @param {string} [collection='projectCounters'] - Collection name
 * @returns {FirestoreCounterAdapter}
 */
export function createClientCounterAdapter(deps, collection = 'projectCounters') {
  const { firestore, doc, getDoc, setDoc, runTransaction } = deps;

  return {
    async runTransaction(counterKey) {
      const counterRef = doc(firestore, collection, counterKey);
      return runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(counterRef);
        let lastId = 0;
        if (docSnap.exists()) {
          lastId = docSnap.data().lastId || 0;
        }
        const newId = lastId + 1;
        transaction.set(counterRef, { lastId: newId }, { merge: true });
        return newId;
      });
    },

    async getCurrentId(counterKey) {
      const counterRef = doc(firestore, collection, counterKey);
      const docSnap = await getDoc(counterRef);
      if (!docSnap.exists()) return 0;
      return docSnap.data().lastId || 0;
    }
  };
}

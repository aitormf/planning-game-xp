import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  migrateProjects,
  migrateCards,
  verifyMigration,
  sectionToCollection,
  SECTION_TO_COLLECTION,
  BATCH_SIZE
} from '../../scripts/backfill-rtdb-to-firestore.js';

function createMockDb(data = {}) {
  return {
    ref(path) {
      return {
        async once() {
          const keys = path.replace(/^\//, '').split('/');
          let val = data;
          for (const k of keys) {
            val = val?.[k];
          }
          return { val: () => val ?? null };
        }
      };
    }
  };
}

function createMockFirestore() {
  const docs = {};
  const batchOps = [];

  const mockBatch = () => ({
    _ops: [],
    set(docRef, data) {
      batchOps.push({ type: 'set', path: docRef._path, data });
      this._ops.push({ type: 'set', path: docRef._path, data });
    },
    async commit() {
      for (const op of this._ops) {
        docs[op.path] = op.data;
      }
      this._ops = [];
    }
  });

  return {
    _docs: docs,
    _batchOps: batchOps,
    batch: mockBatch,
    collection(name) {
      return {
        doc(id) {
          const docPath = `${name}/${id}`;
          return {
            _path: docPath,
            collection(subName) {
              return {
                doc(subId) {
                  const subPath = `${docPath}/${subName}/${subId}`;
                  return { _path: subPath };
                },
                count() {
                  return {
                    async get() {
                      const prefix = `${docPath}/${subName}/`;
                      const count = Object.keys(docs).filter(k => k.startsWith(prefix)).length;
                      return { data: () => ({ count }) };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

describe('backfill-rtdb-to-firestore', () => {

  describe('sectionToCollection', () => {
    it('should map known section prefixes', () => {
      expect(sectionToCollection('TASKS_PlanningGame')).toBe('tasks');
      expect(sectionToCollection('BUGS_Cinema4D')).toBe('bugs');
      expect(sectionToCollection('EPICS_Extranet')).toBe('epics');
      expect(sectionToCollection('PROPOSALS_Intranet')).toBe('proposals');
      expect(sectionToCollection('SPRINTS_PlanningGame')).toBe('sprints');
      expect(sectionToCollection('QA_PlanningGame')).toBe('qa');
    });

    it('should return null for unknown sections', () => {
      expect(sectionToCollection('UNKNOWN_Project')).toBeNull();
      expect(sectionToCollection('CUSTOM')).toBeNull();
    });
  });

  describe('SECTION_TO_COLLECTION', () => {
    it('should contain all expected mappings', () => {
      expect(Object.keys(SECTION_TO_COLLECTION)).toEqual(
        ['TASKS', 'BUGS', 'EPICS', 'PROPOSALS', 'SPRINTS', 'QA']
      );
    });
  });

  describe('BATCH_SIZE', () => {
    it('should be less than Firestore limit of 500', () => {
      expect(BATCH_SIZE).toBeLessThan(500);
      expect(BATCH_SIZE).toBe(400);
    });
  });

  describe('migrateProjects', () => {
    let db, firestore;

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should return zeros when no projects exist', async () => {
      db = createMockDb({ projects: null });
      firestore = createMockFirestore();

      const result = await migrateProjects(db, firestore, { dryRun: false });
      expect(result).toEqual({ migrated: 0, skipped: 0 });
    });

    it('should migrate all projects in live mode', async () => {
      db = createMockDb({
        projects: {
          PlanningGame: { name: 'PG', abbreviation: 'PLN' },
          Cinema4D: { name: 'C4D', abbreviation: 'C4D' }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateProjects(db, firestore, { dryRun: false });
      expect(result.migrated).toBe(2);
      expect(result.skipped).toBe(0);
      expect(firestore._docs['projects/PlanningGame']).toEqual({ name: 'PG', abbreviation: 'PLN' });
      expect(firestore._docs['projects/Cinema4D']).toEqual({ name: 'C4D', abbreviation: 'C4D' });
    });

    it('should count but not write in dry-run mode', async () => {
      db = createMockDb({
        projects: {
          PlanningGame: { name: 'PG' }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateProjects(db, firestore, { dryRun: true });
      expect(result.migrated).toBe(1);
      expect(Object.keys(firestore._docs)).toHaveLength(0);
    });

    it('should filter by project when projectFilter is set', async () => {
      db = createMockDb({
        projects: {
          PlanningGame: { name: 'PG' },
          Cinema4D: { name: 'C4D' }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateProjects(db, firestore, {
        dryRun: false,
        projectFilter: 'PlanningGame'
      });
      expect(result.migrated).toBe(1);
      expect(result.skipped).toBe(1);
      expect(firestore._docs['projects/PlanningGame']).toBeDefined();
      expect(firestore._docs['projects/Cinema4D']).toBeUndefined();
    });
  });

  describe('migrateCards', () => {
    let db, firestore;

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should return zeros when no cards exist', async () => {
      db = createMockDb({ cards: null });
      firestore = createMockFirestore();

      const result = await migrateCards(db, firestore, { dryRun: false });
      expect(result).toEqual({ migrated: 0, skipped: 0, errors: 0 });
    });

    it('should migrate cards to correct Firestore subcollections', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            TASKS_PlanningGame: {
              'PLN-TSK-0001': { title: 'Task 1', status: 'To Do' },
              'PLN-TSK-0002': { title: 'Task 2', status: 'Done' }
            },
            BUGS_PlanningGame: {
              'PLN-BUG-0001': { title: 'Bug 1', status: 'Created' }
            }
          }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateCards(db, firestore, { dryRun: false });
      expect(result.migrated).toBe(3);
      expect(result.errors).toBe(0);
      expect(firestore._docs['projects/PlanningGame/tasks/PLN-TSK-0001']).toEqual({
        title: 'Task 1', status: 'To Do'
      });
      expect(firestore._docs['projects/PlanningGame/bugs/PLN-BUG-0001']).toEqual({
        title: 'Bug 1', status: 'Created'
      });
    });

    it('should skip unknown sections', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            UNKNOWN_PlanningGame: { 'card-1': { title: 'Unknown' } }
          }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateCards(db, firestore, { dryRun: false });
      expect(result.skipped).toBe(1);
      expect(result.migrated).toBe(0);
    });

    it('should filter cards by project', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            TASKS_PlanningGame: { 'PLN-TSK-0001': { title: 'T1' } }
          },
          Cinema4D: {
            TASKS_Cinema4D: { 'C4D-TSK-0001': { title: 'T2' } }
          }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateCards(db, firestore, {
        dryRun: false,
        projectFilter: 'PlanningGame'
      });
      expect(result.migrated).toBe(1);
      expect(firestore._docs['projects/PlanningGame/tasks/PLN-TSK-0001']).toBeDefined();
      expect(firestore._docs['projects/Cinema4D/tasks/C4D-TSK-0001']).toBeUndefined();
    });

    it('should count but not write in dry-run mode', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            TASKS_PlanningGame: {
              'PLN-TSK-0001': { title: 'T1' },
              'PLN-TSK-0002': { title: 'T2' }
            }
          }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateCards(db, firestore, { dryRun: true });
      expect(result.migrated).toBe(2);
      expect(Object.keys(firestore._docs)).toHaveLength(0);
    });

    it('should handle non-object card sections gracefully', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            TASKS_PlanningGame: 'not-an-object'
          }
        }
      });
      firestore = createMockFirestore();

      const result = await migrateCards(db, firestore, { dryRun: false });
      expect(result.migrated).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should migrate all 6 section types', async () => {
      const sections = {};
      for (const type of ['TASKS', 'BUGS', 'EPICS', 'PROPOSALS', 'SPRINTS', 'QA']) {
        sections[`${type}_Proj`] = { [`card-${type}`]: { title: type } };
      }
      db = createMockDb({ cards: { Proj: sections } });
      firestore = createMockFirestore();

      const result = await migrateCards(db, firestore, { dryRun: false });
      expect(result.migrated).toBe(6);

      for (const collection of ['tasks', 'bugs', 'epics', 'proposals', 'sprints', 'qa']) {
        const key = `projects/Proj/${collection}/card-${collection.toUpperCase()}`;
        // The key uses the section prefix uppercase as card ID
      }
      expect(Object.keys(firestore._docs)).toHaveLength(6);
    });
  });

  describe('verifyMigration', () => {
    let db, firestore;

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should return true when counts match', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            TASKS_PlanningGame: {
              'PLN-TSK-0001': { title: 'T1' },
              'PLN-TSK-0002': { title: 'T2' }
            }
          }
        }
      });
      firestore = createMockFirestore();
      // Pre-populate Firestore docs to match
      firestore._docs['projects/PlanningGame/tasks/PLN-TSK-0001'] = { title: 'T1' };
      firestore._docs['projects/PlanningGame/tasks/PLN-TSK-0002'] = { title: 'T2' };

      const result = await verifyMigration(db, firestore, null);
      expect(result).toBe(true);
    });

    it('should return false when counts mismatch', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            TASKS_PlanningGame: {
              'PLN-TSK-0001': { title: 'T1' },
              'PLN-TSK-0002': { title: 'T2' }
            }
          }
        }
      });
      firestore = createMockFirestore();
      // Only 1 doc in Firestore vs 2 in RTDB
      firestore._docs['projects/PlanningGame/tasks/PLN-TSK-0001'] = { title: 'T1' };

      const result = await verifyMigration(db, firestore, null);
      expect(result).toBe(false);
    });

    it('should filter by project', async () => {
      db = createMockDb({
        cards: {
          PlanningGame: {
            TASKS_PlanningGame: { 'PLN-TSK-0001': { title: 'T1' } }
          },
          Cinema4D: {
            TASKS_Cinema4D: {
              'C4D-TSK-0001': { title: 'T1' },
              'C4D-TSK-0002': { title: 'T2' }
            }
          }
        }
      });
      firestore = createMockFirestore();
      // Only PlanningGame matches
      firestore._docs['projects/PlanningGame/tasks/PLN-TSK-0001'] = { title: 'T1' };
      // Cinema4D has mismatch but should be ignored

      const result = await verifyMigration(db, firestore, 'PlanningGame');
      expect(result).toBe(true);
    });

    it('should return true when no cards exist in RTDB', async () => {
      db = createMockDb({ cards: null });
      firestore = createMockFirestore();

      const result = await verifyMigration(db, firestore, null);
      expect(result).toBe(true);
    });
  });
});

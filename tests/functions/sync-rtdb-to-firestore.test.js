import { describe, it, expect, vi, beforeEach } from 'vitest';

const { handleSyncCardToFirestore, handleSyncProjectToFirestore, sectionToCollection } = await import('../../functions/handlers/sync-rtdb-to-firestore.js');

describe('sync-rtdb-to-firestore', () => {
  let mockFirestore, mockLogger;

  function createMockFirestore() {
    const store = {};
    const mockDoc = (path) => ({
      async set(data) { store[path] = { ...data }; },
      async delete() { delete store[path]; }
    });

    return {
      _store: store,
      collection(name) {
        return {
          doc(id) {
            const docPath = `${name}/${id}`;
            return {
              ...mockDoc(docPath),
              collection(subName) {
                return {
                  doc(subId) {
                    return mockDoc(`${docPath}/${subName}/${subId}`);
                  }
                };
              }
            };
          }
        };
      }
    };
  }

  beforeEach(() => {
    mockFirestore = createMockFirestore();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
  });

  describe('sectionToCollection', () => {
    it('should map TASKS_* to tasks', () => {
      expect(sectionToCollection('TASKS_PlanningGame')).toBe('tasks');
    });

    it('should map BUGS_* to bugs', () => {
      expect(sectionToCollection('BUGS_Cinema4D')).toBe('bugs');
    });

    it('should map EPICS_* to epics', () => {
      expect(sectionToCollection('EPICS_PlanningGame')).toBe('epics');
    });

    it('should map SPRINTS_* to sprints', () => {
      expect(sectionToCollection('SPRINTS_PlanningGame')).toBe('sprints');
    });

    it('should map PROPOSALS_* to proposals', () => {
      expect(sectionToCollection('PROPOSALS_PlanningGame')).toBe('proposals');
    });

    it('should map QA_* to qa', () => {
      expect(sectionToCollection('QA_PlanningGame')).toBe('qa');
    });

    it('should return null for unknown sections', () => {
      expect(sectionToCollection('UNKNOWN_PlanningGame')).toBeNull();
    });
  });

  describe('handleSyncCardToFirestore', () => {
    const deps = () => ({ firestore: mockFirestore, logger: mockLogger });

    it('should create card in Firestore when RTDB card is created', async () => {
      const cardData = { cardId: 'PLN-TSK-0001', title: 'Test', status: 'To Do' };

      await handleSyncCardToFirestore(
        { projectId: 'PlanningGame', section: 'TASKS_PlanningGame', cardId: '-abc123' },
        null,
        cardData,
        deps()
      );

      const stored = mockFirestore._store['projects/PlanningGame/tasks/-abc123'];
      expect(stored).toEqual(cardData);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created Firestore')
      );
    });

    it('should update card in Firestore when RTDB card is updated', async () => {
      const before = { cardId: 'PLN-TSK-0001', status: 'To Do' };
      const after = { cardId: 'PLN-TSK-0001', status: 'In Progress' };

      await handleSyncCardToFirestore(
        { projectId: 'PlanningGame', section: 'TASKS_PlanningGame', cardId: '-abc123' },
        before,
        after,
        deps()
      );

      const stored = mockFirestore._store['projects/PlanningGame/tasks/-abc123'];
      expect(stored.status).toBe('In Progress');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Updated Firestore')
      );
    });

    it('should delete card in Firestore when RTDB card is deleted', async () => {
      mockFirestore._store['projects/PlanningGame/tasks/-abc123'] = { title: 'Old' };

      await handleSyncCardToFirestore(
        { projectId: 'PlanningGame', section: 'TASKS_PlanningGame', cardId: '-abc123' },
        { cardId: 'PLN-TSK-0001' },
        null,
        deps()
      );

      expect(mockFirestore._store['projects/PlanningGame/tasks/-abc123']).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deleted Firestore')
      );
    });

    it('should skip unknown sections silently', async () => {
      await handleSyncCardToFirestore(
        { projectId: 'PlanningGame', section: 'UNKNOWN_PlanningGame', cardId: '-abc' },
        null,
        { data: true },
        deps()
      );

      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should sync bugs correctly', async () => {
      const bugData = { cardId: 'PLN-BUG-0001', title: 'Bug', status: 'Created' };

      await handleSyncCardToFirestore(
        { projectId: 'PlanningGame', section: 'BUGS_PlanningGame', cardId: '-bug1' },
        null,
        bugData,
        deps()
      );

      expect(mockFirestore._store['projects/PlanningGame/bugs/-bug1']).toEqual(bugData);
    });

    it('should log errors without throwing', async () => {
      const badFirestore = {
        collection() {
          return {
            doc() {
              return {
                collection() {
                  return {
                    doc() {
                      return {
                        async set() { throw new Error('Firestore unavailable'); }
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };

      await handleSyncCardToFirestore(
        { projectId: 'PG', section: 'TASKS_PG', cardId: '-x' },
        null,
        { data: true },
        { firestore: badFirestore, logger: mockLogger }
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error syncing'),
        expect.objectContaining({ error: 'Firestore unavailable' })
      );
    });
  });

  describe('handleSyncProjectToFirestore', () => {
    const deps = () => ({ firestore: mockFirestore, logger: mockLogger });

    it('should sync project create to Firestore', async () => {
      const projectData = { name: 'New Project', abbreviation: 'NP' };

      await handleSyncProjectToFirestore(
        { projectId: 'NewProject' },
        null,
        projectData,
        deps()
      );

      expect(mockFirestore._store['projects/NewProject']).toEqual(projectData);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Synced Firestore project')
      );
    });

    it('should sync project update to Firestore', async () => {
      const before = { name: 'PG', version: '1.0' };
      const after = { name: 'PG', version: '2.0' };

      await handleSyncProjectToFirestore(
        { projectId: 'PG' },
        before,
        after,
        deps()
      );

      expect(mockFirestore._store['projects/PG'].version).toBe('2.0');
    });

    it('should delete project from Firestore', async () => {
      mockFirestore._store['projects/PG'] = { name: 'PG' };

      await handleSyncProjectToFirestore(
        { projectId: 'PG' },
        { name: 'PG' },
        null,
        deps()
      );

      expect(mockFirestore._store['projects/PG']).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deleted Firestore project')
      );
    });
  });
});

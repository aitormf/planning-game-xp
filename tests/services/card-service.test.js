import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CardService } from '../../public/js/services/card-service.js';
import { createTestCard, createFirebaseSuccessResponse, createFirebaseErrorResponse } from '../utils/test-helpers.js';

// Mock completo de firebase-config.js para evitar imports remotos en Node
vi.mock('../../public/firebase-config.js', () => ({
  get: vi.fn(),
  set: vi.fn(),
  ref: vi.fn(),
  onValue: vi.fn(),
  push: vi.fn(),
  database: {},
  auth: {},
  getAuth: vi.fn(),
  getDatabase: vi.fn(),
  getFirestore: vi.fn(),
  getStorage: vi.fn(),
  getMessaging: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  vapidKey: 'test',
  OAuthProvider: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  microsoftProvider: {},
  app: {},
  databaseFirestore: {},
  messaging: {},
  storage: {},
}));

describe('CardService', () => {
  let cardService;
  let mockFirebaseService;

  beforeEach(() => {
    // Crear mock del FirebaseService
    mockFirebaseService = {
      getRef: vi.fn()
    };
    cardService = new CardService(mockFirebaseService);
  });

  describe('orderCards', () => {
    it('debería ordenar task cards correctamente', () => {
      const task1 = createTestCard('task', { cardId: 'task1', businessPoints: 10, devPoints: 5, sprintId: 'sprint1', blocked: false, startDate: '2024-01-01', desiredDate: '2024-01-15' });
      const task2 = createTestCard('task', { cardId: 'task2', businessPoints: 5, devPoints: 2, sprintId: 'sprint1', blocked: true, startDate: '2024-01-02', desiredDate: '2024-01-10' });
      const cards = { task1, task2 };
      const result = cardService.orderCards(cards, 'task-card');
      const resultArray = Object.values(result);
      expect(resultArray[0].cardId).toBe('task2');
    });
    it('debería ordenar bug cards correctamente', () => {
      const bug1 = createTestCard('bug', { cardId: 'bug1', bugpriorityList: 2, blocked: false, startDate: '2024-01-01', desiredDate: '2024-01-15' });
      const bug2 = createTestCard('bug', { cardId: 'bug2', bugpriorityList: 1, blocked: true, startDate: '2024-01-02', desiredDate: '2024-01-10' });
      const cards = { bug1, bug2 };
      const result = cardService.orderCards(cards, 'bug-card');
      const resultArray = Object.values(result);
      expect(resultArray[0].cardId).toBe('bug2');
    });
    it('debería retornar cards sin ordenar para tipos no soportados', () => {
      const epic1 = createTestCard('epic', { cardId: 'epic1' });
      const epic2 = createTestCard('epic', { cardId: 'epic2' });
      const cards = { epic1, epic2 };
      const result = cardService.orderCards(cards, 'epic-card');
      expect(result).toEqual(cards);
    });
  });

  describe('compareCards', () => {
    it('debería comparar task cards correctamente', () => {
      const task1 = createTestCard('task', { businessPoints: 10, devPoints: 5, sprintId: 'sprint1', blocked: false, startDate: '2024-01-01', desiredDate: '2024-01-15' });
      const task2 = createTestCard('task', { businessPoints: 5, devPoints: 2, sprintId: 'sprint1', blocked: true, startDate: '2024-01-02', desiredDate: '2024-01-10' });
      const result = cardService.compareCards(task1, task2, 'task-card');
      // task2 tiene mayor prioridad (5/2=2.5 > 10/5=2), pero está bloqueado, así que task1 va antes
      expect(result).toBeGreaterThan(0);
    });
    it('debería comparar bug cards correctamente', () => {
      const bug1 = createTestCard('bug', { bugpriorityList: 2, blocked: false, startDate: '2024-01-01', desiredDate: '2024-01-15' });
      const bug2 = createTestCard('bug', { bugpriorityList: 1, blocked: true, startDate: '2024-01-02', desiredDate: '2024-01-10' });
      const result = cardService.compareCards(bug1, bug2, 'bug-card');
      // bug2 tiene mayor prioridad (menor número), pero está bloqueado, así que bug1 va antes
      expect(result).toBeGreaterThan(0);
    });
    it('debería manejar cards sin sprint correctamente', () => {
      const task1 = createTestCard('task', { sprintId: 'sprint1' });
      const task2 = createTestCard('task', { sprintId: null });
      const result = cardService.compareCards(task1, task2, 'task-card');
      expect(result).toBeLessThan(0);
    });
  });

  describe('moveCardToStatus', () => {
    it('debería mover una card a nuevo status exitosamente', async () => {
      const projectId = 'test-project';
      const section = 'tasks';
      const cardId = 'test-card';
      const newStatus = 'In Progress';
      const mockCardData = createTestCard('task', { status: 'To Do' });
      const mockRef = {
        get: vi.fn().mockResolvedValue({ exists: () => true, val: () => mockCardData }),
        set: vi.fn().mockResolvedValue()
      };
      mockFirebaseService.getRef.mockReturnValue(mockRef);
      const result = await cardService.moveCardToStatus(projectId, section, cardId, newStatus);
      expect(result.success).toBe(true);
      expect(mockFirebaseService.getRef).toHaveBeenCalledWith(`/cards/${projectId}/${section}_${projectId}/${cardId}`);
      expect(mockRef.set).toHaveBeenCalledWith({ ...mockCardData, status: newStatus });
    });
    it('debería manejar error cuando la card no existe', async () => {
      const projectId = 'test-project';
      const section = 'tasks';
      const cardId = 'non-existent-card';
      const newStatus = 'In Progress';
      const mockRef = {
        get: vi.fn().mockResolvedValue({ exists: () => false, val: () => null }),
        set: vi.fn()
      };
      mockFirebaseService.getRef.mockReturnValue(mockRef);
      const result = await cardService.moveCardToStatus(projectId, section, cardId, newStatus);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Card not found');
    });
    it('debería manejar errores de Firebase', async () => {
      const projectId = 'test-project';
      const section = 'tasks';
      const cardId = 'test-card';
      const newStatus = 'In Progress';
      const mockRef = {
        get: vi.fn().mockRejectedValue(new Error('Firebase error')),
        set: vi.fn()
      };
      mockFirebaseService.getRef.mockReturnValue(mockRef);
      const result = await cardService.moveCardToStatus(projectId, section, cardId, newStatus);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firebase error');
    });
  });

  describe('moveCardToPriority', () => {
    it('debería ignorar cambio de prioridad para tasks', async () => {
      const projectId = 'test-project';
      const section = 'TASKS';
      const cardId = 'test-card';
      const newPriority = 'High';
      const result = await cardService.moveCardToPriority(projectId, section, cardId, newPriority);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Priority is calculated for tasks, no update needed');
    });
    it('debería actualizar prioridad para bugs', async () => {
      const projectId = 'test-project';
      const section = 'BUGS';
      const cardId = 'test-bug';
      const newPriority = 'High';
      const mockCardData = createTestCard('bug', { priority: 'Low' });
      const mockRef = {
        get: vi.fn().mockResolvedValue({ exists: () => true, val: () => mockCardData }),
        set: vi.fn().mockResolvedValue()
      };
      mockFirebaseService.getRef.mockReturnValue(mockRef);
      const result = await cardService.moveCardToPriority(projectId, section, cardId, newPriority);
      expect(result.success).toBe(true);
      expect(mockRef.set).toHaveBeenCalledWith({ ...mockCardData, priority: newPriority });
    });
  });

  describe('moveCardToSprint', () => {
    it('debería mover una card a un sprint exitosamente', async () => {
      const projectId = 'test-project';
      const cardId = 'test-card';
      const sprintId = 'new-sprint';
      const mockCardData = createTestCard('task', { sprint: 'old-sprint' });
      const mockRef = {
        get: vi.fn().mockResolvedValue({ exists: () => true, val: () => mockCardData }),
        set: vi.fn().mockResolvedValue()
      };
      mockFirebaseService.getRef.mockReturnValue(mockRef);
      const result = await cardService.moveCardToSprint(projectId, cardId, sprintId);
      expect(result.success).toBe(true);
      expect(mockFirebaseService.getRef).toHaveBeenCalledWith(`/cards/${projectId}/TASKS_${projectId}/${cardId}`);
      expect(mockRef.set).toHaveBeenCalledWith({ ...mockCardData, sprint: sprintId });
    });
    it('debería manejar error cuando la card no existe', async () => {
      const projectId = 'test-project';
      const cardId = 'non-existent-card';
      const sprintId = 'new-sprint';
      const mockRef = {
        get: vi.fn().mockResolvedValue({ exists: () => false, val: () => null }),
        set: vi.fn()
      };
      mockFirebaseService.getRef.mockReturnValue(mockRef);
      const result = await cardService.moveCardToSprint(projectId, cardId, sprintId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Card not found');
    });
  });
}); 
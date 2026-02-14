import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => ({
  database: {},
  ref: vi.fn((db, path) => ({ db, path })),
  push: vi.fn((refObj, value) => ({ refObj, value, key: 'test-key' })),
  get: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  limitToLast: vi.fn(),
  onValue: vi.fn(),
  set: vi.fn(),
  runDbTransaction: vi.fn(),
  auth: { currentUser: null },
  firebaseConfig: {},
  functions: {},
  httpsCallable: vi.fn()
}));

vi.mock('../../public/firebase-config.js', () => firebaseMock, { virtual: true });
const { historyService } = await import('../../public/js/services/history-service.js');

beforeEach(() => {
  firebaseMock.ref.mockClear();
  firebaseMock.push.mockClear();
});

describe('historyService.saveHistory', () => {
  it('guarda cambios en /history/{project}/tasks/{cardId}', async () => {
    const oldState = { status: 'To Do', title: 'Test', cardType: 'task-card' };
    const card = {
      projectId: 'PlanningGame',
      cardId: 'PLN-TSK-0001',
      cardType: 'task-card',
      status: 'In Progress',
      title: 'Test'
    };

    await historyService.saveHistory(card, oldState, 'user@example.com');

    expect(firebaseMock.ref).toHaveBeenCalledWith({}, '/history/PlanningGame/tasks/PLN-TSK-0001');
    expect(firebaseMock.push).toHaveBeenCalledTimes(1);
    const [, payload] = firebaseMock.push.mock.calls[0];
    expect(payload.changes).toHaveProperty('status');
  });

  it('no guarda histórico cuando no hay estado anterior', async () => {
    const card = {
      projectId: 'PlanningGame',
      cardId: 'PLN-TSK-0002',
      cardType: 'task-card',
      status: 'To Do',
      title: 'Test'
    };

    await historyService.saveHistory(card, null, 'user@example.com');

    expect(firebaseMock.push).not.toHaveBeenCalled();
  });
});

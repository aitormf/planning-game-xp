// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

const subscribeToHistory = vi.fn((projectId, cardType, cardId, callback) => {
  if (callback) {
    callback([{ id: 'mock-history' }]);
  }
  return () => {};
});

vi.mock('../../public/js/services/history-service.js', () => ({
  historyService: {
    subscribeToHistory
  }
}));

vi.mock('../../public/js/services/entity-directory-service.js', () => ({
  entityDirectoryService: {
    resolveDeveloperId: vi.fn(() => null),
    getDeveloperDisplayName: vi.fn((ref) => ref || ''),
    resolveStakeholderId: vi.fn(() => null),
    getStakeholderDisplayName: vi.fn((ref) => ref || '')
  }
}));

await import('../../public/js/wc/card-history-viewer.js');

describe('card-history-viewer', () => {
  it('carga histórico cuando se asignan props después de conectar', async () => {
    subscribeToHistory.mockClear();

    const el = document.createElement('card-history-viewer');
    document.body.appendChild(el);

    el.projectId = 'PlanningGame';
    el.cardType = 'task-card';
    el.cardId = 'PLN-TSK-0001';

    await el.loadHistory();

    expect(subscribeToHistory).toHaveBeenCalledWith('PlanningGame', 'task-card', 'PLN-TSK-0001', expect.any(Function));
    expect(el.history.length).toBe(1);
  });
});

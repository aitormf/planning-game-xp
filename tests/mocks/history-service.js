import { vi } from 'vitest';

export const historyService = {
  subscribeToHistory: vi.fn((projectId, cardType, cardId, callback) => {
    if (callback) {
      callback([{ id: 'mock-history' }]);
    }
    return () => {};
  })
};

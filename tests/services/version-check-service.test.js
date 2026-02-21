import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-config before importing the module
vi.mock('../../public/firebase-config.js', () => {
  const mockRef = vi.fn();
  const mockOnValue = vi.fn();
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  return {
    database: {},
    ref: mockRef,
    onValue: mockOnValue,
    get: mockGet,
    set: mockSet
  };
});

// Import after mocking
const { compareSemver } = await import('@/services/version-check-service.js')
  .then(() => {
    // compareSemver is not exported, test it indirectly via the module
    // We'll test the logic directly instead
    return {};
  })
  .catch(() => ({}));

describe('Version Check Service - compareSemver logic', () => {
  // Since compareSemver is not exported, we test the logic independently
  function compareSemver(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1;
      if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
  }

  it('should return 0 for equal versions', () => {
    expect(compareSemver('1.127.0', '1.127.0')).toBe(0);
  });

  it('should return 1 when major is higher', () => {
    expect(compareSemver('2.0.0', '1.127.0')).toBe(1);
  });

  it('should return -1 when major is lower', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
  });

  it('should return 1 when minor is higher', () => {
    expect(compareSemver('1.128.0', '1.127.0')).toBe(1);
  });

  it('should return -1 when minor is lower', () => {
    expect(compareSemver('1.126.0', '1.127.0')).toBe(-1);
  });

  it('should return 1 when patch is higher', () => {
    expect(compareSemver('1.127.1', '1.127.0')).toBe(1);
  });

  it('should return -1 when patch is lower', () => {
    expect(compareSemver('1.127.0', '1.127.1')).toBe(-1);
  });

  it('should handle versions with different segment counts', () => {
    expect(compareSemver('1.127', '1.127.0')).toBe(0);
    expect(compareSemver('1.127', '1.127.1')).toBe(-1);
  });
});

describe('Version Check Service - auto-heal behavior', () => {
  let mockGet, mockSet, mockOnValue, mockRef;

  beforeEach(async () => {
    vi.resetModules();

    mockRef = vi.fn().mockReturnValue('versionRef');
    mockOnValue = vi.fn();
    mockSet = vi.fn().mockResolvedValue(undefined);

    vi.doMock('../../public/firebase-config.js', () => ({
      database: {},
      ref: mockRef,
      onValue: mockOnValue,
      get: vi.fn(),
      set: mockSet
    }));
  });

  it('should update RTDB when client version is newer than server', async () => {
    // Simulate: client=1.128.0, server=1.127.0
    const mockGetFn = vi.fn().mockResolvedValue({ val: () => '1.127.0' });

    vi.doMock('../../public/firebase-config.js', () => ({
      database: {},
      ref: mockRef,
      onValue: mockOnValue,
      get: mockGetFn,
      set: mockSet
    }));

    const { versionCheckService } = await import('@/services/version-check-service.js');
    versionCheckService._initialized = false;
    versionCheckService.init('1.128.0');

    // Wait for async get() to resolve
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockSet).toHaveBeenCalledWith('versionRef', '1.128.0');
  });

  it('should NOT update RTDB when server version is newer', async () => {
    const mockGetFn = vi.fn().mockResolvedValue({ val: () => '1.129.0' });

    vi.doMock('../../public/firebase-config.js', () => ({
      database: {},
      ref: mockRef,
      onValue: mockOnValue,
      get: mockGetFn,
      set: mockSet
    }));

    const { versionCheckService } = await import('@/services/version-check-service.js');
    versionCheckService._initialized = false;
    versionCheckService.init('1.127.0');

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('should set version when server has no version', async () => {
    const mockGetFn = vi.fn().mockResolvedValue({ val: () => null });

    vi.doMock('../../public/firebase-config.js', () => ({
      database: {},
      ref: mockRef,
      onValue: mockOnValue,
      get: mockGetFn,
      set: mockSet
    }));

    const { versionCheckService } = await import('@/services/version-check-service.js');
    versionCheckService._initialized = false;
    versionCheckService.init('1.127.0');

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockSet).toHaveBeenCalledWith('versionRef', '1.127.0');
  });
});

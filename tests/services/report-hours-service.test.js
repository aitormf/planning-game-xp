import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGet = vi.fn();
const mockRef = vi.fn(() => 'mock-ref');

vi.mock('../../public/firebase-config.js', () => ({
  database: {},
  ref: (...args) => mockRef(...args),
  get: (...args) => mockGet(...args),
  set: vi.fn(),
  push: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  databaseFirestore: {},
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  auth: { currentUser: { email: 'testuser@example.com' } },
  firebaseConfig: {},
  superAdminEmail: 'superadmin@example.com',
}));

vi.mock('../../public/js/config/holidays-config.js', () => ({
  holidays: [],
  HOURS_PER_WORKDAY: 8,
}));

describe('ReportHoursService', () => {
  let ReportHoursService;

  const sampleGroups = {
    internal: { label: 'Internos', developers: ['dev_001', 'dev_002'] },
    external: { label: 'Externos', developers: ['dev_003'] },
    manager: { label: 'Manager', developers: ['dev_010'] },
  };

  const sampleProjects = {
    PRJ1: { abbreviation: 'PRJ1', name: 'Project 1' },
    PRJ2: { abbreviation: 'PRJ2', name: 'Project 2' },
  };

  function makeCard(overrides = {}) {
    return {
      cardId: 'PRJ1-TSK-0001',
      cardType: 'task',
      status: 'Done',
      developer: 'dev_001',
      startDate: '2026-03-02T09:00:00Z', // Monday
      endDate: '2026-03-02T17:00:00Z',   // Same day
      epic: 'PRJ1-EPC-0001',
      ...overrides,
    };
  }

  function makeEpic(title, overrides = {}) {
    return {
      cardType: 'epic',
      title,
      ...overrides,
    };
  }

  function setupMocks({ groups = sampleGroups, projects = sampleProjects, cardsByProject = {}, epicsByProject = {} } = {}) {
    mockGet.mockImplementation((refArg) => {
      const call = mockRef.mock.calls.find(c => c[1] && mockRef.mock.results.find(r => r.value === refArg));

      // We track calls by inspecting mockRef calls
      return Promise.resolve({ exists: () => true, val: () => null });
    });

    // Use a more deterministic approach: track ref paths
    const refPaths = [];
    mockRef.mockImplementation((db, path) => {
      const id = `ref-${refPaths.length}`;
      refPaths.push(path);
      return id;
    });

    mockGet.mockImplementation((refId) => {
      const index = parseInt(refId.replace('ref-', ''), 10);
      const path = refPaths[index];

      if (path === '/data/developerGroups') {
        return Promise.resolve({ exists: () => !!groups, val: () => groups });
      }
      if (path === '/data/developers') {
        const devMap = {};
        if (groups) {
          for (const [, groupData] of Object.entries(groups)) {
            for (const devId of groupData.developers) {
              devMap[devId] = { name: `Dev ${devId}` };
            }
          }
        }
        return Promise.resolve({ exists: () => true, val: () => devMap });
      }
      if (path === '/projects') {
        return Promise.resolve({ exists: () => !!projects, val: () => projects });
      }

      // Card sections: /cards/{projectId}/TASKS_{projectId} and BUGS_{projectId}
      for (const [projectId, cards] of Object.entries(cardsByProject)) {
        if (path === `/cards/${projectId}/TASKS_${projectId}`) {
          const tasks = {};
          if (cards) {
            for (const [key, card] of Object.entries(cards)) {
              if (card.cardType !== 'bug') tasks[key] = card;
            }
          }
          const hasData = Object.keys(tasks).length > 0;
          return Promise.resolve({ exists: () => hasData, val: () => hasData ? tasks : null });
        }
        if (path === `/cards/${projectId}/BUGS_${projectId}`) {
          const bugs = {};
          if (cards) {
            for (const [key, card] of Object.entries(cards)) {
              if (card.cardType === 'bug') bugs[key] = card;
            }
          }
          const hasData = Object.keys(bugs).length > 0;
          return Promise.resolve({ exists: () => hasData, val: () => hasData ? bugs : null });
        }
      }
      // Epic sections: /cards/{projectId}/EPICS_{projectId}
      for (const [projectId, epics] of Object.entries(epicsByProject)) {
        if (path === `/cards/${projectId}/EPICS_${projectId}`) {
          return Promise.resolve({ exists: () => !!epics, val: () => epics });
        }
      }

      return Promise.resolve({ exists: () => false, val: () => null });
    });
  }

  beforeEach(async () => {
    vi.resetModules();
    mockGet.mockReset();
    mockRef.mockReset();

    const module = await import('../../public/js/services/report-hours-service.js');
    ReportHoursService = module.ReportHoursService;
  });

  describe('calculateMonthlyReport', () => {
    it('should return weekly hours per developer for a given month/year', async () => {
      const taskCard = makeCard({
        startDate: '2026-03-02T09:00:00Z', // Mon March 2
        endDate: '2026-03-02T17:00:00Z',   // Mon March 2 (8h = 1 workday)
        developer: 'dev_001',
        status: 'Done',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'epic-1': makeEpic('Feature Epic') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      expect(report.weeks).toBeDefined();
      expect(report.weeks.length).toBeGreaterThan(0);
      expect(report.groups.internal).toBeDefined();
      expect(report.groups.internal.developers['dev_001']).toBeDefined();
      expect(report.groups.internal.developers['dev_001'].totals.development).toBe(8);
      expect(report.groups.internal.developers['dev_001'].totals.maintenance).toBe(0);
    });

    it('should classify tasks with [MANTENIMIENTO] epic as Maintenance', async () => {
      const taskCard = makeCard({
        cardId: 'PRJ1-TSK-0002',
        startDate: '2026-03-03T09:00:00Z',
        endDate: '2026-03-03T17:00:00Z',
        developer: 'dev_001',
        epic: 'PRJ1-EPC-0002',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: {
            'PRJ1-EPC-0002': makeEpic('[MANTENIMIENTO] Bug fixes & support'),
          },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.maintenance).toBe(8);
      expect(dev.totals.development).toBe(0);
    });

    it('should classify ALL bugs as Maintenance', async () => {
      const bugCard = makeCard({
        cardId: 'PRJ1-BUG-0001',
        cardType: 'bug',
        startDate: '2026-03-04T09:00:00Z',
        endDate: '2026-03-04T17:00:00Z',
        developer: 'dev_001',
        status: 'Done',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'bug-1': bugCard },
        },
        epicsByProject: {
          PRJ1: {},
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.maintenance).toBe(8);
      expect(dev.totals.development).toBe(0);
    });

    it('should classify other tasks as Development', async () => {
      const taskCard = makeCard({
        startDate: '2026-03-05T09:00:00Z',
        endDate: '2026-03-05T17:00:00Z',
        developer: 'dev_001',
        epic: 'PRJ1-EPC-0001',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: {
            'PRJ1-EPC-0001': makeEpic('New Feature Epic'),
          },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.development).toBe(8);
      expect(dev.totals.maintenance).toBe(0);
    });

    it('should distribute multi-week tasks proportionally by business days per week', async () => {
      // Task spanning Mon Mar 2 to Fri Mar 13 (10 business days = 80 hours)
      // Week S1 (Mar 2-6): 5 days, Week S2 (Mar 9-13): 5 days
      const taskCard = makeCard({
        startDate: '2026-03-02T09:00:00Z',
        endDate: '2026-03-13T17:00:00Z',
        developer: 'dev_001',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      // Should have hours distributed across at least 2 weeks
      const weeklyHours = Object.values(dev.weeks);
      const totalDev = weeklyHours.reduce((sum, w) => sum + w.development, 0);
      expect(totalDev).toBe(80); // 10 business days * 8 hours
    });

    it('should use effectiveHours when available', async () => {
      const taskCard = makeCard({
        startDate: '2026-03-02T09:00:00Z',
        endDate: '2026-03-06T17:00:00Z', // 5 days normally = 40h
        developer: 'dev_001',
        effectiveHours: 20, // Override: only 20h
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.development).toBe(20);
    });

    it('should use totalEffectiveHours when available (from reopens)', async () => {
      const taskCard = makeCard({
        startDate: '2026-03-02T09:00:00Z',
        endDate: '2026-03-06T17:00:00Z',
        developer: 'dev_001',
        totalEffectiveHours: 32,
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.development).toBe(32);
    });

    it('should group developers correctly (internal, external, manager, unclassified)', async () => {
      const cardDev1 = makeCard({ developer: 'dev_001', startDate: '2026-03-02T09:00:00Z', endDate: '2026-03-02T17:00:00Z' });
      const cardDev3 = makeCard({ developer: 'dev_003', cardId: 'PRJ1-TSK-0003', startDate: '2026-03-03T09:00:00Z', endDate: '2026-03-03T17:00:00Z' });
      const cardDev99 = makeCard({ developer: 'dev_099', cardId: 'PRJ1-TSK-0099', startDate: '2026-03-04T09:00:00Z', endDate: '2026-03-04T17:00:00Z' });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'c1': cardDev1, 'c3': cardDev3, 'c99': cardDev99 },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      expect(report.groups.internal.developers['dev_001']).toBeDefined();
      expect(report.groups.external.developers['dev_003']).toBeDefined();
      expect(report.groups.unclassified.developers['dev_099']).toBeDefined();
    });

    it('should aggregate cards across multiple projects', async () => {
      const card1 = makeCard({ developer: 'dev_001', startDate: '2026-03-02T09:00:00Z', endDate: '2026-03-02T17:00:00Z' });
      const card2 = makeCard({ developer: 'dev_001', cardId: 'PRJ2-TSK-0001', startDate: '2026-03-03T09:00:00Z', endDate: '2026-03-03T17:00:00Z' });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'c1': card1 },
          PRJ2: { 'c2': card2 },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature A') },
          PRJ2: { 'PRJ2-EPC-0001': makeEpic('Feature B') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.development).toBe(16); // 8h + 8h
    });

    it('should not include developers with no completed tasks', async () => {
      const taskCard = makeCard({
        developer: 'dev_001',
        status: 'In Progress', // Not done
        startDate: '2026-03-02T09:00:00Z',
        endDate: '2026-03-02T17:00:00Z',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'c1': taskCard },
        },
        epicsByProject: {
          PRJ1: {},
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      expect(report.groups.internal.developers['dev_001']).toBeUndefined();
    });

    it('should return empty groups when month has no data', async () => {
      setupMocks({
        cardsByProject: {},
        epicsByProject: {},
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      expect(report.weeks.length).toBeGreaterThan(0);
      expect(report.grandTotals.development).toBe(0);
      expect(report.grandTotals.maintenance).toBe(0);
    });

    it('should include cards that overlap with the month', async () => {
      // Task starts Feb 27 (before the month), ends Mar 4 (within)
      const taskCard = makeCard({
        startDate: '2026-02-27T09:00:00Z', // Friday Feb 27 (before March)
        endDate: '2026-03-04T17:00:00Z',   // Wednesday Mar 4
        developer: 'dev_001',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'c1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      // Only March days should count: Mar 2 (Mon), Mar 3 (Tue), Mar 4 (Wed) = 3 days * 8h = 24h
      expect(dev.totals.development).toBeGreaterThan(0);
    });

    it('should calculate group subtotals correctly', async () => {
      const card1 = makeCard({ developer: 'dev_001', startDate: '2026-03-02T09:00:00Z', endDate: '2026-03-02T17:00:00Z' });
      const card2 = makeCard({ developer: 'dev_002', cardId: 'PRJ1-TSK-0002', startDate: '2026-03-03T09:00:00Z', endDate: '2026-03-03T17:00:00Z' });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'c1': card1, 'c2': card2 },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      expect(report.groups.internal.subtotals.development).toBe(16); // 8h + 8h
    });

    it('should calculate grandTotals correctly', async () => {
      const task = makeCard({ developer: 'dev_001', startDate: '2026-03-02T09:00:00Z', endDate: '2026-03-02T17:00:00Z' });
      const bug = makeCard({ developer: 'dev_003', cardType: 'bug', cardId: 'PRJ1-BUG-0001', startDate: '2026-03-03T09:00:00Z', endDate: '2026-03-03T17:00:00Z' });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'c1': task, 'c2': bug },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      expect(report.grandTotals.development).toBe(8);
      expect(report.grandTotals.maintenance).toBe(8);
    });

    it('should only include cards with Done or Done&Validated status', async () => {
      const doneTodo = makeCard({ status: 'To Do', developer: 'dev_001' });
      const doneValidated = makeCard({ status: 'Done&Validated', developer: 'dev_001', cardId: 'PRJ1-TSK-0002', startDate: '2026-03-03T09:00:00Z', endDate: '2026-03-03T17:00:00Z' });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'c1': doneTodo, 'c2': doneValidated },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.development).toBe(8); // Only the Done&Validated card
    });

    it('should generate correct ISO week labels for the month', async () => {
      setupMocks({ cardsByProject: {}, epicsByProject: {} });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      // March 2026 starts on Sunday, has 5 weeks
      expect(report.weeks.length).toBeGreaterThanOrEqual(4);
      expect(report.weeks[0]).toMatch(/^S\d+$/);
    });

    it('should prefer totalEffectiveHours over effectiveHours', async () => {
      const taskCard = makeCard({
        startDate: '2026-03-02T09:00:00Z',
        endDate: '2026-03-06T17:00:00Z',
        developer: 'dev_001',
        effectiveHours: 20,
        totalEffectiveHours: 25,
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.totals.development).toBe(25);
    });
  });

  describe('cardDetails per developer', () => {
    it('should include cardDetails array for each developer', async () => {
      const taskCard = makeCard({
        cardId: 'PRJ1-TSK-0001',
        title: 'Implement feature X',
        projectId: 'PRJ1',
        startDate: '2026-03-02T09:00:00Z',
        endDate: '2026-03-02T17:00:00Z',
        developer: 'dev_001',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature Epic') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.cardDetails).toBeDefined();
      expect(dev.cardDetails).toHaveLength(1);
      expect(dev.cardDetails[0].cardId).toBe('PRJ1-TSK-0001');
      expect(dev.cardDetails[0].title).toBe('Implement feature X');
      expect(dev.cardDetails[0].projectId).toBe('PRJ1');
      expect(dev.cardDetails[0].category).toBe('development');
      expect(dev.cardDetails[0].hours).toBe(8);
    });

    it('should include bug cardType and maintenance category', async () => {
      const bugCard = makeCard({
        cardId: 'PRJ1-BUG-0001',
        cardType: 'bug',
        title: 'Fix critical issue',
        projectId: 'PRJ1',
        startDate: '2026-03-03T09:00:00Z',
        endDate: '2026-03-03T17:00:00Z',
        developer: 'dev_001',
        status: 'Done',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': bugCard },
        },
        epicsByProject: {},
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.cardDetails[0].cardType).toBe('bug');
      expect(dev.cardDetails[0].category).toBe('maintenance');
    });

    it('should sort cardDetails by endDate ascending', async () => {
      const card1 = makeCard({
        cardId: 'PRJ1-TSK-0010',
        title: 'Later task',
        startDate: '2026-03-10T09:00:00Z',
        endDate: '2026-03-10T17:00:00Z',
        developer: 'dev_001',
      });
      const card2 = makeCard({
        cardId: 'PRJ1-TSK-0005',
        title: 'Earlier task',
        startDate: '2026-03-03T09:00:00Z',
        endDate: '2026-03-03T17:00:00Z',
        developer: 'dev_001',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': card1, 'card-2': card2 },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature Epic') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.cardDetails).toHaveLength(2);
      expect(dev.cardDetails[0].cardId).toBe('PRJ1-TSK-0005');
      expect(dev.cardDetails[1].cardId).toBe('PRJ1-TSK-0010');
    });

    it('should include weekDistribution in cardDetails', async () => {
      const taskCard = makeCard({
        startDate: '2026-03-02T09:00:00Z',
        endDate: '2026-03-06T17:00:00Z',
        developer: 'dev_001',
      });

      setupMocks({
        cardsByProject: {
          PRJ1: { 'card-1': taskCard },
        },
        epicsByProject: {
          PRJ1: { 'PRJ1-EPC-0001': makeEpic('Feature') },
        },
      });

      const service = new ReportHoursService();
      const report = await service.calculateMonthlyReport(2026, 3);

      const dev = report.groups.internal.developers['dev_001'];
      expect(dev.cardDetails[0].weekDistribution).toBeDefined();
      expect(typeof dev.cardDetails[0].weekDistribution).toBe('object');
    });
  });
});

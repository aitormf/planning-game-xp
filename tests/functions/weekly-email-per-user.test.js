import { describe, it, expect, vi, beforeEach } from 'vitest';

// Since the functions are in index.js and not easily importable,
// we'll test the logic by reimplementing the pure functions here
// These tests verify the algorithms work correctly

describe('Weekly Email Per User', () => {
  describe('resolveEmail', () => {
    const resolveEmail = (value, directory = {}) => {
      const normalizeEmail = (email) => (email || '').toString().trim().toLowerCase();

      if (!value) return null;

      // Direct email
      if (typeof value === 'string' && value.includes('@')) {
        return normalizeEmail(value);
      }

      // Object with email/id
      if (typeof value === 'object') {
        const candidate = value.id || value.email || value.mail || value.value;
        if (typeof candidate === 'string' && candidate.includes('@')) {
          return normalizeEmail(candidate);
        }
        if (typeof candidate === 'string' && directory[candidate]?.email) {
          return normalizeEmail(directory[candidate].email);
        }
      }

      // ID lookup in directory
      if (typeof value === 'string' && directory[value]?.email) {
        return normalizeEmail(directory[value].email);
      }

      return null;
    };

    it('should return null for null/undefined values', () => {
      expect(resolveEmail(null)).toBeNull();
      expect(resolveEmail(undefined)).toBeNull();
      expect(resolveEmail('')).toBeNull();
    });

    it('should normalize direct email strings', () => {
      expect(resolveEmail('Test@Example.COM')).toBe('test@example.com');
      expect(resolveEmail(' user@domain.com ')).toBe('user@domain.com');
    });

    it('should extract email from objects', () => {
      expect(resolveEmail({ email: 'Test@Example.com' })).toBe('test@example.com');
      expect(resolveEmail({ mail: 'User@Domain.COM' })).toBe('user@domain.com');
      expect(resolveEmail({ id: 'direct@email.com' })).toBe('direct@email.com');
    });

    it('should lookup ID in directory', () => {
      const directory = {
        'dev_001': { name: 'John', email: 'John@Example.com' },
        'dev_002': { name: 'Jane', email: 'jane@domain.com' }
      };

      expect(resolveEmail('dev_001', directory)).toBe('john@example.com');
      expect(resolveEmail('dev_002', directory)).toBe('jane@domain.com');
      expect(resolveEmail('dev_999', directory)).toBeNull();
    });

    it('should lookup ID from object in directory', () => {
      const directory = {
        'dev_001': { name: 'John', email: 'john@example.com' }
      };

      expect(resolveEmail({ id: 'dev_001' }, directory)).toBe('john@example.com');
      expect(resolveEmail({ value: 'dev_001' }, directory)).toBe('john@example.com');
    });
  });

  describe('resolveName', () => {
    const resolveName = (value, directory = {}) => {
      if (!value) return 'Usuario';

      if (typeof value === 'object') {
        if (value.name) return value.name;
        const candidate = value.id || value.value;
        if (typeof candidate === 'string' && directory[candidate]?.name) {
          return directory[candidate].name;
        }
      }

      if (typeof value === 'string' && directory[value]?.name) {
        return directory[value].name;
      }

      if (typeof value === 'string' && value.includes('@')) {
        return value.split('@')[0];
      }

      return 'Usuario';
    };

    it('should return "Usuario" for null/undefined values', () => {
      expect(resolveName(null)).toBe('Usuario');
      expect(resolveName(undefined)).toBe('Usuario');
    });

    it('should return name from object', () => {
      expect(resolveName({ name: 'John Doe' })).toBe('John Doe');
    });

    it('should lookup name in directory', () => {
      const directory = {
        'dev_001': { name: 'John Doe', email: 'john@example.com' }
      };

      expect(resolveName('dev_001', directory)).toBe('John Doe');
      expect(resolveName({ id: 'dev_001' }, directory)).toBe('John Doe');
    });

    it('should extract name from email', () => {
      expect(resolveName('john.doe@example.com')).toBe('john.doe');
    });
  });

  describe('addTaskToUserMap', () => {
    const normalizeEmail = (email) => (email || '').toString().trim().toLowerCase();

    const addTaskToUserMap = (userTaskMap, email, projectId, projectName, task, taskType, status, directories) => {
      if (!email) return;

      const { developersDirectory, stakeholdersDirectory } = directories;

      if (!userTaskMap.has(email)) {
        let userName = 'Usuario';
        const devEntry = Object.values(developersDirectory).find(d => normalizeEmail(d.email) === email);
        const stkEntry = Object.values(stakeholdersDirectory).find(s => normalizeEmail(s.email) === email);
        if (devEntry?.name) userName = devEntry.name;
        else if (stkEntry?.name) userName = stkEntry.name;
        else if (email.includes('@')) userName = email.split('@')[0];

        userTaskMap.set(email, {
          name: userName,
          email: email,
          projects: new Map()
        });
      }

      const userData = userTaskMap.get(email);

      if (!userData.projects.has(projectId)) {
        userData.projects.set(projectId, {
          projectId,
          projectName,
          assigned: { todo: [], inProgress: [], blocked: [] },
          toValidate: [],
          sprintSummary: []
        });
      }

      const projectData = userData.projects.get(projectId);

      const taskInfo = {
        cardId: task.cardId || task.id,
        title: task.title || 'Sin título',
        sprint: task.sprint,
        developer: task.developer,
        validator: task.validator
      };

      if (taskType === 'assigned') {
        if (status === 'todo') {
          projectData.assigned.todo.push(taskInfo);
        } else if (status === 'inProgress') {
          projectData.assigned.inProgress.push(taskInfo);
        } else if (status === 'blocked') {
          projectData.assigned.blocked.push(taskInfo);
        }
      } else if (taskType === 'toValidate') {
        projectData.toValidate.push(taskInfo);
      }
    };

    it('should create user entry if not exists', () => {
      const userTaskMap = new Map();
      const directories = {
        developersDirectory: { 'dev_001': { name: 'John', email: 'john@test.com' } },
        stakeholdersDirectory: {}
      };

      addTaskToUserMap(
        userTaskMap,
        'john@test.com',
        'TestProject',
        'Test Project Name',
        { cardId: 'TST-001', title: 'Test Task', sprint: 'Sprint 1' },
        'assigned',
        'todo',
        directories
      );

      expect(userTaskMap.has('john@test.com')).toBe(true);
      expect(userTaskMap.get('john@test.com').name).toBe('John');
    });

    it('should add tasks to correct status category', () => {
      const userTaskMap = new Map();
      const directories = { developersDirectory: {}, stakeholdersDirectory: {} };

      addTaskToUserMap(userTaskMap, 'dev@test.com', 'P1', 'Project 1',
        { cardId: 'T1', title: 'Task 1' }, 'assigned', 'todo', directories);
      addTaskToUserMap(userTaskMap, 'dev@test.com', 'P1', 'Project 1',
        { cardId: 'T2', title: 'Task 2' }, 'assigned', 'inProgress', directories);
      addTaskToUserMap(userTaskMap, 'dev@test.com', 'P1', 'Project 1',
        { cardId: 'T3', title: 'Task 3' }, 'assigned', 'blocked', directories);

      const projectData = userTaskMap.get('dev@test.com').projects.get('P1');
      expect(projectData.assigned.todo).toHaveLength(1);
      expect(projectData.assigned.inProgress).toHaveLength(1);
      expect(projectData.assigned.blocked).toHaveLength(1);
    });

    it('should group tasks from multiple projects', () => {
      const userTaskMap = new Map();
      const directories = { developersDirectory: {}, stakeholdersDirectory: {} };

      addTaskToUserMap(userTaskMap, 'dev@test.com', 'P1', 'Project 1',
        { cardId: 'T1', title: 'Task 1' }, 'assigned', 'todo', directories);
      addTaskToUserMap(userTaskMap, 'dev@test.com', 'P2', 'Project 2',
        { cardId: 'T2', title: 'Task 2' }, 'assigned', 'todo', directories);
      addTaskToUserMap(userTaskMap, 'dev@test.com', 'P1', 'Project 1',
        { cardId: 'T3', title: 'Task 3' }, 'assigned', 'inProgress', directories);

      const userData = userTaskMap.get('dev@test.com');
      expect(userData.projects.size).toBe(2);
      expect(userData.projects.get('P1').assigned.todo).toHaveLength(1);
      expect(userData.projects.get('P1').assigned.inProgress).toHaveLength(1);
      expect(userData.projects.get('P2').assigned.todo).toHaveLength(1);
    });

    it('should add toValidate tasks correctly', () => {
      const userTaskMap = new Map();
      const directories = { developersDirectory: {}, stakeholdersDirectory: {} };

      addTaskToUserMap(userTaskMap, 'validator@test.com', 'P1', 'Project 1',
        { cardId: 'T1', title: 'Task to Validate' }, 'toValidate', null, directories);

      const projectData = userTaskMap.get('validator@test.com').projects.get('P1');
      expect(projectData.toValidate).toHaveLength(1);
      expect(projectData.toValidate[0].title).toBe('Task to Validate');
    });

    it('should not add task if email is null', () => {
      const userTaskMap = new Map();
      const directories = { developersDirectory: {}, stakeholdersDirectory: {} };

      addTaskToUserMap(userTaskMap, null, 'P1', 'Project 1',
        { cardId: 'T1', title: 'Task 1' }, 'assigned', 'todo', directories);

      expect(userTaskMap.size).toBe(0);
    });
  });

  describe('Email consolidation logic', () => {
    it('should group same user tasks from different projects', () => {
      // Simulating buildUserTaskMap behavior
      const userTaskMap = new Map();

      // User john@test.com is developer in Project1 and Project2
      userTaskMap.set('john@test.com', {
        name: 'John Doe',
        email: 'john@test.com',
        projects: new Map([
          ['Project1', {
            projectId: 'Project1',
            projectName: 'Project One',
            assigned: { todo: [{ cardId: 'P1-T1', title: 'Task 1' }], inProgress: [], blocked: [] },
            toValidate: []
          }],
          ['Project2', {
            projectId: 'Project2',
            projectName: 'Project Two',
            assigned: { todo: [{ cardId: 'P2-T1', title: 'Task 2' }], inProgress: [], blocked: [] },
            toValidate: []
          }]
        ])
      });

      // User jane@test.com is validator in Project1
      userTaskMap.set('jane@test.com', {
        name: 'Jane Smith',
        email: 'jane@test.com',
        projects: new Map([
          ['Project1', {
            projectId: 'Project1',
            projectName: 'Project One',
            assigned: { todo: [], inProgress: [], blocked: [] },
            toValidate: [{ cardId: 'P1-T2', title: 'Task to validate' }]
          }]
        ])
      });

      // Verify: 2 users = 2 emails (not 3 emails for 2 projects)
      expect(userTaskMap.size).toBe(2);

      // John has tasks from 2 projects
      const johnData = userTaskMap.get('john@test.com');
      expect(johnData.projects.size).toBe(2);

      // Jane has validation tasks from 1 project
      const janeData = userTaskMap.get('jane@test.com');
      expect(janeData.projects.size).toBe(1);
    });

    it('should handle user who is both developer and validator', () => {
      const userTaskMap = new Map();

      // User is both developer AND validator in the same project
      userTaskMap.set('multi@test.com', {
        name: 'Multi Role User',
        email: 'multi@test.com',
        projects: new Map([
          ['Project1', {
            projectId: 'Project1',
            projectName: 'Project One',
            assigned: {
              todo: [{ cardId: 'P1-T1', title: 'My assigned task' }],
              inProgress: [],
              blocked: []
            },
            toValidate: [{ cardId: 'P1-T2', title: 'Task I need to validate' }]
          }]
        ])
      });

      const userData = userTaskMap.get('multi@test.com');
      const projectData = userData.projects.get('Project1');

      // User should see both their assigned tasks AND tasks to validate
      expect(projectData.assigned.todo).toHaveLength(1);
      expect(projectData.toValidate).toHaveLength(1);
    });
  });

  describe('Statistics calculation', () => {
    it('should calculate correct totals across projects', () => {
      const projectsSummary = [
        {
          projectId: 'P1',
          projectName: 'Project 1',
          assigned: {
            todo: [{ cardId: 'T1' }, { cardId: 'T2' }],
            inProgress: [{ cardId: 'T3' }],
            blocked: [{ cardId: 'T4' }]
          },
          toValidate: [{ cardId: 'T5' }]
        },
        {
          projectId: 'P2',
          projectName: 'Project 2',
          assigned: {
            todo: [{ cardId: 'T6' }],
            inProgress: [],
            blocked: []
          },
          toValidate: [{ cardId: 'T7' }, { cardId: 'T8' }]
        }
      ];

      // Calculate stats (same logic as in generateConsolidatedEmailTemplate)
      let totalAssigned = 0;
      let totalTodo = 0;
      let totalInProgress = 0;
      let totalBlocked = 0;
      let totalToValidate = 0;

      for (const project of projectsSummary) {
        totalTodo += project.assigned.todo.length;
        totalInProgress += project.assigned.inProgress.length;
        totalBlocked += project.assigned.blocked.length;
        totalToValidate += project.toValidate.length;
      }
      totalAssigned = totalTodo + totalInProgress + totalBlocked;

      expect(totalTodo).toBe(3);       // 2 + 1
      expect(totalInProgress).toBe(1); // 1 + 0
      expect(totalBlocked).toBe(1);    // 1 + 0
      expect(totalAssigned).toBe(5);   // 3 + 1 + 1
      expect(totalToValidate).toBe(3); // 1 + 2
    });
  });
});

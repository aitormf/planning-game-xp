import { describe, it, expect, beforeEach } from 'vitest';
import {
  escapeAttr,
  collectPhaseTasks,
  collectPlanFormData,
  mergePhaseReferences,
  countPlanTasks,
  countGeneratedTasks
} from '@/utils/dev-plan-utils.js';

describe('dev-plan-utils', () => {
  describe('escapeAttr', () => {
    it('should escape ampersands', () => {
      expect(escapeAttr('a&b')).toBe('a&amp;b');
    });

    it('should escape quotes', () => {
      expect(escapeAttr('say "hello"')).toBe('say &quot;hello&quot;');
    });

    it('should escape angle brackets', () => {
      expect(escapeAttr('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('should handle null/undefined', () => {
      expect(escapeAttr(null)).toBe('');
      expect(escapeAttr(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(escapeAttr('')).toBe('');
    });

    it('should handle strings without special chars', () => {
      expect(escapeAttr('normal text')).toBe('normal text');
    });

    it('should escape multiple special characters together', () => {
      expect(escapeAttr('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;');
    });
  });

  describe('collectPhaseTasks', () => {
    let phaseRow;

    beforeEach(() => {
      phaseRow = document.createElement('div');
      phaseRow.classList.add('phase-row');
    });

    it('should collect tasks from task items', () => {
      phaseRow.innerHTML = `
        <div class="phase-task-item">
          <input class="phase-task-title" value="Task 1" />
          <input class="phase-task-como" value="As a dev" />
          <input class="phase-task-quiero" value="I want X" />
          <input class="phase-task-para" value="So that Y" />
        </div>
        <div class="phase-task-item">
          <input class="phase-task-title" value="Task 2" />
          <input class="phase-task-como" value="As a user" />
          <input class="phase-task-quiero" value="I want Z" />
          <input class="phase-task-para" value="So that W" />
        </div>
      `;
      const tasks = collectPhaseTasks(phaseRow);
      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toEqual({
        title: 'Task 1',
        como: 'As a dev',
        quiero: 'I want X',
        para: 'So that Y'
      });
      expect(tasks[1]).toEqual({
        title: 'Task 2',
        como: 'As a user',
        quiero: 'I want Z',
        para: 'So that W'
      });
    });

    it('should skip tasks with empty titles', () => {
      phaseRow.innerHTML = `
        <div class="phase-task-item">
          <input class="phase-task-title" value="" />
          <input class="phase-task-como" value="As a dev" />
          <input class="phase-task-quiero" value="I want X" />
          <input class="phase-task-para" value="So that Y" />
        </div>
        <div class="phase-task-item">
          <input class="phase-task-title" value="Valid Task" />
          <input class="phase-task-como" value="" />
          <input class="phase-task-quiero" value="" />
          <input class="phase-task-para" value="" />
        </div>
      `;
      const tasks = collectPhaseTasks(phaseRow);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Valid Task');
    });

    it('should return empty array when no task items exist', () => {
      const tasks = collectPhaseTasks(phaseRow);
      expect(tasks).toEqual([]);
    });

    it('should trim whitespace from values', () => {
      phaseRow.innerHTML = `
        <div class="phase-task-item">
          <input class="phase-task-title" value="  Trimmed  " />
          <input class="phase-task-como" value="  role  " />
          <input class="phase-task-quiero" value="  goal  " />
          <input class="phase-task-para" value="  benefit  " />
        </div>
      `;
      const tasks = collectPhaseTasks(phaseRow);
      expect(tasks[0]).toEqual({
        title: 'Trimmed',
        como: 'role',
        quiero: 'goal',
        para: 'benefit'
      });
    });
  });

  describe('collectPlanFormData', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('should collect plan title, objective, and phases with tasks', () => {
      container.innerHTML = `
        <input id="planTitle" value="My Plan" />
        <textarea id="planObjective">Build something great</textarea>
        <div class="phase-row" data-idx="0">
          <input class="phase-name" value="Phase 1" />
          <input class="phase-description" value="Setup" />
          <div class="phase-task-item">
            <input class="phase-task-title" value="Init project" />
            <input class="phase-task-como" value="As a dev" />
            <input class="phase-task-quiero" value="I want init" />
            <input class="phase-task-para" value="So that we start" />
          </div>
        </div>
      `;
      const data = collectPlanFormData(container);
      expect(data.title).toBe('My Plan');
      expect(data.objective).toBe('Build something great');
      expect(data.status).toBe('draft');
      expect(data.phases).toHaveLength(1);
      expect(data.phases[0].name).toBe('Phase 1');
      expect(data.phases[0].description).toBe('Setup');
      expect(data.phases[0].tasks).toHaveLength(1);
      expect(data.phases[0].tasks[0].title).toBe('Init project');
      expect(data.phases[0].epicIds).toEqual([]);
      expect(data.phases[0].taskIds).toEqual([]);
    });

    it('should skip phases with empty names', () => {
      container.innerHTML = `
        <input id="planTitle" value="Plan" />
        <textarea id="planObjective"></textarea>
        <div class="phase-row" data-idx="0">
          <input class="phase-name" value="" />
          <input class="phase-description" value="No name" />
        </div>
        <div class="phase-row" data-idx="1">
          <input class="phase-name" value="Valid Phase" />
          <input class="phase-description" value="Has name" />
        </div>
      `;
      const data = collectPlanFormData(container);
      expect(data.phases).toHaveLength(1);
      expect(data.phases[0].name).toBe('Valid Phase');
    });

    it('should handle empty form', () => {
      container.innerHTML = `
        <input id="planTitle" value="" />
        <textarea id="planObjective"></textarea>
      `;
      const data = collectPlanFormData(container);
      expect(data.title).toBe('');
      expect(data.objective).toBe('');
      expect(data.phases).toEqual([]);
    });

    it('should collect multiple phases with multiple tasks', () => {
      container.innerHTML = `
        <input id="planTitle" value="Big Plan" />
        <textarea id="planObjective">Multi-phase</textarea>
        <div class="phase-row" data-idx="0">
          <input class="phase-name" value="Phase A" />
          <input class="phase-description" value="First" />
          <div class="phase-task-item">
            <input class="phase-task-title" value="Task A1" />
            <input class="phase-task-como" value="" />
            <input class="phase-task-quiero" value="" />
            <input class="phase-task-para" value="" />
          </div>
          <div class="phase-task-item">
            <input class="phase-task-title" value="Task A2" />
            <input class="phase-task-como" value="" />
            <input class="phase-task-quiero" value="" />
            <input class="phase-task-para" value="" />
          </div>
        </div>
        <div class="phase-row" data-idx="1">
          <input class="phase-name" value="Phase B" />
          <input class="phase-description" value="Second" />
          <div class="phase-task-item">
            <input class="phase-task-title" value="Task B1" />
            <input class="phase-task-como" value="" />
            <input class="phase-task-quiero" value="" />
            <input class="phase-task-para" value="" />
          </div>
        </div>
      `;
      const data = collectPlanFormData(container);
      expect(data.phases).toHaveLength(2);
      expect(data.phases[0].tasks).toHaveLength(2);
      expect(data.phases[1].tasks).toHaveLength(1);
    });
  });

  describe('mergePhaseReferences', () => {
    it('should merge epicIds and taskIds from existing phases', () => {
      const formPhases = [
        { name: 'Phase 1', tasks: [], epicIds: [], taskIds: [] },
        { name: 'Phase 2', tasks: [], epicIds: [], taskIds: [] }
      ];
      const existingPhases = [
        { epicIds: ['PLN-PCS-0001'], taskIds: ['PLN-TSK-0001', 'PLN-TSK-0002'] },
        { epicIds: ['PLN-PCS-0002'], taskIds: ['PLN-TSK-0003'] }
      ];
      const merged = mergePhaseReferences(formPhases, existingPhases);
      expect(merged[0].epicIds).toEqual(['PLN-PCS-0001']);
      expect(merged[0].taskIds).toEqual(['PLN-TSK-0001', 'PLN-TSK-0002']);
      expect(merged[1].epicIds).toEqual(['PLN-PCS-0002']);
    });

    it('should handle null existing phases', () => {
      const formPhases = [{ name: 'Phase 1', epicIds: [], taskIds: [] }];
      const merged = mergePhaseReferences(formPhases, null);
      expect(merged).toEqual(formPhases);
    });

    it('should handle more form phases than existing phases', () => {
      const formPhases = [
        { name: 'Phase 1', epicIds: [], taskIds: [] },
        { name: 'New Phase', epicIds: [], taskIds: [] }
      ];
      const existingPhases = [
        { epicIds: ['PLN-PCS-0001'], taskIds: [] }
      ];
      const merged = mergePhaseReferences(formPhases, existingPhases);
      expect(merged[0].epicIds).toEqual(['PLN-PCS-0001']);
      expect(merged[1].epicIds).toEqual([]);
    });

    it('should handle missing epicIds/taskIds in existing phases', () => {
      const formPhases = [{ name: 'Phase 1', epicIds: [], taskIds: [] }];
      const existingPhases = [{}];
      const merged = mergePhaseReferences(formPhases, existingPhases);
      expect(merged[0].epicIds).toEqual([]);
      expect(merged[0].taskIds).toEqual([]);
    });
  });

  describe('countPlanTasks', () => {
    it('should count total tasks across phases', () => {
      const phases = [
        { tasks: [{ title: 'A' }, { title: 'B' }] },
        { tasks: [{ title: 'C' }] },
        { tasks: [] }
      ];
      expect(countPlanTasks(phases)).toBe(3);
    });

    it('should return 0 for null/undefined phases', () => {
      expect(countPlanTasks(null)).toBe(0);
      expect(countPlanTasks(undefined)).toBe(0);
    });

    it('should handle phases without tasks array', () => {
      const phases = [{ name: 'Phase 1' }, { tasks: [{ title: 'A' }] }];
      expect(countPlanTasks(phases)).toBe(1);
    });
  });

  describe('countGeneratedTasks', () => {
    it('should count generated tasks from plan', () => {
      const plan = {
        generatedTasks: [
          { cardId: 'PLN-TSK-0001', firebaseId: '-abc' },
          { cardId: 'PLN-TSK-0002', firebaseId: '-def' }
        ]
      };
      expect(countGeneratedTasks(plan)).toBe(2);
    });

    it('should return 0 for plan without generated tasks', () => {
      expect(countGeneratedTasks({})).toBe(0);
      expect(countGeneratedTasks({ generatedTasks: null })).toBe(0);
    });
  });
});

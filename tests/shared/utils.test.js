/**
 * Tests for shared/utils.js
 */
import { describe, it, expect } from 'vitest';

const {
  SECTION_MAP,
  CARD_TYPE_MAP,
  GROUP_MAP,
  getAbbrId,
  buildSectionPath
} = await import('../../shared/utils.js');

describe('SECTION_MAP', () => {
  it('should map all card types', () => {
    expect(SECTION_MAP.task).toBe('TASKS');
    expect(SECTION_MAP.bug).toBe('BUGS');
    expect(SECTION_MAP.epic).toBe('EPICS');
    expect(SECTION_MAP.sprint).toBe('SPRINTS');
    expect(SECTION_MAP.proposal).toBe('PROPOSALS');
    expect(SECTION_MAP.qa).toBe('QA');
  });
});

describe('CARD_TYPE_MAP', () => {
  it('should map types to component names', () => {
    expect(CARD_TYPE_MAP.task).toBe('task-card');
    expect(CARD_TYPE_MAP.bug).toBe('bug-card');
  });
});

describe('GROUP_MAP', () => {
  it('should map types to group names', () => {
    expect(GROUP_MAP.task).toBe('tasks');
    expect(GROUP_MAP.bug).toBe('bugs');
  });
});

describe('getAbbrId', () => {
  it('should return BUG for BUGS', () => {
    expect(getAbbrId('BUGS')).toBe('BUG');
  });

  it('should return C4D for CINEMA4D', () => {
    expect(getAbbrId('CINEMA4D')).toBe('C4D');
  });

  it('should return EX1 for EXTRANET V1', () => {
    expect(getAbbrId('EXTRANET V1')).toBe('EX1');
  });

  it('should return EX2 for EXTRANET V2', () => {
    expect(getAbbrId('EXTRANET V2')).toBe('EX2');
  });

  it('should pad short words to 3 chars', () => {
    expect(getAbbrId('QA')).toBe('_QA');
  });

  it('should use first 3 consonants for longer words', () => {
    expect(getAbbrId('TASKS')).toBe('TSK');
  });

  it('should handle words with trailing numbers', () => {
    expect(getAbbrId('SPRINTS')).toBe('SPR');
  });
});

describe('buildSectionPath', () => {
  it('should build correct path for tasks', () => {
    expect(buildSectionPath('Cinema4D', 'task')).toBe('/cards/Cinema4D/TASKS_Cinema4D');
  });

  it('should build correct path for bugs', () => {
    expect(buildSectionPath('Intranet', 'bug')).toBe('/cards/Intranet/BUGS_Intranet');
  });

  it('should throw for invalid section', () => {
    expect(() => buildSectionPath('Test', 'invalid')).toThrow(/Invalid section/);
  });
});

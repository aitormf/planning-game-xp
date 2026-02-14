import { describe, it, expect, beforeEach, vi } from 'vitest';
import { statusMatcher } from '@/filters/matchers/status-matcher.js';
import { developerMatcher, validatorMatcher } from '@/filters/matchers/developer-matcher.js';
import { sprintMatcher, completedInSprintMatcher } from '@/filters/matchers/sprint-matcher.js';
import { epicMatcher } from '@/filters/matchers/epic-matcher.js';
import { priorityMatcher, calculatePriority } from '@/filters/matchers/priority-matcher.js';
import { createdByMatcher } from '@/filters/matchers/created-by-matcher.js';
import { repositoryLabelMatcher } from '@/filters/matchers/repository-matcher.js';

describe('statusMatcher', () => {
  it('should return true when card status matches filter', () => {
    const card = { status: 'To Do' };
    expect(statusMatcher(card, ['To Do'])).toBe(true);
  });

  it('should return false when card status does not match', () => {
    const card = { status: 'Done' };
    expect(statusMatcher(card, ['To Do'])).toBe(false);
  });

  it('should support multiple status values (OR logic)', () => {
    const card = { status: 'In Progress' };
    expect(statusMatcher(card, ['To Do', 'In Progress'])).toBe(true);
  });

  it('should return true for empty filter values', () => {
    const card = { status: 'To Do' };
    expect(statusMatcher(card, [])).toBe(true);
    expect(statusMatcher(card, null)).toBe(true);
  });
});

describe('developerMatcher', () => {
  it('should match by developer ID', () => {
    const card = { developer: 'dev_001' };
    expect(developerMatcher(card, ['dev_001'])).toBe(true);
  });

  it('should match by display name from context', () => {
    const card = { developer: 'dev_001' };
    const context = {
      globalDeveloperList: {
        dev_001: { displayName: 'John Doe' }
      }
    };
    expect(developerMatcher(card, ['John Doe'], context)).toBe(true);
  });

  it('should match by display name from entityDirectoryService', () => {
    const card = { developer: 'dev_001' };
    const context = {
      entityDirectoryService: {
        resolveDeveloper: (id) => id === 'dev_001' ? 'John Doe' : null
      }
    };
    expect(developerMatcher(card, ['John Doe'], context)).toBe(true);
  });

  it('should return false when developer does not match', () => {
    const card = { developer: 'dev_001' };
    expect(developerMatcher(card, ['dev_002'])).toBe(false);
  });

  it('should return true for empty filter values', () => {
    const card = { developer: 'dev_001' };
    expect(developerMatcher(card, [])).toBe(true);
  });
});

describe('validatorMatcher', () => {
  it('should match by validator ID', () => {
    const card = { validator: 'dev_001' };
    expect(validatorMatcher(card, ['dev_001'])).toBe(true);
  });

  it('should match by display name from context', () => {
    const card = { validator: 'dev_001' };
    const context = {
      globalDeveloperList: {
        dev_001: { displayName: 'Jane Smith' }
      }
    };
    expect(validatorMatcher(card, ['Jane Smith'], context)).toBe(true);
  });
});

describe('sprintMatcher', () => {
  const context = {
    globalSprintList: {
      sprint_001: { name: 'Sprint 1' },
      sprint_002: { name: 'Sprint 2' }
    }
  };

  it('should match cards with specific sprint', () => {
    const card = { sprint: 'sprint_001' };
    expect(sprintMatcher(card, ['sprint_001'], context)).toBe(true);
  });

  it('should match cards without sprint when no-sprint is selected', () => {
    const card = { sprint: '' };
    expect(sprintMatcher(card, ['no-sprint'], context)).toBe(true);
  });

  it('should match cards with invalid sprint ID when no-sprint is selected', () => {
    const card = { sprint: 'invalid_sprint' };
    expect(sprintMatcher(card, ['no-sprint'], context)).toBe(true);
  });

  it('should match either no-sprint OR specific sprints when both selected', () => {
    const cardNoSprint = { sprint: '' };
    const cardWithSprint = { sprint: 'sprint_001' };
    const cardOtherSprint = { sprint: 'sprint_002' };

    const filters = ['no-sprint', 'sprint_001'];

    expect(sprintMatcher(cardNoSprint, filters, context)).toBe(true);
    expect(sprintMatcher(cardWithSprint, filters, context)).toBe(true);
    expect(sprintMatcher(cardOtherSprint, filters, context)).toBe(false);
  });

  it('should return false for card with sprint when only no-sprint is selected', () => {
    const card = { sprint: 'sprint_001' };
    expect(sprintMatcher(card, ['no-sprint'], context)).toBe(false);
  });

  it('should return true for empty filter values', () => {
    const card = { sprint: 'sprint_001' };
    expect(sprintMatcher(card, [], context)).toBe(true);
  });
});

describe('completedInSprintMatcher', () => {
  it('should match cards completed in specific sprint', () => {
    const card = { completedInSprint: 'sprint_001' };
    expect(completedInSprintMatcher(card, ['sprint_001'])).toBe(true);
  });

  it('should match cards without completedInSprint when no-sprint is selected', () => {
    const card = { completedInSprint: '' };
    expect(completedInSprintMatcher(card, ['no-sprint'])).toBe(true);
  });
});

describe('epicMatcher', () => {
  it('should match cards with specific epic', () => {
    const card = { epic: 'epic_001' };
    expect(epicMatcher(card, ['epic_001'])).toBe(true);
  });

  it('should match cards without epic when no-epic is selected', () => {
    const cardEmpty = { epic: '' };
    const cardNull = { epic: null };
    const cardUndefined = {};

    expect(epicMatcher(cardEmpty, ['no-epic'])).toBe(true);
    expect(epicMatcher(cardNull, ['no-epic'])).toBe(true);
    expect(epicMatcher(cardUndefined, ['no-epic'])).toBe(true);
  });

  it('should match either no-epic OR specific epics when both selected', () => {
    const cardNoEpic = { epic: '' };
    const cardWithEpic = { epic: 'epic_001' };
    const cardOtherEpic = { epic: 'epic_002' };

    const filters = ['no-epic', 'epic_001'];

    expect(epicMatcher(cardNoEpic, filters)).toBe(true);
    expect(epicMatcher(cardWithEpic, filters)).toBe(true);
    expect(epicMatcher(cardOtherEpic, filters)).toBe(false);
  });

  it('should return false for card with epic when only no-epic is selected', () => {
    const card = { epic: 'epic_001' };
    expect(epicMatcher(card, ['no-epic'])).toBe(false);
  });
});

describe('priorityMatcher', () => {
  describe('calculatePriority', () => {
    it('should calculate priority correctly', () => {
      expect(calculatePriority({ businessPoints: 10, devPoints: 5 })).toBe(200);
      expect(calculatePriority({ businessPoints: 5, devPoints: 5 })).toBe(100);
      expect(calculatePriority({ businessPoints: 2, devPoints: 5 })).toBe(40);
    });

    it('should return 0 for cards without devPoints', () => {
      expect(calculatePriority({ businessPoints: 10, devPoints: 0 })).toBe(0);
      expect(calculatePriority({ businessPoints: 10 })).toBe(0);
    });
  });

  it('should match High priority cards (>= 200)', () => {
    const card = { businessPoints: 10, devPoints: 5 }; // priority = 200
    expect(priorityMatcher(card, ['High'])).toBe(true);
    expect(priorityMatcher(card, ['Medium'])).toBe(false);
  });

  it('should match Medium priority cards (100-199)', () => {
    const card = { businessPoints: 5, devPoints: 5 }; // priority = 100
    expect(priorityMatcher(card, ['Medium'])).toBe(true);
    expect(priorityMatcher(card, ['High'])).toBe(false);
  });

  it('should match Low priority cards (1-99)', () => {
    const card = { businessPoints: 2, devPoints: 5 }; // priority = 40
    expect(priorityMatcher(card, ['Low'])).toBe(true);
    expect(priorityMatcher(card, ['Medium'])).toBe(false);
  });

  it('should match Not evaluated cards', () => {
    const cardNoPoints = { businessPoints: 0, devPoints: 0 };
    const cardNoDevPoints = { businessPoints: 10, devPoints: 0 };
    const cardNoBusinessPoints = { businessPoints: 0, devPoints: 5 };

    expect(priorityMatcher(cardNoPoints, ['Not evaluated'])).toBe(true);
    expect(priorityMatcher(cardNoDevPoints, ['Not evaluated'])).toBe(true);
    expect(priorityMatcher(cardNoBusinessPoints, ['Not evaluated'])).toBe(true);
  });

  it('should support multiple priority levels', () => {
    const highCard = { businessPoints: 10, devPoints: 5 };
    const lowCard = { businessPoints: 2, devPoints: 5 };

    expect(priorityMatcher(highCard, ['High', 'Low'])).toBe(true);
    expect(priorityMatcher(lowCard, ['High', 'Low'])).toBe(true);
  });
});

describe('createdByMatcher', () => {
  it('should match by creator ID', () => {
    const card = { createdBy: 'user@example.com' };
    expect(createdByMatcher(card, ['user@example.com'])).toBe(true);
  });

  it('should match by display name from context', () => {
    const card = { createdBy: 'user@example.com' };
    const context = {
      userDirectoryService: {
        getDisplayName: (id) => id === 'user@example.com' ? 'John Doe' : null
      }
    };
    expect(createdByMatcher(card, ['John Doe'], context)).toBe(true);
  });

  it('should match cards without creator when no-creator is selected', () => {
    const cardEmpty = { createdBy: '' };
    const cardNull = { createdBy: null };

    expect(createdByMatcher(cardEmpty, ['no-creator'])).toBe(true);
    expect(createdByMatcher(cardNull, ['no-creator'])).toBe(true);
  });

  it('should match either no-creator OR specific creators when both selected', () => {
    const cardNoCreator = { createdBy: '' };
    const cardWithCreator = { createdBy: 'user@example.com' };

    const filters = ['no-creator', 'user@example.com'];

    expect(createdByMatcher(cardNoCreator, filters)).toBe(true);
    expect(createdByMatcher(cardWithCreator, filters)).toBe(true);
  });
});

describe('repositoryLabelMatcher', () => {
  it('should match by repository label', () => {
    const card = { repositoryLabel: 'frontend' };
    expect(repositoryLabelMatcher(card, ['frontend'])).toBe(true);
  });

  it('should return false when label does not match', () => {
    const card = { repositoryLabel: 'backend' };
    expect(repositoryLabelMatcher(card, ['frontend'])).toBe(false);
  });

  it('should support multiple labels', () => {
    const card = { repositoryLabel: 'frontend' };
    expect(repositoryLabelMatcher(card, ['frontend', 'backend'])).toBe(true);
  });

  it('should return true for empty filter values', () => {
    const card = { repositoryLabel: 'frontend' };
    expect(repositoryLabelMatcher(card, [])).toBe(true);
  });
});

/**
 * Tests for syncProjectTeamToUsers logic
 * (extracted from adminproject.astro for testability)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock encodeEmailForFirebase
function encodeEmailForFirebase(email) {
  if (!email || typeof email !== 'string') return '';
  return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

/**
 * Replicate the syncProjectTeamToUsers logic for testing
 */
async function syncProjectTeamToUsers(projectName, developers, stakeholders, { getUser, applyUpdates }) {
  const devEmails = new Set();
  const stkEmails = new Set();

  for (const dev of developers) {
    if (dev.email) devEmails.add(dev.email.toLowerCase().trim());
  }
  for (const stk of stakeholders) {
    if (stk.email) stkEmails.add(stk.email.toLowerCase().trim());
  }

  const allEmails = new Set([...devEmails, ...stkEmails]);
  const updates = {};

  for (const email of allEmails) {
    const encodedEmail = encodeEmailForFirebase(email);
    if (!encodedEmail) continue;

    const userExists = await getUser(encodedEmail);
    if (!userExists) continue;

    const isDev = devEmails.has(email);
    const isStk = stkEmails.has(email);
    updates[`/users/${encodedEmail}/projects/${projectName}/developer`] = isDev;
    updates[`/users/${encodedEmail}/projects/${projectName}/stakeholder`] = isStk;
  }

  if (Object.keys(updates).length > 0) {
    await applyUpdates(updates);
  }

  return updates;
}

describe('syncProjectTeamToUsers', () => {
  let applyUpdates;
  let getUser;

  beforeEach(() => {
    applyUpdates = vi.fn().mockResolvedValue();
    getUser = vi.fn().mockResolvedValue(true); // All users exist by default
  });

  it('should sync developer assignment to /users/', async () => {
    const devs = [{ id: 'dev_001', name: 'Alice', email: 'alice@example.com' }];
    const stks = [];

    const updates = await syncProjectTeamToUsers('TestProject', devs, stks, { getUser, applyUpdates });

    expect(updates['/users/alice|example!com/projects/TestProject/developer']).toBe(true);
    expect(updates['/users/alice|example!com/projects/TestProject/stakeholder']).toBe(false);
    expect(applyUpdates).toHaveBeenCalledOnce();
  });

  it('should sync stakeholder assignment to /users/', async () => {
    const devs = [];
    const stks = [{ id: 'stk_001', name: 'Bob', email: 'bob@example.com' }];

    const updates = await syncProjectTeamToUsers('TestProject', devs, stks, { getUser, applyUpdates });

    expect(updates['/users/bob|example!com/projects/TestProject/developer']).toBe(false);
    expect(updates['/users/bob|example!com/projects/TestProject/stakeholder']).toBe(true);
  });

  it('should sync user who is both developer and stakeholder', async () => {
    const devs = [{ id: 'dev_001', name: 'Alice', email: 'alice@example.com' }];
    const stks = [{ id: 'stk_001', name: 'Alice', email: 'alice@example.com' }];

    const updates = await syncProjectTeamToUsers('TestProject', devs, stks, { getUser, applyUpdates });

    expect(updates['/users/alice|example!com/projects/TestProject/developer']).toBe(true);
    expect(updates['/users/alice|example!com/projects/TestProject/stakeholder']).toBe(true);
  });

  it('should skip users that do not exist in /users/', async () => {
    getUser.mockResolvedValue(false); // User does not exist

    const devs = [{ id: 'dev_001', name: 'Ghost', email: 'ghost@example.com' }];
    const stks = [];

    const updates = await syncProjectTeamToUsers('TestProject', devs, stks, { getUser, applyUpdates });

    expect(Object.keys(updates)).toHaveLength(0);
    expect(applyUpdates).not.toHaveBeenCalled();
  });

  it('should handle mixed: some users exist, some do not', async () => {
    getUser.mockImplementation((encoded) => {
      return Promise.resolve(encoded === 'alice|example!com');
    });

    const devs = [
      { id: 'dev_001', name: 'Alice', email: 'alice@example.com' },
      { id: 'dev_002', name: 'Ghost', email: 'ghost@example.com' }
    ];

    const updates = await syncProjectTeamToUsers('TestProject', devs, [], { getUser, applyUpdates });

    expect(updates['/users/alice|example!com/projects/TestProject/developer']).toBe(true);
    expect(updates['/users/ghost|example!com/projects/TestProject/developer']).toBeUndefined();
  });

  it('should not call applyUpdates when no team members', async () => {
    const updates = await syncProjectTeamToUsers('TestProject', [], [], { getUser, applyUpdates });

    expect(Object.keys(updates)).toHaveLength(0);
    expect(applyUpdates).not.toHaveBeenCalled();
  });

  it('should skip entries without email', async () => {
    const devs = [
      { id: 'dev_001', name: 'NoEmail' },
      { id: 'dev_002', name: 'HasEmail', email: 'has@example.com' }
    ];

    const updates = await syncProjectTeamToUsers('TestProject', devs, [], { getUser, applyUpdates });

    expect(updates['/users/has|example!com/projects/TestProject/developer']).toBe(true);
    expect(Object.keys(updates)).toHaveLength(2); // developer + stakeholder for has@
  });

  it('should normalize email case', async () => {
    const devs = [{ id: 'dev_001', name: 'Alice', email: 'Alice@Example.COM' }];

    const updates = await syncProjectTeamToUsers('TestProject', devs, [], { getUser, applyUpdates });

    // encodeEmailForFirebase gets the lowercased email
    expect(getUser).toHaveBeenCalledWith('alice|example!com');
  });
});

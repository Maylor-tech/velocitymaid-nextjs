import { afterEach, describe, expect, it } from 'vitest';
import {
  BRIAN_OWNER_CLEANER_ID,
  CARYLL_CLEANER_ID,
  isOwnerAssigneeForPayoutSkip,
} from '../ownerAssignee';

describe('isOwnerAssigneeForPayoutSkip', () => {
  const prevAdminEmail = process.env.ADMIN_EMAIL;

  afterEach(() => {
    if (prevAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = prevAdminEmail;
  });

  it('matches known Brian owner cleaner id', () => {
    expect(
      isOwnerAssigneeForPayoutSkip({
        id: BRIAN_OWNER_CLEANER_ID,
        email: 'someone@example.com',
        role: 'CLEANER',
      })
    ).toBe(true);
  });

  it('matches ADMIN_EMAIL case-insensitively', () => {
    process.env.ADMIN_EMAIL = 'admin@velocitymaid.com';
    expect(
      isOwnerAssigneeForPayoutSkip({
        id: 'any-id',
        email: 'Admin@VelocityMaid.com',
        role: 'ADMIN',
      })
    ).toBe(true);
  });

  it('does not skip Caryll', () => {
    process.env.ADMIN_EMAIL = 'admin@velocitymaid.com';
    expect(
      isOwnerAssigneeForPayoutSkip({
        id: CARYLL_CLEANER_ID,
        email: 'caryll@velocitymaid.com',
        role: 'CLEANER',
      })
    ).toBe(false);
  });

  it('does not skip a normal cleaner', () => {
    process.env.ADMIN_EMAIL = 'admin@velocitymaid.com';
    expect(
      isOwnerAssigneeForPayoutSkip({
        id: 'cleaner-uuid',
        email: 'dory@example.com',
        role: 'CLEANER',
      })
    ).toBe(false);
  });

  it('does not skip solely because role is ADMIN', () => {
    process.env.ADMIN_EMAIL = 'admin@velocitymaid.com';
    expect(
      isOwnerAssigneeForPayoutSkip({
        id: 'other-admin',
        email: 'ops@example.com',
        role: 'ADMIN',
      })
    ).toBe(false);
  });

  it('returns false for null/empty', () => {
    expect(isOwnerAssigneeForPayoutSkip(null)).toBe(false);
    expect(isOwnerAssigneeForPayoutSkip({ id: '' })).toBe(false);
  });
});
